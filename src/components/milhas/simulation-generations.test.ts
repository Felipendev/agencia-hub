// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SimulationGenerations } from "./simulation-generations";
const mocks = vi.hoisted(() => ({ list: vi.fn(), token: "session" as string | null }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: mocks.token }) }));
vi.mock("@/lib/simulation-tasks", () => ({ simulationTasksApi: mocks }));
const row = { sourceId: "s1", customerId: "p1", customerName: "Pessoa teste", title: "Plano anterior", version: 1, createdAt: "2026-10-28T12:00:00Z", planDeleted: true };
beforeEach(() => { vi.resetAllMocks(); mocks.token = "session"; mocks.list.mockResolvedValue([row]); }); afterEach(cleanup);
it("lista origem excluída e oferece consulta por ID original, com busca", async () => {
  render(createElement(SimulationGenerations)); await screen.findByText("Plano anterior"); expect(screen.getByText(/Plano excluído/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Consultar comprovante e tarefas" }).getAttribute("href")).toBe("/milhas/simulador/s1/tarefas");
  fireEvent.change(screen.getByLabelText("Buscar plano ou pessoa"), { target: { value: "Sem resultado" } }); expect(screen.getByText(/Nenhuma geração encontrada/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Buscar plano ou pessoa"), { target: { value: "pessoa" } }); expect(screen.getByText("Plano anterior")).toBeTruthy();
});
it("falha não parece ausência e permite nova consulta", async () => {
  mocks.list.mockRejectedValueOnce("indisponível"); render(createElement(SimulationGenerations)); await screen.findByRole("alert"); expect(screen.queryByText(/Nenhuma geração encontrada/)).toBeNull();
  mocks.list.mockResolvedValueOnce([{ ...row, planDeleted: false }]); fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" })); await screen.findByText("Plano anterior"); expect(screen.queryByRole("alert")).toBeNull();
});
it("mudança de sessão limpa lista e autenticação é exigida", async () => {
  const view=render(createElement(SimulationGenerations)); await screen.findByText("Plano anterior"); mocks.token="session-two"; mocks.list.mockReturnValueOnce(new Promise(() => {})); view.rerender(createElement(SimulationGenerations));
  expect(screen.queryByText("Plano anterior")).toBeNull(); expect(screen.getByRole("status").textContent).toContain("Carregando");
  mocks.token=null; view.rerender(createElement(SimulationGenerations)); expect(screen.getByRole("alert").textContent).toContain("Entre no sistema");
});
