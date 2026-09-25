// Configurável por EXPO_PUBLIC_API_URL (.env). Sem override, usa a API de produção.
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://nero-contabil-api.onrender.com";

export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
  },
  transactions: {
    list: "/transactions",
    create: "/transactions",
    summary: "/transactions/summary",
    byId: (id: string) => `/transactions/${id}`,
  },
  objectives: {
    list: "/objectives",
    create: "/objectives",
    byId: (id: string) => `/objectives/${id}`,
  },
  creditCard: {
    get: "/credit-card",
    upsert: "/credit-card",
    paidInvoices: "/credit-card/invoices/paid",
    payInvoice: (periodKey: string) => `/credit-card/invoices/${periodKey}/pay`,
  },
  recurring: {
    agenda: "/recurring/agenda",
    rules: "/recurring/rules",
    rule: (id: string) => `/recurring/rules/${id}`,
    occurrence: (ruleId: string, periodKey: string) =>
      `/recurring/rules/${ruleId}/occurrences/${periodKey}`,
  },
  insights: {
    list: "/insights",
  },
} as const;
