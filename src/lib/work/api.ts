import { apiFetch } from "@/lib/api/authenticated-fetch";
import type {
  Product,
  TaskState,
  Task,
  Template,
  TaskInput,
  TemplateInput,
  Run,
  Member,
  WorkEvent,
  References,
} from "./types";

export type Filters = {
  product: Product;
  customerId?: string;
  responsibleId?: string;
  state?: TaskState;
  dueBefore?: string;
  runId?: string;
  simulationId?: string;
};
function query(filters: object) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value) params.set(key, String(value));
  return `?${params.toString()}`;
}
const write = (method: string, value?: unknown): RequestInit => ({
  method,
  ...(value === undefined ? {} : { body: JSON.stringify(value) }),
});
export const workApi = {
  tasks: (token: string, filters: Filters) =>
    apiFetch<Task[]>(`/work/tasks${query(filters)}`, {}, token),
  getTask: (token: string, id: string) =>
    apiFetch<Task>(`/work/tasks/${id}`, {}, token),
  saveTask: (token: string, value: TaskInput, id?: string, key?: string) =>
    apiFetch<Task>(
      id ? `/work/tasks/${id}` : "/work/tasks",
      {
        ...write(id ? "PATCH" : "POST", value),
        ...(!id
          ? { headers: { "Idempotency-Key": key ?? crypto.randomUUID() } }
          : {}),
      },
      token,
    ),
  deleteTask: (token: string, task: Task) =>
    apiFetch<void>(
      `/work/tasks/${task.id}?expectedVersion=${task.version}`,
      write("DELETE"),
      token,
    ),
  state: (token: string, task: Task, state: TaskState, reason = "") =>
    apiFetch<Task>(
      `/work/tasks/${task.id}/state`,
      write("POST", { state, reason, expectedVersion: task.version }),
      token,
    ),
  templates: (token: string, product: Product) =>
    apiFetch<Template[]>(`/work/templates${query({ product })}`, {}, token),
  saveTemplate: (token: string, value: TemplateInput, id?: string) =>
    apiFetch<Template>(
      id ? `/work/templates/${id}` : "/work/templates",
      write(id ? "PATCH" : "POST", value),
      token,
    ),
  deleteTemplate: (token: string, model: Template) =>
    apiFetch<void>(
      `/work/templates/${model.id}?expectedVersion=${model.version}`,
      write("DELETE"),
      token,
    ),
  apply: (
    token: string,
    id: string,
    customerId: string,
    date: string,
    responsibleId: string | null,
  ) =>
    apiFetch<Run>(
      `/work/templates/${id}/apply`,
      write("POST", { customerId, date, responsibleId }),
      token,
    ),
  runs: (token: string, product: Product, customerId?: string) =>
    apiFetch<Run[]>(`/work/runs${query({ product, customerId })}`, {}, token),
  saveRun: (token: string, run: Run, title: string, notes: string) =>
    apiFetch<Run>(
      `/work/runs/${run.id}`,
      write("PATCH", { title, notes, expectedVersion: run.version }),
      token,
    ),
  cancelRun: (token: string, run: Run, reason: string) =>
    apiFetch<Run>(
      `/work/runs/${run.id}/cancel`,
      write("POST", { reason, expectedVersion: run.version }),
      token,
    ),
  members: (token: string) => apiFetch<Member[]>("/work/members", {}, token),
  references: (token: string, customerId: string) =>
    apiFetch<References>(`/work/references${query({ customerId })}`, {}, token),
  history: (token: string, type: "TASK" | "RUN" | "TEMPLATE", id: string) =>
    apiFetch<WorkEvent[]>(`/work/history/${type}/${id}`, {}, token),
};
