import type { PaymentMethod, TransactionType } from "./transaction";

/** Regra de evento fixo: "Aluguel, R$ 1.200, todo dia 15". */
export interface RecurringRule {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  paymentMethod: PaymentMethod;
  /** 1-31. Dias inexistentes no mês caem no último. */
  dayOfMonth: number;
  timeZone: string;
  startsAt: string;
  endsAt?: string | null;
  isActive: boolean;
}

export interface CreateRuleDTO {
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  paymentMethod: PaymentMethod;
  dayOfMonth: number;
  startsAt?: string;
  timeZone?: string;
}

/** Ocorrência derivada, pronta para renderizar. */
export interface AgendaItem {
  ruleId: string;
  periodKey: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  paymentMethod: PaymentMethod;
  icon: string;
  color: string;
}

export interface RecurringAgenda {
  /** Já venceram e esperam confirmação. */
  pending: AgendaItem[];
  /** Ainda vão vencer — alimenta a timeline. */
  upcoming: AgendaItem[];
}
