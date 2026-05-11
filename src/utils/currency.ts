export const formatCurrency = (value: number, compact = false): string => {
  if (compact && Math.abs(value) >= 1000) {
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
    return formatted;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatAmount = (value: number): string =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

export const parseAmount = (raw: string): number => {
  const clean = raw.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(clean) || 0;
};
