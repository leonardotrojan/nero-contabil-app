import { getDatabase } from "../index";
import type { Transaction, CreateTransactionDTO } from "../../../types";

export async function insertTransaction(dto: CreateTransactionDTO): Promise<Transaction> {
  const db = await getDatabase();
  const id = `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();

  const transaction: Transaction = {
    id,
    amount: dto.amount,
    type: dto.type,
    categoryId: dto.categoryId,
    description: dto.description,
    date: dto.date ?? now,
    location: dto.location,
    paymentMethod: dto.paymentMethod,
    isRecurring: dto.isRecurring ?? false,
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO transactions
      (id, amount, type, category_id, description, date, location, payment_method, is_recurring, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transaction.id,
      transaction.amount,
      transaction.type,
      transaction.categoryId,
      transaction.description,
      transaction.date,
      transaction.location ?? null,
      transaction.paymentMethod,
      transaction.isRecurring ? 1 : 0,
      transaction.createdAt,
      transaction.updatedAt,
    ]
  );

  return transaction;
}

export async function fetchTransactions(limit = 50): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM transactions ORDER BY date DESC LIMIT ?",
    [limit]
  );
  return rows.map(mapRow);
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
}

function mapRow(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    amount: row.amount as number,
    type: row.type as Transaction["type"],
    categoryId: row.category_id as string,
    description: row.description as string,
    date: row.date as string,
    location: row.location as string | undefined,
    paymentMethod: row.payment_method as Transaction["paymentMethod"],
    isRecurring: (row.is_recurring as number) === 1,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    syncedAt: row.synced_at as string | undefined,
  };
}
