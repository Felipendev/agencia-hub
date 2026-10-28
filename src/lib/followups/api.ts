import { apiFetch } from "@/lib/api/authenticated-fetch";
import type { Product, Member } from "@/lib/work/types";
export type { Product, Member };
export type State = "OPEN" | "DONE" | "CANCELLED";
export type Bucket = "ALL" | "OVERDUE" | "TODAY" | "UPCOMING";
export type Followup = { id: string; product: Product; customerId: string; customerName: string; title: string; notes: string; dueOn: string; responsibleId: string; responsibleName: string; state: State; stateReason: string; version: number; deleted: boolean };
export type Input = Pick<Followup, "product" | "customerId" | "title" | "notes" | "dueOn" | "responsibleId"> & { expectedVersion: number };
export type Board = { today: string; counts: { overdue: number; today: number; upcoming: number }; items: Followup[] };
export type Event = { id: string; action: string; snapshot: { before: Followup | null; after: Followup }; authorId: string; authorName: string | null; createdAt: string };
export type Filters = { product: Product; customerId?: string; responsibleId?: string; state?: State; bucket: Bucket; deleted?: boolean };
const write = (method: string, body?: unknown): RequestInit => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
export const followupApi = {
  list: (token: string, filters: Filters) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, String(value)); });
    return apiFetch<Board>(`/follow-ups?${query}`, {}, token);
  },
  save: (token: string, input: Input, id?: string, key?: string) => apiFetch<Followup>(id ? `/follow-ups/${id}` : "/follow-ups", {
    ...write(id ? "PATCH" : "POST", input), ...(!id ? { headers: { "Idempotency-Key": key! } } : {}),
  }, token),
  state: (token: string, row: Followup, state: State, reason: string) => apiFetch<Followup>(`/follow-ups/${row.id}/state`, write("POST", { state, reason, expectedVersion: row.version }), token),
  remove: (token: string, row: Followup) => apiFetch<void>(`/follow-ups/${row.id}?expectedVersion=${row.version}`, write("DELETE"), token),
  history: (token: string, id: string) => apiFetch<Event[]>(`/follow-ups/${id}/history`, {}, token),
};
export const STATE_LABEL: Record<State, string> = { OPEN: "Aberta", DONE: "Concluída", CANCELLED: "Cancelada" };
export const dateLabel = (date: string) => date.split("-").reverse().join("/");
