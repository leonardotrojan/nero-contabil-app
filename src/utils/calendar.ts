/**
 * Aritmética de calendário sensível a fuso.
 *
 * Compartilhada por fatura de cartão e eventos recorrentes: os dois precisam
 * responder "que dia é hoje para o usuário?" e "dia 31 em fevereiro é que
 * dia?". Duplicar isso é o caminho mais curto para os dois discordarem.
 */

export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

/** Chave estável de um período mensal, no formato "YYYY-MM". */
export type PeriodKey = string;

export class InvalidCycleDayError extends Error {
  constructor(day: unknown) {
    super(`Dia de ciclo inválido: ${String(day)}. Esperado inteiro de 1 a 31.`);
    this.name = "InvalidCycleDayError";
  }
}

export function isValidCycleDay(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

function assertCycleDay(day: number): void {
  if (!isValidCycleDay(day)) throw new InvalidCycleDayError(day);
}

export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

/**
 * Diferença, em ms, entre a hora de parede no fuso e o mesmo instante em UTC.
 * Positivo a leste de Greenwich; -3h para o Brasil.
 */
export function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  // Hermes (Android) tem suporte irregular a formatToParts. Se faltar, cai no
  // fuso do próprio dispositivo — que é o do usuário no uso real, já que o
  // timeZone do cartão é capturado do aparelho na configuração.
  if (typeof Intl?.DateTimeFormat.prototype.formatToParts !== "function") {
    return -instant.getTimezoneOffset() * 60_000;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23", // sem isso, meia-noite vira "24" em algumas engines
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }

  const wallClockAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return wallClockAsUtc - instant.getTime();
}

/** Fuso do aparelho, para gravar no cartão na hora de configurar. */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

/** Extrai o dia do calendário como ele aparece para o usuário, não em UTC. */
export function calendarDateIn(instant: Date, timeZone: string): CalendarDate {
  const offset = timeZoneOffsetMs(instant, timeZone);
  const shifted = new Date(instant.getTime() + offset);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** Instante UTC correspondente a 00:00 de um dia local. */
export function startOfDayIn(
  { year, month, day }: CalendarDate,
  timeZone: string,
): Date {
  const naive = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  // Duas passadas: a primeira estimativa pode cair do lado errado de uma
  // transição de horário de verão. O Brasil não tem mais DST, mas a função
  // aceita qualquer fuso.
  let timestamp = naive - timeZoneOffsetMs(new Date(naive), timeZone);
  timestamp = naive - timeZoneOffsetMs(new Date(timestamp), timeZone);

  return new Date(timestamp);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addMonths(
  year: number,
  month: number,
  amount: number,
): { year: number; month: number } {
  const zeroBased = year * 12 + (month - 1) + amount;
  return {
    year: Math.floor(zeroBased / 12),
    month: (zeroBased % 12) + 1,
  };
}

/**
 * O dia do ciclo pode não existir no mês (virada 31 em fevereiro).
 * Sem este clamp, `new Date(2026, 1, 31)` vira 3 de março silenciosamente.
 */
export function effectiveDayInMonth(
  year: number,
  month: number,
  cycleDay: number,
): number {
  return Math.min(cycleDay, daysInMonth(year, month));
}

export function toKey(year: number, month: number): PeriodKey {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseKey(key: PeriodKey): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  return { year, month };
}
