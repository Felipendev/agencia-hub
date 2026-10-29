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
import { ActivityHistory } from "./activity-history";
const mock = vi.hoisted(() => ({
  token: "session" as string | null,
  owner: true,
  list: vi.fn(),
  export: vi.fn(),
  people: vi.fn(),
  save: vi.fn(),
}));
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ token: mock.token, isOwner: mock.owner }),
}));
vi.mock("@/lib/activity-history", async (original) => ({
  ...(await original<typeof import("@/lib/activity-history")>()),
  historyApi: { list: mock.list, export: mock.export },
}));
vi.mock("@/lib/api/list-customers-remote", () => ({
  listCustomersRemote: mock.people,
}));
vi.mock("@/lib/agenda/api", () => ({ saveBlob: mock.save }));
vi.mock("@/components/cliente/ClientePicker", () => ({
  ClientePicker: ({
    value,
    onChange,
    loadError,
    onRetryLoad,
  }: {
    value: string;
    onChange: (id: string) => void;
    loadError: string;
    onRetryLoad: () => void;
  }) =>
    createElement(
      "div",
      null,
      createElement(
        "label",
        null,
        "Pessoa (opcional)",
        createElement(
          "select",
          {
            value,
            onChange: (e: { target: { value: string } }) =>
              onChange(e.target.value),
          },
          createElement("option", { value: "" }, "Todas"),
          createElement("option", { value: "person" }, "Pessoa teste"),
        ),
      ),
      loadError &&
        createElement(
          "button",
          { type: "button", onClick: onRetryLoad },
          "Recarregar pessoas",
        ),
    ),
}));
const event = {
  id: "event",
  module: "WALLET",
  resourceId: "resource",
  customerId: "person",
  action: "CREATED",
  authorId: "actor",
  authorName: "Equipe",
  at: "2026-10-20T03:00:00Z",
};
const result = {
  events: [event],
  hasMore: false,
  page: 0,
  timeZone: "America/Fortaleza",
};
beforeEach(() => {
  vi.clearAllMocks();
  mock.token = "session";
  mock.owner = true;
  mock.people.mockResolvedValue([]);
  mock.list.mockResolvedValue(result);
  mock.export.mockResolvedValue(new Blob(["csv"]));
});
afterEach(cleanup);
const page = (product: "MILES" | "TRAVEL" = "MILES") =>
  createElement(ActivityHistory, { product });
it("consults API, respects product and renders persistent IDs/author with source links", async () => {
  render(page());
  await screen.findByText("Autor: Equipe");
  expect(mock.list).toHaveBeenCalledWith(
    "session",
    expect.objectContaining({
      product: "MILES",
      customerId: "",
      modules: expect.arrayContaining(["WALLET"]),
    }),
    0,
  );
  expect(
    screen.queryByRole("checkbox", { name: "Etapas de viagem" }),
  ).toBeNull();
  expect(
    screen
      .getByRole("link", { name: "Abrir módulo de origem" })
      .getAttribute("href"),
  ).toBe("/milhas/clientes/person");
  expect(screen.getByText(/20\/10\/2026, 00:00:00/)).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Anterior" }).hasAttribute("disabled"),
  ).toBe(true);
});
it("invalidates stale results when any filter changes and applies selection only on consult", async () => {
  render(page());
  await screen.findByText("Autor: Equipe");
  fireEvent.change(screen.getByLabelText("Pessoa (opcional)"), {
    target: { value: "person" },
  });
  expect(screen.queryByText("Autor: Equipe")).toBeNull();
  expect(screen.queryByRole("button", { name: /Exportar CSV/ })).toBeNull();
  expect(mock.list).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("checkbox", { name: "Contratos" }));
  fireEvent.click(screen.getByRole("button", { name: "Consultar histórico" }));
  await screen.findByText("Autor: Equipe");
  const filters = mock.list.mock.calls[1][1];
  expect(filters.customerId).toBe("person");
  expect(filters.modules).not.toContain("CONTRACTS");
});
it("preserves filters on API failure, retries and recovers people independently", async () => {
  mock.list.mockRejectedValueOnce(new Error("Serviço indisponível"));
  mock.people.mockRejectedValueOnce(new Error("rede"));
  render(page());
  await screen.findByText("Serviço indisponível");
  await screen.findByRole("button", { name: "Recarregar pessoas" });
  fireEvent.click(screen.getByRole("button", { name: "Recarregar pessoas" }));
  await waitFor(() => expect(mock.people).toHaveBeenCalledTimes(2));
  fireEvent.click(
    screen.getByRole("button", { name: "Tentar consulta novamente" }),
  );
  await screen.findByText("Autor: Equipe");
  expect(mock.list.mock.calls[1][1]).toEqual(mock.list.mock.calls[0][1]);
});
it("prevents invalid dates and empty module selections from reaching the API", async () => {
  render(page());
  await screen.findByText("Autor: Equipe");
  fireEvent.change(screen.getByLabelText("Data inicial"), {
    target: { value: "2030-01-01" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Consultar histórico" }));
  expect(await screen.findByText(/Escolha um período crescente/)).toBeTruthy();
  expect(mock.list).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText("Data inicial"), {
    target: { value: "2026-10-01" },
  });
  fireEvent.change(screen.getByLabelText("Data final"), {
    target: { value: "2026-10-31" },
  });
  screen.getAllByRole("checkbox").forEach((c) => fireEvent.click(c));
  fireEvent.click(screen.getByRole("button", { name: "Consultar histórico" }));
  await screen.findByText("Selecione pelo menos um módulo.");
  expect(mock.list).toHaveBeenCalledTimes(1);
});
it("paginates with the same filters and shows empty state without mutable audit controls", async () => {
  mock.list
    .mockResolvedValueOnce({ ...result, hasMore: true })
    .mockResolvedValueOnce({ ...result, page: 1, events: [] });
  render(page());
  await screen.findByText("Autor: Equipe");
  fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
  await screen.findByText("Nenhum evento encontrado neste recorte.");
  expect(mock.list.mock.calls[1][2]).toBe(1);
  expect(mock.list.mock.calls[1][1]).toEqual(mock.list.mock.calls[0][1]);
  expect(screen.queryByRole("button", { name: /excluir|editar/i })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
  await screen.findByText("Autor: Equipe");
});
it("confirms export only after server success, locks changes and keeps failures retryable", async () => {
  let resolve!: (blob: Blob) => void;
  mock.export.mockReturnValueOnce(
    new Promise<Blob>((r) => {
      resolve = r;
    }),
  );
  render(page());
  await screen.findByText("Autor: Equipe");
  fireEvent.click(screen.getByRole("button", { name: /Exportar CSV/ }));
  expect(mock.save).not.toHaveBeenCalled();
  expect(
    (screen.getByLabelText("Data inicial") as HTMLInputElement).disabled,
  ).toBe(false);
  // Native fieldset propagates disabled semantics; the fieldset itself is the lock.
  expect(
    screen.getByLabelText("Data inicial").closest("fieldset")?.disabled,
  ).toBe(true);
  resolve(new Blob(["csv"]));
  await screen.findByText(/Arquivo gerado/);
  expect(mock.save).toHaveBeenCalledTimes(1);
  mock.export.mockRejectedValueOnce(new Error("Reduza os filtros"));
  fireEvent.click(screen.getByRole("button", { name: /Exportar CSV/ }));
  await screen.findByText("Reduza os filtros");
  expect(mock.save).toHaveBeenCalledTimes(1);
  expect(
    screen.getByLabelText("Data inicial").closest("fieldset")?.disabled,
  ).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: /Exportar CSV/ }));
  await waitFor(() => expect(mock.save).toHaveBeenCalledTimes(2));
});
it("blocks seller exports and ignores late responses after product/session changes", async () => {
  let finish!: (v: typeof result) => void;
  mock.list.mockReturnValueOnce(
    new Promise((r) => {
      finish = r;
    }),
  );
  mock.owner = false;
  const view = render(page());
  view.rerender(page("TRAVEL"));
  await screen.findByText("Autor: Equipe");
  expect(
    screen
      .getByRole("button", { name: /Exportar CSV/ })
      .hasAttribute("disabled"),
  ).toBe(true);
  expect(
    screen.queryByRole("checkbox", { name: "Carteira de milhas" }),
  ).toBeNull();
  finish({ ...result, events: [{ ...event, authorName: "Resposta antiga" }] });
  await waitFor(() => expect(screen.queryByText(/Resposta antiga/)).toBeNull());
  mock.token = null;
  view.rerender(page("TRAVEL"));
  expect(screen.queryByText("Autor: Equipe")).toBeNull();
  expect(screen.getByRole("alert").textContent).toContain("Entre no sistema");
});
it("never downloads an export that completes after the session is gone", async () => {
  let finish!: (blob: Blob) => void;
  mock.export.mockReturnValueOnce(
    new Promise<Blob>((r) => {
      finish = r;
    }),
  );
  const view = render(page());
  await screen.findByText("Autor: Equipe");
  fireEvent.click(screen.getByRole("button", { name: /Exportar CSV/ }));
  mock.token = null;
  view.rerender(page());
  finish(new Blob(["csv"]));
  await waitFor(() => expect(mock.save).not.toHaveBeenCalled());
});
