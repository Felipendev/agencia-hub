// @vitest-environment jsdom
import React, { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DiagnosticDetail } from "./diagnostic-detail";
import { emptyDiagnostic, type DiagnosticEntry } from "@/lib/miles-diagnostics";
const mock = vi.hoisted(() => ({
  token: "session" as string | null,
  people: vi.fn(),
  api: {
    get: vi.fn(),
    events: vi.fn(),
    edit: vi.fn(),
    state: vi.fn(),
    wallet: vi.fn(),
    incorporate: vi.fn(),
  },
}));
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ token: mock.token }),
}));
vi.mock("@/lib/api/list-customers-remote", () => ({
  listCustomersRemote: mock.people,
}));
vi.mock("@/lib/miles-diagnostics", async (original) => ({
  ...(await original<typeof import("@/lib/miles-diagnostics")>()),
  diagnosticsApi: mock.api,
}));
vi.mock("@/components/cliente/ClientePicker", () => ({
  ClientePicker: ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (v: string) => void;
    label: string;
  }) =>
    React.createElement(
      "label",
      null,
      label,
      React.createElement(
        "select",
        {
          value,
          onChange: (e: { target: { value: string } }) =>
            onChange(e.target.value),
        },
        React.createElement("option", { value: "" }, "Selecione"),
        React.createElement("option", { value: "p1" }, "Pessoa1"),
        React.createElement("option", { value: "p2" }, "Pessoa2"),
      ),
    ),
}));
const data = {
  ...emptyDiagnostic(),
  name: "Declarada",
  email: "p@test.local",
  items: [
    { kind: "CARD" as const, data: { issuer: "Banco", category: "Black" } },
  ],
};
const entry: DiagnosticEntry = {
  id: "d1",
  original: data,
  data,
  source: "PUBLIC",
  consentVersion: "milhas-2026-10-28",
  version: 1,
  archived: false,
  customerId: null,
  receipt: null,
  createdAt: "2026-10-28T12:00:00Z",
};
beforeEach(() => {
  vi.clearAllMocks();
  mock.token = "session";
  mock.api.get.mockResolvedValue(entry);
  mock.api.events.mockResolvedValue([
    {
      action: "CREATED",
      reason: "",
      createdAt: entry.createdAt,
      snapshot: entry,
    },
  ]);
  mock.people.mockResolvedValue([]);
  mock.api.wallet.mockResolvedValue({ profile: null, items: [] });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const open = async () => {
  render(createElement(DiagnosticDetail, { id: "d1" }));
  await screen.findByLabelText("Nome");
};
it("edita no mesmo ID/versão e mantém formulário em conflito", async () => {
  await open();
  fireEvent.change(screen.getByLabelText("Nome"), {
    target: { value: "Corrigido" },
  });
  mock.api.edit.mockRejectedValueOnce(
    new Error("Recarregue antes de confirmar"),
  );
  fireEvent.submit(
    screen.getByRole("button", { name: "Salvar revisão" }).closest("form")!,
  );
  await screen.findByRole("alert");
  expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe(
    "Corrigido",
  );
  expect(mock.api.edit).toHaveBeenCalledWith(
    "session",
    "d1",
    expect.objectContaining({ name: "Corrigido" }),
    1,
  );
  mock.api.edit.mockResolvedValueOnce({
    ...entry,
    data: { ...data, name: "Corrigido" },
    version: 2,
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Salvar revisão" }).closest("form")!,
  );
  await screen.findByText("Revisão salva no mesmo diagnóstico.");
  expect(screen.getByText(/Versão 2/)).toBeTruthy();
});
it("arquiva por motivo e reativa com versão atual, sem modificar carteira", async () => {
  await open();
  expect(
    (
      screen.getByRole("button", {
        name: "Arquivar diagnóstico",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.change(screen.getByLabelText("Motivo"), {
    target: { value: "Duplicado" },
  });
  mock.api.state.mockResolvedValueOnce({
    ...entry,
    archived: true,
    version: 2,
  });
  fireEvent.click(screen.getByRole("button", { name: "Arquivar diagnóstico" }));
  await screen.findByText("Diagnóstico arquivado.");
  expect(mock.api.state).toHaveBeenCalledWith("session", entry, "Duplicado");
  fireEvent.change(screen.getByLabelText("Motivo"), {
    target: { value: "Revisar" },
  });
  mock.api.state.mockResolvedValueOnce({ ...entry, version: 3 });
  fireEvent.click(screen.getByRole("button", { name: "Reativar diagnóstico" }));
  await screen.findByText("Diagnóstico reativado.");
  expect(mock.api.incorporate).not.toHaveBeenCalled();
});
it("incorporação exige carteira, seleção e confirmação; bloqueia alterações durante envio", async () => {
  await open();
  fireEvent.change(screen.getByLabelText("Pessoa que receberá o diagnóstico"), {
    target: { value: "p1" },
  });
  await screen.findByText(/ainda não possui perfil/);
  const button = screen.getByRole("button", {
    name: "Confirmar incorporação",
  }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  fireEvent.click(screen.getByLabelText(/Adicionar registro 1:/));
  fireEvent.click(screen.getByLabelText(/Conferi a pessoa/));
  let finish!: (value: unknown) => void;
  mock.api.incorporate.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  fireEvent.click(button);
  expect(screen.getByLabelText("Nome").matches(":disabled")).toBe(true);
  expect(
    screen
      .getByLabelText("Pessoa que receberá o diagnóstico")
      .matches(":disabled"),
  ).toBe(true);
  expect(mock.api.incorporate).toHaveBeenCalledWith("session", "d1", {
    customerId: "p1",
    expectedVersion: 1,
    importProfile: false,
    profileVersion: 0,
    items: [0],
  });
  finish({
    customerId: "p1",
    at: entry.createdAt,
    itemIds: ["card"],
    itemIndexes: [0],
    importedProfile: false,
    authorId: "author",
  });
  await screen.findByText(
    "Incorporação confirmada pela API. A carteira foi atualizada.",
  );
  expect(
    screen
      .getByRole("link", { name: "Consultar ou editar a carteira vinculada" })
      .getAttribute("href"),
  ).toBe("/milhas/clientes/p1");
  expect(
    screen.queryByRole("button", { name: "Confirmar incorporação" }),
  ).toBeNull();
  const receiptSection = screen
    .getByRole("heading", { name: "Comprovante de incorporação" })
    .closest("section")!;
  expect(receiptSection.textContent).toContain(
    "O perfil da carteira foi mantido",
  );
  expect(receiptSection.textContent).not.toContain(data.email);
});
it("carteira antiga não reaparece após trocar pessoa e falha bloqueia até recarregar", async () => {
  let finish!: (value: unknown) => void;
  mock.api.wallet.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  await open();
  fireEvent.change(screen.getByLabelText("Pessoa que receberá o diagnóstico"), {
    target: { value: "p1" },
  });
  mock.api.wallet.mockRejectedValueOnce(new Error("403"));
  fireEvent.change(screen.getByLabelText("Pessoa que receberá o diagnóstico"), {
    target: { value: "p2" },
  });
  await screen.findByRole("alert");
  finish({ profile: { data: { goals: "Cliente antigo" } }, items: [] });
  await waitFor(() => expect(screen.queryByText("Cliente antigo")).toBeNull());
  expect(
    screen.queryByRole("button", { name: "Confirmar incorporação" }),
  ).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Recarregar carteira selecionada" }),
  );
  await screen.findByText(/ainda não possui perfil/);
});
it("troca de sessão remove diagnóstico e exige autenticação", async () => {
  const view = render(createElement(DiagnosticDetail, { id: "d1" }));
  await screen.findByLabelText("Nome");
  mock.token = "other";
  mock.api.get.mockReturnValueOnce(new Promise(() => {}));
  view.rerender(createElement(DiagnosticDetail, { id: "d1" }));
  expect(screen.queryByLabelText("Nome")).toBeNull();
  mock.token = null;
  view.rerender(createElement(DiagnosticDetail, { id: "d1" }));
  expect(screen.getByRole("alert").textContent).toContain("Entre no sistema");
});
it("conflito na incorporação preserva seleção e libera formulário; recarga exige nova conferência", async () => {
  mock.api.wallet.mockResolvedValue({
    profile: {
      data: {
        goals: "Meta atual",
        travelFrequency: "Anual",
        destinations: "Roma",
        actionPlan: "Plano atual",
      },
      version: 3,
      archived: true,
    },
    items: [{ archived: false }],
  });
  await open();
  fireEvent.change(screen.getByLabelText("Pessoa que receberá o diagnóstico"), {
    target: { value: "p1" },
  });
  await screen.findByText("Meta atual");
  fireEvent.click(screen.getByLabelText(/Substituir o perfil atual/));
  fireEvent.click(screen.getByLabelText(/Conferi a pessoa/));
  mock.api.incorporate.mockRejectedValueOnce(
    new Error("O perfil foi atualizado por outra pessoa"),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Confirmar incorporação" }),
  );
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Nome").matches(":disabled")).toBe(false);
  expect(
    (screen.getByLabelText(/Substituir o perfil atual/) as HTMLInputElement)
      .checked,
  ).toBe(true);
  expect(mock.api.incorporate).toHaveBeenCalledWith("session", "d1", {
    customerId: "p1",
    expectedVersion: 1,
    importProfile: true,
    profileVersion: 3,
    items: [],
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Recarregar carteira selecionada" }),
  );
  await screen.findByText("Meta atual");
  expect(
    (screen.getByLabelText(/Conferi a pessoa/) as HTMLInputElement).checked,
  ).toBe(false);
});
it("falha inicial permite recuperação e recarga só descarta rascunho com confirmação", async () => {
  mock.api.get.mockRejectedValueOnce(new Error("404"));
  render(createElement(DiagnosticDetail, { id: "d1" }));
  await screen.findByRole("alert");
  expect(screen.queryByLabelText("Nome")).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Recarregar diagnóstico" }),
  );
  await screen.findByLabelText("Nome");
  fireEvent.change(screen.getByLabelText("Nome"), {
    target: { value: "Rascunho" },
  });
  vi.spyOn(window, "confirm")
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(true);
  fireEvent.click(
    screen.getByRole("button", { name: "Recarregar diagnóstico" }),
  );
  expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe(
    "Rascunho",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Recarregar diagnóstico" }),
  );
  await screen.findByDisplayValue("Declarada");
});
