// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import BibliotecaPage from "./page";

vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "test-token" }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example/api/v1" }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const material = { id: "latam", title: "LATAM — bagagem", category: "BAGAGEM", kind: "LINK", url: "https://www.latamairlines.com/" };
describe("edição e exclusão da Biblioteca", () => {
  it("edita um atalho oficial e remove o material somente depois da confirmação da API", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json([material])).mockResolvedValueOnce(Response.json({ ...material, title: "Bagagem LATAM atualizada" })).mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); vi.spyOn(window, "confirm").mockReturnValue(true);
    render(React.createElement(BibliotecaPage));
    await screen.findByText("LATAM — bagagem");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Bagagem LATAM atualizada" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await screen.findByText("Material atualizado.");
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.example/api/v1/library/latam");
    expect(fetchMock.mock.calls[1][1].method).toBe("PATCH");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).title).toBe("Bagagem LATAM atualizada");
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await screen.findByText("Material excluído.");
    expect(screen.queryByRole("heading", { name: "Bagagem LATAM atualizada" })).toBeNull();
    expect(fetchMock.mock.calls[2][1].method).toBe("DELETE");
  });
  it("mantém o material visível quando a API recusa a exclusão", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json([material])).mockResolvedValueOnce(Response.json({ message: "Não foi possível excluir." }, { status: 500 })));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(React.createElement(BibliotecaPage));
    const title = await screen.findByRole("heading", { name: material.title });
    fireEvent.click(within(title.closest("article")!).getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Não foi possível excluir."));
    expect(screen.getByRole("heading", { name: material.title })).toBeTruthy();
  });
});
