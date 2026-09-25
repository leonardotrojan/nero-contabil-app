import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiError } from "../../services/api";
import { ENDPOINTS } from "../../services/api/endpoints";
import { fetchTransactions } from "../../services/database/repositories/transactions";
import { fetchCreditCard } from "../../services/database/repositories/creditCard";
import { fetchPaidInvoices } from "../../services/database/repositories/invoicePayments";
import { summarizeCreditInvoices, type PaidInvoice } from "../../utils/invoiceSummary";
import type { CreditCard, SummaryResponse, Transaction } from "../../types";

export const SUMMARY_KEY = ["transactions", "summary"] as const;

// Espelha getMonthSummary da API. Os dois lados precisam concordar, senão o
// mesmo mês mostra números diferentes com e sem rede.
function computeLocalSummary(
  transactions: Transaction[],
  card: CreditCard | null,
  paidInvoices: PaidInvoice[],
): SummaryResponse {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const monthly = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const income = monthly
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  // EIXO CAIXA: crédito não sai da conta no dia da compra.
  const expenses = monthly
    .filter((t) => t.type === "expense" && t.paymentMethod !== "credit")
    .reduce((s, t) => s + t.amount, 0);

  // EIXO COMPETÊNCIA: aqui o crédito conta, mas o consolidado de fatura não —
  // o sinal de categoria já está nas compras individuais.
  const byCategoryMap = new Map<string, { total: number; count: number }>();
  for (const t of monthly) {
    if (t.type === "expense" && !t.isInvoicePayment) {
      const prev = byCategoryMap.get(t.categoryId) ?? { total: 0, count: 0 };
      byCategoryMap.set(t.categoryId, {
        total: prev.total + t.amount,
        count: prev.count + 1,
      });
    }
  }

  return {
    income,
    expenses,
    balance: income - expenses,
    count: monthly.length,
    byCategory: Array.from(byCategoryMap.entries()).map(([categoryId, v]) => ({
      categoryId,
      ...v,
    })),
    recentTransactions: [],
    // A fatura atravessa dois meses de calendário, então usa todas as
    // transações locais, não só as do mês corrente.
    creditCard: summarizeCreditInvoices(transactions, card, new Date(), paidInvoices),
  };
}

async function computeLocalFallback(): Promise<SummaryResponse> {
  const [local, card, paid] = await Promise.all([
    fetchTransactions(500, 0),
    fetchCreditCard(),
    fetchPaidInvoices(),
  ]);
  return computeLocalSummary(local, card, paid);
}

async function loadSummary(): Promise<SummaryResponse> {
  const now = new Date();

  try {
    const { data } = await apiClient.get<SummaryResponse>(ENDPOINTS.transactions.summary, {
      params: { year: now.getFullYear(), month: now.getMonth() + 1 },
    });
    return data;
  } catch (err) {
    if (
      err instanceof ApiError &&
      (err.isNetwork || err.isUnauthorized)
    ) {
      // Offline or unauthenticated — compute from local SQLite
      return computeLocalFallback();
    }
    // Fallback to local on any error
    return computeLocalFallback();
  }
}

export function useSummary() {
  return useQuery({
    queryKey: SUMMARY_KEY,
    queryFn: loadSummary,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 0,
  });
}
