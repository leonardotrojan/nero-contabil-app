import {
  creditPeriods,
  summarizeCreditInvoices,
  isCreditPurchase,
  type CycleConfig,
  type CreditEntry,
} from "./invoiceSummary";

const TZ = "America/Sao_Paulo";

const CARD: CycleConfig = { closingDay: 10, dueDay: 17, timeZone: TZ };

/** Instante UTC a partir de uma hora de Brasília (UTC-3). */
const brt = (
  year: number,
  month: number,
  day: number,
  hour = 12,
): Date => new Date(Date.UTC(year, month - 1, day, hour + 3));

const entry = (
  amount: number,
  date: Date,
  paymentMethod = "credit",
): CreditEntry => ({ amount, date: date.toISOString(), paymentMethod });

// "Hoje" fixo: 15/out. Com virada dia 10, a fatura aberta é a de novembro
// (cobre 10/out a 09/nov) e a anterior é a de outubro (10/set a 09/out).
const HOJE = brt(2026, 10, 15);

describe("creditPeriods", () => {
  it("devolve null quando não há cartão configurado", () => {
    expect(creditPeriods(null, HOJE)).toBeNull();
  });

  it("aponta a fatura aberta como aquela em que uma compra de hoje cairia", () => {
    const periods = creditPeriods(CARD, HOJE);

    expect(periods?.open.key).toBe("2026-11");
  });

  it("aponta a anterior como a que acabou de fechar", () => {
    const periods = creditPeriods(CARD, HOJE);

    expect(periods?.previous.key).toBe("2026-10");
  });

  it("gera períodos contíguos", () => {
    const periods = creditPeriods(CARD, HOJE)!;

    expect(periods.open.start.getTime() - periods.previous.end.getTime()).toBe(1);
  });
});

describe("isCreditPurchase", () => {
  it("aceita só despesas no crédito", () => {
    expect(isCreditPurchase({ amount: 10, date: "", paymentMethod: "credit" })).toBe(true);
    expect(isCreditPurchase({ amount: 10, date: "", paymentMethod: "pix" })).toBe(false);
    expect(isCreditPurchase({ amount: 10, date: "", paymentMethod: "debit" })).toBe(false);
  });

  it("ignora pagamentos de fatura, que são o custo consolidado", () => {
    // O consolidado entra no caixa; contá-lo aqui dobraria o valor.
    expect(
      isCreditPurchase({
        amount: 500,
        date: "",
        paymentMethod: "credit",
        isInvoicePayment: true,
      }),
    ).toBe(false);
  });
});

describe("summarizeCreditInvoices", () => {
  it("reporta não configurado quando não há cartão", () => {
    const summary = summarizeCreditInvoices([entry(100, HOJE)], null, HOJE);

    expect(summary).toEqual({
      configured: false,
      openInvoice: null,
      previousInvoice: null,
    });
  });

  it("soma compras no crédito da fatura aberta", () => {
    const entries = [
      entry(240, brt(2026, 10, 12)), // depois da virada → fatura aberta
      entry(180, brt(2026, 10, 14)),
    ];

    const { openInvoice } = summarizeCreditInvoices(entries, CARD, HOJE);

    expect(openInvoice).toMatchObject({
      periodKey: "2026-11",
      total: 420,
      count: 2,
    });
  });

  it("separa compras da fatura anterior", () => {
    const entries = [
      entry(100, brt(2026, 9, 20)), // fatura de outubro
      entry(50, brt(2026, 10, 5)), // ainda outubro
      entry(300, brt(2026, 10, 12)), // fatura de novembro
    ];

    const { openInvoice, previousInvoice } = summarizeCreditInvoices(entries, CARD, HOJE);

    expect(previousInvoice).toMatchObject({ periodKey: "2026-10", total: 150, count: 2 });
    expect(openInvoice).toMatchObject({ periodKey: "2026-11", total: 300, count: 1 });
  });

  it("ignora compras que não são no crédito", () => {
    const entries = [
      entry(240, brt(2026, 10, 12)),
      entry(999, brt(2026, 10, 12), "pix"),
      entry(999, brt(2026, 10, 12), "debit"),
    ];

    const { openInvoice } = summarizeCreditInvoices(entries, CARD, HOJE);

    expect(openInvoice?.total).toBe(240);
  });

  it("ignora compras fora das duas faturas", () => {
    const entries = [
      entry(240, brt(2026, 10, 12)), // aberta
      entry(999, brt(2026, 5, 3)), // muito antiga
      entry(999, brt(2027, 3, 3)), // futura
    ];

    const summary = summarizeCreditInvoices(entries, CARD, HOJE);

    expect(summary.openInvoice?.total).toBe(240);
    expect(summary.previousInvoice?.total).toBe(0);
  });

  it("devolve zero quando não há compras no crédito", () => {
    const summary = summarizeCreditInvoices([], CARD, HOJE);

    expect(summary.openInvoice).toMatchObject({ total: 0, count: 0 });
    expect(summary.previousInvoice).toMatchObject({ total: 0, count: 0 });
  });

  describe("fronteiras", () => {
    it("inclui compra no primeiro instante do período", () => {
      // 10/out 00:00 BRT é o primeiro instante da fatura de novembro.
      const entries = [entry(77, brt(2026, 10, 10, 0))];

      const { openInvoice } = summarizeCreditInvoices(entries, CARD, HOJE);

      expect(openInvoice?.total).toBe(77);
    });

    it("inclui compra no último instante do período anterior", () => {
      const entries = [entry(88, brt(2026, 10, 9, 23))];

      const { previousInvoice } = summarizeCreditInvoices(entries, CARD, HOJE);

      expect(previousInvoice?.total).toBe(88);
    });
  });

  describe("fatura anterior paga", () => {
    it("é unpaid quando não há pagamento registrado", () => {
      const summary = summarizeCreditInvoices([], CARD, HOJE, []);

      expect(summary.previousInvoice?.status).toBe("unpaid");
    });

    it("é paid quando há pagamento para a chave", () => {
      const summary = summarizeCreditInvoices([], CARD, HOJE, [
        { periodKey: "2026-10", amount: 150 },
      ]);

      expect(summary.previousInvoice?.status).toBe("paid");
    });

    it("usa o valor CONGELADO no pagamento, não o derivado", () => {
      // Cenário: fatura de out fechou em 150 e foi paga. Depois o usuário
      // corrige o dia de virada, e o cálculo derivado passaria a dar 999.
      // O que foi pago é fato histórico e não pode mudar.
      const entries = [entry(999, brt(2026, 9, 20))];

      const summary = summarizeCreditInvoices(entries, CARD, HOJE, [
        { periodKey: "2026-10", amount: 150 },
      ]);

      expect(summary.previousInvoice?.total).toBe(150);
    });

    it("deixa a fatura aberta re-derivando enquanto não houver pagamento", () => {
      const entries = [entry(300, brt(2026, 10, 12))];

      const summary = summarizeCreditInvoices(entries, CARD, HOJE, []);

      expect(summary.openInvoice?.total).toBe(300);
      expect(summary.openInvoice?.status).toBe("unpaid");
    });

    it("congela também a aberta se houver pagamento para a chave dela", () => {
      // Só acontece quando o usuário muda o dia de virada depois de pagar: os
      // períodos se deslocam e uma fatura já quitada cai no slot da aberta.
      // Ignorar o pagamento aí mostraria como em aberto algo que já foi pago.
      const entries = [entry(300, brt(2026, 10, 12))];

      const summary = summarizeCreditInvoices(entries, CARD, HOJE, [
        { periodKey: "2026-11", amount: 180 },
      ]);

      expect(summary.openInvoice?.total).toBe(180);
      expect(summary.openInvoice?.status).toBe("paid");
    });

    it("ignora pagamento de uma chave que não é a fatura anterior", () => {
      const summary = summarizeCreditInvoices([], CARD, HOJE, [
        { periodKey: "2026-03", amount: 500 },
      ]);

      expect(summary.previousInvoice?.status).toBe("unpaid");
      expect(summary.previousInvoice?.total).toBe(0);
    });
  });

  it("expõe as datas do ciclo em ISO para o cliente renderizar", () => {
    const { openInvoice } = summarizeCreditInvoices([], CARD, HOJE);

    expect(openInvoice?.closesAt).toBe("2026-11-10T03:00:00.000Z");
    expect(openInvoice?.dueAt).toBe("2026-11-17T03:00:00.000Z");
  });
});
