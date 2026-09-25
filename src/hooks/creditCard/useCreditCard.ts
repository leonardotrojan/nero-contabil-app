import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "../../services/api";
import { ENDPOINTS } from "../../services/api/endpoints";
import {
  fetchCreditCard,
  saveCreditCard,
  markCreditCardSynced,
  markCreditCardSyncFailed,
} from "../../services/database/repositories/creditCard";
import { deviceTimeZone, invoicePeriodFor } from "../../utils/invoicePeriod";
import type { CreditCard, CreditCardConfigDTO } from "../../types";

export const CREDIT_CARD_KEY = ["creditCard"] as const;

export interface CreditCardState {
  card: CreditCard | null;
  /** Gate do fluxo de compra no crédito: sem isto, não há fatura para atribuir. */
  isConfigured: boolean;
  isLoading: boolean;
}

export function useCreditCard(): CreditCardState {
  const { data, isLoading } = useQuery({
    queryKey: CREDIT_CARD_KEY,
    queryFn: fetchCreditCard,
    // Config local muda raramente e é a fonte de verdade offline.
    staleTime: 5 * 60 * 1000,
  });

  const card = data ?? null;

  return { card, isConfigured: card !== null, isLoading };
}

export function useSaveCreditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreditCardConfigDTO): Promise<CreditCard> => {
      // 1. Grava local primeiro — o gate precisa liberar mesmo sem rede.
      const local = await saveCreditCard(dto, deviceTimeZone());
      queryClient.setQueryData<CreditCard>(CREDIT_CARD_KEY, local);

      // 2. Tenta espelhar no servidor.
      try {
        await apiClient.put(ENDPOINTS.creditCard.upsert, {
          closingDay: local.closingDay,
          dueDay: local.dueDay,
          timeZone: local.timeZone,
          name: local.name,
        });

        await markCreditCardSynced();
        const synced: CreditCard = { ...local, syncStatus: "synced" };
        queryClient.setQueryData<CreditCard>(CREDIT_CARD_KEY, synced);
        return synced;
      } catch (err) {
        if (err instanceof ApiError && (err.isNetwork || err.isUnauthorized)) {
          // Offline: a config vale localmente e sobe no próximo sync.
          return local;
        }

        await markCreditCardSyncFailed();
        return { ...local, syncStatus: "failed" };
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_KEY });
    },
  });
}

/**
 * Período de fatura em que uma compra cairia, ou null se o cartão ainda não
 * foi configurado. Derivado — nada é gravado na transação.
 */
export function useInvoicePeriodFor(date: Date, card: CreditCard | null) {
  if (!card) return null;

  return invoicePeriodFor(date, card.closingDay, card.dueDay, card.timeZone);
}
