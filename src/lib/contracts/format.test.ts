import { describe, expect, it } from "vitest";
import { emptyDraftForm, formatDay, parsePrice, toDraftInput, todayInAgencyZone } from "./format";

describe("formatação e validação de contratos", () => {
  it("converte valores em reais e recusa formatos ambíguos", () => {
    expect(parsePrice("1.200,50")).toBe(1200.5);
    expect(parsePrice("R$ 99,9")).toBe(99.9);
    expect(parsePrice("1500.00")).toBe(1500);
    expect(parsePrice("  ")).toBeNull();
    expect(() => parsePrice("12,345")).toThrow(/2 casas/);
    expect(() => parsePrice("-10")).toThrow();
  });

  it("monta o DTO do rascunho e valida vigência e parcelas", () => {
    const form = { ...emptyDraftForm("tpl"), title: " Assessoria ", price: "1.000,00", paymentMode: "INSTALLMENTS" as const, installments: "3", startDate: "2026-11-01" };
    expect(toDraftInput("person", "MILES", form, 2)).toEqual({
      customerId: "person", product: "MILES", templateId: "tpl", templateVersion: null, title: "Assessoria", planName: null, price: 1000,
      startDate: "2026-11-01", endDate: null, paymentMode: "INSTALLMENTS", installments: 3, paymentTerms: null, notes: null, expectedVersion: 2,
    });
    expect(toDraftInput("person", "TRAVEL", { ...form, paymentMode: "CASH" }).installments).toBeNull();
    expect(() => toDraftInput("person", "TRAVEL", { ...form, installments: "1" })).toThrow(/parcelas/);
    expect(() => toDraftInput("person", "TRAVEL", { ...form, endDate: "2026-10-01" })).toThrow(/vigência/);
    expect(() => toDraftInput("person", "TRAVEL", { ...form, title: "" })).toThrow(/título/);
    expect(() => toDraftInput("person", "TRAVEL", { ...form, templateId: "" })).toThrow(/modelo/);
    expect(() => toDraftInput("person", "", form)).toThrow(/Viagens ou de Milhas/);
  });

  it("exibe datas sem deslocar o dia e calcula hoje no fuso da agência", () => {
    expect(formatDay("2026-01-01")).toBe("01/01/2026");
    expect(formatDay(null)).toBe("—");
    // 02:00 UTC ainda é o dia anterior em Fortaleza (UTC-3).
    expect(todayInAgencyZone(new Date("2026-03-10T02:00:00Z"))).toBe("2026-03-09");
  });
});
