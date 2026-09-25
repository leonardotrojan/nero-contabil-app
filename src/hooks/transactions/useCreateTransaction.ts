import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "../../services/api";
import { ENDPOINTS } from "../../services/api/endpoints";
import {
  insertTransaction,
  markAsSynced,
  markSyncFailed,
} from "../../services/database/repositories/transactions";
import { TRANSACTIONS_KEY } from "./useTransactions";
import { SUMMARY_KEY } from "./useSummary";
import type { CreateTransactionDTO, Transaction } from "../../types";

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateTransactionDTO): Promise<Transaction> => {
      // Step 1: Save locally immediately
      const local = await insertTransaction(dto);

      // Step 2: Optimistically update cache
      queryClient.setQueryData<Transaction[]>(TRANSACTIONS_KEY, (prev = []) => [
        local,
        ...prev,
      ]);

      // Step 3: Try to sync with API
      try {
        const { data } = await apiClient.post(ENDPOINTS.transactions.create, {
          amount: dto.amount,
          type: dto.type,
          categoryId: dto.categoryId,
          description: dto.description,
          date: dto.date ?? local.date,
          location: dto.location,
          paymentMethod: dto.paymentMethod,
          isRecurring: dto.isRecurring ?? false,
        });

        // Step 4: Reconcile local ID with remote ID
        await markAsSynced(local.id, data.id);

        const synced: Transaction = { ...local, remoteId: data.id, syncStatus: "synced" };

        queryClient.setQueryData<Transaction[]>(TRANSACTIONS_KEY, (prev = []) =>
          prev.map((t) => (t.id === local.id ? synced : t))
        );

        return synced;
      } catch (err) {
        if (err instanceof ApiError && (err.isNetwork || err.isUnauthorized)) {
          // Offline or unauthenticated — transaction is saved locally, will sync later
          return local;
        }

        // API returned a validation/server error — mark as failed but keep local
        await markSyncFailed(local.id);
        return { ...local, syncStatus: "failed" };
      }
    },
    onSuccess: () => {
      // Invalidate summary so balances refresh
      queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
    },
  });
}
