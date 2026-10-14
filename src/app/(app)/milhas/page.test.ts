// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import MilesDirectoryPage from "./page";
const { request, push, sync } = vi.hoisted(() => ({
  request: vi.fn(),
  push: vi.fn(),
  sync: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/api/authenticated-fetch", () => ({ apiFetch: request }));
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ token: "test" }),
}));
vi.mock("@/contexts/data-context", () => ({
  useData: () => ({ clientes: [], syncClientesFromApi: sync }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/cliente/ClientePicker", () => ({
  ClientePicker: ({ onChange }: { onChange: (id: string) => void }) =>
    React.createElement(
      "button",
      { type: "button", onClick: () => onChange("shared-person") },
      "Selecionar pessoa compartilhada",
    ),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const row = {
  customerId: "person",
  name: "João",
  archived: false,
  accounts: 1,
  cards: 1,
  clubs: 0,
  nextExpiry: null,
};
it("mostra carteiras registradas e separa arquivadas mantendo o ID da pessoa", async () => {
  request.mockResolvedValue([
    row,
    { ...row, customerId: "archived", name: "Perfil antigo", archived: true },
  ]);
  render(React.createElement(MilesDirectoryPage));
  await screen.findByRole("heading", { name: "João" });
  expect(screen.queryByText("Perfil antigo")).toBeNull();
  expect(
    screen.getByRole("link", { name: "Abrir carteira →" }).getAttribute("href"),
  ).toBe("/milhas/clientes/person");
  fireEvent.change(screen.getByLabelText("Buscar pessoa"), {
    target: { value: "joao" },
  });
  expect(screen.getByText("João")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Buscar pessoa"), {
    target: { value: "" },
  });
  fireEvent.click(
    screen.getByLabelText("Mostrar também carteiras apenas arquivadas"),
  );
  await screen.findByText("Perfil antigo");
});
it("abrir o perfil reutiliza a pessoa e não envia uma criação", async () => {
  request.mockResolvedValue([]);
  render(React.createElement(MilesDirectoryPage));
  await screen.findByText(
    "Nenhum acompanhamento de milhas cadastrado. Selecione uma pessoa acima para começar.",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Selecionar pessoa compartilhada" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Abrir perfil de milhas" }),
  );
  expect(push).toHaveBeenCalledWith("/milhas/clientes/shared-person");
  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0][0]).toBe("/miles-wallets");
});
it("falha de consulta não aparece como carteira vazia e permite tentar novamente", async () => {
  request
    .mockRejectedValueOnce(new Error("Sem acesso"))
    .mockResolvedValueOnce([row]);
  render(React.createElement(MilesDirectoryPage));
  await screen.findByRole("alert");
  expect(
    screen.queryByText(
      "Nenhum acompanhamento de milhas cadastrado. Selecione uma pessoa acima para começar.",
    ),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Atualizar lista" }));
  await screen.findByText("João");
  expect(screen.queryByRole("alert")).toBeNull();
});
