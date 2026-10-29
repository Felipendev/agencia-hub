// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { seedClientes, seedCotacoes, seedLancamentos } from "@/data/seed";
import { createCustomerRemote } from "./create-customer-remote";
import { updateCustomerRemote } from "./update-customer-remote";
import { createQuotationRemote } from "./create-quotation-remote";
import { updateQuotationRemote } from "./update-quotation-remote";
import { createFinancialEntryRemote } from "./create-financial-entry-remote";
import { updateFinancialEntryRemote } from "./update-financial-entry-remote";
import { deleteFinancialEntryRemote } from "./delete-financial-entry-remote";
import { softDeleteCustomer, softDeleteQuotation } from "./soft-delete-remote";
const env = vi.hoisted(() => ({
  base: "https://api.test/api/v1" as string | null,
}));
vi.mock("./agencia-hub-env", () => ({
  getAgenciaHubApiBaseUrl: () => env.base,
}));
const id = "11111111-1111-4111-8111-111111111111",
  personId = "22222222-2222-4222-8222-222222222222";
const client = { ...seedClientes[0], id: personId },
  quote = { ...seedCotacoes[0], id, clienteId: personId },
  entry = { ...seedLancamentos[0], id };
const customer = {
  id,
  name: "Servidor",
  email: "fixture@test.local",
  phone: "+351912345678",
  status: "ACTIVE",
  createdAt: "2026-10-20T12:00:00Z",
};
const quotation = {
  id,
  customerId: personId,
  title: "Servidor",
  destination: "Lisboa",
  totalAmount: 1200,
  currency: "BRL",
  status: "DRAFT",
  validUntil: "2026-10-30",
  createdAt: "2026-10-20T12:00:00Z",
  updatedAt: "2026-10-20T12:00:00Z",
};
const financial = {
  id,
  description: "Servidor",
  amount: 1200,
  type: "INCOME",
  category: "OTHER",
  entryDate: "2026-10-20",
  status: "PENDING",
};
const cases = [
  {
    name: "create customer",
    call: () => createCustomerRemote(client, "jwt"),
    reply: customer,
    expected: { id, nome: "Servidor" },
    method: "POST",
    path: "/customers",
  },
  {
    name: "update customer",
    call: () => updateCustomerRemote(client, { nome: "Rascunho" }, "jwt"),
    reply: { ...customer, id: personId },
    expected: { id: personId, nome: "Servidor" },
    method: "PATCH",
    path: "/customers/" + personId,
  },
  {
    name: "create quotation",
    call: () => createQuotationRemote(quote, "jwt"),
    reply: quotation,
    expected: { id, titulo: "Servidor", valorTotal: 1200 },
    method: "POST",
    path: "/quotations",
  },
  {
    name: "update quotation",
    call: () => updateQuotationRemote(quote, { titulo: "Rascunho" }, "jwt"),
    reply: quotation,
    expected: { id, titulo: "Servidor", valorTotal: 1200 },
    method: "PATCH",
    path: "/quotations/" + id,
  },
  {
    name: "create financial entry",
    call: () => createFinancialEntryRemote(entry, "jwt"),
    reply: financial,
    expected: { id, descricao: "Servidor", valor: 1200 },
    method: "POST",
    path: "/financial-entries",
  },
  {
    name: "update financial entry",
    call: () =>
      updateFinancialEntryRemote(entry, { descricao: "Rascunho" }, "jwt"),
    reply: financial,
    expected: { id, descricao: "Servidor", valor: 1200 },
    method: "PATCH",
    path: "/financial-entries/" + id,
  },
];
beforeEach(() => {
  env.base = "https://api.test/api/v1";
});
afterEach(() => vi.unstubAllGlobals());
it.each(cases)(
  "maps the real HTTP contract for $name and uses server identity/values",
  async (c) => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(c.reply), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetcher);
    await expect(c.call()).resolves.toMatchObject(c.expected);
    expect(fetcher).toHaveBeenCalledWith(
      env.base + c.path,
      expect.objectContaining({
        method: c.method,
        headers: expect.objectContaining({ Authorization: "Bearer jwt" }),
      }),
    );
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.id).toBeUndefined();
    expect(body.title ?? body.name ?? body.description).toBeTruthy();
  },
);
it.each(
  cases.flatMap((c) =>
    [400, 401, 403, 409, 500].map((status) => ({ ...c, status })),
  ),
)("does not disguise HTTP $status as saved on $name", async (c) => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ message: "Falha do serviço " + c.status }),
          { status: c.status },
        ),
      ),
  );
  await expect(c.call()).rejects.toThrow("Falha do serviço " + c.status);
});
it.each(cases)(
  "rejects transport failures and malformed success on $name",
  async (c) => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(c.call()).rejects.toThrow("offline");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    );
    await expect(c.call()).rejects.toThrow(/inválida/);
  },
);
it("returns no local fallback when backend URL is absent", async () => {
  env.base = null;
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(createCustomerRemote(client, "jwt")).resolves.toBeNull();
  await expect(createQuotationRemote(quote, "jwt")).resolves.toBeNull();
  await expect(createFinancialEntryRemote(entry, "jwt")).resolves.toBeNull();
  await expect(deleteFinancialEntryRemote(id, "jwt")).resolves.toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
});
it("only considers deletes complete after the service response and preserves denials", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetcher);
  await softDeleteCustomer(personId, "jwt");
  await softDeleteQuotation(id, "jwt");
  await expect(deleteFinancialEntryRemote(id, "jwt")).resolves.toBe(true);
  for (const action of [
    () => softDeleteCustomer(personId, "jwt"),
    () => softDeleteQuotation(id, "jwt"),
    () => deleteFinancialEntryRemote(id, "jwt"),
  ]) {
    fetcher.mockResolvedValue(
      new Response(JSON.stringify({ message: "Acesso negado" }), {
        status: 403,
      }),
    );
    await expect(action()).rejects.toThrow("Acesso negado");
  }
});
it("rejects a customer response for another ID and does not locally apply unsupported fields", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(customer), { status: 200 }));
  vi.stubGlobal("fetch", fetcher);
  await expect(
    updateCustomerRemote(client, { nome: "Rascunho" }, "jwt"),
  ).rejects.toThrow(/inválida/);
  fetcher.mockClear();
  await expect(
    updateCustomerRemote(client, { id: "outro-id" }, "jwt"),
  ).resolves.toEqual(client);
  expect(fetcher).not.toHaveBeenCalled();
});
