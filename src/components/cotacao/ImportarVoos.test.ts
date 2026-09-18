// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ImportarVoos } from "./ImportarVoos";
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "test" }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe("leitura de oferta", () => {
  it("mostra progresso e descarta resposta recebida depois de cancelar", async () => {
    let complete!: (response: unknown) => void;
    const fetchMock = vi.fn(() => new Promise((resolve) => { complete = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    const onImport = vi.fn();
    render(createElement(ImportarVoos, { onImport }));
    fireEvent.change(screen.getByLabelText("Arquivo da oferta"), { target: { files: [new File(["image"], "oferta.png", { type: "image/png" })] } });
    fireEvent.click(screen.getByRole("button", { name: "Ler arquivo" }));
    expect(screen.getByRole("button", { name: "Cancelar leitura" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar leitura" }));
    expect(fetchMock.mock.calls.length).toBe(1);
    expect(screen.getByRole("status").textContent).toContain("Leitura cancelada");
    complete({ ok: true, json: async () => ({ id: "old", extraction: { offers: [{}] } }) });
    await waitFor(() => expect(screen.getByRole("button", { name: "Ler arquivo" }).hasAttribute("disabled")).toBe(false));
    expect(onImport).not.toHaveBeenCalled();
  });
});
