// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import SimuladorAcumuloPage from "./page";
import {
  calculateAccumulation,
  type AccumulationAssumptions,
} from "@/lib/accumulation-simulation";
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ token: "test-token" }),
}));
vi.mock("@/lib/api/agencia-hub-env", () => ({
  getAgenciaHubApiBaseUrl: () => "https://api.example",
}));
const { route, people } = vi.hoisted(() => ({
  route: { query: "" },
  people: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(route.query),
}));
vi.mock("@/lib/api/list-customers-remote", () => ({
  listCustomersRemote: people,
}));
vi.mock("@/components/cliente/ClientePicker", () => ({
  ClientePicker: ({
    id,
    label,
    value,
    onChange,
    required,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (id: string) => void;
    required?: boolean;
  }) =>
    React.createElement(
      "label",
      null,
      label,
      React.createElement(
        "select",
        {
          id,
          value,
          required,
          onChange: (event: { target: { value: string } }) =>
            onChange(event.target.value),
        },
        React.createElement("option", { value: "" }, "Selecione"),
        React.createElement("option", { value: "person-a" }, "Cliente A"),
        React.createElement("option", { value: "person-b" }, "Cliente B"),
      ),
    ),
}));
beforeEach(() => {
  route.query = "";
  people.mockResolvedValue([
    { id: "person-a", nome: "Cliente A" },
    { id: "person-b", nome: "Cliente B" },
  ]);
});
const assumptions: AccumulationAssumptions = {
  title: "Plano Lisboa",
  monthlySpending: 10000,
  pointsPerDollar: 2,
  exchangeRate: 5,
  exchangeDate: "2026-01-01",
  months: 12,
  passengers: 2,
  milesPerPassenger: 40000,
  destination: "Lisboa",
  scenarios: [{ program: "Smiles", bonusPercent: 100 }],
};
const row = {
  id: "scenario",
  assumptions,
  result: calculateAccumulation(assumptions)!,
  createdAt: "2026-01-01T12:00:00Z",
  updatedAt: "2026-01-01T12:00:00Z",
  version: 1,
  customerId: "person-a",
  customerName: "Cliente A",
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("reaproveita cartão sem gravar carteira e persiste premissas editáveis no mesmo plano", async () => {
  let stored = row;
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/miles-wallet")) return Response.json({ profile: null, items: [{ id: "card", kind: "CARD", archived: false, data: { issuer: "Banco", category: "Black", monthlySpend: 4500, pointsPerDollar: 3.25 } }] });
    if (init?.method === "PATCH") { stored = { ...row, ...JSON.parse(init.body as string), version: 2 }; return Response.json(stored); }
    if (url.endsWith("/scenario")) return Response.json(stored);
    return Response.json([stored]);
  });
  vi.stubGlobal("fetch", fetchMock); vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const view = render(React.createElement(SimuladorAcumuloPage)); await screen.findByRole("heading", { name: "Plano Lisboa" }); fireEvent.click(screen.getByRole("button", { name: "Editar" })); await screen.findByDisplayValue("Plano Lisboa");
  fireEvent.click(screen.getByRole("button", { name: "Consultar cartões da carteira" })); await screen.findByLabelText("Cartão desta pessoa"); fireEvent.change(screen.getByLabelText("Cartão desta pessoa"), { target: { value: "card" } });
  expect((screen.getByLabelText("Gasto mensal (R$)") as HTMLInputElement).value).toBe("10000");
  fireEvent.click(screen.getByRole("button", { name: "Usar no cálculo" }));
  expect((screen.getByLabelText("Gasto mensal (R$)") as HTMLInputElement).value).toBe("4500");
  expect((screen.getByLabelText("Pontos por dólar") as HTMLInputElement).value).toBe("3.25");
  expect((screen.getByLabelText("Câmbio informado (R$ por US$)") as HTMLInputElement).value).toBe("5");
  fireEvent.change(screen.getByLabelText("Gasto mensal (R$)"), { target: { value: "4600" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" })); await screen.findByText("Alterações salvas. A versão anterior permanece no histórico.");
  expect(stored.assumptions).toMatchObject({ ...assumptions, monthlySpending: 4600, pointsPerDollar: 3.25 });
  expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH").map(([url]) => url)).toEqual(["https://api.example/accumulation-simulations/scenario"]);
  expect(fetchMock.mock.calls.filter(([url, init]) => url.endsWith("/miles-wallet") && init?.method)).toHaveLength(0);
  view.unmount(); route.query = "simulationId=scenario"; render(React.createElement(SimuladorAcumuloPage));
  await screen.findByDisplayValue("4600"); expect((screen.getByLabelText("Pontos por dólar") as HTMLInputElement).value).toBe("3.25");
});
it("edita o cenário pelo mesmo ID e envia a versão consultada", async () => {
  const changed = { ...assumptions, title: "Plano atualizado" };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json([row]))
    .mockResolvedValueOnce(Response.json(row))
    .mockResolvedValueOnce(
      Response.json({ ...row, assumptions: changed, version: 2 }),
    );
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  render(React.createElement(SimuladorAcumuloPage));
  await screen.findByRole("heading", { name: "Plano Lisboa" });
  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  await screen.findByDisplayValue("Plano Lisboa");
  fireEvent.change(screen.getByLabelText("Nome da simulação"), {
    target: { value: "Plano atualizado" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
  await screen.findByText(
    "Alterações salvas. A versão anterior permanece no histórico.",
  );
  expect(fetchMock.mock.calls[2][0]).toBe(
    "https://api.example/accumulation-simulations/scenario",
  );
  expect(fetchMock.mock.calls[2][1].method).toBe("PATCH");
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({
    expectedVersion: 1,
    assumptions: { title: "Plano atualizado" },
  });
  expect(
    screen.getAllByRole("heading", { name: "Plano atualizado" }).length,
  ).toBe(1);
});
it("duplicar cria um novo registro sem editar o original", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const copy = { ...assumptions, title: "Plano Lisboa (cópia)" };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json([row]))
    .mockResolvedValueOnce(
      Response.json({ ...row, id: "copy", assumptions: copy }),
    );
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  render(React.createElement(SimuladorAcumuloPage));
  await screen.findByRole("heading", { name: "Plano Lisboa" });
  fireEvent.click(screen.getByRole("button", { name: "Duplicar" }));
  expect(screen.getByLabelText("Nome da simulação").getAttribute("value")).toBe(
    copy.title,
  );
  fireEvent.click(screen.getByRole("button", { name: "Criar simulação" }));
  await screen.findByText("Simulação criada para consulta pela equipe.");
  expect(fetchMock.mock.calls[1][1].method).toBe("POST");
  expect(screen.getByRole("heading", { name: "Plano Lisboa" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: copy.title })).toBeTruthy();
});
it("mantém a edição aberta quando outra pessoa atualizou o cenário", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json([row]))
    .mockResolvedValueOnce(Response.json(row))
    .mockResolvedValueOnce(
      Response.json({ message: "Recarregue o cenário" }, { status: 409 }),
    );
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  render(React.createElement(SimuladorAcumuloPage));
  await screen.findByRole("heading", { name: "Plano Lisboa" });
  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  await screen.findByDisplayValue("Plano Lisboa");
  fireEvent.change(screen.getByLabelText("Nome da simulação"), {
    target: { value: "Meu rascunho" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toBe("Recarregue o cenário"),
  );
  expect(screen.getByDisplayValue("Meu rascunho")).toBeTruthy();
  expect(
    screen.queryByText(
      "Alterações salvas. A versão anterior permanece no histórico.",
    ),
  ).toBeNull();
});

it("permite calcular avulso e bloqueia gravação sem cliente", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(SimuladorAcumuloPage));
  await screen.findByText("Nenhuma simulação salva com esses filtros.");
  expect(
    screen.getByRole("heading", { name: "Projeção do planejamento" }),
  ).toBeTruthy();
  expect(
    screen
      .getByRole("button", { name: "Criar simulação" })
      .hasAttribute("disabled"),
  ).toBe(true);
  fireEvent.submit(
    screen.getByRole("button", { name: "Criar simulação" }).closest("form")!,
  );
  await screen.findByText(
    "Selecione uma pessoa da agência para salvar. O cálculo avulso não grava dados.",
  );
  expect(
    fetchMock.mock.calls.every(
      ([, init]) => !init?.method || init.method === "GET",
    ),
  ).toBe(true);
});
it("associa cenário legado explicitamente sem alterar suas versões antigas", async () => {
  const legacy = { ...row, customerId: null, customerName: null };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json([legacy]))
    .mockResolvedValueOnce(Response.json(legacy))
    .mockResolvedValueOnce(Response.json({ ...row, version: 2 }));
  const confirm = vi
    .spyOn(window, "confirm")
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(true);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(SimuladorAcumuloPage));
  await screen.findByRole("heading", { name: "Plano Lisboa" });
  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  await screen.findByDisplayValue("Plano Lisboa");
  expect(
    (screen.getByLabelText("Cliente do plano") as HTMLSelectElement).value,
  ).toBe("");
  fireEvent.change(screen.getByLabelText("Cliente do plano"), {
    target: { value: "person-a" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
  await screen.findByText(
    "Alterações salvas. A versão anterior permanece no histórico.",
  );
  expect(confirm).toHaveBeenCalledWith(
    expect.stringContaining("versões antigas continuarão sem cliente"),
  );
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({
    customerId: "person-a",
    expectedVersion: 1,
  });
});
it("corrige o vínculo pelo mesmo ID após confirmar cliente anterior e novo", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json([row]))
    .mockResolvedValueOnce(Response.json(row))
    .mockResolvedValueOnce(
      Response.json({
        ...row,
        customerId: "person-b",
        customerName: "Cliente B",
        version: 2,
      }),
    );
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  render(React.createElement(SimuladorAcumuloPage));
  await screen.findByRole("heading", { name: "Plano Lisboa" });
  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  await screen.findByDisplayValue("Plano Lisboa");
  fireEvent.change(screen.getByLabelText("Cliente do plano"), {
    target: { value: "person-b" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
  await screen.findByText(
    "Alterações salvas. A versão anterior permanece no histórico.",
  );
  expect(fetchMock.mock.calls[2][0]).toBe(
    "https://api.example/accumulation-simulations/scenario",
  );
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({
    customerId: "person-b",
    expectedVersion: 1,
  });
});
it("filtra por pessoa ou legados separadamente e sem gravar", async () => {
  const fetchMock = vi
    .fn()
    .mockImplementation(() => Promise.resolve(Response.json([])));
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(SimuladorAcumuloPage));
  await screen.findByText("Nenhuma simulação salva com esses filtros.");
  fireEvent.change(screen.getByLabelText("Filtrar planos por cliente"), {
    target: { value: "person-b" },
  });
  await waitFor(() =>
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://api.example/accumulation-simulations?customerId=person-b",
      expect.anything(),
    ),
  );
  fireEvent.click(
    screen.getByLabelText("Somente cenários antigos sem cliente"),
  );
  await waitFor(() =>
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://api.example/accumulation-simulations?unlinked=true",
      expect.anything(),
    ),
  );
  expect(
    (screen.getByLabelText("Filtrar planos por cliente") as HTMLSelectElement)
      .value,
  ).toBe("");
  expect(fetchMock.mock.calls.every(([, init]) => !init?.method)).toBe(true);
});
it("abre o plano do perfil pelo ID persistido com cliente preselecionado", async () => {
  route.query = "customerId=person-a&simulationId=scenario";
  const fetchMock = vi
    .fn()
    .mockImplementation((url: string) =>
      Promise.resolve(Response.json(url.endsWith("/scenario") ? row : [row])),
    );
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(SimuladorAcumuloPage));
  await screen.findByDisplayValue("Plano Lisboa");
  expect(
    screen.getByRole("button", { name: "Salvar alterações" }),
  ).toBeTruthy();
  expect(
    (screen.getByLabelText("Cliente do plano") as HTMLSelectElement).value,
  ).toBe("person-a");
  expect(
    fetchMock.mock.calls.some(
      ([url]) =>
        url === "https://api.example/accumulation-simulations/scenario",
    ),
  ).toBe(true);
});
it("não transforma falha ao abrir um plano em criação de outro registro", async () => {
  route.query = "customerId=person-a&simulationId=missing";
  const fetchMock = vi
    .fn()
    .mockImplementation((url: string) =>
      Promise.resolve(
        url.endsWith("/missing")
          ? Response.json({}, { status: 404 })
          : Response.json([]),
      ),
    );
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(SimuladorAcumuloPage));
  await screen.findByText(
    "Não foi possível abrir o plano solicitado nesta agência.",
  );
  expect(
    screen
      .getByRole("button", { name: "Criar simulação" })
      .hasAttribute("disabled"),
  ).toBe(true);
});
it("mostra cliente de cada versão e não inventa vínculo ao duplicar versão legada", async () => {
  const version = {
    version: 1,
    assumptions,
    result: row.result,
    author: "autor-legado",
    authorName: null,
    recordedAt: row.createdAt,
    customerId: null,
    customerName: null,
  };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json([row]))
    .mockResolvedValueOnce(Response.json([version]));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  render(React.createElement(SimuladorAcumuloPage));
  await screen.findByRole("heading", { name: "Plano Lisboa" });
  fireEvent.click(screen.getByRole("button", { name: "Histórico" }));
  await screen.findByText("Cliente nesta versão: Sem cliente (versão legada)");
  expect(screen.getByText(/Autor legado não identificado/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Duplicar versão 1" }));
  expect(
    (screen.getByLabelText("Cliente do plano") as HTMLSelectElement).value,
  ).toBe("");
  expect(
    screen
      .getByRole("button", { name: "Criar simulação" })
      .hasAttribute("disabled"),
  ).toBe(true);
});
