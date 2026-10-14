// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import MilesCustomerPage from "./page";
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/lib/api/authenticated-fetch", () => ({ apiFetch: request }));
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ token: "test" }),
}));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "person" }) }));
vi.mock("@/components/cliente/MilesWallet", () => ({
  MilesWallet: ({
    customerId,
    defaultOpen,
  }: {
    customerId: string;
    defaultOpen: boolean;
  }) =>
    React.createElement(
      "p",
      null,
      `Carteira ${customerId} · aberta ${defaultOpen}`,
    ),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("abre a carteira no domínio de milhas consultando somente a identidade compartilhada", async () => {
  request.mockResolvedValue({ id: "person", name: "Pessoa compartilhada" });
  render(React.createElement(MilesCustomerPage));
  await screen.findByRole("heading", { name: "Pessoa compartilhada" });
  expect(screen.getByText("Carteira person · aberta true")).toBeTruthy();
  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0][0]).toBe("/customers/person");
  expect(
    screen
      .getByRole("link", { name: "Cadastro da pessoa e viagens →" })
      .getAttribute("href"),
  ).toBe("/clientes/person");
});
it("não monta a carteira quando a identidade não está autorizada", async () => {
  request.mockRejectedValue(new Error("Pessoa não encontrada"));
  render(React.createElement(MilesCustomerPage));
  await screen.findByRole("alert");
  expect(screen.queryByText("Carteira person · aberta true")).toBeNull();
});
