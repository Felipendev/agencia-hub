// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SimulationTasks } from "./simulation-tasks";
import type { PlanContext, Generation, Source } from "@/lib/simulation-tasks";
import type { Task } from "@/lib/work/types";
const mocks = vi.hoisted(() => ({ get: vi.fn(), generate: vi.fn(), members: vi.fn(), token: "session" as string | null }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: mocks.token }) }));
vi.mock("@/lib/simulation-tasks", () => ({ simulationTasksApi: mocks }));
vi.mock("@/lib/work/api", () => ({ workApi: { members: mocks.members } }));
const context: PlanContext & { simulation: Source } = { today: "2026-10-28", simulation: { id: "s1", version: 2, customerId: "p1", customerName: "Pessoa teste", assumptions: { title: "Plano de acúmulo", destination: "Lisboa", months: 12, monthlySpending: 10000, pointsPerDollar: 2, exchangeRate: 5, exchangeDate: "2026-10-01", passengers: 1, milesPerPassenger: 80000, scenarios: [] }, result: { monthlyPoints: 4000, basePoints: 48000, goalMiles: 80000, scenarios: [] } }, generation: null };
const task = { id: "t1", title: "Revisar meta", notes: "Observações atuais", dueOn: "2026-11-01", responsibleName: "Equipe", state: "OPEN", deleted: false } as Task;
const receipt: Generation = { id: "g1", snapshot: context.simulation, requested: { expectedVersion: 2, customerId: "p1", responsibleId: "u1", steps: [{ title: "Tarefa original", notes: "Observações de origem", dueOn: "2026-11-01" }] }, authorId: "u1", authorName: "Equipe", createdAt: "2026-10-28T10:00:00Z", tasks: [task] };
beforeEach(() => { vi.resetAllMocks(); mocks.token = "session"; mocks.get.mockResolvedValue(context); mocks.members.mockResolvedValue([{ id: "u1", name: "Equipe" }]); mocks.generate.mockResolvedValue(receipt); });
afterEach(cleanup);
const mount = () => render(createElement(SimulationTasks, { id: "s1" }));

it("revisa várias tarefas e só confirma depois da API, bloqueando envio simultâneo", async () => {
  mount(); await screen.findByText("Plano de acúmulo"); await waitFor(() => expect(screen.getByRole("option", { name: "Equipe" })).toBeTruthy());
  fireEvent.change(screen.getByLabelText("Responsável pelas tarefas"), { target: { value: "u1" } });
  fireEvent.change(screen.getByLabelText("Tarefa 1"), { target: { value: "Conferir meta" } }); fireEvent.change(screen.getByLabelText("Prazo 1"), { target: { value: "2026-11-02" } });
  fireEvent.change(screen.getByLabelText("Observações 1"), { target: { value: "Revisar com cliente" } });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar tarefa (1/20)" }));
  fireEvent.change(screen.getByLabelText("Tarefa 2"), { target: { value: "Próximo contato" } });
  fireEvent.click(screen.getByRole("button", { name: "Remover tarefa 2" }));
  let resolve!: (g: Generation) => void; mocks.generate.mockImplementationOnce(() => new Promise<Generation>(r => { resolve = r; }));
  fireEvent.submit(screen.getByRole("form", { name: "Revisar tarefas do plano" })); fireEvent.submit(screen.getByRole("form", { name: "Revisar tarefas do plano" }));
  expect(mocks.generate).toHaveBeenCalledTimes(1); expect(screen.queryByText(/Geração confirmada/)).toBeNull();
  expect((screen.getByRole("button", { name: /Recarregar plano e geração/ }) as HTMLButtonElement).disabled).toBe(true);
  expect(mocks.generate).toHaveBeenCalledWith("session", "s1", { expectedVersion: 2, customerId: "p1", responsibleId: "u1", steps: [{ title: "Conferir meta", notes: "Revisar com cliente", dueOn: "2026-11-02" }] });
  resolve(receipt); await screen.findByText(/Geração confirmada/); expect(screen.queryByRole("button", { name: "Gerar tarefas de Milhas" })).toBeNull();
  expect(screen.getByRole("link", { name: "Gerenciar tarefas deste plano" }).getAttribute("href")).toBe("/milhas/tarefas?simulationId=s1&customerId=p1");
});
it("falha de conexão conserva o formulário e o reenvio mantém o mesmo payload", async () => {
  mount(); await screen.findByText("Plano de acúmulo"); fireEvent.change(screen.getByLabelText("Responsável pelas tarefas"), { target: { value: "u1" } });
  mocks.generate.mockRejectedValueOnce(new TypeError("network")); fireEvent.click(screen.getByRole("button", { name: "Gerar tarefas de Milhas" }));
  await screen.findByRole("alert"); expect((screen.getByLabelText("Tarefa 1") as HTMLInputElement).value).toContain("Lisboa");
  const first = mocks.generate.mock.calls[0][2]; fireEvent.click(screen.getByRole("button", { name: "Gerar tarefas de Milhas" }));
  await screen.findByText(/Geração confirmada/); expect(mocks.generate.mock.calls[1][2]).toEqual(first);
});
it("409 não confirma nem apaga revisão e permite consultar a geração existente", async () => {
  mount(); await screen.findByText("Plano de acúmulo"); fireEvent.change(screen.getByLabelText("Responsável pelas tarefas"), { target: { value: "u1" } });
  fireEvent.change(screen.getByLabelText("Tarefa 1"), { target: { value: "Preservar revisão" } }); mocks.generate.mockRejectedValueOnce(new Error("Este plano já gerou tarefas"));
  fireEvent.click(screen.getByRole("button", { name: "Gerar tarefas de Milhas" })); await screen.findByRole("alert"); expect((screen.getByLabelText("Tarefa 1") as HTMLInputElement).value).toBe("Preservar revisão");
  mocks.get.mockResolvedValue({ ...context, generation: receipt }); fireEvent.click(screen.getByRole("button", { name: /Recarregar plano e geração/ }));
  await screen.findByText("Tarefas já geradas"); expect(screen.queryByText(/Geração confirmada/)).toBeNull();
});
it("comprovante mantém pessoa original e tarefas excluídas sem oferecer outra geração", async () => {
  mocks.get.mockResolvedValue({ ...context, simulation: { ...context.simulation, customerId: "p2", customerName: "Pessoa nova" }, generation: { ...receipt, authorName: null, tasks: [{ ...task, deleted: true }, { ...task, id: "t2", state: "DONE" }] } });
  mount(); await screen.findByText("Tarefas já geradas"); expect(screen.getByText(/Pessoa da geração: Pessoa teste/)).toBeTruthy(); expect(screen.getByText(/Pessoa atual: Pessoa nova/)).toBeTruthy();
  expect(screen.getByText(/Excluída — histórico preservado/)).toBeTruthy(); expect(screen.getByText(/Concluída/)).toBeTruthy(); expect(screen.queryByRole("button", { name: "Gerar tarefas de Milhas" })).toBeNull();
});
it("plano legado sem pessoa bloqueia geração e mantém cálculo avulso", async () => {
  mocks.get.mockResolvedValue({ ...context, simulation: { ...context.simulation, customerId: null, customerName: null } }); mount();
  await screen.findByRole("alert"); expect(screen.queryByRole("form")).toBeNull(); expect(screen.getByRole("link", { name: "Voltar ao simulador" }).getAttribute("href")).toBe("/milhas/simulador");
});
it("falha de consulta permite recarregar sem aparecer como plano vazio", async () => {
  mocks.get.mockRejectedValueOnce(new Error("Plano indisponível")); mocks.members.mockRejectedValueOnce(new Error("Equipe indisponível")); mount(); await screen.findByText("Plano indisponível");
  expect(screen.queryByRole("form")).toBeNull(); fireEvent.click(screen.getByRole("button", { name: /Recarregar plano e geração/ })); await screen.findByText("Plano de acúmulo");
  fireEvent.submit(screen.getByRole("form")); await screen.findByText(/Selecione um responsável ativo/); expect(mocks.generate).not.toHaveBeenCalled();
});
it("trocar ID ou sessão não mostra dados anteriores e exige autenticação", async () => {
  const view = mount(); await screen.findByText("Plano de acúmulo"); mocks.get.mockReturnValueOnce(new Promise(() => {})); view.rerender(createElement(SimulationTasks, { id: "s2" }));
  expect(screen.queryByText("Plano de acúmulo")).toBeNull(); expect(screen.getByText("Carregando plano e geração…")).toBeTruthy();
  mocks.token = null; view.rerender(createElement(SimulationTasks, { id: "s2" })); expect(screen.getByRole("alert").textContent).toContain("Entre no sistema");
});
it("erro da equipe bloqueia geração mas permite recuperação explícita", async () => {
  mocks.members.mockRejectedValueOnce(new Error("Falha da equipe")); mount(); await screen.findByText(/Equipe indisponível/);
  expect((screen.getByRole("button", { name: "Gerar tarefas de Milhas" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: /Recarregar plano e geração/ }));
  await screen.findByRole("option", { name: "Equipe" }); expect(screen.queryByText(/Equipe indisponível/)).toBeNull();
});
it("consulta comprovante e todas as tarefas mesmo quando o plano foi excluído", async () => {
  mocks.get.mockResolvedValue({ ...context, simulation: null, generation: { ...receipt, tasks: [{ ...task, deleted: true }] } }); mount();
  await screen.findByText(/O plano foi excluído/); expect(screen.getByText("Tarefas já geradas")).toBeTruthy(); expect(screen.getByRole("link", { name: "Histórico de gerações" })).toBeTruthy();
  expect(screen.getByText("Tarefa original · 01/11/2026")).toBeTruthy(); expect(screen.getByText("Observações de origem")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Gerar tarefas de Milhas" })).toBeNull(); expect(screen.getByText(/Excluída — histórico preservado/)).toBeTruthy();
});
