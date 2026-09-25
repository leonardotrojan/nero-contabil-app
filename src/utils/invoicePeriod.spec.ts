import {
  invoicePeriodFor,
  invoicePeriodByKey,
  isValidCycleDay,
  InvalidCycleDayError,
} from "./invoicePeriod";

// Fuso do produto. Brasil não tem horário de verão desde 2019 (UTC-3 fixo),
// mas o parâmetro é explícito para que o comportamento não dependa do
// fuso em que o servidor roda.
const TZ = "America/Sao_Paulo";

/** Helper: monta um instante UTC a partir de uma hora de Brasília (UTC-3). */
const brt = (
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
): Date => new Date(Date.UTC(year, month - 1, day, hour + 3, minute));

describe("invoicePeriodFor", () => {
  describe("regra de corte", () => {
    it("joga compra ANTES da virada na fatura do mês corrente", () => {
      // Arrange
      const compra = brt(2026, 10, 3);

      // Act
      const periodo = invoicePeriodFor(compra, 10, 17, TZ);

      // Assert
      expect(periodo.key).toBe("2026-10");
    });

    it("joga compra NO DIA da virada na fatura do mês seguinte", () => {
      // A virada abre o novo ciclo: o próprio dia já pertence à fatura seguinte.
      const periodo = invoicePeriodFor(brt(2026, 10, 10), 10, 17, TZ);

      expect(periodo.key).toBe("2026-11");
    });

    it("joga compra DEPOIS da virada na fatura do mês seguinte", () => {
      const periodo = invoicePeriodFor(brt(2026, 10, 15), 10, 17, TZ);

      expect(periodo.key).toBe("2026-11");
    });

    it("vira o ano quando a compra é em dezembro depois da virada", () => {
      const periodo = invoicePeriodFor(brt(2026, 12, 20), 10, 17, TZ);

      expect(periodo.key).toBe("2027-01");
    });
  });

  describe("fuso horário", () => {
    it("usa o dia no fuso do usuário, não em UTC", () => {
      // 21h de Brasília no dia 9 = dia 10 em UTC.
      // Com virada no dia 10, ler em UTC jogaria na fatura errada.
      const compraNoite = brt(2026, 10, 9, 21);

      const periodo = invoicePeriodFor(compraNoite, 10, 17, TZ);

      expect(compraNoite.getUTCDate()).toBe(10); // confirma a armadilha
      expect(periodo.key).toBe("2026-10"); // mas a fatura é a de outubro
    });

    it("trata a virada de meia-noite local corretamente", () => {
      // 00:00 BRT do dia 10 já é a nova fatura.
      const periodo = invoicePeriodFor(brt(2026, 10, 10, 0, 0), 10, 17, TZ);

      expect(periodo.key).toBe("2026-11");
    });

    it("23:59 local do dia anterior ainda é a fatura corrente", () => {
      const periodo = invoicePeriodFor(brt(2026, 10, 9, 23, 59), 10, 17, TZ);

      expect(periodo.key).toBe("2026-10");
    });
  });

  describe("clamp de dias que não existem no mês", () => {
    it("trata virada 31 em fevereiro sem estourar para março", () => {
      // Fevereiro de 2026 tem 28 dias. A virada efetiva é dia 28.
      const antes = invoicePeriodFor(brt(2026, 2, 27), 31, 5, TZ);
      const noDia = invoicePeriodFor(brt(2026, 2, 28), 31, 5, TZ);

      expect(antes.key).toBe("2026-02");
      expect(noDia.key).toBe("2026-03");
    });

    it("trata virada 31 em mês de 30 dias", () => {
      // Abril tem 30 dias.
      const periodo = invoicePeriodFor(brt(2026, 4, 30), 31, 5, TZ);

      expect(periodo.key).toBe("2026-05");
    });

    it("respeita ano bissexto", () => {
      // 2028 é bissexto: fevereiro tem 29 dias.
      const periodo = invoicePeriodFor(brt(2028, 2, 29), 31, 5, TZ);

      expect(periodo.key).toBe("2028-03");
    });
  });

  describe("fronteiras do período", () => {
    it("fecha o período no instante anterior à virada", () => {
      const { start, end } = invoicePeriodFor(brt(2026, 10, 3), 10, 17, TZ);

      // Fatura de outubro cobre 10/set 00:00 até 09/out 23:59:59.999 (BRT).
      expect(start.toISOString()).toBe("2026-09-10T03:00:00.000Z");
      expect(end.toISOString()).toBe("2026-10-10T02:59:59.999Z");
    });

    it("gera períodos contíguos, sem buraco nem sobreposição", () => {
      const outubro = invoicePeriodFor(brt(2026, 10, 3), 10, 17, TZ);
      const novembro = invoicePeriodFor(brt(2026, 10, 15), 10, 17, TZ);

      expect(novembro.start.getTime() - outubro.end.getTime()).toBe(1);
    });
  });

  describe("vencimento", () => {
    it("vence no mesmo mês quando o vencimento cai depois da virada", () => {
      const { dueAt } = invoicePeriodFor(brt(2026, 10, 3), 10, 17, TZ);

      expect(dueAt.toISOString()).toBe("2026-10-17T03:00:00.000Z");
    });

    it("vence no mês seguinte quando o vencimento cai antes da virada", () => {
      // Fecha dia 28, vence dia 5 — o 5 só pode ser do mês seguinte.
      const { dueAt } = invoicePeriodFor(brt(2026, 10, 3), 28, 5, TZ);

      expect(dueAt.toISOString()).toBe("2026-11-05T03:00:00.000Z");
    });

    it("faz clamp do vencimento em mês curto", () => {
      // Vence dia 31, mas novembro tem 30 dias.
      const { dueAt } = invoicePeriodFor(brt(2026, 11, 3), 10, 31, TZ);

      expect(dueAt.toISOString()).toBe("2026-11-30T03:00:00.000Z");
    });
  });

  describe("validação", () => {
    it.each([0, -1, 32, 1.5, NaN])(
      "rejeita dia de ciclo inválido: %p",
      (dia) => {
        expect(() => invoicePeriodFor(brt(2026, 10, 3), dia, 17, TZ)).toThrow(
          InvalidCycleDayError,
        );
      },
    );

    it("aceita os extremos válidos", () => {
      expect(() => invoicePeriodFor(brt(2026, 10, 3), 1, 2, TZ)).not.toThrow();
      expect(() => invoicePeriodFor(brt(2026, 10, 3), 31, 1, TZ)).not.toThrow();
    });
  });
});

describe("invoicePeriodByKey", () => {
  it("reconstrói o mesmo período a partir da chave", () => {
    const doFato = invoicePeriodFor(brt(2026, 10, 3), 10, 17, TZ);
    const daChave = invoicePeriodByKey("2026-10", 10, 17, TZ);

    expect(daChave).toEqual(doFato);
  });

  it("rejeita chave malformada", () => {
    expect(() => invoicePeriodByKey("2026/10", 10, 17, TZ)).toThrow();
    expect(() => invoicePeriodByKey("2026-13", 10, 17, TZ)).toThrow();
  });
});

describe("isValidCycleDay", () => {
  it("aceita 1 a 31 inteiros", () => {
    expect(isValidCycleDay(1)).toBe(true);
    expect(isValidCycleDay(31)).toBe(true);
    expect(isValidCycleDay(15)).toBe(true);
  });

  it("recusa fora da faixa e não-inteiros", () => {
    expect(isValidCycleDay(0)).toBe(false);
    expect(isValidCycleDay(32)).toBe(false);
    expect(isValidCycleDay(10.5)).toBe(false);
  });
});
