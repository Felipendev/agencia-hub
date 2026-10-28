// @vitest-environment jsdom
import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PublicDiagnostic } from "./public-diagnostic";
const api = vi.hoisted(() => ({ publicConfig: vi.fn(), submit: vi.fn() }));
vi.mock("@/lib/miles-diagnostics", async (original) => ({
  ...(await original<typeof import("@/lib/miles-diagnostics")>()),
  diagnosticsApi: api,
}));
const config = {
  agencyName: "Agência teste",
  title: "Diagnóstico",
  introduction: "Objetivos de milhas",
  consentVersion: "milhas-2026-10-28",
};
beforeEach(() => {
  vi.clearAllMocks();
  api.publicConfig.mockResolvedValue(config);
  api.submit.mockResolvedValue(undefined);
});
afterEach(cleanup);
it("exige consentimento, envia versão exibida e confirma só após resposta", async () => {
  render(createElement(PublicDiagnostic, { id: "public-token" }));
  await screen.findByRole("heading", { name: "Diagnóstico" });
  expect(
    (
      screen.getByRole("button", {
        name: "Enviar para revisão",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.change(screen.getByLabelText("Nome"), {
    target: { value: "Pessoa" },
  });
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "p@test.local" },
  });
  fireEvent.change(screen.getByLabelText("Telefone com código do país"), {
    target: { value: "+351912345678" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  let finish!: () => void;
  api.submit.mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Enviar para revisão" })
      .closest("form")!,
  );
  expect(screen.queryByText(/Diagnóstico enviado/)).toBeNull();
  expect(screen.getByRole("button", { name: "Enviando…" })).toBeTruthy();
  finish();
  await screen.findByText(/Diagnóstico enviado para revisão/);
  expect(api.submit).toHaveBeenCalledWith(
    "public-token",
    expect.any(String),
    expect.objectContaining({ phone: "+351912345678", name: "Pessoa" }),
    true,
    config.consentVersion,
  );
  expect(screen.queryByLabelText("Nome")).toBeNull();
});
it("preserva dados e chave de confirmação em falha e nova tentativa", async () => {
  api.submit.mockRejectedValueOnce(new Error("Serviço indisponível"));
  render(createElement(PublicDiagnostic, { id: "token" }));
  await screen.findByLabelText("Nome");
  fireEvent.change(screen.getByLabelText("Nome"), {
    target: { value: "Rascunho" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  const form = screen
    .getByRole("button", { name: "Enviar para revisão" })
    .closest("form")!;
  fireEvent.submit(form);
  await screen.findByRole("alert");
  expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe(
    "Rascunho",
  );
  fireEvent.submit(form);
  await screen.findByText(/Diagnóstico enviado/);
  expect(api.submit.mock.calls[1][1]).toBe(api.submit.mock.calls[0][1]);
});
it("formulário indisponível permite recuperar e mudança de link descarta resposta antiga", async () => {
  api.publicConfig.mockRejectedValueOnce(new Error("404"));
  const view = render(createElement(PublicDiagnostic, { id: "old" }));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByLabelText("Nome");
  fireEvent.change(screen.getByLabelText("Nome"), {
    target: { value: "Não compartilhar" },
  });
  let finish!: (v: typeof config) => void;
  api.publicConfig.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  view.rerender(createElement(PublicDiagnostic, { id: "other" }));
  expect(screen.queryByLabelText("Nome")).toBeNull();
  view.rerender(createElement(PublicDiagnostic, { id: "third" }));
  await screen.findByLabelText("Nome");
  finish({ ...config, title: "Antigo" });
  await waitFor(() =>
    expect(screen.queryByRole("heading", { name: "Antigo" })).toBeNull(),
  );
  expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe("");
});
