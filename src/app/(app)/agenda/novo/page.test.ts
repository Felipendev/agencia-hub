// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import NovoCompromissoPage from "./page";

const push = vi.fn();
let search = "customerId=p1";
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok", user: { id: "u1", accountKind: "SALES_AGENT" } }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams(search) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); push.mockReset(); search = "customerId=p1"; });

const person = { id: "p1", name: "Ana", email: null, phone: null, interestDestination: null, status: "ACTIVE", notes: "", createdAt: "2026-10-14T12:00:00Z", deletedAt: null };

function routes(onPost: (init: RequestInit) => Response) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/appointments/members")) return Response.json([{ id: "u1", name: "Vendedora" }]);
    if (url.endsWith("/customers")) return Response.json([person]);
    if (url.includes("/trips")) return Response.json([{ id: "t1", serviceType: "AEREO", bookingLocator: "ABC", travelStartDate: "2026-12-01" }]);
    if (init?.method === "POST") return onPost(init);
    throw new Error(url);
  });
}

it("exige produto e responsável explícitos antes de enviar", async () => {
  const fetchMock = routes(() => Response.json({}));
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(NovoCompromissoPage));
  await screen.findByRole("option", { name: "Ana" });
  await waitFor(() => expect((screen.getByLabelText(/^Responsável/) as HTMLSelectElement).value).toBe("u1"));
  fireEvent.change(screen.getByLabelText(/^Título/), { target: { value: "Revisão" } });
  fireEvent.change(screen.getByLabelText(/^Início/), { target: { value: "14:00" } });
  fireEvent.submit(screen.getByRole("button", { name: "Agendar" }).closest("form")!);
  expect((await screen.findByRole("alert")).textContent).toContain("Viagens ou de Milhas");
  expect(fetchMock.mock.calls.some(([, i]) => i?.method === "POST")).toBe(false);
});

it("envia o horário com offset do fuso e reaproveita a chave após falha", async () => {
  search = "customerId=p1&product=TRAVEL";
  let attempts = 0;
  const fetchMock = routes(() => (++attempts === 1 ? Response.json({ message: "Instabilidade" }, { status: 503 }) : Response.json({ appointment: { id: "a1" } }, { status: 201 })));
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(NovoCompromissoPage));
  await screen.findByRole("option", { name: /ABC/ });
  fireEvent.change(screen.getByLabelText(/^Título/), { target: { value: "Revisão" } });
  fireEvent.change(screen.getByLabelText(/^Data/), { target: { value: "2026-11-01" } });
  fireEvent.change(screen.getByLabelText(/^Início/), { target: { value: "23:30" } });
  fireEvent.change(screen.getByLabelText(/^Formato/), { target: { value: "VIDEO" } });
  fireEvent.change(screen.getByLabelText(/Viagem relacionada/), { target: { value: "t1" } });
  const form = screen.getByRole("button", { name: "Agendar" }).closest("form")!;
  fireEvent.submit(form);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Instabilidade"));
  expect(push).not.toHaveBeenCalled();
  fireEvent.submit(form);
  await waitFor(() => expect(push).toHaveBeenCalledWith("/agenda/a1?criado=1"));
  const posts = fetchMock.mock.calls.filter(([, i]) => i?.method === "POST");
  const keys = posts.map(([, i]) => (i!.headers as Headers).get("Idempotency-Key"));
  expect(keys[0]).toBeTruthy();
  expect(keys[0]).toBe(keys[1]);
  expect(JSON.parse(String(posts[0][1]!.body))).toMatchObject({ product: "TRAVEL", customerId: "p1", tripId: "t1", startsAt: "2026-11-01T23:30:00-03:00", timeZone: "America/Fortaleza", durationMinutes: 60, responsibleId: "u1" });
});
