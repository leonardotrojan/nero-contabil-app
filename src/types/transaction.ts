export type TransactionType = "expense" | "income" | "transfer";

export type PaymentMethod =
  | "cash"
  | "debit"
  | "credit"
  | "pix"
  | "transfer";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  description: string;
  date: string;
  location?: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
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
