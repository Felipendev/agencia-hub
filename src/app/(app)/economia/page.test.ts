// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import EconomiaPage from "./page";

vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok", user: { accountKind: "SALES_AGENT" } }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("customerId=p1&from=2026-01-01") }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("totaliza só o documentado e mostra os motivos das indisponíveis", async () => {
  const trip = { customerId: "p1", customerName: "Ana", serviceType: "AEREO", bookingLocator: null, airline: null, status: "COMPLETED", travelStartDate: "2026-03-10", travelEndDate: null };
  const report = {
    customerId: "p1", from: "2026-01-01", to: null,
    totals: { trips: 2, available: 1, unavailable: 1, cancelled: 1, comparablePrice: 5000, effectiveCost: 3550.5, savings: 1449.5, savingsPercent: 29 },
    rows: [
      { trip: { ...trip, tripId: "a" }, savingsId: "s", version: 1, data: null, updatedAt: null, result: { available: true, reasons: [], comparablePrice: 5000, baseCost: 3550.5, adjustments: 0, effectiveCost: 3550.5, savings: 1449.5, savingsPercent: 29 } },
      { trip: { ...trip, tripId: "b", status: "CANCELLED" }, savingsId: null, version: 0, data: null, updatedAt: null, result: { available: false, reasons: [{ code: "TRIP_CANCELLED", label: "Viagem cancelada: não há economia realizada" }], comparablePrice: null, baseCost: null, adjustments: null, effectiveCost: null, savings: null, savingsPercent: null } },
    ],
  };
  const fetchMock = vi.fn(async (url: string) => Response.json(url.includes("/savings/report") ? report : []));
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(EconomiaPage));
  expect((await screen.findAllByText("R$ 1.449,50")).length).toBeGreaterThan(0);
  expect(screen.getByText("Viagem cancelada: não há economia realizada")).toBeTruthy();
  expect(screen.getByText("Indisponível")).toBeTruthy();
  expect(String(fetchMock.mock.calls.find(([u]) => String(u).includes("/savings/report"))![0])).toBe("https://api.example/savings/report?customerId=p1&from=2026-01-01");
  expect(screen.queryByRole("link", { name: "Relatório para o cliente" })).toBeNull();
});
