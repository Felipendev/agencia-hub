import { describe, expect, it } from "vitest";
import { expiryState, walletPayload } from "./miles-wallet";
describe("carteira declarada", () => {
  it("limpa campos opcionais e preserva valores numéricos zero", () => {
    expect(
      walletPayload(
        "CARD",
        {
          issuer: "Banco",
          category: "Categoria",
          monthlySpend: "0",
          pointsPerDollar: "",
          creditDay: "",
        },
        { pointsPerDollar: 2 },
      ),
    ).toMatchObject({
      monthlySpend: 0,
      pointsPerDollar: null,
      creditDay: null,
    });
  });
  it("inclui a conta do vencimento sem transformar os pontos em saldo", () => {
    expect(
      walletPayload("EXPIRY", {
        accountId: "account",
        quantity: "1500",
        expiresOn: "2026-12-01",
      }),
    ).toMatchObject({
      accountId: "account",
      quantity: 1500,
      expiresOn: "2026-12-01",
    });
  });
  it("separa vencidos e a janela inclusiva dos próximos 90 dias", () => {
    expect(expiryState("2026-10-13", "2026-10-14")).toBe("expired");
    expect(expiryState("2026-10-14", "2026-10-14")).toBe("upcoming");
    expect(expiryState("2027-01-12", "2026-10-14")).toBe("upcoming");
    expect(expiryState("2027-01-13", "2026-10-14")).toBe("later");
  });
});
