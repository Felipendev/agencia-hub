import { describe, expect, it } from "vitest";
import { emptyForm, groupByDay, toInput } from "./format";
import type { Stage } from "./types";

const stage = (id: string, startsAt: string, timeZone = "America/Fortaleza") => ({ id, startsAt, timeZone }) as Stage;

describe("etapas — formulário", () => {
  it("converte data e hora locais do fuso para ISO com offset", () => {
    const input = toInput({ ...emptyForm("Europe/Lisbon"), title: " Hotel ", startDate: "2099-07-10", endDate: "2099-07-12", people: "2" });
    expect(input.startsAt).toBe("2099-07-10T14:00:00+01:00");
    expect(input.endsAt).toBe("2099-07-12T12:00:00+01:00");
    expect(input.title).toBe("Hotel");
    expect(input.people).toBe(2);
    expect(input).not.toHaveProperty("expectedVersion");
  });

  it("rejeita check-out antes do check-in, pessoas inválidas e fim incompleto", () => {
    const base = { ...emptyForm("America/Fortaleza"), title: "Hotel", startDate: "2099-01-10" };
    expect(() => toInput({ ...base, endDate: "2099-01-09" })).toThrow("O check-out não pode ser anterior ao check-in.");
    expect(() => toInput({ ...base, people: "0" })).toThrow("Informe de 1 a 99 pessoas.");
    expect(() => toInput({ ...base, endTime: "" , endDate: "2099-01-11"})).toThrow("ou deixe a data em branco");
    expect(() => toInput({ ...base, title: " " })).toThrow("O título é obrigatório.");
  });

  it("ignora horário de fim sem data", () => {
    expect(toInput({ ...emptyForm("America/Fortaleza"), title: "Passeio", startDate: "2099-01-10" }).endsAt).toBeNull();
  });

  it("descarta origem e destino fora de transfer e envia a versão esperada na edição", () => {
    const base = { ...emptyForm("America/Fortaleza"), title: "Passeio", kind: "ACTIVITY" as const, startDate: "2099-01-10", endDate: "", endTime: "", origin: "A", destination: "B" };
    expect(toInput(base, 3)).toMatchObject({ origin: null, destination: null, endsAt: null, expectedVersion: 3 });
    expect(toInput({ ...base, kind: "TRANSFER" })).toMatchObject({ origin: "A", destination: "B" });
  });
});

describe("etapas — roteiro", () => {
  it("agrupa pelo dia no fuso da etapa", () => {
    // 02:30Z do dia 11 ainda é dia 10 em Fortaleza.
    const groups = groupByDay([stage("a", "2099-01-10T13:00:00Z"), stage("b", "2099-01-11T02:30:00Z"), stage("c", "2099-01-11T12:00:00Z", "Europe/Lisbon")]);
    expect(groups.map((g) => [g.date, g.stages.map((s) => s.id)])).toEqual([["2099-01-10", ["a", "b"]], ["2099-01-11", ["c"]]]);
  });
});
