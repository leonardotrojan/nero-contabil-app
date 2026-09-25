import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "../../services/api";
import { ENDPOINTS } from "../../services/api/endpoints";
import {
  fetchRules,
  replaceRules,
  fetchResolvedOccurrences,
  markOccurrenceResolved,
} from "../../services/database/repositories/recurring";
import { getCategoryById } from "../../constants/categories";
import {
  pendingOccurrences,
  upcomingOccurrences,
  type Occurrence,
} from "../../utils/recurrence";
import { SUMMARY_KEY } from "../transactions/useSummary";
import { TRANSACTIONS_KEY } from "../transactions/useTransactions";
import type {
  AgendaItem,
  CreateRuleDTO,
  RecurringAgenda,
  RecurringRule,
} from "../../types";

export const RECURRING_RULES_KEY = ["recurring", "rules"] as const;
export const RECURRING_AGENDA_KEY = ["recurring", "agenda"] as const;

/** Quantos dias a timeline projeta para frente. */
const HORIZON_DAYS = 45;

function decorate(occurrence: Occurrence, rule: RecurringRule): AgendaItem {
  const category = getCategoryById(rule.categoryId);

  return {
    ruleId: occurrence.ruleId,
    periodKey: occurrence.periodKey,
    date: occurrence.date.toISOString(),
    description: rule.description,
    amount: rule.amount,
    type: rule.type,
    categoryId: rule.categoryId,
    paymentMethod: rule.paymentMethod,
    icon: category.icon,
    color: category.color,
  };
}

/**
 * Agenda derivada localmente a partir das regras e das resoluções em SQLite.
 * Calcular no cliente mantém a timeline viva offline — a API expõe o mesmo
 * cálculo em /recurring/agenda para quem precisar do lado servidor.
 */
function buildAgenda(
  rules: RecurringRule[],
  resolved: string[],
): RecurringAgenda {
  if (rules.length === 0) return { pending: [], upcoming: [] };

  const byId = new Map(rules.map((r) => [r.id, r]));
  const shaped = rules.map((r) => ({
    id: r.id,
    dayOfMonth: r.dayOfMonth,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    isActive: r.isActive,
  }));

  const now = new Date();
  const until = new Date(now.getTime() + HORIZON_DAYS * 86_400_000);
  const timeZone = rules[0].timeZone;

  return {
    pending: pendingOccurrences(shaped, resolved, now, timeZone).map((o) =>
      decorate(o, byId.get(o.ruleId)!),
    ),
    upcoming: upcomingOccurrences(shaped, now, until, timeZone).map((o) =>
      decorate(o, byId.get(o.ruleId)!),
    ),
  };
}

async function loadRules(): Promise<RecurringRule[]> {
  try {
    const { data } = await apiClient.get<RecurringRule[]>(ENDPOINTS.recurring.rules);
    const normalized = data.map((r) => ({ ...r, amount: Number(r.amount) }));
    await replaceRules(normalized);
    return normalized;
  } catch (err) {
    if (err instanceof ApiError && (err.isNetwork || err.isUnauthorized)) {
      return fetchRules();
    }
    return fetchRules();
  }
}

export function useRecurringRules() {
  return useQuery({
    queryKey: RECURRING_RULES_KEY,
    queryFn: loadRules,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRecurringAgenda() {
  const { data: rules = [], isLoading } = useRecurringRules();

  const { data: agenda } = useQuery({
    queryKey: [...RECURRING_AGENDA_KEY, rules.map((r) => r.id).join(",")],
    queryFn: async () => buildAgenda(rules, await fetchResolvedOccurrences()),
    enabled: !isLoading,
  });

  return {
    pending: agenda?.pending ?? [],
    upcoming: agenda?.upcoming ?? [],
    isLoading,
  };
}

export function useSaveRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateRuleDTO) => {
      const { data } = await apiClient.post<RecurringRule>(
        ENDPOINTS.recurring.rules,
        dto,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_RULES_KEY });
      queryClient.invalidateQueries({ queryKey: RECURRING_AGENDA_KEY });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(ENDPOINTS.recurring.rule(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_RULES_KEY });
      queryClient.invalidateQueries({ queryKey: RECURRING_AGENDA_KEY });
    },
  });
}

interface ResolveInput {
  ruleId: string;
  periodKey: string;
  status: "confirmed" | "skipped";
}

/**
 * Confirmar é o único momento em que uma previsão vira transação real.
 * Ignorar só registra a resolução — nada entra no extrato.
 */
export function useResolveOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, periodKey, status }: ResolveInput) => {
      await apiClient.post(ENDPOINTS.recurring.occurrence(ruleId, periodKey), {
        status,
      });
      await markOccurrenceResolved(ruleId, periodKey, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_AGENDA_KEY });
      queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });
}
