import { beforeEach, expect, it, vi } from "vitest";
import { followupApi, type Followup, type Input } from "./api";
import { apiFetch } from "@/lib/api/authenticated-fetch";

vi.mock("@/lib/api/authenticated-fetch", () => ({ apiFetch: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
const input: Input = { product: "MILES", customerId: "p1", title: "Retornar", notes: "", dueOn: "2026-11-01", responsibleId: "u1", expectedVersion: 4 };
const row = { id: "f1", version: 4 } as Followup;

it("envia filtros de produto e histórico sem serializar valores ausentes", async () => {
  await followupApi.list("session", { product: "MILES", bucket: "ALL", customerId: "p1", deleted: true });
  expect(apiFetch).toHaveBeenLastCalledWith("/follow-ups?product=MILES&bucket=ALL&customerId=p1&deleted=true", {}, "session");
  await followupApi.list("session", { product: "TRAVEL", bucket: "TODAY", customerId: undefined, deleted: false });
  expect(apiFetch).toHaveBeenLastCalledWith("/follow-ups?product=TRAVEL&bucket=TODAY", {}, "session");
});
it("criação usa chave e edição preserva ID e versão sem criar outra ação", async () => {
  await followupApi.save("session", input, undefined, "confirmation");
  expect(apiFetch).toHaveBeenLastCalledWith("/follow-ups", { method: "POST", body: JSON.stringify(input), headers: { "Idempotency-Key": "confirmation" } }, "session");
  await followupApi.save("session", input, "f1");
  expect(apiFetch).toHaveBeenLastCalledWith("/follow-ups/f1", { method: "PATCH", body: JSON.stringify(input) }, "session");
});
it("transição e exclusão enviam versão e histórico usa recurso selecionado", async () => {
  await followupApi.state("session", row, "CANCELLED", "Pausa");
  expect(apiFetch).toHaveBeenLastCalledWith("/follow-ups/f1/state", { method: "POST", body: JSON.stringify({ state: "CANCELLED", reason: "Pausa", expectedVersion: 4 }) }, "session");
  await followupApi.remove("session", row);
  expect(apiFetch).toHaveBeenLastCalledWith("/follow-ups/f1?expectedVersion=4", { method: "DELETE" }, "session");
  await followupApi.history("session", "f1");
  expect(apiFetch).toHaveBeenLastCalledWith("/follow-ups/f1/history", {}, "session");
});
