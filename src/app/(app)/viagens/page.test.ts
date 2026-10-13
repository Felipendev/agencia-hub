// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ViagensPage from "./page";

vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "test-token", user: { id: "test-user" } }) }));
vi.mock("@/contexts/data-context", () => ({ useData: () => ({ clientes: [], isReady: true, hasRemoteApi: false, syncClientesFromApi: () => Promise.resolve() }) }));
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const trips = [
  { id: "future", customerId: "c1", customerName: "Cliente futuro", serviceType: "FLIGHT", status: "UPCOMING", travelStartDate: "2099-12-01", travelEndDate: "2099-12-10" },
  { id: "past", customerId: "c2", customerName: "Cliente passado", serviceType: "FLIGHT", status: "UPCOMING", travelStartDate: "2025-10-25", travelEndDate: "2025-10-26" },
  { id: "undated", customerId: "c3", customerName: "Cliente sem data", serviceType: "PACKAGE", status: "UPCOMING", travelStartDate: null, travelEndDate: null },
];
describe("visibilidade das viagens de cotações aprovadas", () => {
  it("mostra viagens antigas e sem data na visualização Todas", async () => {
    vi.stubEnv("NEXT_PUBLIC_AGENCIA_HUB_API_URL", "https://api.example"); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(trips)));
    render(React.createElement(ViagensPage));
    await screen.findByText("Cliente futuro"); expect(screen.getByText("Cliente passado")).toBeTruthy(); expect(screen.getByText("Cliente sem data")).toBeTruthy();
  });
  it("restaura Próximas e oculta viagens passadas/sem data até limpar os filtros", async () => {
    localStorage.setItem("agencia-hub:trip-view:test-user", JSON.stringify({ view: "UPCOMING", sort: "TRAVEL_START_ASC" }));
    vi.stubEnv("NEXT_PUBLIC_AGENCIA_HUB_API_URL", "https://api.example"); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(trips)));
    render(React.createElement(ViagensPage)); await screen.findByText("Cliente futuro");
    expect(screen.queryByText("Cliente passado")).toBeNull(); expect(screen.queryByText("Cliente sem data")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(screen.getByText("Cliente passado")).toBeTruthy(); expect(screen.getByText("Cliente sem data")).toBeTruthy();
  });
});
