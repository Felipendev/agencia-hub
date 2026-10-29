// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  historyApi,
  historyOrigin,
  historyQuery,
  modulesFor,
  type HistoryEvent,
  type HistoryFilters,
} from "./activity-history";
vi.mock("@/lib/api/agencia-hub-env", () => ({
  getAgenciaHubApiBaseUrl: () => "https://api.test/api/v1",
}));
const filters: HistoryFilters = {
  product: "MILES",
  customerId: "person",
  from: "2026-10-01",
  to: "2026-10-28",
  modules: ["WALLET", "TASKS"],
};
afterEach(() => vi.unstubAllGlobals());
it("encodes repeated modules, person, product and page without mixing domains", () => {
  const q = new URLSearchParams(historyQuery(filters, 2));
  expect(q.getAll("modules")).toEqual(["WALLET", "TASKS"]);
  expect(q.get("page")).toBe("2");
  expect(q.get("customerId")).toBe("person");
  expect(
    new URLSearchParams(historyQuery({ ...filters, customerId: "" })).has(
      "customerId",
    ),
  ).toBe(false);
  expect(modulesFor("TRAVEL")).not.toContain("WALLET");
  expect(modulesFor("MILES")).not.toContain("SAVINGS");
  for (const product of ["TRAVEL", "MILES"] as const)
    for (const source of modulesFor(product)) {
      expect(
        historyOrigin(
          { module: source, resourceId: "id", customerId: null } as HistoryEvent,
          product,
        ),
      ).toMatch(/^\//);
    }
});
it("exports bearer-authenticated CSV only after OK, keeps server error and dispatches unauthorized", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response("csv", { status: 200 }))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Limite excedido" }), {
        status: 422,
      }),
    )
    .mockResolvedValueOnce(new Response("expired", { status: 401 }))
    .mockRejectedValueOnce(new Error("offline"));
  vi.stubGlobal("fetch", fetcher);
  expect(await (await historyApi.export("jwt", filters)).text()).toBe("csv");
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBe("Bearer jwt");
  await expect(historyApi.export("jwt", filters)).rejects.toThrow(
    "Limite excedido",
  );
  const listener = vi.fn();
  window.addEventListener("auth:unauthorized", listener);
  await expect(historyApi.export("jwt", filters)).rejects.toThrow(
    "Não foi possível",
  );
  expect(listener).toHaveBeenCalled();
  window.removeEventListener("auth:unauthorized", listener);
  await expect(historyApi.export("jwt", filters)).rejects.toThrow("offline");
});
