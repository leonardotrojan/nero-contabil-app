import { create } from "zustand";

// Zustand only manages transient UI state for transactions.
// Server state (list, summary) lives in React Query.
// Persistence lives in SQLite.

interface TransactionUIState {
  selectedTransactionId: string | null;
  filterType: "all" | "expense" | "income" | "transfer";
  selectTransaction: (id: string | null) => void;
  setFilterType: (type: TransactionUIState["filterType"]) => void;
}

export const useTransactionUIStore = create<TransactionUIState>((set) => ({
  selectedTransactionId: null,
  filterType: "all",

  selectTransaction: (id) => set({ selectedTransactionId: id }),
  setFilterType: (type) => set({ filterType: type }),
}));
