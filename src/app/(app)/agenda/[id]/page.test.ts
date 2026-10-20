// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CompromissoPage from "./page";

const push = vi.fn();
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok" }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "a1" }), useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams() }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); push.mockReset(); });

const appointment = { id: "a1", product: "TRAVEL", customerId: "p1", customerName: "Ana", tripId: null, title: "Revisão do plano", purpose: "Apresentar opções",
  startsAt: "2026-01-10T13:00:00Z", endsAt: "2026-01-10T14:00:00Z", durationMinutes: 60, timeZone: "America/Fortaleza", format: "VIDEO", location: null,
  meetingUrl: "https://meet.example/x", responsibleId: "u1", responsibleName: "Gestor", status: "SCHEDULED", statusReason: null, statusChangedAt: null,
  version: 1, minutesVersion: null, createdAt: "2026-01-01T12:00:00Z", updatedAt: "2026-01-01T12:00:00Z" };
const detail = (over: Record<string, unknown> = {}, appt: Record<string, unknown> = {}) => ({ appointment: { ...appointment, ...appt }, minutes: null, minutesVersions: [], overlaps: [], history: [], ...over });
const minutes = { data: { participants: "Ana", summary: "Discutimos o roteiro", decisions: ["Lisboa"], nextSteps: [] }, version: 1, updatedAt: "2026-01-10T15:00:00Z" };

function routes(get: () => unknown, write: (url: string, init: RequestInit) => Response) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/members")) return Response.json([{ id: "u1", name: "Gestor" }]);
    if (init?.method && init.method !== "GET") return write(url, init);
    return Response.json(get());
  });
}

describe("detalhe do compromisso", () => {
  it("registra a ata com versão esperada 0 e só confirma depois da API", async () => {
    const fetchMock = routes(() => detail(), () => Response.json(detail({ minutes, minutesVersions: [{ version: 1, author: "Gestor", createdAt: "2026-01-10T15:00:00Z" }] }, { minutesVersion: 1 })));
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(CompromissoPage));
    expect((await screen.findAllByText("10/01/2026", { exact: false })).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Resumo"), { target: { value: "Discutimos o roteiro" } });
    fireEvent.change(screen.getByLabelText("Decisão 1"), { target: { value: "Lisboa" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar ata" }));
    await screen.findByText("Ata registrada.");
    const put = fetchMock.mock.calls.find(([, i]) => i?.method === "PUT")!;
    expect(String(put[0])).toBe("https://api.example/appointments/a1/minutes");
    expect(JSON.parse(String(put[1]!.body))).toEqual({ data: { participants: null, summary: "Discutimos o roteiro", decisions: ["Lisboa"], nextSteps: [] }, expectedVersion: 0 });
    expect(screen.getByRole("button", { name: "Salvar nova versão" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Excluir" })).toBeNull();
  });

  it("mantém o texto da ata quando outra pessoa salvou antes", async () => {
    vi.stubGlobal("fetch", routes(() => detail(), () => Response.json({ message: "O compromisso foi alterado por outra pessoa." }, { status: 409 })));
    render(React.createElement(CompromissoPage));
    fireEvent.change(await screen.findByLabelText("Resumo"), { target: { value: "Meu rascunho" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar ata" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("alterado por outra pessoa"));
    expect((screen.getByLabelText("Resumo") as HTMLTextAreaElement).value).toBe("Meu rascunho");
  });

  it("cancelar exige motivo e envia a versão atual", async () => {
    const fetchMock = routes(() => detail(), (_url, init) => Response.json(detail({}, { status: "CANCELLED", statusReason: JSON.parse(String(init.body)).reason, version: 2 })));
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(CompromissoPage));
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar compromisso" }));
    const confirm = screen.getByRole("button", { name: "Confirmar cancelamento" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/^Motivo do cancelamento/), { target: { value: "Cliente remarcou" } });
    fireEvent.click(confirm);
    await screen.findByText(/Compromisso cancelado\. O histórico/);
    const post = fetchMock.mock.calls.find(([u]) => String(u).endsWith("/status"))!;
    expect(JSON.parse(String(post[1]!.body))).toEqual({ status: "CANCELLED", reason: "Cliente remarcou", expectedVersion: 1 });
    expect(screen.queryByRole("button", { name: "Registrar ata" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reabrir" })).toBeNull();
  });

  it("compromisso futuro não oferece 'realizado'; realizado oferece reabrir e preserva a ata", async () => {
    vi.stubGlobal("fetch", routes(() => detail({}, { startsAt: "2099-01-10T13:00:00Z", endsAt: "2099-01-10T14:00:00Z" }), () => Response.json({})));
    render(React.createElement(CompromissoPage));
    await screen.findByText(/a partir do horário de início/);
    expect(screen.queryByRole("button", { name: "Marcar como realizado" })).toBeNull();
    cleanup();
    vi.stubGlobal("fetch", routes(() => detail({ minutes }, { status: "COMPLETED", minutesVersion: 1 }), () => Response.json({})));
    render(React.createElement(CompromissoPage));
    expect(await screen.findByRole("button", { name: "Reabrir" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Editar ou reagendar" })).toBeNull();
    expect(screen.getByRole("button", { name: "Salvar nova versão" })).toBeTruthy();
  });
});
