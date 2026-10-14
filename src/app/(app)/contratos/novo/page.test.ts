// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import NovoContratoPage from "./page";

const push = vi.fn();
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok", user: { accountKind: "SALES_AGENT" } }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams("customerId=p1") }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); push.mockReset(); });

const template = { id: "t1", name: "Assessoria", description: null, currentVersion: 1, archived: false, rowVersion: 1, contractCount: 0, updatedAt: "2026-10-14T12:00:00Z" };
const person = { id: "p1", name: "Ana", email: "ana@x.com", phone: null, interestDestination: null, status: "ACTIVE", notes: "", createdAt: "2026-10-14T12:00:00Z", deletedAt: null };

it("reenvia com a mesma chave após falha e só navega quando a API confirma", async () => {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/customers")) return Response.json([person]);
    if (url.includes("/contract-templates")) return Response.json([template]);
    if (url.endsWith("/contracts") && init?.method === "POST") {
      const attempts = fetchMock.mock.calls.filter(([, i]) => i?.method === "POST").length;
      return attempts === 1 ? Response.json({ message: "Instabilidade temporária" }, { status: 503 }) : Response.json({ contract: { id: "c1" } }, { status: 201 });
    }
    throw new Error(url);
  });
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(NovoContratoPage));
  await screen.findByRole("option", { name: /Ana/ });
  await waitFor(() => expect((screen.getByLabelText(/^Modelo/) as HTMLSelectElement).value).toBe("t1"));
  fireEvent.change(screen.getByLabelText(/^Título/), { target: { value: "Assessoria anual" } });
  fireEvent.click(screen.getByRole("button", { name: "Criar rascunho" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Instabilidade temporária"));
  expect(push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Criar rascunho" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/contratos/c1?criado=1"));
  const keys = fetchMock.mock.calls.filter(([, i]) => i?.method === "POST").map(([, i]) => (i!.headers as Headers).get("Idempotency-Key"));
  expect(keys[0]).toBeTruthy();
  expect(keys[0]).toBe(keys[1]);
  expect(JSON.parse(String(fetchMock.mock.calls.find(([, i]) => i?.method === "POST")![1]!.body))).toMatchObject({ customerId: "p1", templateId: "t1", title: "Assessoria anual" });
});
