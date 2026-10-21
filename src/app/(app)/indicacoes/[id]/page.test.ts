// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import IndicacaoPage from "./page";

const push = vi.fn();
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok" }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "r1" }), useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams() }));
vi.mock("@/lib/api/list-customers-remote", () => ({ listCustomersRemote: async () => [{ id: "p1", nome: "Ana", telefone: "", email: "" }, { id: "p2", nome: "Bia Souza", telefone: "", email: "" }] }));
vi.mock("@/lib/agenda/time", async (orig) => ({ ...(await orig<typeof import("@/lib/agenda/time")>()), todayIn: () => "2026-10-21" }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); push.mockReset(); });

const base = { id: "r1", product: "TRAVEL", status: "CONTACTED", statusReason: null, referrerId: "p1", referrerName: "Ana", referredCustomerId: null, referredCustomerName: null,
  referredName: "Bia Souza", referredPhone: "+5585999991234", referredEmail: null, referredOn: "2026-10-10", channel: "WHATSAPP", channelDetail: null, responsibleId: null,
  responsibleName: null, notes: null, convertedOn: null, saleId: null, everConverted: false, version: 3, createdAt: "", updatedAt: "" };
const detail = (over: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({ referral: { ...base, ...over }, warnings: [], history: [], ...extra });

function routes(get: () => unknown, write: (url: string, init: RequestInit) => Response) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (String(url).endsWith("/members")) return Response.json([]);
    if (String(url).includes("/sales?")) return Response.json([{ id: "s1", saleDate: "2026-10-18", totalAmount: 3500, status: "OPEN" }]);
    if (init?.method && init.method !== "GET") return write(String(url), init);
    return Response.json(get());
  });
}

describe("detalhe da indicação", () => {
  it("reutiliza prospecto já cadastrado quando o vínculo falha", async () => {
    let links = 0;
    const fetchMock = routes(() => detail(), (url) => {
      if (url.endsWith("/customers")) return Response.json({ id: "p3", name: "Bia Souza" }, { status: 201 });
      links++;
      return links === 1 ? Response.json({ message: "Falha temporária" }, { status: 503 }) : Response.json(detail({ referredCustomerId: "p3", referredCustomerName: "Bia Souza", version: 4 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(IndicacaoPage));
    fireEvent.click(await screen.findByRole("button", { name: "Cadastrar “Bia Souza” como prospecto" }));
    await screen.findByText(/A pessoa foi cadastrada em Pessoas, mas não foi vinculada/);
    fireEvent.click(screen.getByRole("button", { name: "Vincular prospecto já cadastrado" }));
    await screen.findByText("Pessoa cadastrada como prospecto e vinculada à indicação.");
    expect(fetchMock.mock.calls.filter(([u, i]) => String(u).endsWith("/customers") && i?.method === "POST")).toHaveLength(1);
    expect(fetchMock.mock.calls.filter(([u, i]) => String(u).endsWith("/referred-customer/p3") && i?.method === "PUT")).toHaveLength(2);
  });
  it("convertida exige indicado no cadastro; vincular usa a versão atual", async () => {
    const fetchMock = routes(() => detail({}, { warnings: [{ kind: "CUSTOMER", id: "p2", label: "Bia Souza" }] }), () => Response.json(detail({ referredCustomerId: "p2", referredCustomerName: "Bia Souza", version: 4 })));
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(IndicacaoPage));
    expect(await screen.findByText(/coincide com/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Marcar como convertida" }));
    expect(screen.getByText(/Vincule a pessoa indicada a um cadastro/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Confirmar" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    fireEvent.change(screen.getByLabelText("Pessoa já cadastrada"), { target: { value: "p2" } });
    fireEvent.click(screen.getByRole("button", { name: "Vincular" }));
    await screen.findByText("Pessoa indicada vinculada ao cadastro.");
    const put = fetchMock.mock.calls.find(([, i]) => i?.method === "PUT")!;
    expect(String(put[0])).toBe("https://api.example/referrals/r1/referred-customer/p2");
    expect(JSON.parse(String(put[1]!.body))).toEqual({ expectedVersion: 3 });
    expect(screen.queryByText("Vincular a pessoa indicada ao cadastro")).toBeNull();
  });

  it("marca convertida com data e venda opcional de Viagens", async () => {
    const fetchMock = routes(() => detail({ referredCustomerId: "p2", referredCustomerName: "Bia Souza" }), (_u, init) => {
      const body = JSON.parse(String(init.body));
      return Response.json(detail({ referredCustomerId: "p2", referredCustomerName: "Bia Souza", status: "CONVERTED", convertedOn: body.convertedOn, saleId: body.saleId, everConverted: true, version: 4 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(IndicacaoPage));
    fireEvent.click(await screen.findByRole("button", { name: "Marcar como convertida" }));
    await waitFor(() => expect(screen.getByRole("option", { name: /18\/10\/2026/ })).toBeTruthy());
    fireEvent.change(screen.getByLabelText(/^Venda da pessoa indicada/), { target: { value: "s1" } });
    fireEvent.change(screen.getByLabelText(/^Data da conversão/), { target: { value: "2026-10-19" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await screen.findByText("Indicação marcada como convertida.");
    const post = fetchMock.mock.calls.find(([u]) => String(u).endsWith("/status"))!;
    expect(JSON.parse(String(post[1]!.body))).toEqual({ status: "CONVERTED", reason: null, convertedOn: "2026-10-19", saleId: "s1", expectedVersion: 3 });
    expect(screen.queryByRole("button", { name: "Excluir" })).toBeNull();
    expect(screen.getByText(/já foram convertidas não são excluídas/)).toBeTruthy();
  });

  it("cancelar exige motivo; edição mantém o formulário em conflito", async () => {
    const fetchMock = routes(() => detail(), (u, init) => {
      if (u.endsWith("/status")) return Response.json(detail({ status: "CANCELLED", statusReason: JSON.parse(String(init.body)).reason, version: 4 }));
      return Response.json({ message: "A indicação foi alterada por outra pessoa. Recarregue antes de continuar." }, { status: 409 });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(IndicacaoPage));
    fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Observações"), { target: { value: "Prefere contato à noite" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("alterada por outra pessoa"));
    const patch = fetchMock.mock.calls.find(([, i]) => i?.method === "PATCH")!;
    expect(String(patch[0])).toBe("https://api.example/referrals/r1");
    expect(JSON.parse(String(patch[1]!.body))).toMatchObject({ notes: "Prefere contato à noite", expectedVersion: 3, product: "TRAVEL" });
    expect((screen.getByLabelText("Observações") as HTMLTextAreaElement).value).toBe("Prefere contato à noite");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar edição" }));

    fireEvent.click(screen.getByRole("button", { name: "Cancelar indicação" }));
    const confirm = screen.getByRole("button", { name: "Confirmar" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/^Motivo do cancelamento/), { target: { value: "Registro duplicado" } });
    fireEvent.click(confirm);
    await screen.findByText(/Indicação cancelada/);
    expect(screen.getByRole("button", { name: "Reativar" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
  });

  it("exclui só após a API e volta para a lista do produto", async () => {
    const fetchMock = routes(() => detail(), () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(IndicacaoPage));
    fireEvent.click(await screen.findByRole("button", { name: "Excluir" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" }).at(-1)!);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/indicacoes?product=TRAVEL"));
    expect(String(fetchMock.mock.calls.find(([, i]) => i?.method === "DELETE")![0])).toBe("https://api.example/referrals/r1?expectedVersion=3");
  });
});
