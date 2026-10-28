import { apiFetch } from "@/lib/api/authenticated-fetch";
import type { SavedSimulation } from "./accumulation-simulation";
import type { Task } from "./work/types";
export type Source = Pick<SavedSimulation, "id" | "customerId" | "customerName" | "version" | "assumptions" | "result">;
export type Step = { title: string; notes: string; dueOn: string };
export type GenerationInput = { expectedVersion: number; customerId: string; responsibleId: string; steps: Step[] };
export type Generation = { id: string; snapshot: Source; requested: GenerationInput; authorId: string; authorName: string | null; createdAt: string; tasks: Task[] };
export type PlanContext = { today: string; simulation: Source | null; generation: Generation | null };
export type GenerationSummary = { sourceId: string; customerId: string; customerName: string; title: string; version: number; createdAt: string; planDeleted: boolean };
const path = (id: string) => `/accumulation-simulations/${id}/task-generation`;
export const simulationTasksApi = {
  list: (token: string) => apiFetch<GenerationSummary[]>("/accumulation-simulations/task-generations", {}, token),
  get: (token: string, id: string) => apiFetch<PlanContext>(path(id), {}, token),
  generate: (token: string, id: string, input: GenerationInput) => apiFetch<Generation>(path(id), { method: "POST", body: JSON.stringify(input) }, token),
};
