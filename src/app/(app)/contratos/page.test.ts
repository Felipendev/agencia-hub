// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ContratosPage from "./page";

vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok" }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("customerId=p1") }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const base = { customerId: "p1", customerName: "Ana", templateId: "t", templateName: "Modelo", templateVersion: 1, status: "DRAFT", planName: null, price: null,
  startDate: null, endDate: null, latestDocumentVersion: null, documentCurrent: false, rowVersion: 1, updatedAt: "2026-10-14T12:00:00Z" };

it("lista contratos da pessoa e separa Viagens e Milhas", async () => {
  const fetchMock = vi.fn(async (url: string) => url && Response.json([{ ...base, id: "a", product: "TRAVEL", title: "Contrato de viagem" }, { ...base, id: "b", product: "MILES", title: "Contrato de milhas" }]));
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(ContratosPage));
  await screen.findByText("Contrato de viagem");
  expect(String(fetchMock.mock.calls[0][0])).toBe("https://api.example/contracts?customerId=p1");
  fireEvent.change(screen.getByLabelText("Filtrar produto"), { target: { value: "MILES" } });
  expect(screen.queryByText("Contrato de viagem")).toBeNull();
  expect(screen.getByText("Contrato de milhas")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Novo contrato" }).getAttribute("href")).toBe("/contratos/novo?customerId=p1&product=MILES");
});

it("mostra erro em vez de lista vazia quando a API falha", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "Serviço indisponível" }, { status: 503 })));
  render(React.createElement(ContratosPage));
  expect((await screen.findByRole("alert")).textContent).toContain("Serviço indisponível");
  expect(screen.queryByText(/Nenhum contrato ainda/)).toBeNull();
});
