// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import RelatoriosEconomiaPage from "./page";

let accountKind = "AGENCY_OWNER";
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok", user: { accountKind } }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("customerId=p1") }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); accountKind = "AGENCY_OWNER"; });

const person = { id: "p1", name: "Ana", email: null, phone: null, interestDestination: null, status: "ACTIVE", notes: "", createdAt: "2026-10-14T12:00:00Z", deletedAt: null };
const totals = { trips: 1, available: 1, unavailable: 0, cancelled: 0, comparablePrice: 5000, effectiveCost: 3550.5, savings: 1449.5, savingsPercent: 29 };
const content = { previewHash: "1".repeat(64), title: "Resultado", customerLabel: "Cliente", from: null, to: null, message: null, totals, generatedOn: "2026-10-14",
  lines: [{ service: "AEREO", airline: null, locator: null, status: "COMPLETED", travelStartDate: "2026-03-10", travelEndDate: null, available: true, unavailableReasons: [], comparablePrice: 5000, source: null, route: null, effectiveCost: 3550.5, savings: 1449.5, savingsPercent: 29, methodology: "m", notes: null }] };

it("só gera depois da prévia e envia as ocultações escolhidas", async () => {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/customers")) return Response.json([person]);
    if (url.endsWith("/preview")) return Response.json(content);
    if (init?.method === "POST") return Response.json({ id: "r1", customerId: "p1", from: null, to: null, options: {}, content, author: "Gestor", createdAt: "2026-10-14T12:00:00Z" }, { status: 201 });
    return Response.json([]);
  });
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(RelatoriosEconomiaPage));
  await screen.findByRole("option", { name: "Ana" });
  const generate = screen.getByRole("button", { name: "Gerar relatório" }) as HTMLButtonElement;
  expect(generate.disabled).toBe(true);
  fireEvent.click(screen.getByLabelText(/Ocultar o nome da pessoa/));
  fireEvent.click(screen.getByRole("button", { name: "Ver prévia" }));
  await screen.findByText(/Prévia — Resultado/);
  expect(generate.disabled).toBe(false);
  const previewBody = JSON.parse(String(fetchMock.mock.calls.find(([u]) => String(u).endsWith("/preview"))![1]!.body));
  expect(previewBody).toMatchObject({ customerId: "p1", options: { hideCustomerName: true, hideLocators: true, hideNotes: true } });

  // Mudar uma opção invalida a prévia.
  fireEvent.click(screen.getByLabelText(/Ocultar fontes/));
  expect(generate.disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Ver prévia" }));
  await screen.findByText(/Prévia — Resultado/);
  fireEvent.click(screen.getByRole("button", { name: "Gerar relatório" }));
  await screen.findByText(/Relatório gerado/);
  const generated = fetchMock.mock.calls.find(([u, i]) => !String(u).endsWith("/preview") && i?.method === "POST");
  expect(JSON.parse(String(generated![1]!.body)).expectedPreviewHash).toBe(content.previewHash);
  expect(screen.getByRole("button", { name: "Baixar PDF" })).toBeTruthy();
});

it("mostra os detalhes que serão compartilhados e exige nova prévia após conflito", async () => {
  const full = { ...content, lines: [{ ...content.lines[0], route: "FOR-LIS", passengers: 2, fareConditions: "Econômica", baggage: "23 kg",
    comparisonOutboundDate: "2026-12-01", comparisonReturnDate: "2026-12-15", researchedOn: "2026-09-01", sourceType: "AIRLINE_SITE",
    costs: [{ kind: "TAXES", amount: 400, description: "Taxas documentadas", origin: "Comprovante da companhia" }],
    adjustments: [{ kind: "REFUND", amount: 50, date: "2026-09-01", description: "Reembolso documentado" }] }] };
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/customers")) return Response.json([person]);
    if (url.endsWith("/preview")) return Response.json(full);
    if (init?.method === "POST") return Response.json({ message: "Revise uma nova prévia", code: "SAVINGS_CONFLICT" }, { status: 409 });
    return Response.json([]);
  }));
  render(React.createElement(RelatoriosEconomiaPage));
  await screen.findByRole("option", { name: "Ana" });
  fireEvent.click(screen.getByRole("button", { name: "Ver prévia" }));
  expect(await screen.findByText(/Taxas documentadas/)).toBeTruthy();
  expect(screen.getByText(/Comprovante da companhia/)).toBeTruthy();
  expect(screen.getByText(/Reembolso documentado/)).toBeTruthy();
  expect(screen.getByText(/Datas do comparativo: 01\/12\/2026 a 15\/12\/2026/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Gerar relatório" }));
  expect((await screen.findByRole("alert")).textContent).toContain("nova prévia");
  expect((screen.getByRole("button", { name: "Gerar relatório" }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.queryByText(/Prévia — Resultado/)).toBeNull();
});

it("vendedor não gera relatório para o cliente", async () => {
  accountKind = "SALES_AGENT";
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(RelatoriosEconomiaPage));
  expect(screen.getByRole("alert").textContent).toContain("Somente o gestor");
  expect(fetchMock).not.toHaveBeenCalled();
});
