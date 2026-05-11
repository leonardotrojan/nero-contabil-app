import type { Insight } from "../../types";

export const MOCK_INSIGHTS: Insight[] = [
  {
    id: "i1",
    type: "spending_trend",
    content: "Delivery subiu 23% esta semana.",
    severity: "warning",
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: "i2",
    type: "comparison",
    content: "Você está 8% abaixo da média mensal.",
    severity: "positive",
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: "i3",
    type: "behavioral",
    content: "Gastos concentrados às sextas-feiras.",
    severity: "info",
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: "i4",
    type: "subscription",
    content: "3 assinaturas sem uso recente detectadas.",
    severity: "warning",
    createdAt: new Date().toISOString(),
    read: true,
  },
  {
    id: "i5",
    type: "projection",
    content: "Projeção: R$ 2.481 no fim do mês.",
    severity: "neutral",
    createdAt: new Date().toISOString(),
    read: false,
  },
];
