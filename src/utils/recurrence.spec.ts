import {
  occurrencesInRange,
  pendingOccurrences,
  upcomingOccurrences,
  occurrenceId,
  type RecurrenceRule,
} from "./recurrence";

const TZ = "America/Sao_Paulo";

/** Instante UTC a partir de uma hora de Brasília (UTC-3). */
const brt = (year: number, month: number, day: number, hour = 12): Date =>
  new Date(Date.UTC(year, month - 1, day, hour + 3));

const rule = (over: Partial<RecurrenceRule> = {}): RecurrenceRule => ({
  id: "r1",
  dayOfMonth: 15,
  startsAt: brt(2026, 1, 1),
  endsAt: null,
  isActive: true,
  ...over,
});

describe("occurrencesInRange", () => {
  it("gera uma ocorrência por mês na janela", () => {
    const found = occurrencesInRange(rule(), brt(2026, 3, 1), brt(2026, 5, 31), TZ);

    expect(found.map((o) => o.periodKey)).toEqual(["2026-03", "2026-04", "2026-05"]);
  });

  it("posiciona a ocorrência na meia-noite local do dia", () => {
    const [first] = occurrencesInRange(rule(), brt(2026, 3, 1), brt(2026, 3, 31), TZ);

    // 15/mar 00:00 em Brasília = 03:00 UTC
    expect(first.date.toISOString()).toBe("2026-03-15T03:00:00.000Z");
  });

  it("não gera nada antes do início da regra", () => {
    const r = rule({ startsAt: brt(2026, 4, 1) });

    const found = occurrencesInRange(r, brt(2026, 1, 1), brt(2026, 5, 31), TZ);

    expect(found.map((o) => o.periodKey)).toEqual(["2026-04", "2026-05"]);
  });

  it("não gera nada depois do fim da regra", () => {
    const r = rule({ endsAt: brt(2026, 4, 20) });

    const found = occurrencesInRange(r, brt(2026, 1, 1), brt(2026, 12, 31), TZ);

    expect(found[found.length - 1].periodKey).toBe("2026-04");
  });

  it("ignora regra inativa", () => {
    const r = rule({ isActive: false });

    expect(occurrencesInRange(r, brt(2026, 1, 1), brt(2026, 12, 31), TZ)).toEqual([]);
  });

  describe("dias que não existem no mês", () => {
    it("faz clamp de dia 31 para o último dia de fevereiro", () => {
      const r = rule({ dayOfMonth: 31 });

      const [fev] = occurrencesInRange(r, brt(2026, 2, 1), brt(2026, 2, 28), TZ);

      // Fevereiro de 2026 tem 28 dias — não pode virar 3 de março.
      expect(fev.date.toISOString()).toBe("2026-02-28T03:00:00.000Z");
    });

    it("faz clamp em mês de 30 dias", () => {
      const r = rule({ dayOfMonth: 31 });

      const [abr] = occurrencesInRange(r, brt(2026, 4, 1), brt(2026, 4, 30), TZ);

      expect(abr.date.toISOString()).toBe("2026-04-30T03:00:00.000Z");
    });

    it("respeita ano bissexto", () => {
      const r = rule({ dayOfMonth: 30 });

      const [fev] = occurrencesInRange(r, brt(2028, 2, 1), brt(2028, 2, 29), TZ);

      expect(fev.date.toISOString()).toBe("2028-02-29T03:00:00.000Z");
    });
  });
});

describe("pendingOccurrences", () => {
  // Hoje: 20/set. A regra do dia 15 já venceu neste mês.
  const HOJE = brt(2026, 9, 20);

  it("traz a ocorrência que já venceu e não foi resolvida", () => {
    const pending = pendingOccurrences([rule()], [], HOJE, TZ);

    expect(pending.map((o) => o.periodKey)).toContain("2026-09");
  });

  it("não traz ocorrência que ainda não venceu", () => {
    const r = rule({ dayOfMonth: 25 });

    const pending = pendingOccurrences([r], [], HOJE, TZ);

    expect(pending.map((o) => o.periodKey)).not.toContain("2026-09");
  });

  it("traz a ocorrência do próprio dia", () => {
    const r = rule({ dayOfMonth: 20 });

    const pending = pendingOccurrences([r], [], HOJE, TZ);

    expect(pending.map((o) => o.periodKey)).toContain("2026-09");
  });

  it("exclui o que já foi resolvido", () => {
    const resolvidas = [occurrenceId("r1", "2026-09")];

    const pending = pendingOccurrences([rule()], resolvidas, HOJE, TZ);

    expect(pending.map((o) => o.periodKey)).not.toContain("2026-09");
  });

  it("olha meses para trás, para pegar o que passou despercebido", () => {
    const pending = pendingOccurrences([rule()], [], HOJE, TZ, 3);

    expect(pending.map((o) => o.periodKey)).toEqual([
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
  });

  it("não olha para antes do início da regra", () => {
    const r = rule({ startsAt: brt(2026, 8, 1) });

    const pending = pendingOccurrences([r], [], HOJE, TZ, 6);

    expect(pending.map((o) => o.periodKey)).toEqual(["2026-08", "2026-09"]);
  });

  it("ordena da mais antiga para a mais recente", () => {
    const pending = pendingOccurrences([rule()], [], HOJE, TZ, 2);

    const dates = pending.map((o) => o.date.getTime());
    expect([...dates].sort((a, b) => a - b)).toEqual(dates);
  });
});

describe("upcomingOccurrences", () => {
  const HOJE = brt(2026, 9, 12);

  it("traz só o que ainda vai vencer", () => {
    const regras = [
      rule({ id: "aluguel", dayOfMonth: 15 }),
      rule({ id: "spotify", dayOfMonth: 5 }), // já passou neste mês
    ];

    const upcoming = upcomingOccurrences(regras, HOJE, brt(2026, 9, 30), TZ);

    expect(upcoming.map((o) => o.ruleId)).toEqual(["aluguel"]);
  });

  it("ordena por data", () => {
    const regras = [
      rule({ id: "c", dayOfMonth: 28 }),
      rule({ id: "a", dayOfMonth: 15 }),
      rule({ id: "b", dayOfMonth: 20 }),
    ];

    const upcoming = upcomingOccurrences(regras, HOJE, brt(2026, 9, 30), TZ);

    expect(upcoming.map((o) => o.ruleId)).toEqual(["a", "b", "c"]);
  });

  it("atravessa a virada do mês quando a janela pede", () => {
    const upcoming = upcomingOccurrences([rule()], HOJE, brt(2026, 10, 31), TZ);

    expect(upcoming.map((o) => o.periodKey)).toEqual(["2026-09", "2026-10"]);
  });

  it("devolve vazio quando não há regras", () => {
    expect(upcomingOccurrences([], HOJE, brt(2026, 12, 31), TZ)).toEqual([]);
  });
});

describe("occurrenceId", () => {
  it("combina regra e período numa chave estável", () => {
    expect(occurrenceId("r1", "2026-09")).toBe("r1:2026-09");
  });
});
