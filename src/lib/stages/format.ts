import { fromIso, toZonedIso } from "@/lib/agenda/time";
import type { Stage, StageEvent, StageInput, StageKind, StageStatus } from "./types";

export const KIND_LABEL: Record<StageKind, string> = { HOTEL: "Hotel", TRANSFER: "Transfer", ACTIVITY: "Atividade", OTHER: "Outro" };
export const STATUS_LABEL: Record<StageStatus, string> = { PLANNED: "Prevista", CONFIRMED: "Confirmada", CANCELLED: "Cancelada" };
export const STATUS_TONE: Record<StageStatus, "muted" | "success" | "danger"> = { PLANNED: "muted", CONFIRMED: "success", CANCELLED: "danger" };

const ACTIONS: Record<string, string> = {
  CREATED: "Etapa criada", UPDATED: "Etapa editada", RESCHEDULED: "Data ou horário alterado", DELETED: "Etapa excluída",
  STATUS_CONFIRMED: "Confirmada", STATUS_PLANNED: "Voltou a prevista", STATUS_CANCELLED: "Cancelada",
  ATTACHMENT_LINKED: "Anexo vinculado", ATTACHMENT_UNLINKED: "Anexo desvinculado", LIBRARY_LINKED: "Material da Biblioteca vinculado", LIBRARY_UNLINKED: "Material da Biblioteca desvinculado",
};
export const actionLabel = (action: string) => ACTIONS[action] ?? action;

export const startLabel = (kind: StageKind) => (kind === "HOTEL" ? "Check-in" : "Início");
export const endLabel = (kind: StageKind) => (kind === "HOTEL" ? "Check-out" : "Fim");

export type StageForm = {
  kind: StageKind; title: string; startDate: string; startTime: string; endDate: string; endTime: string; timeZone: string;
  provider: string; confirmationCode: string; location: string; origin: string; destination: string; people: string; notes: string;
};

export function emptyForm(timeZone: string, date = ""): StageForm {
  return { kind: "HOTEL", title: "", startDate: date, startTime: "14:00", endDate: "", endTime: "12:00", timeZone, provider: "", confirmationCode: "", location: "", origin: "", destination: "", people: "", notes: "" };
}

export function formFromStage(s: Stage): StageForm {
  const start = fromIso(s.startsAt, s.timeZone);
  const end = s.endsAt ? fromIso(s.endsAt, s.timeZone) : { date: "", time: "" };
  return {
    kind: s.kind, title: s.title, startDate: start.date, startTime: start.time, endDate: end.date, endTime: end.time, timeZone: s.timeZone,
    provider: s.provider ?? "", confirmationCode: s.confirmationCode ?? "", location: s.location ?? "", origin: s.origin ?? "",
    destination: s.destination ?? "", people: s.people == null ? "" : String(s.people), notes: s.notes ?? "",
  };
}

const text = (v: string) => (v.trim() ? v.trim() : null);

/** Valida no navegador o que dá para validar; a API continua sendo a fonte das regras. */
export function toInput(f: StageForm, expectedVersion?: number): StageInput {
  if (!f.title.trim()) throw new Error("O título é obrigatório.");
  if (!f.startDate || !f.startTime) throw new Error(f.kind === "HOTEL" ? "Informe a data e o horário de check-in." : "Informe a data e o horário de início.");
  if (f.endDate && !f.endTime) throw new Error(`Informe data e horário de ${endLabel(f.kind).toLowerCase()}, ou deixe a data em branco.`);
  const startsAt = toZonedIso(f.startDate, f.startTime, f.timeZone);
  const endsAt = f.endDate ? toZonedIso(f.endDate, f.endTime, f.timeZone) : null;
  if (endsAt && new Date(endsAt) < new Date(startsAt)) throw new Error(f.kind === "HOTEL" ? "O check-out não pode ser anterior ao check-in." : "O fim não pode ser anterior ao início.");
  let people: number | null = null;
  if (f.people.trim()) {
    people = Number(f.people);
    if (!Number.isInteger(people) || people < 1 || people > 99) throw new Error("Informe de 1 a 99 pessoas.");
  }
  const transfer = f.kind === "TRANSFER";
  return {
    kind: f.kind, title: f.title.trim(), startsAt, endsAt, timeZone: f.timeZone, provider: text(f.provider), confirmationCode: text(f.confirmationCode),
    location: text(f.location), origin: transfer ? text(f.origin) : null, destination: transfer ? text(f.destination) : null, people, notes: text(f.notes),
    ...(expectedVersion === undefined ? {} : { expectedVersion }),
  };
}

/** Agrupa por dia de início no fuso da própria etapa, mantendo a ordem cronológica da API. */
export function groupByDay(stages: Stage[]): { date: string; stages: Stage[] }[] {
  const groups: { date: string; stages: Stage[] }[] = [];
  for (const s of stages) {
    const date = fromIso(s.startsAt, s.timeZone).date;
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.stages.push(s);
    else groups.push({ date, stages: [s] });
  }
  return groups;
}

export function dayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export const brDate = (date: string | null) => (date ? date.split("-").reverse().join("/") : "");

export function eventNote(e: StageEvent): string {
  const d = e.detail ?? {};
  if (typeof d.reason === "string" && d.reason) return d.reason;
  if (typeof d.title === "string" && (e.action === "DELETED" || e.action === "CREATED")) return d.title;
  return "";
}
