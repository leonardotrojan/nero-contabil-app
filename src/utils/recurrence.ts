/**
 * Ocorrências de eventos recorrentes de data fixa.
 *
 * Função pura, sem I/O. A mesma lógica existe no app
 * (src/shared/recurrence/recurrence.ts) — os dois lados compartilham os casos de teste.
 *
 * Uma regra descreve "todo dia 15"; as ocorrências são DERIVADAS dela, nunca
 * gravadas. O que se grava é a resolução: confirmei ou ignorei o mês tal.
 * Mesma disciplina da fatura — mudar o dia da regra reagrupa tudo sozinho.
 */

import {
  DEFAULT_TIME_ZONE,
  addMonths,
  calendarDateIn,
  effectiveDayInMonth,
  startOfDayIn,
  toKey,
  type PeriodKey,
} from "./calendar";

export interface RecurrenceRule {
  id: string;
  /** 1-31. Dias que não existem no mês são ajustados para o último. */
  dayOfMonth: number;
  startsAt: string | Date;
  endsAt?: string | Date | null;
  isActive: boolean;
}

export interface Occurrence {
  ruleId: string;
  periodKey: PeriodKey;
  /** Meia-noite local do dia da ocorrência. */
  date: Date;
}

/** Chave estável de uma ocorrência: identifica regra + mês. */
export function occurrenceId(ruleId: string, periodKey: PeriodKey): string {
  return `${ruleId}:${periodKey}`;
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Todas as ocorrências de uma regra dentro de uma janela fechada. */
export function occurrencesInRange(
  rule: RecurrenceRule,
  from: Date,
  to: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): Occurrence[] {
  if (!rule.isActive) return [];

  const startsAt = toDate(rule.startsAt);
  const endsAt = rule.endsAt ? toDate(rule.endsAt) : null;

  const first = calendarDateIn(from, timeZone);
  const last = calendarDateIn(to, timeZone);
  const monthCount =
    (last.year - first.year) * 12 + (last.month - first.month);

  const occurrences: Occurrence[] = [];

  for (let offset = 0; offset <= monthCount; offset += 1) {
    const { year, month } = addMonths(first.year, first.month, offset);
    const day = effectiveDayInMonth(year, month, rule.dayOfMonth);
    const date = startOfDayIn({ year, month, day }, timeZone);

    const time = date.getTime();
    if (time < from.getTime() || time > to.getTime()) continue;
    if (time < startsAt.getTime()) continue;
    if (endsAt && time > endsAt.getTime()) continue;

    occurrences.push({ ruleId: rule.id, periodKey: toKey(year, month), date });
  }

  return occurrences;
}

function sortByDate(occurrences: Occurrence[]): Occurrence[] {
  return [...occurrences].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Ocorrências que já venceram e ainda não foram confirmadas nem ignoradas.
 *
 * @param resolved        Ids de ocorrência (regra:período) já resolvidos.
 * @param lookbackMonths  Quanto olhar para trás, para não perder um mês em
 *                        que o app não foi aberto.
 */
export function pendingOccurrences(
  rules: RecurrenceRule[],
  resolved: readonly string[],
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
  lookbackMonths = 3,
): Occurrence[] {
  const resolvedSet = new Set(resolved);
  const { year, month } = calendarDateIn(now, timeZone);
  const from = startOfDayIn(
    { ...addMonths(year, month, -lookbackMonths), day: 1 },
    timeZone,
  );

  const due = rules.flatMap((rule) =>
    occurrencesInRange(rule, from, now, timeZone).filter(
      (o) => !resolvedSet.has(occurrenceId(o.ruleId, o.periodKey)),
    ),
  );

  return sortByDate(due);
}

/** Ocorrências ainda por vencer — alimenta a timeline da Home. */
export function upcomingOccurrences(
  rules: RecurrenceRule[],
  now: Date = new Date(),
  until: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
): Occurrence[] {
  const upcoming = rules.flatMap((rule) =>
    // Exclusivo no início: o que vence hoje já é pendente, não futuro.
    occurrencesInRange(rule, now, until, timeZone).filter(
      (o) => o.date.getTime() > now.getTime(),
    ),
  );

  return sortByDate(upcoming);
}
