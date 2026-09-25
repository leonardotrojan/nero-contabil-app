import type { Category } from "../types";
import { colors } from "../theme/colors";

export const CATEGORIES: Category[] = [
  { id: "food", name: "Alimentação", icon: "🍔", color: colors.semantic.warning, type: "expense" },
  { id: "transport", name: "Transporte", icon: "🚗", color: colors.accent.blue, type: "expense" },
  { id: "health", name: "Saúde", icon: "❤️", color: colors.semantic.danger, type: "expense" },
  { id: "entertainment", name: "Lazer", icon: "🎮", color: colors.accent.purple, type: "expense" },
  { id: "shopping", name: "Compras", icon: "🛍️", color: "#FF9F7A", type: "expense" },
  { id: "home", name: "Casa", icon: "🏠", color: "#7A9FF5", type: "expense" },
  { id: "subscriptions", name: "Assinaturas", icon: "📱", color: colors.accent.purpleDim, type: "expense" },
  { id: "education", name: "Educação", icon: "📚", color: colors.accent.blue, type: "expense" },
  { id: "delivery", name: "Delivery", icon: "📦", color: "#FF7A50", type: "expense" },
  { id: "salary", name: "Salário", icon: "💼", color: colors.accent.mint, type: "income" },
  { id: "freelance", name: "Freelance", icon: "💻", color: colors.accent.mintDim, type: "income" },
  { id: "investment", name: "Investimento", icon: "📈", color: colors.accent.blue, type: "income" },
  { id: "objectives", name: "Metas", icon: "◎", color: colors.accent.purple, type: "expense" },
  { id: "other", name: "Outros", icon: "✦", color: colors.base[300], type: "both" },
  // Espelha prisma/seed.ts. Usada só pelo custo consolidado de fatura.
  { id: "invoice", name: "Fatura", icon: "💳", color: colors.accent.blue, type: "expense", system: true },
];

export const getCategoryById = (id: string): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
