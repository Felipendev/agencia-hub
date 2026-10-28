// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DiagnosticDirectory } from "./diagnostic-directory";
import { emptyDiagnostic } from "@/lib/miles-diagnostics";
const mock = vi.hoisted(() => ({
  token: "session" as string | null,
  owner: true,
  api: {
    list: vi.fn(),
    config: vi.fn(),
    configure: vi.fn(),
    revoke: vi.fn(),
    create: vi.fn(),
  },
}));
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ token: mock.token, isOwner: mock.owner }),
}));
vi.mock("@/lib/miles-diagnostics", async (original) => ({
  ...(await original<typeof import("@/lib/miles-diagnostics")>()),
  diagnosticsApi: mock.api,
}));
const config = {
  token: "public-link",
  title: "Diagnóstico",
  introduction: "Declare seus objetivos",
  enabled: true,
  version: 3,
};
const row = {
  id: "d1",
  name: "Pessoa",
  email: "p@test.local",
  version: 1,
  archived: false,
  incorporated: false,
  createdAt: "2026-10-28T12:00:00Z",
};
beforeEach(() => {
  vi.clearAllMocks();
  mock.token = "session";
  mock.owner = true;
  mock.api.list.mockResolvedValue([
    row,
    { ...row, id: "d2", name: "Arquivada", archived: true, incorporated: true },
  ]);
  mock.api.config.mockResolvedValue(config);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("consulta, busca e exibe arquivados com navegação própria de Milhas", async () => {
  render(createElement(DiagnosticDirectory));
  await screen.findByText("Pessoa");
  expect(screen.queryByText("Arquivada")).toBeNull();
  fireEvent.click(screen.getByLabelText("Incluir arquivados"));
  expect(screen.getByText("Arquivada")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Buscar pessoa ou e-mail"), {
    target: { value: "Nada" },
  });
  expect(screen.getByText(/Nenhum diagnóstico encontrado/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Buscar pessoa ou e-mail"), {
    target: { value: "Pessoa" },
  });
  expect(
    screen
      .getByRole("link", { name: "Revisar diagnóstico" })
      .getAttribute("href"),
  ).toBe("/milhas/diagnosticos/d1");
});
it("criação só aparece após confirmação; falha preserva rascunho e chave", async () => {
  mock.api.list.mockResolvedValue([]);
  render(createElement(DiagnosticDirectory));
  await screen.findByText(/Nenhum diagnóstico encontrado/);
  fireEvent.click(screen.getByRole("button", { name: "Novo diagnóstico" }));
  fireEvent.change(screen.getByLabelText("Nome"), {
    target: { value: "Nova pessoa" },
  });
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "nova@test.local" },
  });
  mock.api.create.mockRejectedValueOnce(new Error("Falha ao salvar"));
  fireEvent.submit(
    screen.getByRole("button", { name: "Criar diagnóstico" }).closest("form")!,
  );
  await screen.findByRole("alert");
  expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe(
    "Nova pessoa",
  );
  let finish!: (entry: unknown) => void;
  mock.api.create.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  fireEvent.submit(
    screen.getByRole("button", { name: "Criar diagnóstico" }).closest("form")!,
  );
  expect(
    screen.queryByRole("link", { name: "Revisar diagnóstico" }),
  ).toBeNull();
  finish({
    ...row,
    data: {
      ...emptyDiagnostic(),
      name: "Nova pessoa",
      email: "nova@test.local",
    },
  });
  await screen.findByRole("link", { name: "Revisar diagnóstico" });
  expect(mock.api.create.mock.calls[0][1]).toBe(
    mock.api.create.mock.calls[1][1],
  );
  expect(screen.queryByLabelText("Nome")).toBeNull();
});
it("dono configura e revoga link com versão, após confirmação da API", async () => {
  render(createElement(DiagnosticDirectory));
  await screen.findByLabelText("Título do formulário");
  fireEvent.change(screen.getByLabelText("Título do formulário"), {
    target: { value: "Título revisado" },
  });
  mock.api.configure.mockRejectedValueOnce(new Error("Conflito de versão"));
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Salvar configuração do link" })
      .closest("form")!,
  );
  await screen.findByText("Conflito de versão");
  expect(
    (screen.getByLabelText("Título do formulário") as HTMLInputElement).value,
  ).toBe("Título revisado");
  mock.api.configure.mockResolvedValueOnce({
    ...config,
    title: "Título revisado",
    version: 4,
  });
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Salvar configuração do link" })
      .closest("form")!,
  );
  await screen.findByText("Configuração do link confirmada pela API.");
  expect(mock.api.configure).toHaveBeenLastCalledWith("session", {
    title: "Título revisado",
    introduction: config.introduction,
    enabled: true,
    expectedVersion: 3,
  });
  vi.spyOn(window, "confirm")
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(true);
  fireEvent.click(screen.getByRole("button", { name: "Revogar link" }));
  expect(mock.api.revoke).not.toHaveBeenCalled();
  mock.api.revoke.mockResolvedValueOnce({
    ...config,
    token: "new-token",
    enabled: false,
    version: 5,
  });
  fireEvent.click(screen.getByRole("button", { name: "Revogar link" }));
  await screen.findByText(/Desabilitado/);
  expect(mock.api.revoke).toHaveBeenCalledWith("session", 4);
  expect(
    screen.queryByRole("button", { name: "Copiar link público" }),
  ).toBeNull();
});
it("vendedor só consulta link, e troca de sessão remove dados anteriores", async () => {
  mock.owner = false;
  const view = render(createElement(DiagnosticDirectory));
  await screen.findByText("Pessoa");
  expect(screen.queryByLabelText("Título do formulário")).toBeNull();
  expect(
    screen
      .getByRole("link", { name: /diagnostico-milhas/ })
      .getAttribute("href"),
  ).toContain("/diagnostico-milhas/public-link");
  mock.token = "other";
  mock.api.list.mockReturnValueOnce(new Promise(() => {}));
  view.rerender(createElement(DiagnosticDirectory));
  expect(screen.queryByText("Pessoa")).toBeNull();
  mock.token = null;
  view.rerender(createElement(DiagnosticDirectory));
  expect(screen.getByRole("alert").textContent).toContain("Entre no sistema");
});
it("falha não parece fila vazia; recuperação e configuração inicial funcionam", async () => {
  mock.api.list.mockRejectedValueOnce(new Error("Falhou"));
  mock.api.config.mockResolvedValue(null);
  render(createElement(DiagnosticDirectory));
  await screen.findByRole("alert");
  expect(screen.queryByText(/Nenhum diagnóstico encontrado/)).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Atualizar lista e link" }),
  );
  await screen.findByText("Pessoa");
  expect(screen.getByText(/Desabilitado/)).toBeTruthy();
  mock.api.configure.mockResolvedValueOnce(config);
  fireEvent.click(screen.getByLabelText("Habilitar recebimento público"));
  fireEvent.change(screen.getByLabelText("Introdução"), {
    target: { value: "Nova introdução" },
  });
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Salvar configuração do link" })
      .closest("form")!,
  );
  await screen.findByRole("button", { name: "Copiar link público" });
  expect(mock.api.configure.mock.calls[0][1]).toMatchObject({
    expectedVersion: 0,
    introduction: "Nova introdução",
  });
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
  fireEvent.click(screen.getByRole("button", { name: "Copiar link público" }));
  await screen.findByText("Link copiado.");
});
