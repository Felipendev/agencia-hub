export type Product = "TRAVEL" | "MILES";
export type TaskState = "OPEN" | "DONE" | "CANCELLED";
export type Frequency = "ONCE" | "WEEKLY" | "MONTHLY";
export type Member = { id: string; name: string };
export type Step = { title: string; dueOffsetDays: number };
export type Template = {
  id: string;
  product: Product;
  name: string;
  frequency: Frequency;
  steps: Step[];
  version: number;
  deleted: boolean;
};
export type Task = {
  id: string;
  product: Product;
  customerId: string;
  customerName: string;
  title: string;
  notes: string;
  dueOn: string;
  responsibleId: string | null;
  responsibleName: string | null;
  tripId: string | null;
  quotationId: string | null;
  runId: string | null;
  state: TaskState;
  version: number;
  stateBy: string | null;
  stateAt: string | null;
  stateReason: string;
  deleted: boolean;
};
export type TaskInput = Pick<
  Task,
  | "product"
  | "customerId"
  | "title"
  | "notes"
  | "dueOn"
  | "responsibleId"
  | "tripId"
  | "quotationId"
> & { expectedVersion: number };
export type TemplateInput = Pick<
  Template,
  "product" | "name" | "frequency" | "steps"
> & { expectedVersion: number };
export type Run = {
  id: string;
  product: Product;
  customerId: string;
  customerName: string;
  templateId: string;
  title: string;
  notes: string;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  snapshot: Template;
  version: number;
  cancelledAt: string | null;
  cancelReason: string;
};
export type WorkEvent = {
  id: string;
  action: string;
  snapshot: unknown;
  authorId: string;
  createdAt: string;
};
export type References = { trips: Member[]; quotations: Member[] };
export const STATE_LABELS: Record<TaskState, string> = {
  OPEN: "Aberta",
  DONE: "Concluída",
  CANCELLED: "Cancelada",
};
export const FREQUENCY_LABELS: Record<Frequency, string> = {
  ONCE: "Checklist inicial",
  WEEKLY: "Rotina semanal",
  MONTHLY: "Rotina mensal",
};
export function todayLocal(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function formatDate(value: string): string {
  return value.split("-").reverse().join("/");
}
