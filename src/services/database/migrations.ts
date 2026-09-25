import type { SQLiteDatabase } from "expo-sqlite";

// Increment this whenever a new migration is added
const CURRENT_VERSION = 5;

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_version LIMIT 1"
  );
  const currentVersion = row?.version ?? 0;

  if (currentVersion < 1) {
    await migration_v1(db);
  }

  if (currentVersion < 2) {
    await migration_v2(db);
  }

  if (currentVersion < 3) {
    await migration_v3(db);
  }

  if (currentVersion < 4) {
    await migration_v4(db);
  }

  if (currentVersion < 5) {
    await migration_v5(db);
  }

  if (currentVersion === 0) {
    await db.runAsync("INSERT INTO schema_version (version) VALUES (?)", [CURRENT_VERSION]);
  } else {
    await db.runAsync("UPDATE schema_version SET version = ?", [CURRENT_VERSION]);
  }
}

async function migration_v1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      remote_id TEXT,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'transfer')),
      category_id TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT,
      payment_method TEXT NOT NULL,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending', 'synced', 'failed')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS objectives (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      deadline TEXT,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('create', 'update', 'delete')),
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      retries INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_sync ON transactions(sync_status);
    CREATE INDEX IF NOT EXISTS idx_transactions_remote ON transactions(remote_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
  `);
}

// Adds remote_id and sync_status to existing installations that had v1 without those columns
async function migration_v2(db: SQLiteDatabase): Promise<void> {
  const tableInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(transactions)"
  );
  const columns = tableInfo.map((r) => r.name);

  if (!columns.includes("remote_id")) {
    await db.execAsync("ALTER TABLE transactions ADD COLUMN remote_id TEXT;");
  }

  if (!columns.includes("sync_status")) {
    await db.execAsync(
      "ALTER TABLE transactions ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending';"
    );
  }

  // Mark all pre-existing local-only rows as pending sync
  await db.execAsync(
    "UPDATE transactions SET sync_status = 'pending' WHERE sync_status IS NULL OR sync_status = '';"
  );
}

// Configuração do ciclo de fatura do cartão. A UI expõe um cartão só, então a
// tabela guarda uma linha de id fixo; o schema aceita mais para acompanhar o
// backend sem migração futura.
async function migration_v3(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS credit_cards (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL DEFAULT 'Meu cartão',
      closing_day INTEGER NOT NULL,
      due_day INTEGER NOT NULL,
      time_zone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
      sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending', 'synced', 'failed')),
      updated_at TEXT NOT NULL
    );
  `);
}

// Faturas pagas e o marcador do custo consolidado. Espelho local do servidor:
// pagar exige rede, mas ler o estado pago funciona offline.
async function migration_v4(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS invoice_payments (
      period_key TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      paid_at TEXT NOT NULL
    );
  `);

  const tableInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(transactions)"
  );
  const columns = tableInfo.map((r) => r.name);

  if (!columns.includes("is_invoice_payment")) {
    await db.execAsync(
      "ALTER TABLE transactions ADD COLUMN is_invoice_payment INTEGER NOT NULL DEFAULT 0;"
    );
  }
}

// Eventos recorrentes. As ocorrências NÃO são gravadas — derivam das regras
// em utils/recurrence. O que se grava é a resolução de cada mês, para que a
// timeline e a lista de pendências funcionem offline.
async function migration_v5(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS recurring_rules (
      id TEXT PRIMARY KEY NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'transfer')),
      category_id TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      day_of_month INTEGER NOT NULL,
      time_zone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
      starts_at TEXT NOT NULL,
      ends_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS recurring_occurrences (
      occurrence_id TEXT PRIMARY KEY NOT NULL,
      rule_id TEXT NOT NULL,
      period_key TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('confirmed', 'skipped')),
      resolved_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_recurring_occ_rule ON recurring_occurrences(rule_id);
  `);
}
