// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MilesWallet } from "./MilesWallet";
import type { WalletView } from "@/lib/miles-wallet";
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ token: "test-token" }),
}));
vi.mock("@/lib/api/agencia-hub-env", () => ({
  getAgenciaHubApiBaseUrl: () => "https://api.example",
}));
const account = {
  id: "account",
  kind: "ACCOUNT" as const,
  data: {
    program: "Smiles",
    holder: "Titular",
    openingBalance: 1000,
    declaredOn: "2026-01-01",
    source: "Extrato",
  },
  version: 1,
  archived: false,
  balance: 1000,
};
const view: WalletView = {
  profile: null,
  items: [account],
  movements: [],
  history: [],
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function open() {
  render(React.createElement(MilesWallet, { customerId: "person" }));
  fireEvent.click(screen.getByRole("button", { name: "Abrir carteira" }));
  await screen.findByText("Nenhum perfil de milhas cadastrado.");
}
it("edita uma conta pelo mesmo ID preservando o saldo inicial", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json(view))
    .mockResolvedValueOnce(Response.json({ ...account, version: 2 }))
    .mockResolvedValueOnce(
      Response.json({
        ...view,
        items: [
          {
            ...account,
            data: { ...account.data, holder: "Titular alterado" },
            version: 2,
          },
        ],
      }),
    );
  vi.stubGlobal("fetch", fetchMock);
  await open();
  fireEvent.click(screen.getByRole("button", { name: "Contas de programas" }));
  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  expect(
    (screen.getByLabelText("Saldo inicial declarado *") as HTMLInputElement)
      .disabled,
  ).toBe(true);
  fireEvent.change(screen.getByLabelText("Titular da conta *"), {
    target: { value: "Titular alterado" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar registro" }));
  await screen.findByText("Registro salvo.");
  await screen.findByText("Titular alterado");
  expect(fetchMock.mock.calls[1][0]).toBe(
    "https://api.example/customers/person/miles-wallet/items/account",
  );
  expect(fetchMock.mock.calls[1][1].method).toBe("PATCH");
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
    expectedVersion: 1,
    data: { holder: "Titular alterado", openingBalance: 1000 },
  });
});
it("erro de exclusão conserva o cartão e não mostra sucesso", async () => {
  const card = {
    ...account,
    id: "card",
    kind: "CARD" as const,
    data: { issuer: "Banco", category: "Categoria" },
  };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ ...view, items: [card] }))
    .mockResolvedValueOnce(
      Response.json({ message: "Acesso recusado" }, { status: 403 }),
    );
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  await open();
  fireEvent.click(screen.getByRole("button", { name: "Cartões" }));
  fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
  await screen.findByRole("alert");
  expect(screen.getByText("Banco · Categoria")).toBeTruthy();
  expect(screen.queryByText("Registro excluído.")).toBeNull();
});
it("repetir uma movimentação após falha mantém a mesma chave e bloqueia envio duplo", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json(view))
    .mockRejectedValueOnce(new Error("Conexão interrompida"))
    .mockResolvedValueOnce(Response.json({ id: "move" }))
    .mockResolvedValueOnce(Response.json(view));
  vi.stubGlobal("fetch", fetchMock);
  await open();
  fireEvent.click(screen.getByRole("button", { name: "Movimentações" }));
  fireEvent.click(screen.getByRole("button", { name: "Nova movimentação" }));
  fireEvent.change(screen.getByLabelText("Conta *"), {
    target: { value: "account" },
  });
  fireEvent.change(screen.getByLabelText("Quantidade *"), {
    target: { value: "100" },
  });
  fireEvent.change(screen.getByLabelText("Motivo *"), {
    target: { value: "Crédito manual" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Confirmar movimentação" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Registrando…" }));
  await screen.findByRole("alert");
  expect(fetchMock).toHaveBeenCalledTimes(2);
  const body = JSON.parse(fetchMock.mock.calls[1][1].body);
  expect(body.quantity).toBe(100);
  expect(body.requestKey).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Confirmar movimentação" }),
  );
  await screen.findByText("Movimentação registrada.");
  expect(JSON.parse(fetchMock.mock.calls[2][1].body).requestKey).toBe(
    body.requestKey,
  );
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
});
it("arquiva a conta com a versão corrente, mantendo o saldo para consulta", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json(view))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(
      Response.json({
        ...view,
        items: [{ ...account, archived: true, version: 2 }],
      }),
    );
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  await open();
  fireEvent.click(screen.getByRole("button", { name: "Contas de programas" }));
  fireEvent.click(screen.getByRole("button", { name: "Arquivar conta" }));
  await screen.findByText("Conta arquivada.");
  expect(fetchMock.mock.calls[1][0]).toContain("account?expectedVersion=1");
  expect(fetchMock.mock.calls[1][1].method).toBe("DELETE");
  fireEvent.click(screen.getByLabelText("Mostrar contas arquivadas"));
  await screen.findByRole("button", { name: "Reativar conta" });
  expect(screen.getByText("1.000 pontos de saldo declarado")).toBeTruthy();
});
