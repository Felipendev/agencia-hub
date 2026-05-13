import { describe, expect, it } from "vitest";
import { mergeCotacaoDetalhes } from "./cotacao-migrate";

describe("mergeCotacaoDetalhes", () => {
  it("normalizes phones and trechos from destinoForm", () => {
    const m = mergeCotacaoDetalhes({
      origem: "BH",
      destinoForm: "Lisboa",
      celular: "(31) 98261-5986",
      whatsapp: "31982615986",
    });
    expect(m.celular).toBe("31982615986");
    expect(m.whatsapp).toBe("31982615986");
    expect(m.destinosTrechos.some((t) => t.includes("Lisboa"))).toBe(true);
  });

  it("returns defaults when partial is undefined", () => {
    const m = mergeCotacaoDetalhes(undefined);
    expect(m.celular).toBe("");
    expect(Array.isArray(m.destinosTrechos)).toBe(true);
  });
});
