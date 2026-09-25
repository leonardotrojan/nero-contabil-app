import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "../../services/api";
import { ENDPOINTS } from "../../services/api/endpoints";
import {
  upsertPaidInvoice,
  removePaidInvoice,
} from "../../services/database/repositories/invoicePayments";
import { SUMMARY_KEY } from "../transactions/useSummary";
import { TRANSACTIONS_KEY } from "../transactions/useTransactions";
import type { PaymentMethod } from "../../types";

export class OfflinePaymentError extends Error {
  constructor() {
    super(
      "Pagar uma fatura precisa de conexão — o valor consolidado é calculado no servidor."
    );
    this.name = "OfflinePaymentError";
  }
}

interface PayInvoiceInput {
  periodKey: string;
  paymentMethod?: PaymentMethod;
  amount?: number;
}

interface PayInvoiceResponse {
  payment: {
    periodKey: string;
    amount: string | number;
    periodStart: string;
    periodEnd: string;
    paidAt: string;
  };
}

/**
 * Pagar exige rede, ao contrário do resto do app. O consolidado precisa bater
 * exatamente com o que o servidor calculou para a fatura congelada; divergir
 * aqui deixaria saldo local e remoto permanentemente diferentes.
 */
export function usePayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ periodKey, paymentMethod, amount }: PayInvoiceInput) => {
      try {
        const { data } = await apiClient.post<PayInvoiceResponse>(
          ENDPOINTS.creditCard.payInvoice(periodKey),
          { paymentMethod, amount }
        );

        await upsertPaidInvoice({
          periodKey: data.payment.periodKey,
          amount: Number(data.payment.amount),
          periodStart: data.payment.periodStart,
          periodEnd: data.payment.periodEnd,
          paidAt: data.payment.paidAt,
        });

        return data;
      } catch (err) {
        if (err instanceof ApiError && err.isNetwork) throw new OfflinePaymentError();
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });
}

export function useUnpayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (periodKey: string) => {
      await apiClient.delete(ENDPOINTS.creditCard.payInvoice(periodKey));
      await removePaidInvoice(periodKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });
}
