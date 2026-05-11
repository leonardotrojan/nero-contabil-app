import type { Objective } from "../../types";
import { colors } from "../../theme/colors";

export const MOCK_OBJECTIVES: Objective[] = [
  {
    id: "o1",
    title: "Óculos N.E.R.O.",
    targetAmount: 8000,
    currentAmount: 2140,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
    color: colors.accent.purple,
    icon: "👓",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "o2",
    title: "Viagem — Lisboa",
    targetAmount: 12000,
    currentAmount: 4500,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
    color: colors.accent.blue,
    icon: "✈️",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "o3",
    title: "Reserva de emergência",
    targetAmount: 25000,
    currentAmount: 18750,
    color: colors.accent.mint,
    icon: "🛡️",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
