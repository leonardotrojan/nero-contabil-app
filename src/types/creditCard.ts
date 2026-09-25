import type { SyncStatus } from "./transaction";

export interface CreditCard {
  /** Dia da virada: quando a fatura fecha e o próximo ciclo abre (1-31). */
  closingDay: number;
  /** Dia do vencimento: quando o dinheiro sai da conta (1-31). */
  dueDay: number;
  /** Fuso capturado do aparelho — decide qual é "o dia" de uma compra. */
  timeZone: string;
  name: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface CreditCardConfigDTO {
  closingDay: number;
  dueDay: number;
  timeZone?: string;
  name?: string;
}

/** Resposta de GET/PUT /credit-card. */
export interface CreditCardResponse {
  configured: boolean;
  card: {
    id: string;
    name: string;
    closingDay: number;
    dueDay: number;
    timeZone: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  cycle: {
    current: {
      key: string;
      start: string;
      end: string;
      closesAt: string;
      dueAt: string;
    };
  } | null;
}
