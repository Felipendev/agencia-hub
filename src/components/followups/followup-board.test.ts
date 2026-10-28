// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FollowupBoard } from "./followup-board";
import type { Board, Followup } from "@/lib/followups/api";

const mocks = vi.hoisted(() => ({ list: vi.fn(), save: vi.fn(), state: vi.fn(), remove: vi.fn(), history: vi.fn(), members: vi.fn(), customers: vi.fn() }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "f08-token" }) }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/lib/followups/api", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/followups/api")>(), followupApi: mocks }));
vi.mock("@/lib/work/api", () => ({ workApi: { members: mocks.members } }));
vi.mock("@/lib/api/list-customers-remote", () => ({ listCustomersRemote: mocks.customers }));
vi.mock("@/components/cliente/ClientePicker", () => ({ ClientePicker: ({ label, value, onChange, disabled, required, id }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; required?: boolean; id: string }) => createElement("label", null, label, createElement("select", { id, value, disabled, required, onChange: (e: { target: { value: string } }) => onChange(e.target.value) }, createElement("option", { value: "" }, "Selecione"), createElement("option", { value: "p1" }, "Pessoa teste"))) }));
const row: Followup = { id: "f1", product: "TRAVEL", customerId: "p1", customerName: "Pessoa teste", title: "Retornar com proposta", notes: "Prefere mensagens", dueOn: "2026-10-26", responsibleId: "u1", responsibleName: "Equipe", state: "OPEN", stateReason: "", version: 3, deleted: false };
const board = (items: Followup[] = [row]): Board => ({ today: "2026-10-27", counts: { overdue: 1, today: 0, upcoming: 0 }, items });
const mount = () => render(createElement(FollowupBoard, { product: "TRAVEL" }));
beforeEach(() => { vi.resetAllMocks(); mocks.list.mockResolvedValue(board()); mocks.members.mockResolvedValue([{ id: "u1", name: "Equipe" }]); mocks.customers.mockResolvedValue([{ id: "p1", nome: "Pessoa teste" }]); mocks.save.mockResolvedValue(row); mocks.remove.mockResolvedValue(undefined); mocks.state.mockResolvedValue(row); });
afterEach(cleanup);

describe("F08 acompanhamento comercial", () => {
  it("cria somente após confirmação e reutiliza a chave depois de falha de rede", async () => {
    mount(); await screen.findByText("Retornar com proposta");
    fireEvent.click(screen.getByRole("button", { name: "Nova ação" }));
    fireEvent.change(screen.getByLabelText("Pessoa ou prospecto"), { target: { value: "p1" } });
    fireEvent.change(screen.getByLabelText("Próxima ação"), { target: { value: "Pedir retorno" } });
    fireEvent.change(screen.getByLabelText("Prazo"), { target: { value: "2026-11-01" } });
    fireEvent.change(screen.getByLabelText("Responsável"), { target: { value: "u1" } });
    mocks.save.mockRejectedValueOnce(new Error("Não foi possível confirmar a gravação"));
    fireEvent.click(screen.getByRole("button", { name: "Salvar ação" }));
    await screen.findByRole("alert"); expect((screen.getByLabelText("Próxima ação") as HTMLInputElement).value).toBe("Pedir retorno");
    const key = mocks.save.mock.calls[0][3]; expect(key).toBeTruthy();
    let resolve!: (value: Followup) => void; mocks.save.mockImplementationOnce(() => new Promise<Followup>(r => { resolve = r; }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar ação" }));
    expect(screen.queryByText("Ação salva.")).toBeNull();
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(mocks.save.mock.calls[1][3]).toBe(key); expect(mocks.save.mock.calls[1][1]).toMatchObject({ product: "TRAVEL", customerId: "p1", responsibleId: "u1", expectedVersion: 0 });
    resolve(row); await screen.findByText("Ação salva.");
  });
  it("reprograma o mesmo ID e conserva o formulário em 409", async () => {
    mount(); await screen.findByText("Retornar com proposta");
    fireEvent.click(screen.getByRole("button", { name: "Editar / reprogramar" }));
    expect((screen.getByLabelText("Pessoa ou prospecto") as HTMLSelectElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Prazo"), { target: { value: "2026-11-05" } });
    mocks.save.mockRejectedValueOnce(new Error("Esta ação foi alterada. Recarregue."));
    fireEvent.click(screen.getByRole("button", { name: "Salvar ação" }));
    await screen.findByRole("alert"); expect((screen.getByLabelText("Prazo") as HTMLInputElement).value).toBe("2026-11-05");
    expect(mocks.save.mock.calls[0][2]).toBe("f1"); expect(mocks.save.mock.calls[0][1]).toMatchObject({ expectedVersion: 3, dueOn: "2026-11-05" });
    expect(screen.queryByText("Ação salva.")).toBeNull();
  });
  it("pede confirmação para excluir e não retira a ação quando a API recusa", async () => {
    mount(); await screen.findByText("Retornar com proposta");
    fireEvent.click(screen.getByRole("button", { name: "Excluir" })); expect(mocks.remove).not.toHaveBeenCalled();
    mocks.remove.mockRejectedValueOnce(new Error("Versão antiga"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    await screen.findByRole("alert"); expect(screen.queryByText("Ação excluída. O histórico foi preservado.")).toBeNull();
    mocks.list.mockResolvedValue(board([])); fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    await screen.findByText("Ação excluída. O histórico foi preservado.");
    await screen.findByText("Nenhuma ação encontrada com esses filtros."); expect(mocks.remove).toHaveBeenLastCalledWith("f08-token", row);
  });
  it("muda filtros sem mostrar resultados antigos durante o carregamento", async () => {
    mount(); await screen.findByText("Retornar com proposta");
    mocks.list.mockReturnValueOnce(new Promise(() => {})); fireEvent.click(screen.getByRole("button", { name: "Próximas (0)" }));
    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith("f08-token", expect.objectContaining({ product: "TRAVEL", bucket: "UPCOMING", state: "OPEN" })));
    expect(screen.queryByText("Retornar com proposta")).toBeNull(); expect(screen.getByText("Carregando ações…")).toBeTruthy();
  });
  it("separa a troca de produto e abre a ficha de Milhas correta", async () => {
    const view = mount(); await screen.findByText("Retornar com proposta");
    mocks.list.mockResolvedValue(board([{ ...row, product: "MILES", title: "Contato de Milhas" }])); view.rerender(createElement(FollowupBoard, { product: "MILES" }));
    expect(screen.queryByText("Retornar com proposta")).toBeNull(); await screen.findByText("Contato de Milhas");
    expect(screen.getByRole("link", { name: "Pessoa teste" }).getAttribute("href")).toBe("/milhas/clientes/p1");
  });
  it("mantém consulta do histórico de ações excluídas sem oferecer reabertura", async () => {
    mount(); await screen.findByText("Retornar com proposta"); mocks.list.mockResolvedValue(board([{ ...row, deleted: true }]));
    fireEvent.change(screen.getByLabelText("Situação"), { target: { value: "DELETED" } });
    await screen.findByText("Excluída"); expect(mocks.list).toHaveBeenLastCalledWith("f08-token", expect.objectContaining({ deleted: true, state: undefined }));
    expect(screen.queryByRole("button", { name: "Reabrir com motivo" })).toBeNull(); expect(screen.queryByRole("button", { name: "Excluir" })).toBeNull();
    mocks.history.mockResolvedValue([{ id: "e1", action: "DELETED", snapshot: { before: row, after: { ...row, deleted: true } }, authorId: "u1", authorName: "Equipe", createdAt: "2026-10-27T10:00:00Z" }]);
    fireEvent.click(screen.getByRole("button", { name: "Histórico" })); await screen.findByText("Excluída · Equipe");
    expect(screen.getByText(/Antes: Retornar com proposta/)).toBeTruthy();
  });
  it("conclui e cancela usando versão e motivo da ação selecionada", async () => {
    mount(); await screen.findByText("Retornar com proposta"); fireEvent.click(screen.getByRole("button", { name: "Cancelar ação" }));
    fireEvent.change(screen.getByLabelText("Motivo"), { target: { value: "Cliente pediu pausa" } }); fireEvent.click(screen.getByRole("button", { name: "Salvar ação" }));
    await screen.findByText("Ação salva."); expect(mocks.state).toHaveBeenCalledWith("f08-token", row, "CANCELLED", "Cliente pediu pausa");
  });
  it("recupera erros de referências, lista e histórico sem confundir falha com ausência", async () => {
    mocks.members.mockRejectedValueOnce(new Error("Equipe indisponível"));
    mocks.list.mockRejectedValueOnce(new Error("Lista indisponível"));
    mount(); await screen.findByText(/Equipe indisponível/); await screen.findByText(/Lista indisponível/);
    expect((screen.getByRole("button", { name: "Nova ação" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Recarregar pessoas e equipe" }));
    fireEvent.click(screen.getByRole("button", { name: "Recarregar lista" }));
    await screen.findByText("Retornar com proposta");
    mocks.history.mockRejectedValueOnce(new Error("Histórico indisponível"));
    fireEvent.click(screen.getByRole("button", { name: "Histórico" })); await screen.findByText(/Histórico indisponível/);
    mocks.history.mockResolvedValue([]); fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(screen.queryByText(/Histórico indisponível/)).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Fechar histórico" }));
    fireEvent.change(screen.getByLabelText("Filtrar pessoa ou prospecto"), { target: { value: "p1" } });
    fireEvent.change(screen.getByLabelText("Responsável"), { target: { value: "u1" } });
    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith("f08-token", expect.objectContaining({ customerId: "p1", responsibleId: "u1" })));
  });
  it("reabre com motivo e permite voltar ao formulário após interrupção de rede", async () => {
    mocks.list.mockResolvedValue(board([{ ...row, state: "DONE" }]));
    mount(); await screen.findByText("Retornar com proposta");
    fireEvent.click(screen.getByRole("button", { name: "Reabrir com motivo" }));
    fireEvent.change(screen.getByLabelText("Motivo"), { target: { value: "Retomar contato" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar ação" }));
    await screen.findByText("Ação salva."); expect(mocks.state).toHaveBeenLastCalledWith("f08-token", expect.objectContaining({ id: "f1" }), "OPEN", "Retomar contato");
    mocks.list.mockResolvedValue(board()); fireEvent.change(screen.getByLabelText("Situação"), { target: { value: "" } });
    await screen.findByRole("button", { name: "Editar / reprogramar" });
    fireEvent.click(screen.getByRole("button", { name: "Editar / reprogramar" }));
    fireEvent.change(screen.getByLabelText("Observações"), { target: { value: "Nova observação" } });
    mocks.save.mockRejectedValueOnce(new TypeError("network"));
    fireEvent.click(screen.getByRole("button", { name: "Salvar ação" }));
    await screen.findByText(/A conexão foi interrompida/);
    expect((screen.getByLabelText("Observações") as HTMLTextAreaElement).value).toBe("Nova observação");
    fireEvent.click(screen.getByRole("button", { name: "Voltar à lista" }));
    expect(screen.queryByRole("region", { name: "Editar ou reprogramar ação" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    expect(screen.getByLabelText("Resultado do contato (opcional)")).toBeTruthy();
  });
});
