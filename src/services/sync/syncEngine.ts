import { apiClient, ApiError } from "../api";
import { ENDPOINTS } from "../api/endpoints";
import {
  fetchPendingTransactions,
  markAsSynced,
  markSyncFailed,
  markPendingRetry,
} from "../database/repositories/transactions";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5_000;

let syncInProgress = false;

export async function syncPendingTransactions(): Promise<{
  synced: number;
  failed: number;
}> {
  if (syncInProgress) return { synced: 0, failed: 0 };
  syncInProgress = true;

  let synced = 0;
  let failed = 0;

  try {
    const pending = await fetchPendingTransactions();
    if (pending.length === 0) return { synced: 0, failed: 0 };

    for (const tx of pending) {
      try {
        const { data } = await apiClient.post(ENDPOINTS.transactions.create, {
          amount: tx.amount,
          type: tx.type,
          categoryId: tx.categoryId,
          description: tx.description,
          date: tx.date,
          location: tx.location,
          paymentMethod: tx.paymentMethod,
          isRecurring: tx.isRecurring,
        });

        await markAsSynced(tx.id, data.id);
        synced++;
      } catch (err) {
        if (err instanceof ApiError && err.isNetwork) {
          // Network is down — abort entire batch, try again later
          break;
        }
        await markSyncFailed(tx.id);
        failed++;
      }
    }
  } finally {
    syncInProgress = false;
  }

  return { synced, failed };
}

export async function retryFailedTransactions(): Promise<void> {
  await markPendingRetry();
  await syncPendingTransactions();
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSyncIn(ms: number): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    syncTimer = null;
    await syncPendingTransactions();
  }, ms);
}

export function triggerSync(): void {
  scheduleSyncIn(1_000);
}

export function triggerRetrySync(): void {
  scheduleSyncIn(RETRY_DELAY_MS);
}
