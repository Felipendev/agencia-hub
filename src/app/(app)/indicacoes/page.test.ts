// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import IndicacoesPage from "./page";

let search = new URLSearchParams();
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok" }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => search }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); search = new URLSearchParams(); });

const row = { id: "r1", product: "MILES", status: "CONTACTED", statusReason: null, referrerId: "p1", referrerName: "Ana", referredCustomerId: null, referredCustomerName: null,
  referredName: "Bia", referredPhone: "+5585999991234", referredEmail: null, referredOn: "2026-10-10", channel: "WHATSAPP", channelDetail: null, responsibleId: null,
  responsibleName: null, notes: null, convertedOn: null, saleId: null, everConverted: false, version: 1, createdAt: "", updatedAt: "" };
const summary = { counts: { RECEIVED: 2, CONTACTED: 1, CONVERTED: 3, NOT_CONVERTED: 0, CANCELLED: 1 }, topReferrers: [{ customerId: "p1", name: "Ana", total: 4, converted: 3 }] };

function api() {
  return vi.fn(async (url: string) => (String(url).includes("/summary") ? Response.json(summary) : Response.json([row])));
}

describe("lista de indicações", () => {
  it("filtra pelo produto da URL e mostra o resumo sem valores financeiros", async () => {
    search = new URLSearchParams("product=MILES");
    const fetchMock = api();
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(IndicacoesPage));
    expect(await screen.findByText("Ana → Bia")).toBeTruthy();
    expect(String(fetchMock.mock.calls.find(([u]) => !String(u).includes("summary"))![0])).toBe("https://api.example/referrals?product=MILES");
    expect(screen.getByText(/ainda não cadastrada/)).toBeTruthy();
    expect(screen.getByText(/Créditos de indicação ainda não são controlados/)).toBeTruthy();
    expect(screen.getByText(/4 indicações, 3 convertidas/)).toBeTruthy();
    expect(screen.queryByText(/R\$/)).toBeNull();
    expect(screen.getByRole("link", { name: "Nova indicação" }).getAttribute("href")).toBe("/indicacoes/nova?product=MILES");
  });

  it("clicar no resumo filtra pela situação", async () => {
    const fetchMock = api();
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(IndicacoesPage));
    fireEvent.click(await screen.findByRole("button", { name: /Convertida\s*3/ }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u) === "https://api.example/referrals?status=CONVERTED")).toBe(true));
  });

  it("na visão de uma pessoa busca os dois lados e oferece registrar indicação feita por ela", async () => {
    search = new URLSearchParams("customerId=p1&product=TRAVEL");
    const fetchMock = api();
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(IndicacoesPage));
    await screen.findByText("Ana → Bia");
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/summary"))).toBe(false);
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://api.example/referrals?customerId=p1&product=TRAVEL");
    expect(screen.getByRole("link", { name: "Nova indicação" }).getAttribute("href")).toBe("/indicacoes/nova?referrerId=p1&product=TRAVEL");
  });

  it("erro da API não parece lista vazia", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "Seu perfil não tem acesso às indicações." }, { status: 403 })));
    render(React.createElement(IndicacoesPage));
    expect((await screen.findByRole("alert")).textContent).toContain("não tem acesso");
    expect(screen.queryByText(/Nenhuma indicação encontrada/)).toBeNull();
  });
});
