import { create } from "zustand";
import type { Objective } from "../types";

type CreateObjectiveDTO = Omit<Objective, "id" | "createdAt" | "updatedAt">;

interface ObjectiveState {
  objectives: Objective[];
  addObjective: (dto: CreateObjectiveDTO) => Objective;
  removeObjective: (id: string) => void;
  contribute: (id: string, amount: number) => void;
  getById: (id: string) => Objective | undefined;
}

export const useObjectiveStore = create<ObjectiveState>((set, get) => ({
  objectives: [],

  addObjective: (dto) => {
    const now = new Date().toISOString();
    const objective: Objective = {
      ...dto,
      id: `obj_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ objectives: [objective, ...s.objectives] }));
    return objective;
  },

  removeObjective: (id) =>
    set((s) => ({ objectives: s.objectives.filter((o) => o.id !== id) })),

  contribute: (id, amount) =>
    set((s) => ({
      objectives: s.objectives.map((o) =>
        o.id === id
          ? { ...o, currentAmount: Math.min(o.currentAmount + amount, o.targetAmount), updatedAt: new Date().toISOString() }
          : o
      ),
    })),

  getById: (id) => get().objectives.find((o) => o.id === id),
}));
