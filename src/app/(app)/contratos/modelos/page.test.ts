// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ContractTemplatesPage from "./page";

let accountKind = "AGENCY_OWNER";
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok", user: { accountKind } }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); accountKind = "AGENCY_OWNER"; });

const fields = [{ key: "cliente.nome", label: "Nome da pessoa", source: "CUSTOMER" }];
const summary = { id: "t1", product: "MILES", name: "Assessoria", description: null, currentVersion: 1, archived: false, rowVersion: 1, contractCount: 2, updatedAt: "2026-10-14T12:00:00Z" };
const detail = (over: Record<string, unknown> = {}, tpl: Record<string, unknown> = {}) => ({
  template: { ...summary, ...tpl }, body: "Contratante: {{cliente.nome}}", usedFields: ["cliente.nome"],
  versions: [{ version: 1, body: "Contratante: {{cliente.nome}}", usedFields: ["cliente.nome"], author: "Gestor", createdAt: "2026-10-14T12:00:00Z" }],
  history: [], ...over,
});

describe("modelos de contrato", () => {
  it("edita o mesmo modelo e informa que o conteúdo virou nova versão", async () => {
    const versioned = detail({ body: "Novo texto {{cliente.nome}}" }, { currentVersion: 2, rowVersion: 2 });
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/contract-templates/fields")) return Response.json(fields);
      if (url.endsWith("/contract-templates/t1") && init?.method === "PATCH") return Response.json(versioned);
      if (url.endsWith("/contract-templates/t1")) return Response.json(detail());
      if (url.includes("/contract-templates")) return Response.json([summary]);
      throw new Error(url);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(ContractTemplatesPage));
    fireEvent.click(await screen.findByRole("button", { name: /Assessoria/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText(/^Conteúdo do contrato/), { target: { value: "Novo texto " } });
    fireEvent.click(screen.getByRole("button", { name: "Nome da pessoa" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await screen.findByText(/versão 2\. Contratos já emitidos continuam/);
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH")!;
    expect(JSON.parse(String(patch[1]!.body))).toMatchObject({ product: "MILES", body: "Novo texto {{cliente.nome}}", expectedVersion: 1 });
  });

  it("arquiva modelo usado e mostra a explicação da API", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/contract-templates/fields")) return Response.json(fields);
      if (init?.method === "DELETE") return Response.json({ outcome: "ARCHIVED", message: "O modelo já foi usado em contratos e foi arquivado para preservar o histórico." });
      if (url.endsWith("/contract-templates/t1")) return Response.json(fetchMock.mock.calls.some(([, i]) => i?.method === "DELETE") ? detail({}, { archived: true, rowVersion: 2 }) : detail());
      if (url.includes("/contract-templates")) return Response.json([summary]);
      throw new Error(url);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(ContractTemplatesPage));
    fireEvent.click(await screen.findByRole("button", { name: /Assessoria/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Arquivar" }));
    expect(screen.getByText(/será arquivado para preservar o histórico/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Arquivar" }).at(-1)!);
    await screen.findByText(/foi arquivado para preservar o histórico\./);
    expect(fetchMock.mock.calls.find(([, i]) => i?.method === "DELETE")![0]).toContain("expectedVersion=1");
    await waitFor(() => expect(screen.getByRole("button", { name: "Reativar" })).toBeTruthy());
  });

  it("vendedor consulta modelos sem ações de edição", async () => {
    accountKind = "SALES_AGENT";
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.endsWith("/contract-templates/fields")) return Response.json(fields);
      if (url.endsWith("/contract-templates/t1")) return Response.json(detail());
      return Response.json([summary]);
    }));
    render(React.createElement(ContractTemplatesPage));
    fireEvent.click(await screen.findByRole("button", { name: /Assessoria/ }));
    await screen.findByText("Versão 1 (atual)");
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Novo modelo" })).toBeNull();
  });
});
