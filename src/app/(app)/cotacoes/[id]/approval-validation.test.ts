// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import CotacaoDetalhePage from "./page";
import { emptyCotacaoDetalhes } from "@/lib/cotacao-defaults";

const mocks = vi.hoisted(() => ({ update: vi.fn(), success: vi.fn(), error: vi.fn(), push: vi.fn(), quotes: [] as unknown[] }));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "quote-test" }), useRouter: () => ({ push: mocks.push, back: vi.fn() }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ isOwner: false, token: "test", user: null }) }));
vi.mock("@/contexts/data-context", () => ({ useData: () => ({ clientes: [], cotacoes: mocks.quotes, updateCotacao: mocks.update, isReady: true }) }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ success: mocks.success, error: mocks.error }) }));
vi.mock("@/hooks/use-agency-branding", () => ({ useAgencyBranding: () => ({ name: "Agência teste", logo: null }) }));
vi.mock("@/components/timeline/TimelineView", () => ({ TimelineView: () => null }));
vi.mock("@/components/cotacao/EditarCotacaoModal", () => ({ EditarCotacaoModal: () => null }));
vi.mock("@/components/cotacao/EnviarWhatsAppModal", () => ({ EnviarWhatsAppModal: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });
const fixture = (status = "aprovado") => ({ id: "quote-test", clienteId: "customer-test", titulo: "Cotação de teste", destino: "Lisboa", valorTotal: 1000, moeda: "BRL", status, validade: "2099-12-31", detalhes: emptyCotacaoDetalhes(), tags: [], prioridade: false, responsavel: "Equipe", observacoes: "", createdAt: "2026-10-01T12:00:00Z", updatedAt: "2026-10-01T12:00:00Z" });
describe("diagnóstico da confirmação de aprovação", () => {
  it("aguarda a API antes de confirmar a aprovação e impede reenvio", async () => {
    let complete!: () => void; const pending = new Promise<void>(resolve => { complete = resolve; });
    mocks.update.mockReturnValue(pending);
    mocks.quotes = [{ id: "quote-test", clienteId: "customer-test", titulo: "Cotação de teste", destino: "Lisboa", valorTotal: 1000, moeda: "BRL", status: "aguardando", validade: "2099-12-31", detalhes: emptyCotacaoDetalhes(), tags: [], prioridade: false, responsavel: "Equipe", observacoes: "", createdAt: "2026-10-01T12:00:00Z", updatedAt: "2026-10-01T12:00:00Z" }];
    render(React.createElement(CotacaoDetalhePage));
    fireEvent.click(screen.getByRole("button", { name: "Aprovado" }));
    expect(mocks.update).toHaveBeenCalledWith("quote-test", { status: "aprovado" });
    expect(mocks.success).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Aprovado" }));
    expect(mocks.update).toHaveBeenCalledTimes(1);
    await act(async () => { complete(); await pending; });
    await waitFor(() => expect(mocks.success).toHaveBeenCalledTimes(1));
  });
  it("abre a viagem existente em vez de cadastrar outra", async () => {
    mocks.quotes = [fixture()];
    const fetchMock = vi.fn().mockResolvedValue(Response.json([{ id: "existing-trip" }])); vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(CotacaoDetalhePage)); fireEvent.click(screen.getByRole("button", { name: "Abrir viagem vinculada" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/viagens/existing-trip"));
    expect(fetchMock).toHaveBeenCalledTimes(1); expect(fetchMock.mock.calls[0][0]).toContain("quotationId=quote-test");
  });
  it("mostra os registros legados quando existe mais de uma viagem", async () => {
    mocks.quotes = [fixture()]; vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([{ id: "first" }, { id: "second" }])));
    render(React.createElement(CotacaoDetalhePage)); fireEvent.click(screen.getByRole("button", { name: "Abrir viagem vinculada" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/viagens?cotacaoId=quote-test"));
    expect(mocks.error).toHaveBeenCalled();
  });
  it("não confirma aprovação quando a API recusa a alteração", async () => {
    mocks.quotes = [fixture("aguardando")]; mocks.update.mockRejectedValue(new Error("Falha no servidor"));
    render(React.createElement(CotacaoDetalhePage)); fireEvent.click(screen.getByRole("button", { name: "Aprovado" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Falha no servidor")); expect(mocks.success).not.toHaveBeenCalled();
  });
});
