// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import NovoContratoPage from "./page";

const push = vi.fn();
let search = "customerId=p1";
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok", user: { accountKind: "SALES_AGENT" } }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams(search) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); push.mockReset(); search = "customerId=p1"; });

const travel = { id: "t1", product: "TRAVEL", name: "Viagem", description: null, currentVersion: 1, archived: false, rowVersion: 1, contractCount: 0, updatedAt: "2026-10-14T12:00:00Z" };
const miles = { ...travel, id: "m1", product: "MILES", name: "Acompanhamento de milhas" };
const person = { id: "p1", name: "Ana", email: "ana@x.com", phone: null, interestDestination: null, status: "ACTIVE", notes: "", createdAt: "2026-10-14T12:00:00Z", deletedAt: null };
const productRadio = (name: string) => screen.getByRole("radio", { name }) as HTMLInputElement;

it("exige escolher o produto e mostra apenas modelos daquele produto", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => Response.json(url.endsWith("/customers") ? [person] : [travel, miles])));
  render(React.createElement(NovoContratoPage));
  await screen.findByRole("option", { name: /Ana/ });
  expect(productRadio("Viagens").checked).toBe(false);
  expect(productRadio("Milhas").checked).toBe(false);
  expect(screen.queryByRole("option", { name: "Acompanhamento de milhas" })).toBeNull();
  fireEvent.click(productRadio("Milhas"));
  expect((screen.getByLabelText(/^Modelo/) as HTMLSelectElement).value).toBe("m1");
  expect(screen.queryByRole("option", { name: "Viagem" })).toBeNull();
});

it("reenvia com a mesma chave após falha e só navega quando a API confirma", async () => {
  search = "customerId=p1&product=TRAVEL";
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/customers")) return Response.json([person]);
    if (url.includes("/contract-templates")) return Response.json([travel, miles]);
    if (url.endsWith("/contracts") && init?.method === "POST") {
      const attempts = fetchMock.mock.calls.filter(([, i]) => i?.method === "POST").length;
      return attempts === 1 ? Response.json({ message: "Instabilidade temporária" }, { status: 503 }) : Response.json({ contract: { id: "c1" } }, { status: 201 });
    }
    throw new Error(url);
  });
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(NovoContratoPage));
  await screen.findByRole("option", { name: /Ana/ });
  expect(productRadio("Viagens").checked).toBe(true);
  fireEvent.change(screen.getByLabelText(/^Modelo/), { target: { value: "t1" } });
  fireEvent.change(screen.getByLabelText(/^Título/), { target: { value: "Assessoria anual" } });
  fireEvent.click(screen.getByRole("button", { name: "Criar rascunho" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Instabilidade temporária"));
  expect(push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Criar rascunho" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/contratos/c1?criado=1"));
  const keys = fetchMock.mock.calls.filter(([, i]) => i?.method === "POST").map(([, i]) => (i!.headers as Headers).get("Idempotency-Key"));
  expect(keys[0]).toBeTruthy();
  expect(keys[0]).toBe(keys[1]);
  expect(JSON.parse(String(fetchMock.mock.calls.find(([, i]) => i?.method === "POST")![1]!.body))).toMatchObject({ customerId: "p1", product: "TRAVEL", templateId: "t1", title: "Assessoria anual" });
});
