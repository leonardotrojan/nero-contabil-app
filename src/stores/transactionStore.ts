import { create } from "zustand";
import type { Transaction, CreateTransactionDTO } from "../types";

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  addTransaction: (dto: CreateTransactionDTO) => void;
  removeTransaction: (id: string) => void;
  getTotalBalance: () => number;
  getMonthlyExpenses: () => number;
  getMonthlyIncome: () => number;
  getRecentTransactions: (limit?: number) => Transaction[];
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,

  addTransaction: (dto) => {
    const transaction: Transaction = {
      id: `t_${Date.now()}`,
      amount: dto.amount,
      type: dto.type,
      categoryId: dto.categoryId,
      description: dto.description,
      date: dto.date ?? new Date().toISOString(),
      location: dto.location,
      paymentMethod: dto.paymentMethod,
      isRecurring: dto.isRecurring ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ transactions: [transaction, ...s.transactions] }));
  },

  removeTransaction: (id) =>
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

  getTotalBalance: () => {
    const { transactions } = get();
    return transactions.reduce((acc, t) => {
      if (t.type === "income") return acc + t.amount;
      if (t.type === "expense") return acc - t.amount;
      return acc;
    }, 0);
  },

  getMonthlyExpenses: () => {
    const { transactions } = get();
    const now = new Date();
    return transactions
      .filter((t) => {
        const date = new Date(t.date);
        return (
          t.type === "expense" &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);
  },

  getMonthlyIncome: () => {
    const { transactions } = get();
    const now = new Date();
    return transactions
      .filter((t) => {
        const date = new Date(t.date);
        return (
          t.type === "income" &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);
  },

  getRecentTransactions: (limit = 5) =>
    get()
      .transactions.slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit),
}));
