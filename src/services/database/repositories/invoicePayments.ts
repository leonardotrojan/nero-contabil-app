import { getDatabase } from "../index";
import type { PaidInvoice } from "../../../utils/invoiceSummary";

interface PaidRow {
  period_key: string;
  amount: number;
}

/** Espelho local das faturas pagas — alimenta o summary offline. */
export async function fetchPaidInvoices(): Promise<PaidInvoice[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PaidRow>(
    "SELECT period_key, amount FROM invoice_payments ORDER BY paid_at DESC LIMIT 24"
  );

  return rows.map((r) => ({ periodKey: r.period_key, amount: r.amount }));
}

export async function upsertPaidInvoice(payment: {
  periodKey: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  paidAt: string;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO invoice_payments (period_key, amount, period_start, period_end, paid_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(period_key) DO UPDATE SET
       amount = excluded.amount,
       period_start = excluded.period_start,
       period_end = excluded.period_end,
       paid_at = excluded.paid_at`,
    [
      payment.periodKey,
      payment.amount,
      payment.periodStart,
      payment.periodEnd,
      payment.paidAt,
    ]
  );
}

export async function removePaidInvoice(periodKey: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM invoice_payments WHERE period_key = ?", [periodKey]);
}
