// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SimulationWalletCard } from "./simulation-wallet-card";
import type { WalletView } from "@/lib/miles-wallet";
const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/authenticated-fetch", () => ({ apiFetch: api }));
const card = { id: "c1", kind: "CARD" as const, data: { issuer: "Banco teste", category: "Platinum", monthlySpend: 3000, pointsPerDollar: 2.5 }, version: 1, archived: false, balance: 0 };
const wallet: WalletView = { profile: null, items: [card, { ...card, id: "archived", archived: true, data: { ...card.data, category: "Arquivado" } }, { ...card, id: "account", kind: "ACCOUNT", data: { program: "Programa" } }], movements: [], history: [] };
const apply = vi.fn();
const props = { token: "token", customerId: "person", onApply: apply };
beforeEach(() => { vi.clearAllMocks(); api.mockResolvedValue(wallet); });
afterEach(cleanup);
const open = async () => { fireEvent.click(screen.getByRole("button", { name: "Consultar cartões da carteira" })); await screen.findByLabelText("Cartão desta pessoa"); fireEvent.change(screen.getByLabelText("Cartão desta pessoa"), { target: { value: "c1" } }); };
it("consulta só por ação explícita e aplica apenas as duas premissas após revisão", async () => {
  render(createElement(SimulationWalletCard, props)); expect(api).not.toHaveBeenCalled(); await open();
  expect(api).toHaveBeenCalledWith("/customers/person/miles-wallet", { signal: expect.any(AbortSignal) }, "token");
  expect(apply).not.toHaveBeenCalled(); expect(screen.queryByText(/Arquivado/)).toBeNull();
  expect(screen.getByRole("link").getAttribute("href")).toBe("/milhas/clientes/person");
  fireEvent.click(screen.getByRole("button", { name: "Usar no cálculo" }));
  expect(apply).toHaveBeenCalledWith({ monthlySpending: 3000, pointsPerDollar: 2.5 }); expect(api).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("status").textContent).toContain("salve o plano");
  fireEvent.change(screen.getByLabelText("Cartão desta pessoa"), { target: { value: "" } }); expect(screen.queryByRole("status")).toBeNull();
});
it.each([null, undefined, -1, Infinity, "1000", 10000001])("não transforma gasto inválido %s em premissa", async (monthlySpend) => {
  api.mockResolvedValue({ ...wallet, items: [{ ...card, data: { ...card.data, monthlySpend } }] }); render(createElement(SimulationWalletCard, props)); await open();
  expect((screen.getByRole("button", { name: "Usar no cálculo" }) as HTMLButtonElement).disabled).toBe(true); expect(screen.getByText(/Campos ausentes/)).toBeTruthy(); expect(apply).not.toHaveBeenCalled();
});
it.each([null, -1, NaN, 101, "2"])("recusa pontuação inválida %s", async (pointsPerDollar) => {
  api.mockResolvedValue({ ...wallet, items: [{ ...card, data: { ...card.data, pointsPerDollar } }] }); render(createElement(SimulationWalletCard, props)); await open(); expect((screen.getByRole("button", { name: "Usar no cálculo" }) as HTMLButtonElement).disabled).toBe(true);
});
it("zero informado é válido e não equivale a campo ausente", async () => {
  api.mockResolvedValue({ ...wallet, items: [{ ...card, data: { ...card.data, monthlySpend: 0, pointsPerDollar: 0 } }] }); render(createElement(SimulationWalletCard, props)); await open(); fireEvent.click(screen.getByRole("button", { name: "Usar no cálculo" })); expect(apply).toHaveBeenCalledWith({ monthlySpending: 0, pointsPerDollar: 0 });
});
it("distingue ausência, arquivamento e falha, com recuperação sem aplicar dados", async () => {
  api.mockRejectedValueOnce(new Error("403")); render(createElement(SimulationWalletCard, props)); fireEvent.click(screen.getByRole("button", { name: "Consultar cartões da carteira" })); await screen.findByRole("alert");
  expect(screen.queryByText(/Nenhum cartão/)).toBeNull(); api.mockResolvedValueOnce({ ...wallet, items: [] }); fireEvent.click(screen.getByRole("button", { name: "Tentar consultar cartões" })); await screen.findByText(/Nenhum cartão ativo/);
  api.mockResolvedValueOnce({ ...wallet, profile: { archived: true } }); fireEvent.click(screen.getByRole("button", { name: "Atualizar cartões" })); await screen.findByText(/perfil de milhas está arquivado/); expect(screen.queryByLabelText("Cartão desta pessoa")).toBeNull(); expect(apply).not.toHaveBeenCalled();
});
it("trocar pessoa/sessão oculta dados e descarta resposta antiga, sem consulta automática", async () => {
  let finish!: (value: WalletView) => void; api.mockReturnValueOnce(new Promise<WalletView>((resolve) => { finish = resolve; }));
  const view = render(createElement(SimulationWalletCard, props)); fireEvent.click(screen.getByRole("button", { name: "Consultar cartões da carteira" })); const signal = api.mock.calls[0][1].signal;
  view.rerender(createElement(SimulationWalletCard, { ...props, customerId: "other" })); expect(signal.aborted).toBe(true); finish(wallet); await waitFor(() => expect(screen.queryByText(/Banco teste/)).toBeNull()); expect(api).toHaveBeenCalledTimes(1);
  await open(); view.rerender(createElement(SimulationWalletCard, { ...props, token: "second", customerId: "other" })); expect(screen.queryByLabelText("Cartão desta pessoa")).toBeNull();
  view.rerender(createElement(SimulationWalletCard, { ...props, token: null })); expect(screen.queryByRole("region")).toBeNull();
  view.rerender(createElement(SimulationWalletCard, { ...props, customerId: "" })); expect(screen.queryByRole("region")).toBeNull(); expect(apply).not.toHaveBeenCalled();
});
