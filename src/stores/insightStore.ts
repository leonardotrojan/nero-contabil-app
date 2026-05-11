import { create } from "zustand";
import type { Insight } from "../types";

interface InsightState {
  insights: Insight[];
  markAsRead: (id: string) => void;
  getUnread: () => Insight[];
}

export const useInsightStore = create<InsightState>((set, get) => ({
  insights: [],

  markAsRead: (id) =>
    set((s) => ({
      insights: s.insights.map((i) =>
        i.id === id ? { ...i, read: true } : i
      ),
    })),

  getUnread: () => get().insights.filter((i) => !i.read),
}));
