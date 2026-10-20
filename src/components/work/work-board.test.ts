// @vitest-environment jsdom
import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkBoard } from "./work-board";
import type { Task, Template, Run } from "@/lib/work/types";

const mocks = vi.hoisted(() => ({
  tasks: vi.fn(),
  templates: vi.fn(),
  runs: vi.fn(),
  members: vi.fn(),
  references: vi.fn(),
  history: vi.fn(),
  saveTask: vi.fn(),
  deleteTask: vi.fn(),
  state: vi.fn(),
  saveTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  apply: vi.fn(),
  saveRun: vi.fn(),
  cancelRun: vi.fn(),
  customers: vi.fn(),
}));
vi.mock("@/lib/work/api", () => ({ workApi: mocks }));
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ token: "test-token" }),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/api/list-customers-remote", () => ({
  listCustomersRemote: mocks.customers,
}));
vi.mock("@/components/cliente/ClientePicker", () => ({
  ClientePicker: ({
    id,
    value,
    onChange,
    label = "Cliente",
    required,
    disabled,
  }: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    label?: string;
    required?: boolean;
    disabled?: boolean;
  }) =>
    createElement(
      "label",
      null,
      label,
      createElement(
        "select",
        {
          id,
          value,
          required,
          disabled,
          onChange: (e: { target: { value: string } }) =>
            onChange(e.target.value),
        },
        createElement("option", { value: "" }, "Escolha"),
        createElement("option", { value: "person-1" }, "Pessoa de teste"),
      ),
    ),
}));
const task: Task = {
  id: "task-1",
  product: "MILES",
  customerId: "person-1",
  customerName: "Pessoa de teste",
  title: "Verificar saldo",
  notes: "Dados originais",
  dueOn: "2026-11-20",
  responsibleId: null,
  responsibleName: null,
  tripId: null,
  quotationId: null,
  runId: null,
  state: "OPEN",
  version: 4,
  stateBy: null,
  stateAt: null,
  stateReason: "",
  deleted: false,
};
const model: Template = {
  id: "model-1",
  product: "MILES",
  name: "Rotina de milhas",
  frequency: "WEEKLY",
  steps: [{ title: "Revisar conta", dueOffsetDays: 2 }],
  version: 3,
  deleted: false,
};
const run: Run = {
  id: "run-1",
  product: "MILES",
  customerId: "person-1",
  customerName: "Pessoa de teste",
  templateId: model.id,
  title: "Semana do cliente",
  notes: "",
  periodKey: "W:2026-10-19",
  periodStart: "2026-10-19",
  periodEnd: "2026-10-25",
  snapshot: model,
  version: 2,
  cancelledAt: null,
  cancelReason: "",
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.tasks.mockResolvedValue([task]);
  mocks.templates.mockResolvedValue([model]);
  mocks.runs.mockResolvedValue([run]);
  mocks.members.mockResolvedValue([{ id: "member-1", name: "Agente" }]);
  mocks.customers.mockResolvedValue([
    { id: "person-1", nome: "Pessoa de teste" },
  ]);
  mocks.references.mockResolvedValue({ trips: [], quotations: [] });
  mocks.history.mockResolvedValue([]);
  mocks.saveTask.mockResolvedValue(task);
  mocks.saveTemplate.mockResolvedValue(model);
  mocks.apply.mockResolvedValue(run);
  mocks.saveRun.mockResolvedValue(run);
  mocks.deleteTask.mockResolvedValue(undefined);
  mocks.cancelRun.mockResolvedValue(run);
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal("requestAnimationFrame", (fn: () => void) => {
    fn();
    return 0;
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function ready(product: "MILES" | "TRAVEL" = "MILES") {
  render(createElement(WorkBoard, { product }));
  await screen.findByText("Verificar saldo");
}
describe("F01 — operações persistidas da interface", () => {
  it("edita o mesmo ID com versão e confirma somente após a API", async () => {
    await ready();
    fireEvent.click(
      screen.getByRole("button", { name: "Editar", exact: true }),
    );
    fireEvent.change(screen.getByLabelText("Tarefa"), {
      target: { value: "Saldo conferido" },
    });
    let resolve: () => void = () => {};
    mocks.saveTask.mockImplementationOnce(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar", exact: true }),
    );
    await waitFor(() => expect(mocks.saveTask).toHaveBeenCalled());
    expect(screen.queryByText("Tarefa salva.")).toBeNull();
    expect(mocks.saveTask.mock.calls[0][1]).toMatchObject({
      title: "Saldo conferido",
      expectedVersion: 4,
      product: "MILES",
      customerId: "person-1",
    });
    expect(mocks.saveTask.mock.calls[0][2]).toBe("task-1");
    resolve();
    await screen.findByText("Tarefa salva.");
  });
  it("preserva formulário e não confirma sucesso em conflito", async () => {
    mocks.saveTask.mockRejectedValueOnce(
      new Error("Este registro foi alterado. Recarregue."),
    );
    await ready();
    fireEvent.click(
      screen.getByRole("button", { name: "Editar", exact: true }),
    );
    fireEvent.change(screen.getByLabelText("Tarefa"), {
      target: { value: "Minha revisão" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar", exact: true }),
    );
    await screen.findByText("Este registro foi alterado. Recarregue.");
    expect((screen.getByLabelText("Tarefa") as HTMLInputElement).value).toBe(
      "Minha revisão",
    );
    expect(screen.queryByText("Tarefa salva.")).toBeNull();
  });
  it("mantém chave de criação em tentativas após resposta perdida", async () => {
    mocks.saveTask.mockRejectedValueOnce(new Error("Sem conexão"));
    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Nova tarefa" }));
    fireEvent.change(screen.getByLabelText("Cliente"), {
      target: { value: "person-1" },
    });
    fireEvent.change(screen.getByLabelText("Tarefa"), {
      target: { value: "Nova atividade" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar", exact: true }),
    );
    await screen.findByText("Sem conexão");
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar", exact: true }),
    );
    await screen.findByText("Tarefa salva.");
    expect(mocks.saveTask.mock.calls[0][3]).toBe(
      mocks.saveTask.mock.calls[1][3],
    );
    expect(mocks.saveTask.mock.calls[0][3]).toBeTruthy();
  });
  it("aplica modelo e passa a consultar as tarefas da execução retornada", async () => {
    await ready();
    fireEvent.click(
      screen.getByRole("button", { name: "Modelos", exact: true }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Aplicar", exact: true }),
    );
    fireEvent.change(screen.getByLabelText("Cliente"), {
      target: { value: "person-1" },
    });
    fireEvent.change(screen.getByLabelText("Data dentro do período"), {
      target: { value: "2026-10-21" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar modelo" }));
    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(
        "test-token",
        "model-1",
        "person-1",
        "2026-10-21",
        null,
      ),
    );
    await waitFor(() =>
      expect(mocks.tasks).toHaveBeenLastCalledWith(
        "test-token",
        expect.objectContaining({ runId: "run-1", customerId: "person-1" }),
      ),
    );
  });
  it("edita um modelo existente em vez de criar outra cópia", async () => {
    await ready();
    fireEvent.click(
      screen.getByRole("button", { name: "Modelos", exact: true }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Editar modelo", exact: true }),
    );
    fireEvent.change(screen.getByLabelText("Nome do modelo"), {
      target: { value: "Rotina revisada" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar", exact: true }),
    );
    await waitFor(() =>
      expect(mocks.saveTemplate).toHaveBeenCalledWith(
        "test-token",
        expect.objectContaining({
          name: "Rotina revisada",
          expectedVersion: 3,
        }),
        "model-1",
      ),
    );
  });
  it("edita execução pelo mesmo ID e oferece cancelamento com motivo", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("Cliente pausou");
    await ready();
    fireEvent.click(
      screen.getByRole("button", { name: "Execuções", exact: true }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Editar execução", exact: true }),
    );
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Semana revisada" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar", exact: true }),
    );
    await screen.findByText("Execução atualizada.");
    expect(mocks.saveRun).toHaveBeenCalledWith(
      "test-token",
      run,
      "Semana revisada",
      "",
    );
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "Cancelar execução" })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancelar execução" }));
    await waitFor(() =>
      expect(mocks.cancelRun).toHaveBeenCalledWith(
        "test-token",
        run,
        "Cliente pausou",
      ),
    );
  });
  it("não confirma exclusão quando a API rejeita", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mocks.deleteTask.mockRejectedValueOnce(new Error("Conflito de versão"));
    await ready();
    fireEvent.click(
      screen.getByRole("button", { name: "Excluir", exact: true }),
    );
    await screen.findByText("Conflito de versão");
    expect(screen.queryByText("Tarefa excluída.")).toBeNull();
    expect(mocks.deleteTask).toHaveBeenCalledWith("test-token", task);
  });
  it("consulta cada produto explicitamente e não apresenta lista vazia em falha", async () => {
    mocks.tasks.mockRejectedValueOnce(new Error("Serviço indisponível"));
    render(createElement(WorkBoard, { product: "TRAVEL" }));
    await screen.findByText("Serviço indisponível");
    expect(mocks.tasks).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({ product: "TRAVEL" }),
    );
    expect(screen.queryByText(/Nenhuma tarefa com esses filtros/)).toBeNull();
  });
});
