// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import TripSavingsPage from "./page";

vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok", user: { accountKind: "SALES_AGENT" } }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("next/navigation", () => ({ useParams: () => ({ tripId: "t1" }) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const trip = { tripId: "t1", customerId: "p1", customerName: "Ana", serviceType: "AEREO", bookingLocator: "ABC123", airline: "LATAM", status: "COMPLETED", travelStartDate: "2026-03-10", travelEndDate: null };
const unavailable = { available: false, reasons: [{ code: "NO_ANALYSIS", label: "Sem análise de economia registrada" }], comparablePrice: null, baseCost: null, adjustments: null, effectiveCost: null, savings: null, savingsPercent: null };
const empty = { trip, savingsId: null, version: 0, data: null, result: unavailable, versions: [], evidence: [], history: [] };
const savedResult = { available: true, reasons: [], comparablePrice: 5000, baseCost: 3550.5, adjustments: 0, effectiveCost: 3550.5, savings: 1449.5, savingsPercent: 29 };

describe("análise de economia da viagem", () => {
  it("mostra indisponível sem número e cria a análise com versão esperada 0", async () => {
    const saved = { ...empty, savingsId: "s1", version: 1, data: { comparison: null, costs: [], milesUsage: "NOT_USED", adjustments: [], methodology: "m", notes: null }, result: savedResult, versions: [{ version: 1, author: "Ana", createdAt: "2026-10-14T12:00:00Z" }] };
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => Response.json(init?.method === "PUT" ? saved : empty));
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(TripSavingsPage));
    expect(await screen.findByText("Economia indisponível")).toBeTruthy();
    expect(screen.getByText("Sem análise de economia registrada")).toBeTruthy();
    expect(screen.queryByText(/^R\$\s?\d/)).toBeNull();

    fireEvent.change(screen.getByLabelText("Preço total da alternativa (R$)"), { target: { value: "5.000,00" } });
    fireEvent.click(screen.getByLabelText("Não usou milhas"));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar custo" }));
    fireEvent.change(screen.getByLabelText("Valor (R$)"), { target: { value: "3.000" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Pago à agência" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar análise" }));
    await screen.findByText("Análise registrada.");
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT")!;
    expect(String(put[0])).toBe("https://api.example/trips/t1/savings");
    const body = JSON.parse(String(put[1]!.body));
    expect(body.expectedVersion).toBe(0);
    expect(body.data.comparison.price).toBe(5000);
    expect(body.data.costs).toEqual([{ kind: "AGENCY_PAYMENT", amount: 3000, description: "Pago à agência", origin: null, miles: null }]);
    expect(screen.getByText("R$ 1.449,50")).toBeTruthy();
  });

  it("mantém o formulário quando outra pessoa alterou a análise", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => init?.method === "PUT"
      ? Response.json({ message: "A análise foi alterada por outra pessoa. Recarregue antes de salvar." }, { status: 409 })
      : Response.json(empty));
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(TripSavingsPage));
    fireEvent.change(await screen.findByLabelText("Metodologia"), { target: { value: "Meu rascunho" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar análise" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("alterada por outra pessoa"));
    expect((screen.getByLabelText("Metodologia") as HTMLTextAreaElement).value).toBe("Meu rascunho");
    expect(screen.queryByText("Análise registrada.")).toBeNull();
  });
});
