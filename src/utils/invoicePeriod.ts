/**
 * Atribuição de compras a faturas de cartão de crédito.
 *
 * Função pura, sem I/O. A mesma lógica existe no app
 * (src/shared/invoice/invoice-period.ts) — os dois lados compartilham os casos de teste,
 * porque divergir aqui coloca uma compra em faturas diferentes no cliente e
 * no servidor sem que nada quebre visivelmente.
 *
 * Semântica do corte: uma compra no DIA DA VIRADA já pertence à fatura
 * seguinte — a virada abre o novo ciclo, não fecha o anterior.
 */

import {
  DEFAULT_TIME_ZONE,
  addMonths,
  calendarDateIn,
  effectiveDayInMonth,
  parseKey,
  startOfDayIn,
  toKey,
  type PeriodKey,
} from "./calendar";

export { DEFAULT_TIME_ZONE, deviceTimeZone } from "./calendar";
export type { PeriodKey } from "./calendar";

export interface InvoicePeriod {
  /** "2026-10" — identifica a fatura de forma estável. */
  key: PeriodKey;
  /** Primeiro instante coberto pela fatura. */
  start: Date;
  /** Último instante coberto (start da próxima menos 1ms). */
  end: Date;
  /** Instante da virada: quando a fatura fecha e o próximo ciclo abre. */
  closesAt: Date;
  /** Vencimento: quando o dinheiro efetivamente sai da conta. */
  dueAt: Date;
}

export class InvalidCycleDayError extends Error {
  constructor(day: unknown) {
    super(`Dia de ciclo inválido: ${String(day)}. Esperado inteiro de 1 a 31.`);
    this.name = "InvalidCycleDayError";
  }
}

export class InvalidPeriodKeyError extends Error {
  constructor(key: unknown) {
    super(`Chave de período inválida: ${String(key)}. Esperado "YYYY-MM".`);
    this.name = "InvalidPeriodKeyError";
  }
}

export function isValidCycleDay(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

function assertCycleDay(day: number): void {
  if (!isValidCycleDay(day)) throw new InvalidCycleDayError(day);
}

function buildPeriod(
  year: number,
  month: number,
  closingDay: number,
  dueDay: number,
  timeZone: string,
): InvoicePeriod {
  const previous = addMonths(year, month, -1);

  const start = startOfDayIn(
    {
      year: previous.year,
      month: previous.month,
      day: effectiveDayInMonth(previous.year, previous.month, closingDay),
    },
    timeZone,
  );

  const closesAt = startOfDayIn(
    { year, month, day: effectiveDayInMonth(year, month, closingDay) },
    timeZone,
  );

  // Vencimento posterior à virada cai no mesmo mês; anterior, no mês seguinte.
  // Ex.: fecha 28 e vence 5 — o dia 5 só pode ser do mês que vem.
  const dueMonth = dueDay > closingDay ? { year, month } : addMonths(year, month, 1);

  const dueAt = startOfDayIn(
    {
      year: dueMonth.year,
      month: dueMonth.month,
      day: effectiveDayInMonth(dueMonth.year, dueMonth.month, dueDay),
    },
    timeZone,
  );

  return {
    key: toKey(year, month),
    start,
    end: new Date(closesAt.getTime() - 1),
    closesAt,
    dueAt,
  };
}

/**
 * Descobre a qual fatura uma compra pertence.
 *
 * @param date       Instante da compra (UTC no banco).
 * @param closingDay Dia da virada configurado no cartão (1-31).
 * @param dueDay     Dia do vencimento configurado no cartão (1-31).
 * @param timeZone   Fuso do usuário — determina qual é "o dia" da compra.
 */
export function invoicePeriodFor(
  date: Date,
  closingDay: number,
  dueDay: number,
  timeZone: string = DEFAULT_TIME_ZONE,
): InvoicePeriod {
  assertCycleDay(closingDay);
  assertCycleDay(dueDay);

  const { year, month, day } = calendarDateIn(date, timeZone);
  const closing = effectiveDayInMonth(year, month, closingDay);

  // Antes da virada, a fatura é a do mês corrente. No dia ou depois, a seguinte.
  const target = day < closing ? { year, month } : addMonths(year, month, 1);

  return buildPeriod(target.year, target.month, closingDay, dueDay, timeZone);
}

/** Reconstrói um período a partir da sua chave. */
export function invoicePeriodByKey(
  key: PeriodKey,
  closingDay: number,
  dueDay: number,
  timeZone: string = DEFAULT_TIME_ZONE,
): InvoicePeriod {
  assertCycleDay(closingDay);
  assertCycleDay(dueDay);

  const parsed = parseKey(key);
  if (!parsed) throw new InvalidPeriodKeyError(key);

  return buildPeriod(parsed.year, parsed.month, closingDay, dueDay, timeZone);
}
