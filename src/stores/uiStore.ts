import { create } from "zustand";

type BottomSheetType = "add_transaction" | "filter" | "category" | null;

interface UIState {
  isBalanceVisible: boolean;
  activeBottomSheet: BottomSheetType;
  isFabOpen: boolean;
  toggleBalanceVisibility: () => void;
  openBottomSheet: (type: BottomSheetType) => void;
  closeBottomSheet: () => void;
  setFabOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isBalanceVisible: true,
  activeBottomSheet: null,
  isFabOpen: false,

  toggleBalanceVisibility: () =>
    set((s) => ({ isBalanceVisible: !s.isBalanceVisible })),

  openBottomSheet: (type) =>
    set({ activeBottomSheet: type }),

  closeBottomSheet: () =>
    set({ activeBottomSheet: null }),

  setFabOpen: (open) =>
    set({ isFabOpen: open }),
}));
