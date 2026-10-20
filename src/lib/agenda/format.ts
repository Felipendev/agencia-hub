import type { Appointment, Format, Product, Status } from "./types";

export const PRODUCT_LABEL: Record<Product, string> = { TRAVEL: "Viagens", MILES: "Milhas" };
export const FORMAT_LABEL: Record<Format, string> = { IN_PERSON: "Presencial", VIDEO: "Videochamada", PHONE: "Telefone", OTHER: "Outro" };
export const STATUS_LABEL: Record<Status, string> = { SCHEDULED: "Agendado", COMPLETED: "Realizado", NO_SHOW: "Não compareceu", CANCELLED: "Cancelado" };
export const STATUS_TONE: Record<Status, "default" | "success" | "warning" | "muted" | "danger"> = {
  SCHEDULED: "default", COMPLETED: "success", NO_SHOW: "warning", CANCELLED: "muted",
};
export const isProduct = (v: string | null | undefined): v is Product => v === "TRAVEL" || v === "MILES";

const ACTION: Record<string, string> = {
  CREATED: "Compromisso criado",
  UPDATED: "Compromisso editado",
  RESCHEDULED: "Compromisso reagendado",
  DELETED: "Compromisso excluído",
  STATUS_COMPLETED: "Marcado como realizado",
  STATUS_NO_SHOW: "Marcado como não compareceu",
  STATUS_CANCELLED: "Compromisso cancelado",
  REOPENED: "Compromisso reaberto",
  MINUTES_CREATED: "Ata registrada",
  MINUTES_UPDATED: "Ata corrigida (nova versão)",
};
export const actionLabel = (a: string) => ACTION[a] ?? a;

export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h ? `${h}h${m ? `${String(m).padStart(2, "0")}` : ""}` : `${m} min`;
}

/** Já começou: só então pode ser marcado como realizado ou não compareceu. */
export const hasStarted = (a: Appointment, now = new Date()) => new Date(a.startsAt).getTime() <= now.getTime();
