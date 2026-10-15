import { describe, expect, it } from "vitest";
import { dataFromForm, emptyForm, formFromData, parseMoney } from "./format";

describe("formulário de economia", () => {
  it("converte valores e mantém campos vazios como nulos (resultado indisponível, não erro)", () => {
    const data = dataFromForm(emptyForm());
    expect(data.comparison?.price).toBeNull();
    expect(data.costs).toEqual([]);
    expect(data.milesUsage).toBeNull();
    expect(parseMoney("1.234,56", "x")).toBe(1234.56);
    expect(parseMoney("3.000", "x")).toBe(3000);
    expect(parseMoney("1.234.567", "x")).toBe(1234567);
    expect(parseMoney("12.5", "x")).toBe(12.5);
    expect(() => parseMoney("1,234", "Preço")).toThrow(/Preço/);
  });

  it("exige valor nas linhas de custo e ajuste e valida passageiros", () => {
    const base = emptyForm();
    expect(() => dataFromForm({ ...base, costs: [{ kind: "TAXES", amount: "", description: "Taxas", origin: "", miles: "" }] })).toThrow(/Custo 1/);
    expect(() => dataFromForm({ ...base, adjustments: [{ kind: "REFUND", amount: "", date: "2026-01-01", description: "x" }] })).toThrow(/Ajuste 1/);
    expect(() => dataFromForm({ ...base, passengers: "0" })).toThrow(/passageiros/);
  });

  it("ida e volta pelo formulário preservam os dados", () => {
    const form = { ...emptyForm(), price: "5.000,00", sourceType: "AIRLINE_SITE" as const, sourceDescription: "Site", sameRoute: true, sameDates: true,
      samePassengers: true, equivalentConditions: true, milesUsage: "KNOWN" as const, methodology: "Mesma busca",
      costs: [{ kind: "MILES_ACQUISITION" as const, amount: "900,00", description: "50 mil milhas", origin: "Compra no clube", miles: "50000" }] };
    const data = dataFromForm(form);
    expect(data.comparison?.price).toBe(5000);
    expect(data.costs[0]).toEqual({ kind: "MILES_ACQUISITION", amount: 900, description: "50 mil milhas", origin: "Compra no clube", miles: 50000 });
    expect(formFromData(data)).toMatchObject({ price: "5000,00", milesUsage: "KNOWN", sameDates: true });
  });
});
