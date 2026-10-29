// @vitest-environment jsdom
import { createElement, useState, type ReactNode } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  DataProvider,
  useData,
  filterClientes,
  cotacoesEmAndamento,
  computeFinanceiroResumo,
  type DataContextValue,
} from "./data-context";
import {
  importedDraft,
  buildFlightPlan,
  commercialFlights,
} from "@/lib/flight-plan";
import { seedClientes, seedCotacoes, seedLancamentos } from "@/data/seed";
import { getHasRemoteApi } from "@/lib/api/agencia-hub-env";
import { createCustomerRemote } from "@/lib/api/create-customer-remote";
import { updateCustomerRemote } from "@/lib/api/update-customer-remote";
import { softDeleteCustomer } from "@/lib/api/soft-delete-remote";
import { createQuotationRemote } from "@/lib/api/create-quotation-remote";
import { updateQuotationRemote } from "@/lib/api/update-quotation-remote";
import { createFinancialEntryRemote } from "@/lib/api/create-financial-entry-remote";
import { updateFinancialEntryRemote } from "@/lib/api/update-financial-entry-remote";
import { deleteFinancialEntryRemote } from "@/lib/api/delete-financial-entry-remote";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import { listQuotationsRemote } from "@/lib/api/list-quotations-remote";
import { listFinancialEntriesRemote } from "@/lib/api/list-financial-entries-remote";
const auth = vi.hoisted(() => ({
  token: "token-a" as string | null,
  user: { id: "user-a", agencyId: "agency-a" } as {
    id: string;
    agencyId?: string;
  } | null,
}));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => auth }));
vi.mock("@/lib/api/agencia-hub-env");
vi.mock("@/lib/api/create-customer-remote");
vi.mock("@/lib/api/update-customer-remote");
vi.mock("@/lib/api/soft-delete-remote");
vi.mock("@/lib/api/create-quotation-remote");
vi.mock("@/lib/api/update-quotation-remote");
vi.mock("@/lib/api/create-financial-entry-remote");
vi.mock("@/lib/api/update-financial-entry-remote");
vi.mock("@/lib/api/delete-financial-entry-remote");
vi.mock("@/lib/api/list-customers-remote");
vi.mock("@/lib/api/list-quotations-remote");
vi.mock("@/lib/api/list-financial-entries-remote");
const client = {
  ...seedClientes[0],
  id: "11111111-1111-4111-8111-111111111111",
  nome: "Persistido",
};
const quote = {
  ...seedCotacoes[0],
  id: "22222222-2222-4222-8222-222222222222",
  clienteId: client.id,
  titulo: "Original",
};
const entry = {
  ...seedLancamentos[0],
  id: "33333333-3333-4333-8333-333333333333",
  descricao: "Original",
};
function cache(scope = "user-a:agency-a") {
  localStorage.setItem(
    "agencia-hub-data",
    JSON.stringify({
      scope,
      clientes: [client],
      cotacoes: [quote],
      lancamentos: [entry],
    }),
  );
}
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(DataProvider, null, children);
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  auth.token = "token-a";
  auth.user = { id: "user-a", agencyId: "agency-a" };
  vi.mocked(getHasRemoteApi).mockReturnValue(true);
  cache();
  vi.mocked(listCustomersRemote).mockResolvedValue([client]);
  vi.mocked(listQuotationsRemote).mockResolvedValue([quote]);
  vi.mocked(listFinancialEntriesRemote).mockResolvedValue([entry]);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
it("refuses customer deletion without a session instead of silently removing a local record", async () => {
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  auth.token = null;
  h.rerender();
  await act(async () => {
    await expect(h.result.current.deleteCliente(client.id)).rejects.toThrow(
      /sessão/i,
    );
  });
  expect(softDeleteCustomer).not.toHaveBeenCalled();
});
it("refuses a null quotation API result and never confirms an optimistic-only edit", async () => {
  vi.mocked(updateQuotationRemote).mockResolvedValue(null);
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  await act(async () => {
    await expect(
      h.result.current.updateCotacao(quote.id, { titulo: "Não confirmado" }),
    ).rejects.toThrow();
  });
  expect(h.result.current.cotacoes[0].titulo).toBe("Original");
  expect(
    JSON.parse(localStorage.getItem("agencia-hub-data")!).cotacoes[0].titulo,
  ).toBe("Original");
});
it("does not display another account's cache or in-memory records after switching user", async () => {
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.clientes).toHaveLength(1));
  auth.user = { id: "user-b" };
  auth.token = "token-b";
  h.rerender();
  await waitFor(() => expect(h.result.current.clientes).toEqual([]));
  expect(h.result.current.cotacoes).toEqual([]);
  expect(h.result.current.lancamentos).toEqual([]);
});
it("fails closed in production without a remote service instead of creating demo data", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.mocked(getHasRemoteApi).mockReturnValue(false);
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  await act(async () => {
    await expect(h.result.current.addCliente(client)).rejects.toThrow();
  });
  expect(createCustomerRemote).not.toHaveBeenCalled();
});
const failedOperations = [
  {
    name: "create customer",
    fail: (e: Error) => vi.mocked(createCustomerRemote).mockRejectedValue(e),
    run: (c: DataContextValue) => c.addCliente(client),
  },
  {
    name: "create quotation",
    fail: (e: Error) => vi.mocked(createQuotationRemote).mockRejectedValue(e),
    run: (c: DataContextValue) => c.addCotacao(quote),
  },
  {
    name: "create financial entry",
    fail: (e: Error) =>
      vi.mocked(createFinancialEntryRemote).mockRejectedValue(e),
    run: (c: DataContextValue) => c.addLancamento(entry),
  },
  {
    name: "update customer",
    fail: (e: Error) => vi.mocked(updateCustomerRemote).mockRejectedValue(e),
    run: (c: DataContextValue) =>
      c.updateCliente(client.id, { nome: "Não salvo" }),
  },
  {
    name: "update quotation",
    fail: (e: Error) => vi.mocked(updateQuotationRemote).mockRejectedValue(e),
    run: (c: DataContextValue) =>
      c.updateCotacao(quote.id, { titulo: "Não salvo" }),
  },
  {
    name: "update financial entry",
    fail: (e: Error) =>
      vi.mocked(updateFinancialEntryRemote).mockRejectedValue(e),
    run: (c: DataContextValue) =>
      c.updateLancamento(entry.id, { descricao: "Não salvo" }),
  },
  {
    name: "delete customer",
    fail: (e: Error) => vi.mocked(softDeleteCustomer).mockRejectedValue(e),
    run: (c: DataContextValue) => c.deleteCliente(client.id),
  },
  {
    name: "delete financial entry",
    fail: (e: Error) =>
      vi.mocked(deleteFinancialEntryRemote).mockRejectedValue(e),
    run: (c: DataContextValue) => c.deleteLancamento(entry.id),
  },
];
it.each(failedOperations)(
  "preserves all confirmed data/cache when $name fails",
  async ({ fail, run }) => {
    fail(new Error("Falha do serviço"));
    const h = renderHook(useData, { wrapper });
    await waitFor(() => expect(h.result.current.isReady).toBe(true));
    const before = JSON.stringify({
      clientes: h.result.current.clientes,
      cotacoes: h.result.current.cotacoes,
      lancamentos: h.result.current.lancamentos,
    });
    const stored = localStorage.getItem("agencia-hub-data");
    await act(async () => {
      await expect(run(h.result.current)).rejects.toThrow("Falha do serviço");
    });
    expect(
      JSON.stringify({
        clientes: h.result.current.clientes,
        cotacoes: h.result.current.cotacoes,
        lancamentos: h.result.current.lancamentos,
      }),
    ).toBe(before);
    expect(localStorage.getItem("agencia-hub-data")).toBe(stored);
  },
);
it("waits for server confirmation, uses canonical customer data and can reconcile after remount", async () => {
  let finish!: (v: typeof client) => void;
  vi.mocked(createCustomerRemote).mockReturnValue(
    new Promise((r) => {
      finish = r;
    }),
  );
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  let pending!: Promise<unknown>;
  await act(async () => {
    pending = h.result.current.addCliente({ ...client, nome: "Enviado" });
  });
  expect(h.result.current.clientes).toHaveLength(1);
  const canonical = {
    ...client,
    id: "55555555-5555-4555-8555-555555555555",
    nome: "Confirmado pelo servidor",
  };
  await act(async () => {
    finish(canonical);
    await pending;
  });
  expect(h.result.current.clientes[0]).toEqual(canonical);
  h.unmount();
  localStorage.clear();
  vi.mocked(listCustomersRemote).mockResolvedValue([canonical]);
  const remount = renderHook(useData, { wrapper });
  await waitFor(() => expect(remount.result.current.isReady).toBe(true));
  expect(remount.result.current.clientes).toEqual([]);
  await act(async () => {
    await remount.result.current.syncClientesFromApi();
  });
  expect(remount.result.current.clientes).toEqual([canonical]);
});
it("waits before quotation creation and edit, accepts server response and persists it across reload", async () => {
  let finish!: (v: typeof quote) => void;
  vi.mocked(createQuotationRemote).mockReturnValue(
    new Promise((r) => {
      finish = r;
    }),
  );
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  let pending!: Promise<unknown>;
  await act(async () => {
    pending = h.result.current.addCotacao(quote);
  });
  expect(h.result.current.cotacoes).toHaveLength(1);
  const saved = {
    ...quote,
    id: "66666666-6666-4666-8666-666666666666",
    titulo: "Criada no serviço",
  };
  await act(async () => {
    finish(saved);
    await pending;
  });
  expect(h.result.current.cotacoes[0]).toEqual(saved);
  let edit!: (v: typeof quote) => void;
  vi.mocked(updateQuotationRemote).mockReturnValue(
    new Promise((r) => {
      edit = r;
    }),
  );
  await act(async () => {
    pending = h.result.current.updateCotacao(saved.id, { titulo: "Rascunho" });
  });
  expect(h.result.current.cotacoes[0].titulo).toBe("Criada no serviço");
  await act(async () => {
    edit({ ...saved, titulo: "Resposta canônica" });
    await pending;
  });
  expect(h.result.current.cotacoes[0].titulo).toBe("Resposta canônica");
  h.unmount();
  const reload = renderHook(useData, { wrapper });
  await waitFor(() => expect(reload.result.current.isReady).toBe(true));
  expect(reload.result.current.cotacoes[0].titulo).toBe("Resposta canônica");
});
it("uses confirmed financial creates/updates and removes records only after successful delete", async () => {
  vi.mocked(createFinancialEntryRemote).mockResolvedValue({
    ...entry,
    id: "77777777-7777-4777-8777-777777777777",
    descricao: "Recebido",
  });
  vi.mocked(updateFinancialEntryRemote).mockResolvedValue({
    ...entry,
    descricao: "Servidor",
  });
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  await act(async () => {
    await h.result.current.addLancamento(entry);
    await h.result.current.updateLancamento(entry.id, {
      descricao: "Rascunho",
    });
  });
  expect(
    h.result.current.lancamentos.find((x) => x.id === entry.id)?.descricao,
  ).toBe("Servidor");
  vi.mocked(deleteFinancialEntryRemote).mockResolvedValue(false);
  await act(async () => {
    await expect(h.result.current.deleteLancamento(entry.id)).rejects.toThrow();
  });
  expect(h.result.current.lancamentos).toHaveLength(2);
  vi.mocked(deleteFinancialEntryRemote).mockResolvedValue(true);
  await act(async () => {
    await h.result.current.deleteLancamento(entry.id);
  });
  expect(h.result.current.lancamentos).toHaveLength(1);
  vi.mocked(softDeleteCustomer).mockResolvedValue(undefined);
  await act(async () => {
    await h.result.current.deleteCliente(client.id);
  });
  expect(h.result.current.clientes).toEqual([]);
  expect(h.result.current.cotacoes).toEqual([]);
});
it("rejects null create/update adapter results instead of inserting generated local identifiers", async () => {
  vi.mocked(createCustomerRemote).mockResolvedValue(null);
  vi.mocked(createQuotationRemote).mockResolvedValue(null);
  vi.mocked(createFinancialEntryRemote).mockResolvedValue(null);
  vi.mocked(updateFinancialEntryRemote).mockResolvedValue(null);
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  await act(async () => {
    await expect(h.result.current.addCliente(client)).rejects.toThrow();
    await expect(h.result.current.addCotacao(quote)).rejects.toThrow();
    await expect(h.result.current.addLancamento(entry)).rejects.toThrow();
    await expect(
      h.result.current.updateLancamento(entry.id, { descricao: "Não salvo" }),
    ).rejects.toThrow();
  });
  expect(h.result.current.clientes).toHaveLength(1);
  expect(h.result.current.cotacoes).toHaveLength(1);
  expect(h.result.current.lancamentos).toHaveLength(1);
});
it("rejects unsynchronized identifiers, absent records and no-session mutations/reads", async () => {
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  await act(async () => {
    await expect(h.result.current.deleteCliente("local")).rejects.toThrow(
      /sincronizado/,
    );
    await expect(h.result.current.deleteLancamento("local")).rejects.toThrow(
      /sincronizado/,
    );
    await expect(h.result.current.updateCliente("missing", {})).rejects.toThrow(
      /encontrado/,
    );
    await expect(
      h.result.current.updateLancamento("missing", {}),
    ).rejects.toThrow(/encontrado/);
    await expect(h.result.current.updateCotacao("missing", {})).rejects.toThrow(
      /encontrada/,
    );
    await expect(
      h.result.current.syncCotacoesFromApi({ customerId: "local" }),
    ).rejects.toThrow(/sincronizada/);
    await expect(
      h.result.current.syncCotacoesFromApi({ token: "old-session" }),
    ).rejects.toThrow(/sessão/);
  });
  auth.token = null;
  h.rerender();
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  await act(async () => {
    await expect(h.result.current.addCliente(client)).rejects.toThrow(/sessão/);
    await expect(h.result.current.addCotacao(quote)).rejects.toThrow(/sessão/);
    await expect(h.result.current.addLancamento(entry)).rejects.toThrow(
      /sessão/,
    );
    await expect(h.result.current.deleteLancamento(entry.id)).rejects.toThrow(
      /sessão/,
    );
    await expect(h.result.current.syncClientesFromApi()).rejects.toThrow(
      /sessão/,
    );
    await expect(h.result.current.syncCotacoesFromApi()).rejects.toThrow(
      /sessão/,
    );
    await expect(h.result.current.syncLancamentosFromApi()).rejects.toThrow(
      /sessão/,
    );
  });
});
it("discards legacy or other-agency cache, but token renewal preserves the same mounted scope", async () => {
  cache("legacy");
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  expect(h.result.current.clientes).toEqual([]);
  await act(async () => {
    await h.result.current.syncClientesFromApi();
  });
  auth.token = "renewed-same-user";
  h.rerender();
  expect(h.result.current.clientes).toHaveLength(1);
  auth.user = { id: "user-a", agencyId: "agency-b" };
  h.rerender();
  await waitFor(() => expect(h.result.current.clientes).toEqual([]));
  expect(JSON.parse(localStorage.getItem("agencia-hub-data")!).scope).toBe(
    "user-a:agency-b",
  );
});
it("ignores late reads and rejects late writes after switching session", async () => {
  let read!: (v: (typeof client)[]) => void, write!: (v: typeof client) => void;
  vi.mocked(listCustomersRemote).mockReturnValue(
    new Promise((r) => {
      read = r;
    }),
  );
  vi.mocked(createCustomerRemote).mockReturnValue(
    new Promise((r) => {
      write = r;
    }),
  );
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  let pendingRead!: Promise<unknown>, pendingWrite!: Promise<unknown>;
  await act(async () => {
    pendingRead = h.result.current.syncClientesFromApi();
    pendingWrite = h.result.current.addCliente(client);
  });
  auth.user = { id: "user-b", agencyId: "agency-b" };
  auth.token = "token-b";
  h.rerender();
  await act(async () => {
    read([client]);
    write(client);
    await expect(pendingRead).rejects.toThrow(/sessão mudou/);
    await expect(pendingWrite).rejects.toThrow(/sessão mudou/);
  });
  expect(h.result.current.clientes).toEqual([]);
  expect(JSON.parse(localStorage.getItem("agencia-hub-data")!).scope).toBe(
    "user-b:agency-b",
  );
});
it("reconciles remote lists with the current token and preserves data on failed refresh", async () => {
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  await act(async () => {
    await h.result.current.syncCotacoesFromApi({
      customerId: client.id,
      search: " viagem ",
    });
    await h.result.current.syncLancamentosFromApi();
  });
  expect(listQuotationsRemote).toHaveBeenCalledWith(
    expect.objectContaining({
      token: "token-a",
      customerId: client.id,
      search: "viagem",
    }),
  );
  vi.mocked(listQuotationsRemote).mockRejectedValue(new Error("rede"));
  vi.mocked(listFinancialEntriesRemote).mockRejectedValue(new Error("rede"));
  await act(async () => {
    await expect(h.result.current.syncCotacoesFromApi()).rejects.toThrow(
      "rede",
    );
    await expect(h.result.current.syncLancamentosFromApi()).rejects.toThrow(
      "rede",
    );
  });
  expect(h.result.current.cotacoes[0].id).toBe(quote.id);
  expect(h.result.current.lancamentos[0].id).toBe(entry.id);
});
it("does not turn a cache storage failure into a failed server-confirmed write", async () => {
  vi.mocked(createCustomerRemote).mockResolvedValue({
    ...client,
    nome: "Confirmado",
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  await act(async () => {
    await expect(h.result.current.addCliente(client)).resolves.toMatchObject({
      nome: "Confirmado",
    });
  });
  expect(h.result.current.clientes[0].nome).toBe("Confirmado");
});
it("permits local demo writes only with explicit development opt-in", async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NEXT_PUBLIC_ALLOW_LOCAL_DATA", "true");
  vi.mocked(getHasRemoteApi).mockReturnValue(false);
  localStorage.clear();
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  const size = h.result.current.clientes.length;
  await act(async () => {
    await h.result.current.addCliente(client);
  });
  expect(h.result.current.clientes).toHaveLength(size + 1);
  expect(createCustomerRemote).not.toHaveBeenCalled();
});
it("keeps unsaved form state mounted across token renewal for the same user/agency", async () => {
  const h = renderHook(
    () => {
      const data = useData();
      const [draft, setDraft] = useState("");
      return { data, draft, setDraft };
    },
    { wrapper },
  );
  await waitFor(() => expect(h.result.current.data.isReady).toBe(true));
  act(() => h.result.current.setDraft("Não perder este formulário"));
  auth.token = "token-renewed";
  h.rerender();
  expect(h.result.current.draft).toBe("Não perder este formulário");
  expect(h.result.current.data.clientes).toHaveLength(1);
});
it("rejects retained callbacks from an ended session before sending a new request", async () => {
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  const stale = h.result.current.addCliente;
  auth.user = null;
  auth.token = null;
  h.rerender();
  await expect(stale(client)).rejects.toThrow(/sessão mudou/);
  expect(createCustomerRemote).not.toHaveBeenCalled();
});
it("confirms flight plan totals with the service and rejects invalid/null saves without overwriting", async () => {
  const draft = importedDraft(
    {
      airline: "",
      miles: 0,
      cashAmount: 500,
      passengers: 1,
      priceBasis: "PER_PERSON",
      warnings: [],
      segments: [
        {
          origin: "CWB",
          destination: "SSA",
          departureDate: "2026-12-01",
          arrivalDate: "2026-12-01",
          departureTime: "12:00",
          arrivalTime: "14:00",
          durationMinutes: 120,
          stops: 0,
        },
      ],
    },
    "fixture-source",
  );
  draft.calculo.revisado = true;
  const plan = buildFlightPlan([draft], draft.id);
  const saved = {
    ...quote,
    flightPlan: plan,
    valorTotal: plan.options[0].precoTotal,
    opcoesVoo: commercialFlights(plan),
  };
  vi.mocked(updateQuotationRemote)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(saved);
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  await act(async () => {
    await expect(
      h.result.current.saveCotacaoFlightPlan("missing", plan),
    ).rejects.toThrow(/encontrada/);
    await expect(
      h.result.current.saveCotacaoFlightPlan(quote.id, {
        ...plan,
        selectedOptionId: "missing",
      }),
    ).rejects.toThrow(/principal/);
    await expect(
      h.result.current.saveCotacaoFlightPlan(quote.id, plan),
    ).rejects.toThrow(/configurada/);
  });
  expect(h.result.current.cotacoes[0].titulo).toBe("Original");
  await act(async () => {
    await expect(
      h.result.current.saveCotacaoFlightPlan(quote.id, plan),
    ).resolves.toEqual(saved);
  });
  expect(h.result.current.cotacoes[0].valorTotal).toBe(saved.valorTotal);
  expect(updateQuotationRemote).toHaveBeenLastCalledWith(
    expect.objectContaining({ id: quote.id }),
    expect.objectContaining({ flightPlan: plan, valorTotal: saved.valorTotal }),
    "token-a",
  );
});
it("keeps demo-only changes explicitly local while remote reset never reloads seed customers", async () => {
  const remote = renderHook(useData, { wrapper });
  await waitFor(() => expect(remote.result.current.isReady).toBe(true));
  act(() => remote.result.current.resetDemoData());
  expect(remote.result.current.clientes).toEqual([]);
  remote.unmount();
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NEXT_PUBLIC_ALLOW_LOCAL_DATA", "true");
  vi.mocked(getHasRemoteApi).mockReturnValue(false);
  localStorage.clear();
  const local = renderHook(useData, { wrapper });
  await waitFor(() => expect(local.result.current.isReady).toBe(true));
  await act(async () => {
    await local.result.current.updateCliente(seedClientes[0].id, {
      nome: "Demo alterado",
    });
    await local.result.current.updateCotacao(seedCotacoes[0].id, {
      titulo: "Demo alterado",
    });
    await local.result.current.updateLancamento(seedLancamentos[0].id, {
      descricao: "Demo alterado",
    });
    await local.result.current.addCotacao(quote);
    await local.result.current.addLancamento(entry);
    await local.result.current.syncClientesFromApi();
    await local.result.current.syncCotacoesFromApi();
    await local.result.current.syncLancamentosFromApi();
  });
  expect(local.result.current.clientes[0].nome).toBe("Demo alterado");
  act(() => local.result.current.resetDemoData());
  expect(local.result.current.clientes[0].nome).toBe(seedClientes[0].nome);
  expect(updateCustomerRemote).not.toHaveBeenCalled();
  expect(updateFinancialEntryRemote).not.toHaveBeenCalled();
});
it("does not seed an invalid remote cache and detects duplicates without blocking edits of the same person", async () => {
  localStorage.setItem("agencia-hub-data", "malformed");
  const h = renderHook(useData, { wrapper });
  await waitFor(() => expect(h.result.current.isReady).toBe(true));
  expect(h.result.current.clientes).toEqual([]);
  await act(async () => {
    await h.result.current.syncClientesFromApi();
  });
  expect(
    h.result.current.checkDuplicate(
      client.email.toUpperCase(),
      client.telefone,
    ),
  ).toMatchObject({ hasDuplicate: true });
  expect(
    h.result.current.checkDuplicate(client.email, client.telefone, client.id)
      .hasDuplicate,
  ).toBe(false);
  expect(h.result.current.checkDuplicate("", "123").hasDuplicate).toBe(false);
  expect(filterClientes([client], "persist", "ativo")).toEqual([client]);
  expect(filterClientes([client], "", "todos")).toEqual([client]);
  expect(filterClientes([client], "ausente", "todos")).toEqual([]);
});
it("dashboard totals exclude cancelled financial entries and distinguish cash received from future income", () => {
  const rows = [
    {
      ...entry,
      tipo: "entrada" as const,
      status: "confirmado" as const,
      valor: 100,
    },
    {
      ...entry,
      tipo: "entrada" as const,
      status: "previsto" as const,
      valor: 50,
    },
    {
      ...entry,
      tipo: "entrada" as const,
      status: "cancelado" as const,
      valor: 999,
    },
    {
      ...entry,
      tipo: "saida" as const,
      status: "confirmado" as const,
      valor: 30,
    },
    {
      ...entry,
      tipo: "saida" as const,
      status: "previsto" as const,
      valor: 80,
    },
  ];
  expect(computeFinanceiroResumo(rows)).toEqual({
    faturamento: 150,
    totalRecebido: 100,
    aReceber: 50,
    totalDespesas: 30,
    saldo: 70,
  });
  const open = { ...quote, status: "aguardando" as const },
    closed = { ...quote, status: "aprovado" as const };
  expect(cotacoesEmAndamento([open, closed])).toEqual([open]);
});
