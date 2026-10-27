import { describe, expect, it } from "vitest";
import { emptyForm, needsReason, nextStatuses, toInput } from "./format";

const TODAY = "2026-10-21";
const base = { ...emptyForm(TODAY, "TRAVEL", "p1"), channel: "WHATSAPP" as const };

describe("indicações — formulário", () => {
  it("contato ainda não cadastrado exige nome e telefone ou e-mail", () => {
    expect(() => toInput({ ...base, referredName: "Bia" }, TODAY)).toThrow("Informe telefone ou e-mail da pessoa indicada.");
    expect(toInput({ ...base, referredName: " Bia ", referredPhone: " 85 99999-1234 " }, TODAY)).toMatchObject({
      product: "TRAVEL", referrerId: "p1", referredCustomerId: null, referredName: "Bia", referredPhone: "85 99999-1234", referredEmail: null, responsibleId: null,
    });
  });

  it("indicado do CRM descarta o contato digitado e não pode ser o indicador", () => {
    const crm = { ...base, mode: "crm" as const, referredCustomerId: "p2", referredName: "Digitado", referredPhone: "123" };
    expect(toInput(crm, TODAY, 4)).toMatchObject({ referredCustomerId: "p2", referredName: null, referredPhone: null, expectedVersion: 4 });
    expect(() => toInput({ ...crm, referredCustomerId: "p1" }, TODAY)).toThrow("não pode ser a mesma");
  });

  it("produto é obrigatório, data não pode ser futura e “Outro” exige detalhe", () => {
    expect(() => toInput({ ...base, product: "", referredName: "Bia", referredPhone: "1" }, TODAY)).toThrow("Viagens ou de Milhas");
    expect(() => toInput({ ...base, referredOn: "2026-10-22", referredName: "Bia", referredPhone: "1" }, TODAY)).toThrow("futuro");
    expect(() => toInput({ ...base, channel: "OTHER", referredName: "Bia", referredPhone: "1" }, TODAY)).toThrow("Descreva a origem");
  });
});

describe("indicações — ciclo", () => {
  it("oferece transições coerentes e pede motivo quando a API exige", () => {
    expect(nextStatuses("CANCELLED")).toEqual(["RECEIVED"]);
    expect(nextStatuses("CONVERTED")).toEqual(["CONTACTED", "CANCELLED"]);
    expect(needsReason("RECEIVED", "CONTACTED")).toBe(false);
    expect(needsReason("CONVERTED", "CONTACTED")).toBe(true);
    expect(needsReason("CONTACTED", "CONVERTED")).toBe(false);
    expect(needsReason("CONTACTED", "NOT_CONVERTED")).toBe(true);
  });
});
