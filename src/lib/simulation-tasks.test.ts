import { beforeEach, expect, it, vi } from "vitest";
import { simulationTasksApi, type GenerationInput } from "./simulation-tasks";
import { apiFetch } from "@/lib/api/authenticated-fetch";
vi.mock("@/lib/api/authenticated-fetch", () => ({ apiFetch: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it("consulta a origem selecionada e envia versão, pessoa e tarefas na confirmação", async () => {
  await simulationTasksApi.list("session"); expect(apiFetch).toHaveBeenLastCalledWith("/accumulation-simulations/task-generations", {}, "session");
  await simulationTasksApi.get("session", "s1"); expect(apiFetch).toHaveBeenLastCalledWith("/accumulation-simulations/s1/task-generation", {}, "session");
  const input: GenerationInput = { expectedVersion: 2, customerId: "p1", responsibleId: "u1", steps: [{ title: "Revisar", notes: "", dueOn: "2026-11-01" }] };
  await simulationTasksApi.generate("session", "s1", input); expect(apiFetch).toHaveBeenLastCalledWith("/accumulation-simulations/s1/task-generation", { method: "POST", body: JSON.stringify(input) }, "session");
});
