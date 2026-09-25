/**
 * Agregação de compras no crédito em faturas.
 *
 * Função pura, sem I/O. A mesma lógica existe no app
 * (src/shared/invoice/invoice-summary.ts) — os dois lados compartilham os casos de teste.
 * O app calcula offline sobre o SQLite local; a API, sobre o Postgres. Divergir
 * aqui faria o mesmo mês mostrar totais diferentes com e sem rede.
 */

import { invoicePeriodFor, type InvoicePeriod, type PeriodKey } from "./invoicePeriod";

export interface CycleConfig {
  closingDay: number;
  dueDay: number;
  timeZone: string;
}

/** Forma mínima que os dois lados conseguem produzir a partir do seu storage. */
export interface CreditEntry {
  amount: number;
  date: string | Date;
  paymentMethod: string;
  /** Transação de custo consolidado, criada ao pagar a fatura (fase 3). */
  isInvoicePayment?: boolean;
}

export type InvoiceStatus = "paid" | "unpaid";

export interface InvoiceSummary {
  periodKey: PeriodKey;
  total: number;
  count: number;
  /** ISO — o cliente formata. */
  closesAt: string;
  dueAt: string;
  status: InvoiceStatus;
}

/**
 * Fatura já quitada. O valor é o que foi efetivamente pago e substitui o
 * cálculo derivado: se o usuário corrigir o dia de virada depois, o derivado
 * muda, mas o que saiu da conta não.
 */
export interface PaidInvoice {
  periodKey: PeriodKey;
  amount: number;
}

export interface CreditCardSummary {
  configured: boolean;
  /** Fatura que ainda está acumulando compras. */
  openInvoice: InvoiceSummary | null;
  /** Última fatura fechada — o que já virou dívida. */
  previousInvoice: InvoiceSummary | null;
}

/**
 * Uma compra no crédito é despesa de competência, nunca de caixa. O pagamento
 * da fatura é que é caixa — e por isso fica de fora daqui, senão o valor
 * apareceria duas vezes.
 */
export function isCreditPurchase(entry: CreditEntry): boolean {
  return entry.paymentMethod === "credit" && entry.isInvoicePayment !== true;
}

/**
 * As duas faturas que interessam: a que está aberta agora e a que acabou de
 * fechar. Null quando o cartão não foi configurado.
 */
export function creditPeriods(
  card: CycleConfig | null,
  now: Date = new Date(),
): { open: InvoicePeriod; previous: InvoicePeriod } | null {
  if (!card) return null;

  const open = invoicePeriodFor(now, card.closingDay, card.dueDay, card.timeZone);

  // O instante anterior ao início da aberta cai, por construção, na anterior.
  const previous = invoicePeriodFor(
    new Date(open.start.getTime() - 1),
    card.closingDay,
    card.dueDay,
    card.timeZone,
  );

  return { open, previous };
}

/** Total e contagem de compras no crédito dentro de um período. */
export function aggregateInvoice(
  entries: CreditEntry[],
  period: InvoicePeriod,
): InvoiceSummary {
  let total = 0;
  let count = 0;

  for (const entry of entries) {
    if (!isCreditPurchase(entry)) continue;

    const at = entry.date instanceof Date ? entry.date : new Date(entry.date);
    const time = at.getTime();

    if (time < period.start.getTime() || time > period.end.getTime()) continue;

    total += entry.amount;
    count += 1;
  }

  return {
    periodKey: period.key,
    // Duas casas: os valores vêm de Decimal(12,2) e a soma em float acumula ruído.
    total: Math.round(total * 100) / 100,
    count,
    closesAt: period.closesAt.toISOString(),
    dueAt: period.dueAt.toISOString(),
    status: "unpaid",
  };
}

/**
 * Fatura com pagamento registrado é fato histórico: o valor pago substitui o
 * derivado. Vale para qualquer slot — normalmente só a anterior pode estar
 * paga, mas mudar o dia de virada desloca os períodos e pode jogar uma fatura
 * quitada para o slot da aberta.
 */
function applyPayment(
  summary: InvoiceSummary,
  paidInvoices: readonly PaidInvoice[],
): InvoiceSummary {
  const paid = paidInvoices.find((p) => p.periodKey === summary.periodKey);
  if (!paid) return summary;

  // count segue derivado — é informativo; o total é que precisa ser fiel ao
  // que saiu da conta.
  return { ...summary, total: paid.amount, status: "paid" };
}

/**
 * @param entries        Transações candidatas — os não-crédito são filtrados aqui.
 * @param card           Configuração do ciclo, ou null se não configurado.
 * @param now            Instante de referência para decidir qual fatura está aberta.
 * @param paidInvoices   Faturas quitadas, com o valor congelado no pagamento.
 */
export function summarizeCreditInvoices(
  entries: CreditEntry[],
  card: CycleConfig | null,
  now: Date = new Date(),
  paidInvoices: readonly PaidInvoice[] = [],
): CreditCardSummary {
  const periods = creditPeriods(card, now);

  if (!periods) {
    return { configured: false, openInvoice: null, previousInvoice: null };
  }

  return {
    configured: true,
    openInvoice: applyPayment(aggregateInvoice(entries, periods.open), paidInvoices),
    previousInvoice: applyPayment(
      aggregateInvoice(entries, periods.previous),
      paidInvoices,
    ),
  };
}
