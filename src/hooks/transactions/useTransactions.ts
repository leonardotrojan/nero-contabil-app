import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiError } from "../../services/api";
import { ENDPOINTS } from "../../services/api/endpoints";
import {
  fetchTransactions,
  upsertFromRemote,
} from "../../services/database/repositories/transactions";
import type { ApiTransaction, Transaction } from "../../types";

export const TRANSACTIONS_KEY = ["transactions"] as const;

async function loadTransactions(): Promise<Transaction[]> {
  // Always read from local SQLite first (instant)
  const local = await fetchTransactions(50, 0);

  // Try to sync from API in background — failures are silent (offline-first)
  try {
    const { data } = await apiClient.get<ApiTransaction[]>(ENDPOINTS.transactions.list, {
      params: { limit: 50, offset: 0 },
    });

    // Reconcile remote data into SQLite
    await Promise.all(data.map(upsertFromRemote));

    // Re-read from SQLite so IDs are consistent
    return fetchTransactions(50, 0);
  } catch (err) {
    if (err instanceof ApiError && err.isNetwork) {
      // Offline — return local data silently
      return local;
    }
    if (err instanceof ApiError && err.isUnauthorized) {
      // No auth yet — return local data
      return local;
    }
    // Any other error: return local data to keep UX fluid
    return local;
  }
}

export function useTransactions() {
  return useQuery({
    queryKey: TRANSACTIONS_KEY,
    queryFn: loadTransactions,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 0, // we handle retries manually in loadTransactions
  });
}
