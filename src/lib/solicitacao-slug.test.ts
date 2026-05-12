import { describe, expect, it } from "vitest";
import { isValidSolicitacaoSlug } from "./solicitacao-slug";

describe("isValidSolicitacaoSlug", () => {
  it("accepts demo-style slugs", () => {
    expect(isValidSolicitacaoSlug("demo")).toBe(true);
    expect(isValidSolicitacaoSlug("minha-agencia-2024")).toBe(true);
  });

  it("rejects empty, uppercase, or too short", () => {
    expect(isValidSolicitacaoSlug("")).toBe(false);
    expect(isValidSolicitacaoSlug("a")).toBe(false);
    expect(isValidSolicitacaoSlug("Demo")).toBe(false);
  });
});
