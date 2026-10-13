import { describe, expect, it } from "vitest";
import { accumulationReport, calculateAccumulation, type AccumulationAssumptions } from "./accumulation-simulation";
const input: AccumulationAssumptions = { title: "Plano", monthlySpending: 10000, pointsPerDollar: 2, exchangeRate: 5, exchangeDate: "2026-10-13", months: 12, passengers: 2, milesPerPassenger: 40000, destination: "Lisboa", scenarios: [{ program: "Smiles", bonusPercent: 100 }, { program: "LATAM", bonusPercent: 30 }] };
describe("simulação de acúmulo", () => {
  it("calcula os cenários de referência como alternativas e a meta do grupo", () => {
    const r = calculateAccumulation(input)!;
    expect(r.monthlyPoints).toBe(4000); expect(r.basePoints).toBe(48000); expect(r.goalMiles).toBe(80000);
    expect(r.scenarios[0]).toMatchObject({ projectedMiles: 96000, remainingMiles: 0, goalReached: true });
    expect(r.scenarios[1]).toMatchObject({ projectedMiles: 62400, remainingMiles: 17600, goalReached: false });
  });
  it("não converte câmbio ou prazo inválido em projeção", () => {
    for(const rate of [0, -1, NaN, Infinity]) expect(calculateAccumulation({ ...input, exchangeRate: rate })).toBeNull();
    for(const months of [0, -1, 121, 1.5]) expect(calculateAccumulation({ ...input, months })).toBeNull();
    expect(calculateAccumulation({ ...input, passengers: 0 })).toBeNull();
    expect(calculateAccumulation({ ...input, scenarios: [{ program: "A", bonusPercent: -1 }] })).toBeNull();
  });
  it("não arredonda pontos fracionários para cima", () => {
    expect(calculateAccumulation({ ...input, monthlySpending: 100, exchangeRate: 3, months: 1 })?.basePoints).toBe(66);
  });
  it("exporta premissas e impede conteúdo do título de virar código HTML", () => {
    const html = accumulationReport({ ...input, title: '<script>alert("x")</script>' }, calculateAccumulation(input)!);
    expect(html).not.toContain("<script>"); expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Não representam saldo real"); expect(html).toContain("2026-10-13");
  });
});
