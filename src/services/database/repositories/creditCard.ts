import { getDatabase } from "../index";
import type { CreditCard, CreditCardConfigDTO, SyncStatus } from "../../../types";

/** A UI expõe um cartão só; a linha local tem id fixo. */
const PRIMARY_ID = "primary";

interface CreditCardRow {
  name: string;
  closing_day: number;
  due_day: number;
  time_zone: string;
  sync_status: string;
  updated_at: string;
}

function toDomain(row: CreditCardRow): CreditCard {
  return {
    name: row.name,
    closingDay: row.closing_day,
    dueDay: row.due_day,
    timeZone: row.time_zone,
    syncStatus: row.sync_status as SyncStatus,
    updatedAt: row.updated_at,
  };
}

export async function fetchCreditCard(): Promise<CreditCard | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CreditCardRow>(
    "SELECT name, closing_day, due_day, time_zone, sync_status, updated_at FROM credit_cards WHERE id = ?",
    [PRIMARY_ID],
  );

  return row ? toDomain(row) : null;
}

export async function saveCreditCard(
  dto: CreditCardConfigDTO,
  timeZone: string,
): Promise<CreditCard> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const card: CreditCard = {
    name: dto.name ?? "Meu cartão",
    closingDay: dto.closingDay,
    dueDay: dto.dueDay,
    timeZone: dto.timeZone ?? timeZone,
    syncStatus: "pending",
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO credit_cards (id, name, closing_day, due_day, time_zone, sync_status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       closing_day = excluded.closing_day,
       due_day = excluded.due_day,
       time_zone = excluded.time_zone,
       sync_status = excluded.sync_status,
       updated_at = excluded.updated_at`,
    [
      PRIMARY_ID,
      card.name,
      card.closingDay,
      card.dueDay,
      card.timeZone,
      card.syncStatus,
      card.updatedAt,
    ],
  );

  return card;
}

export async function markCreditCardSynced(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE credit_cards SET sync_status = 'synced' WHERE id = ?", [
    PRIMARY_ID,
  ]);
}

export async function markCreditCardSyncFailed(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE credit_cards SET sync_status = 'failed' WHERE id = ?", [
    PRIMARY_ID,
  ]);
}
