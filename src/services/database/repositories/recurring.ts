import { getDatabase } from "../index";
import { occurrenceId } from "../../../utils/recurrence";
import type { RecurringRule } from "../../../types";

interface RuleRow {
  id: string;
  description: string;
  amount: number;
  type: string;
  category_id: string;
  payment_method: string;
  day_of_month: number;
  time_zone: string;
  starts_at: string;
  ends_at: string | null;
  is_active: number;
}

function toDomain(row: RuleRow): RecurringRule {
  return {
    id: row.id,
    description: row.description,
    amount: row.amount,
    type: row.type as RecurringRule["type"],
    categoryId: row.category_id,
    paymentMethod: row.payment_method as RecurringRule["paymentMethod"],
    dayOfMonth: row.day_of_month,
    timeZone: row.time_zone,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active === 1,
  };
}

export async function fetchRules(): Promise<RecurringRule[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RuleRow>(
    "SELECT * FROM recurring_rules ORDER BY is_active DESC, day_of_month ASC"
  );
  return rows.map(toDomain);
}

/** Espelha o que veio do servidor, substituindo o conjunto local. */
export async function replaceRules(rules: RecurringRule[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM recurring_rules");
    for (const r of rules) {
      await db.runAsync(
        `INSERT INTO recurring_rules
          (id, description, amount, type, category_id, payment_method, day_of_month, time_zone, starts_at, ends_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id,
          r.description,
          r.amount,
          r.type,
          r.categoryId,
          r.paymentMethod,
          r.dayOfMonth,
          r.timeZone,
          r.startsAt,
          r.endsAt ?? null,
          r.isActive ? 1 : 0,
        ]
      );
    }
  });
}

export async function fetchResolvedOccurrences(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ occurrence_id: string }>(
    "SELECT occurrence_id FROM recurring_occurrences"
  );
  return rows.map((r) => r.occurrence_id);
}

export async function replaceResolvedOccurrences(
  resolved: Array<{ ruleId: string; periodKey: string; status: string; resolvedAt: string }>
): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM recurring_occurrences");
    for (const o of resolved) {
      await db.runAsync(
        `INSERT INTO recurring_occurrences (occurrence_id, rule_id, period_key, status, resolved_at)
         VALUES (?, ?, ?, ?, ?)`,
        [occurrenceId(o.ruleId, o.periodKey), o.ruleId, o.periodKey, o.status, o.resolvedAt]
      );
    }
  });
}

export async function markOccurrenceResolved(
  ruleId: string,
  periodKey: string,
  status: "confirmed" | "skipped"
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO recurring_occurrences (occurrence_id, rule_id, period_key, status, resolved_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(occurrence_id) DO UPDATE SET status = excluded.status, resolved_at = excluded.resolved_at`,
    [occurrenceId(ruleId, periodKey), ruleId, periodKey, status, new Date().toISOString()]
  );
}
