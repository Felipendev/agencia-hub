import { describe, expect, it } from "vitest";
import {
  clienteToCreateRequest,
  clientePatchToApi,
  mergeCustomerApiResponse,
} from "./customer-mapper";
import type { Cliente } from "@/types";

const baseCliente: Omit<Cliente, "id" | "createdAt"> = {
  nome: "Ana Souza",
  email: "",
  telefone: "",
  destinoInteresse: "",
  status: "prospecto",
  observacoes: "",
};

describe("clienteToCreateRequest", () => {
  it("sends null (not a sentinel) when email/phone/destination are empty", () => {
    const request = clienteToCreateRequest(baseCliente);
    expect(request.email).toBeNull();
    expect(request.phone).toBeNull();
    expect(request.interestDestination).toBeNull();
  });

  it("trims and forwards filled fields", () => {
    const request = clienteToCreateRequest({
      ...baseCliente,
      destinoInteresse: "  Lisboa  ",
    });
    expect(request.interestDestination).toBe("Lisboa");
  });
});

describe("clientePatchToApi", () => {
  it("sends an empty string (not null) to clear an optional field", () => {
    const body = clientePatchToApi({ destinoInteresse: "   " });
    // Empty string means "clear" for the API; null/omitted means "don't change".
    expect(body.interestDestination).toBe("");
  });

  it("omits fields that were not part of the patch", () => {
    const body = clientePatchToApi({ nome: "Novo nome" });
    expect(body).not.toHaveProperty("interestDestination");
    expect(body).not.toHaveProperty("email");
  });
});

describe("mergeCustomerApiResponse", () => {
  it("falls back to a display placeholder only for missing interestDestination", () => {
    const merged = mergeCustomerApiResponse(
      { ...baseCliente, id: "x", createdAt: "2026-01-01" },
      {
        id: "x",
        name: "Ana Souza",
        email: null,
        phone: null,
        interestDestination: null,
        status: "PROSPECT",
        notes: "",
        createdAt: "2026-01-01",
        deletedAt: null,
      },
    );
    expect(merged.destinoInteresse).toBe("—");
    expect(merged.email).toBe("");
  });
});
