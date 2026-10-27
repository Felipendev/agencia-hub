// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import NovaIndicacaoPage from "./page";

const push = vi.fn();
let search = new URLSearchParams();
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok" }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), useSearchParams: () => search }));
vi.mock("@/lib/api/list-customers-remote", () => ({ listCustomersRemote: async () => [{ id: "p1", nome: "Ana", telefone: "85 9999", email: "" }, { id: "p2", nome: "Caio", telefone: "", email: "caio@x.com" }] }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); push.mockReset(); search = new URLSearchParams(); });

describe("nova indicação", () => {
  it("exige produto, envia chave de idempotência e só navega após a API", async () => {
    search = new URLSearchParams("referrerId=p1");
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith("/members")) return Response.json([{ id: "u1", name: "Gestora" }]);
      if (init?.method === "POST") return Response.json({ referral: { id: "r9" }, warnings: [], history: [] }, { status: 201 });
      return Response.json([]);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(NovaIndicacaoPage));
    await screen.findByRole("option", { name: "Ana · 85 9999" });
    expect((screen.getByLabelText(/^Quem indicou/) as HTMLSelectElement).value).toBe("p1");
    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: "Bia" } });
    fireEvent.change(screen.getByLabelText("Telefone"), { target: { value: "85 99999-1234" } });
    fireEvent.change(screen.getByLabelText(/^Origem/), { target: { value: "WHATSAPP" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar indicação" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Viagens ou de Milhas");
    expect(fetchMock.mock.calls.some(([, i]) => i?.method === "POST")).toBe(false);

    fireEvent.click(screen.getByLabelText("Milhas"));
    fireEvent.click(screen.getByRole("button", { name: "Registrar indicação" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/indicacoes/r9?criada=1"));
    const post = fetchMock.mock.calls.find(([, i]) => i?.method === "POST")!;
    expect(new Headers(post[1]!.headers).get("Idempotency-Key")).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.parse(String(post[1]!.body))).toMatchObject({ product: "MILES", referrerId: "p1", referredCustomerId: null, referredName: "Bia", referredPhone: "85 99999-1234", channel: "WHATSAPP" });
  });

  it("indicado do CRM não lista o próprio indicador e erro 409 preserva o formulário", async () => {
    search = new URLSearchParams("product=TRAVEL&referrerId=p1");
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") return Response.json({ message: "Caio já tem uma indicação ativa em Viagens." }, { status: 409 });
      return Response.json([]);
    }));
    render(React.createElement(NovaIndicacaoPage));
    await screen.findByRole("option", { name: "Ana · 85 9999" });
    fireEvent.click(screen.getByLabelText("Já cadastrada em Pessoas"));
    const referred = screen.getByLabelText(/^Pessoa indicada/) as HTMLSelectElement;
    expect(Array.from(referred.options).map((o) => o.value)).toEqual(["", "p2"]);
    fireEvent.change(referred, { target: { value: "p2" } });
    fireEvent.change(screen.getByLabelText(/^Origem/), { target: { value: "EVENT" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar indicação" }));
    expect((await screen.findByRole("alert")).textContent).toContain("já tem uma indicação ativa");
    expect(push).not.toHaveBeenCalled();
    expect((screen.getByLabelText(/^Pessoa indicada/) as HTMLSelectElement).value).toBe("p2");
  });
});
