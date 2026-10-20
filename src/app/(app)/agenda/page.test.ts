// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AgendaPage from "./page";

vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok" }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("customerId=p1") }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const base = { customerId: "p1", customerName: "Ana", tripId: null, purpose: null, durationMinutes: 60, timeZone: "America/Fortaleza", format: "VIDEO",
  location: null, meetingUrl: null, responsibleId: "u1", responsibleName: "Gestor", status: "SCHEDULED", statusReason: null, statusChangedAt: null,
  version: 1, minutesVersion: null, createdAt: "2026-10-01T12:00:00Z", updatedAt: "2026-10-01T12:00:00Z" };

it("agrupa pelo dia de Fortaleza e envia os filtros para a API", async () => {
  const late = { ...base, id: "a", product: "MILES", title: "Revisão tardia", startsAt: "2026-11-02T02:30:00Z", endsAt: "2026-11-02T03:30:00Z", minutesVersion: 1 };
  const fetchMock = vi.fn(async (url: string) => Response.json(url.includes("/members") ? [{ id: "u1", name: "Gestor" }] : [late]));
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(AgendaPage));
  await screen.findByText("Revisão tardia");
  expect(screen.getByRole("heading", { level: 2 }).textContent).toContain("1 de novembro de 2026");
  expect(screen.getByText("23:30")).toBeTruthy();
  expect(screen.getByText("Ata")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Produto"), { target: { value: "MILES" } });
  await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u).includes("product=MILES") && String(u).includes("customerId=p1"))).toBe(true));
});

it("mostra o erro em vez de agenda vazia", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.includes("/members") ? Response.json([]) : Response.json({ message: "Serviço indisponível" }, { status: 503 })));
  render(React.createElement(AgendaPage));
  expect((await screen.findByRole("alert")).textContent).toContain("Serviço indisponível");
  expect(screen.queryByText(/Nenhum compromisso/)).toBeNull();
});
