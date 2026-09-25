import type { TransactionType } from "./transaction";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType | "both";
  /** Categoria interna: existe para renderizar, mas não é selecionável. */
  system?: boolean;
}
