// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { listFinancialEntriesRemote } from "@/lib/api/list-financial-entries-remote";

const fixture = vi.hoisted(() => ({
  auth: { user: { id: "owner", agencyId: "agency-a" }, token: "token-a" as string | null, isReady: true, isOwner: true },
  ready: true,
}));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => fixture.auth }));
vi.mock("@/contexts/data-context", async (original) => ({
  ...await original<object>(),
  useData: () => ({ clientes: [], cotacoes: [], isReady: fixture.ready,
    lancamentos: [{ id: "stale", descricao: "Cache antigo", valor: 99999, data: "2026-09-01", tipo: "entrada", status: "confirmado" }],
  }),
}));
vi.mock("@/components/charts/AreaChart", () => ({ AreaChart: ({ data }: { data: unknown }) => createElement("output", { "data-testid": "series" }, JSON.stringify(data)) }));
vi.mock("@/components/charts/BarChart", () => ({ BarChart: () => null }));
vi.mock("@/components/charts/DonutChart", () => ({ DonutChart: () => null }));
import Dashboard from "./page";

let receiptIndex = 0;
const receipt = (amount: number, overrides = {}) => ({
  id: `receipt-${++receiptIndex}`, description: "Recebimento confirmado", type: "INCOME", category: "PACKAGE_SOLD",
  amount, entryDate: "2026-09-21", status: "CONFIRMED", ...overrides,
});
const response = (rows: unknown, status = 200) => new Response(JSON.stringify(rows), { status, headers: { "Content-Type": "application/json" } });
const mount = () => render(createElement(Dashboard));
const series = (): Array<{ label: string; receita: number; despesa: number }> => JSON.parse(screen.getByTestId("series").textContent!);
const card = (title: string) => screen.getByText(title, { selector: "p" }).parentElement!.textContent!;
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fixture.auth = { user: { id: "owner", agencyId: "agency-a" }, token: "token-a", isReady: true, isOwner: true };
  fixture.ready = true;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-31T12:00:00-03:00"));
  vi.stubEnv("AGENCIA_HUB_API_URL", "https://api.test/api/v1");
  fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

it("consults the API on direct entry and shows confirmed receipts without first opening Cash Flow", async () => {
  let finish!: (value: Response) => void;
  fetchMock.mockReturnValue(new Promise<Response>((resolve) => { finish = resolve; }));
  mount();
  expect(screen.getByRole("status").textContent).toContain("Carregando financeiro");
  expect(screen.queryByText("Total recebido")).toBeNull();
  expect(screen.queryByText("Cache antigo")).toBeNull();
  expect(screen.getByText("Cotações por status")).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock).toHaveBeenCalledWith("https://api.test/api/v1/financial-entries", expect.objectContaining({
    cache: "no-store", signal: expect.any(AbortSignal), headers: expect.objectContaining({ Authorization: "Bearer token-a" }),
  }));
  await act(async () => finish(response([
    receipt(4298.53), receipt(1000, { id: "2" }),
    receipt(200, { id: "expense", type: "EXPENSE", category: "OTHER" }),
    receipt(50, { id: "pending", status: "PENDING" }), receipt(9000, { id: "cancelled", status: "CANCELLED" }),
  ])));
  expect(card("Total recebido")).toContain("5.298,53");
  expect(card("A receber")).toContain("50,00");
  expect(card("Despesas")).toContain("200,00");
  expect(card("Saldo do período")).toContain("5.098,53");
  expect(series().find((month) => month.label.startsWith("set"))).toEqual(expect.objectContaining({ receita: 5298.53, despesa: 200 }));
});

it("shows an error instead of zero after failure and retries to a truly empty response", async () => {
  fetchMock.mockResolvedValueOnce(response({ message: "Indisponível" }, 503)).mockResolvedValueOnce(response([]));
  mount(); await screen.findByRole("alert");
  expect(screen.queryByText("Total recebido")).toBeNull();
  expect(card("Saldo do período")).toContain("—");
  expect(screen.getByText("Cotações recentes")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByText("Total recebido");
  expect(card("Total recebido")).toContain("0,00");
  expect(series().every((month) => month.receita === 0 && month.despesa === 0)).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it.each([null, { unexpected: true }])("does not turn malformed success %j into an empty financial balance", async (body) => {
  fetchMock.mockResolvedValue(response(body)); mount(); await screen.findByRole("alert");
  expect(screen.queryByText("Total recebido")).toBeNull();
});

it.each([
  null, {}, { amount: null }, { amount: "" }, { amount: "100" }, { amount: undefined },
  { id: "" }, { id: undefined }, { description: null }, { category: undefined },
  { type: "UNKNOWN" }, { type: undefined }, { status: "UNKNOWN" }, { status: undefined },
  { entryDate: null }, { entryDate: "" }, { entryDate: "2026-02-30" }, { entryDate: "2026-13-01" },
])("rejects an invalid financial row %j without presenting partial balances or zero", async (patch) => {
  const invalid = patch === null ? null : Object.keys(patch).length === 0 ? {} : receipt(100, patch);
  fetchMock.mockResolvedValue(response([receipt(200), invalid]));
  mount(); await screen.findByRole("alert");
  expect(screen.queryByText("Total recebido")).toBeNull();
  expect(screen.queryByText("Últimos lançamentos")).toBeNull();
});

it("rejects a non-finite number from an otherwise parseable HTTP JSON body", async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify([receipt(100)]).replace('"amount":100', '"amount":1e400')));
  mount(); await screen.findByRole("alert"); expect(screen.queryByText("Total recebido")).toBeNull();
});

it("hides old values during refresh and shows the updated server balance", async () => {
  let finish!: (value: Response) => void;
  fetchMock.mockResolvedValueOnce(response([receipt(100)]))
    .mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; }));
  mount(); await screen.findByText("Total recebido");
  fireEvent.click(screen.getByRole("button", { name: "Atualizar financeiro" }));
  expect(screen.queryByText("Total recebido")).toBeNull();
  expect(screen.getByRole("status")).toBeTruthy();
  await act(async () => finish(response([receipt(250)])));
  expect(card("Total recebido")).toContain("250,00");
});

it("queries again after remount rather than reusing the shared cached balance", async () => {
  fetchMock.mockResolvedValueOnce(response([receipt(100)])).mockResolvedValueOnce(response([receipt(300)]));
  const first = mount(); await screen.findByText("Total recebido"); first.unmount();
  mount(); await screen.findByText("Total recebido");
  expect(card("Total recebido")).toContain("300,00");
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("aborts a previous agency request and discards its late success after the session changes", async () => {
  let oldFinish!: (value: Response) => void;
  fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => { oldFinish = resolve; }))
    .mockResolvedValueOnce(response([receipt(20)]));
  const view = mount(); const oldSignal = fetchMock.mock.calls[0][1].signal as AbortSignal;
  fixture.auth = { ...fixture.auth, user: { id: "other-owner", agencyId: "agency-b" }, token: "token-b" };
  view.rerender(createElement(Dashboard));
  expect(oldSignal.aborted).toBe(true);
  await screen.findByText("Total recebido");
  await act(async () => oldFinish(response([receipt(9999)])));
  expect(card("Total recebido")).toContain("20,00");
  expect(screen.queryByText(/9\.999,00/)).toBeNull();
});

it("hides a previously loaded balance immediately when a token is replaced and handles a late old error", async () => {
  let fail!: (error: Error) => void;
  fetchMock.mockImplementationOnce(() => new Promise<Response>((_, reject) => { fail = reject; }))
    .mockResolvedValueOnce(response([receipt(30)]));
  const view = mount(); fixture.auth = { ...fixture.auth, token: "renewed-token" };
  view.rerender(createElement(Dashboard)); await screen.findByText("Total recebido");
  await act(async () => fail(new Error("Old session failed")));
  expect(screen.queryByRole("alert")).toBeNull(); expect(card("Total recebido")).toContain("30,00");
});

it("waits for hydration and the auth session before making a request", async () => {
  fixture.auth.isReady = false; fixture.ready = false; fetchMock.mockResolvedValue(response([]));
  const view = mount(); expect(fetchMock).not.toHaveBeenCalled();
  fixture.ready = true; view.rerender(createElement(Dashboard)); expect(fetchMock).not.toHaveBeenCalled();
  fixture.auth.isReady = true; view.rerender(createElement(Dashboard));
  await screen.findByText("Total recebido"); expect(fetchMock).toHaveBeenCalledOnce();
});

it.each(["seller", "signed-out"])("does not request agency finances for %s", async (kind) => {
  if (kind === "seller") fixture.auth.isOwner = false; else fixture.auth.token = null;
  mount(); expect(screen.getByRole("alert")).toBeTruthy(); expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Tentar novamente" })).toBeNull();
});

it("uses 12 distinct calendar months at month end and ignores unconfirmed or out-of-range amounts in the chart", async () => {
  fetchMock.mockResolvedValue(response([
    receipt(100, { entryDate: "2025-11-01" }), receipt(999, { entryDate: "2025-10-31" }),
    receipt(200, { entryDate: "2026-10-31" }), receipt(999, { entryDate: "2026-11-01" }),
    receipt(999, { entryDate: "2026-02-01", status: "PENDING" }),
  ]));
  mount(); await screen.findByText("Total recebido");
  expect(new Set(series().map((month) => month.label)).size).toBe(12);
  expect(series().some((month) => month.label.startsWith("fev"))).toBe(true);
  expect(series().reduce((sum, month) => sum + month.receita, 0)).toBe(300);
});

it("aborts on unmount and keeps the optional signal compatible with other financial callers", async () => {
  fetchMock.mockImplementation(() => Promise.resolve(response([]))); const view = mount();
  await screen.findByText("Total recebido");
  const signal = fetchMock.mock.calls[0][1].signal as AbortSignal; view.unmount();
  expect(signal.aborted).toBe(true);
  await listFinancialEntriesRemote("separate-token");
  expect(fetchMock.mock.calls[1][1].signal).toBeUndefined();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
});
