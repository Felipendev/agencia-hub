// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import EtapasDaViagemPage from "./page";

vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok" }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
const navigation = vi.hoisted(() => ({ id: "t1" }));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: navigation.id }) }));
afterEach(() => { cleanup(); navigation.id = "t1"; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const trip = { id: "t1", customerId: "p1", customerName: "Ana", serviceType: "AEREO", bookingLocator: "ABC123", status: "UPCOMING", travelStartDate: "2099-01-10", travelEndDate: "2099-01-15" };
const hotel = { id: "s1", kind: "HOTEL", title: "Hotel Central", startsAt: "2099-01-10T17:00:00Z", endsAt: "2099-01-12T15:00:00Z", timeZone: "America/Fortaleza",
  provider: "Rede X", confirmationCode: "ABC", location: null, origin: null, destination: null, people: 2, notes: null, status: "PLANNED", statusReason: null,
  version: 1, links: [], warnings: [], updatedAt: "2099-01-01T00:00:00Z" };
const itinerary = (stages: unknown[] = [hotel], over: Record<string, unknown> = {}) => ({ trip: { ...trip, ...over }, stages, history: [] });

function routes(get: () => unknown, write: (url: string, init: RequestInit) => Response) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/attachments/trips/t1") && (!init?.method || init.method === "GET")) return Response.json([{ id: "f1", filename: "voucher.pdf", contentType: "application/pdf", size: 10, description: "" }]);
    if (url.endsWith("/library")) return Response.json([{ id: "b1", title: "Guia de Lisboa", category: "OUTROS", kind: "LINK" }]);
    if (init?.method && init.method !== "GET") return write(url, init);
    return Response.json(get());
  });
}

describe("etapas da viagem", () => {
  it("não mostra etapas da viagem anterior enquanto carrega outra viagem", async () => {
    let resolveNext!: (response: Response) => void;
    const next = new Promise<Response>((resolve) => { resolveNext = resolve; });
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.endsWith("/trips/t2/stages")) return next;
      if (url.endsWith("/trips/t1/stages")) return Response.json(itinerary());
      return Response.json([]);
    }));
    const view = render(React.createElement(EtapasDaViagemPage));
    await screen.findByRole("article", { name: "Hotel Central" });
    navigation.id = "t2";
    view.rerender(React.createElement(EtapasDaViagemPage));
    expect(screen.queryByRole("article", { name: "Hotel Central" })).toBeNull();
    expect(screen.getByText("Carregando etapas…")).toBeTruthy();
    resolveNext(Response.json(itinerary([], { id: "t2", customerName: "Bruna" })));
    await screen.findByText(/Bruna/);
    expect(screen.queryByRole("article", { name: "Hotel Central" })).toBeNull();
  });
  it("cria etapa com chave de idempotência e só confirma depois da API", async () => {
    const created = { ...hotel, id: "s2", kind: "ACTIVITY", title: "Passeio de barco", startsAt: "2099-01-11T12:00:00Z", endsAt: null };
    const fetchMock = routes(() => itinerary(), () => Response.json({ trip, stage: created, history: [{ id: "e1", stageId: "s2", action: "CREATED", detail: { title: "Passeio de barco" }, author: "Gestor <g@x>", createdAt: "2099-01-01T00:00:00Z" }] }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(EtapasDaViagemPage));
    fireEvent.click(await screen.findByRole("button", { name: "Nova etapa" }));
    fireEvent.change(screen.getByLabelText(/^Tipo/), { target: { value: "ACTIVITY" } });
    fireEvent.change(screen.getByLabelText(/^Título/), { target: { value: "Passeio de barco" } });
    fireEvent.change(screen.getByLabelText(/^Início — data/), { target: { value: "2099-01-11" } });
    fireEvent.change(screen.getByLabelText(/^Início — hora/), { target: { value: "09:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar etapa" }));
    await screen.findByText("Etapa adicionada ao roteiro.");
    const post = fetchMock.mock.calls.find(([, i]) => i?.method === "POST")!;
    expect(String(post[0])).toBe("https://api.example/trips/t1/stages");
    expect(new Headers(post[1]!.headers).get("Idempotency-Key")).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.parse(String(post[1]!.body))).toMatchObject({ kind: "ACTIVITY", title: "Passeio de barco", startsAt: "2099-01-11T09:00:00-03:00", endsAt: null, origin: null });
    expect(screen.getByRole("region", { name: /11 de janeiro/ })).toBeTruthy();
  });

  it("edita pelo mesmo ID e mantém o formulário em conflito de versão", async () => {
    const fetchMock = routes(() => itinerary(), () => Response.json({ message: "A etapa foi alterada por outra pessoa. Recarregue antes de continuar." }, { status: 409 }));
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(EtapasDaViagemPage));
    const card = await screen.findByRole("article", { name: "Hotel Central" });
    fireEvent.click(within(card).getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText(/^Título/), { target: { value: "Hotel Central Plus" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("alterada por outra pessoa"));
    const patch = fetchMock.mock.calls.find(([, i]) => i?.method === "PATCH")!;
    expect(String(patch[0])).toBe("https://api.example/trips/t1/stages/s1");
    expect(JSON.parse(String(patch[1]!.body))).toMatchObject({ title: "Hotel Central Plus", expectedVersion: 1, startsAt: "2099-01-10T14:00:00-03:00" });
    expect((screen.getByLabelText(/^Título/) as HTMLInputElement).value).toBe("Hotel Central Plus");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("cancelar exige motivo e vincula anexo existente sem enviar arquivo", async () => {
    const fetchMock = routes(() => itinerary(), (url, init) => {
      if (url.includes("/status")) return Response.json({ trip, stage: { ...hotel, status: "CANCELLED", statusReason: JSON.parse(String(init.body)).reason, version: 2 }, history: [] });
      return Response.json({ trip, stage: { ...hotel, links: [{ id: "l1", type: "ATTACHMENT", targetId: "f1", title: "voucher.pdf", detail: "", author: "G", createdAt: "2099-01-01T00:00:00Z" }] }, history: [] });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(EtapasDaViagemPage));
    const card = await screen.findByRole("article", { name: "Hotel Central" });
    await waitFor(() => expect(within(card).getByRole("option", { name: "voucher.pdf" })).toBeTruthy());
    fireEvent.change(within(card).getByLabelText("Anexo da viagem para Hotel Central"), { target: { value: "f1" } });
    fireEvent.click(within(card).getAllByRole("button", { name: "Vincular" })[0]);
    await screen.findByText("Anexo vinculado à etapa.");
    const put = fetchMock.mock.calls.find(([, i]) => i?.method === "PUT")!;
    expect(String(put[0])).toBe("https://api.example/trips/t1/stages/s1/attachments/f1");
    expect(fetchMock.mock.calls.some(([u, i]) => String(u).endsWith("/attachments/trips/t1") && i?.method === "POST")).toBe(false);

    fireEvent.click(within(card).getByRole("button", { name: "Cancelar etapa" }));
    const confirm = within(card).getByRole("button", { name: "Confirmar cancelamento" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.change(within(card).getByLabelText(/^Motivo do cancelamento/), { target: { value: "Hotel sem vaga" } });
    fireEvent.click(confirm);
    await screen.findByText(/Etapa cancelada/);
    const status = fetchMock.mock.calls.find(([u]) => String(u).endsWith("/status"))!;
    expect(JSON.parse(String(status[1]!.body))).toEqual({ status: "CANCELLED", reason: "Hotel sem vaga", expectedVersion: 1 });
    expect(within(card).getByText("Cancelada: Hotel sem vaga")).toBeTruthy();
  });

  it("viagem cancelada não oferece nova etapa e mostra avisos de período", async () => {
    vi.stubGlobal("fetch", routes(() => itinerary([{ ...hotel, warnings: ["Termina depois do retorno registrado na viagem."] }], { status: "CANCELLED" }), () => Response.json({})));
    render(React.createElement(EtapasDaViagemPage));
    await screen.findByText(/A viagem está cancelada/);
    expect(screen.queryByRole("button", { name: "Nova etapa" })).toBeNull();
    expect(screen.getByText("Atenção: Termina depois do retorno registrado na viagem.")).toBeTruthy();
  });

  it("excluir só remove após a API e recarrega o roteiro", async () => {
    let stages: unknown[] = [hotel];
    const fetchMock = routes(() => itinerary(stages), (url, init) => { if (init.method === "DELETE") { stages = []; return new Response(null, { status: 204 }); } return Response.json({}); });
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(EtapasDaViagemPage));
    const card = await screen.findByRole("article", { name: "Hotel Central" });
    fireEvent.click(within(card).getByRole("button", { name: "Excluir" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" }).at(-1)!);
    await screen.findByText("Etapa excluída.");
    const del = fetchMock.mock.calls.find(([, i]) => i?.method === "DELETE")!;
    expect(String(del[0])).toBe("https://api.example/trips/t1/stages/s1?expectedVersion=1");
    expect(screen.getByText(/Nenhuma etapa registrada/)).toBeTruthy();
  });
});
