import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "../../services/api";
import { ENDPOINTS } from "../../services/api/endpoints";
import { deleteTransaction } from "../../services/database/repositories/transactions";
import { TRANSACTIONS_KEY } from "./useTransactions";
import { SUMMARY_KEY } from "./useSummary";
import type { Transaction } from "../../types";

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Transaction): Promise<void> => {
      // Optimistic: remove from cache immediately
      queryClient.setQueryData<Transaction[]>(TRANSACTIONS_KEY, (prev = []) =>
        prev.filter((t) => t.id !== transaction.id)
      );

      // Delete from local SQLite
      await deleteTransaction(transaction.id);

      // Try to delete from API if it has a remote ID
      if (transaction.remoteId) {
        try {
          await apiClient.delete(ENDPOINTS.transactions.byId(transaction.remoteId));
        } catch (err) {
          if (err instanceof ApiError && !err.isNetwork && !err.isUnauthorized) {
            // Non-network error — re-throw so the mutation is marked failed
            throw err;
          }
          // Network/auth error — local delete succeeded, remote will reconcile on next sync
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
    },
    onError: () => {
      // Revert optimistic update on failure
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });
}
