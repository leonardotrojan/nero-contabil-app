export type TransactionType = "expense" | "income" | "transfer";

export type PaymentMethod =
  | "cash"
  | "debit"
  | "credit"
  | "pix"
  | "transfer";

export type SyncStatus = "pending" | "synced" | "failed";

// Domain model used by UI
export interface Transaction {
  id: string;
  remoteId?: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  description: string;
  date: string;
  location?: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  /** Custo consolidado de fatura: entra no caixa, fora da análise de categoria. */
  isInvoicePayment: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  syncedAt?: string;
}

export interface CreateTransactionDTO {
  amount: number;
  type: TransactionType;
  categoryId: string;
  description: string;
  date?: string;
  location?: string;
  paymentMethod: PaymentMethod;
  isRecurring?: boolean;
}

// API response shape from the backend
export interface ApiTransaction {
  id: string;
  amount: string | number;
  type: TransactionType;
  categoryId: string;
  description: string;
  date: string;
  location?: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  isInvoicePayment?: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

export interface InvoiceSummary {
  periodKey: string;
  total: number;
  count: number;
  closesAt: string;
  dueAt: string;
  /** Fatura com pagamento registrado tem total congelado no valor pago. */
  status: "paid" | "unpaid";
}

export interface CreditCardSummary {
  configured: boolean;
  openInvoice: InvoiceSummary | null;
  previousInvoice: InvoiceSummary | null;
}

export interface SummaryResponse {
  income: number;
  /** EIXO CAIXA: exclui compras no crédito — elas pesam quando a fatura vence. */
  expenses: number;
  balance: number;
  count: number;
  /** EIXO COMPETÊNCIA: inclui crédito. Não soma o mesmo que `expenses`. */
  byCategory: Array<{ categoryId: string; total: number; count: number }>;
  recentTransactions: ApiTransaction[];
  creditCard: CreditCardSummary;
}
