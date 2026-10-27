import type { Channel, Product, ReferralInput, Status } from "./types";

export const PRODUCT_LABEL: Record<Product, string> = { TRAVEL: "Viagens", MILES: "Milhas" };
export const CHANNEL_LABEL: Record<Channel, string> = { CONVERSATION: "Conversa", WHATSAPP: "WhatsApp", SOCIAL_MEDIA: "Rede social", EVENT: "Evento", OTHER: "Outro" };
export const STATUS_LABEL: Record<Status, string> = {
  RECEIVED: "Recebida", CONTACTED: "Em contato", CONVERTED: "Convertida", NOT_CONVERTED: "Não convertida", CANCELLED: "Cancelada",
};
export const STATUS_TONE: Record<Status, "default" | "warning" | "success" | "muted" | "danger"> = {
  RECEIVED: "default", CONTACTED: "warning", CONVERTED: "success", NOT_CONVERTED: "muted", CANCELLED: "danger",
};

const ACTIONS: Record<string, string> = {
  CREATED: "Indicação registrada", UPDATED: "Indicação editada", DELETED: "Indicação excluída", REFERRED_LINKED: "Indicado vinculado ao cadastro",
  STATUS_CONTACTED: "Em contato", STATUS_CONVERTED: "Convertida", STATUS_NOT_CONVERTED: "Não convertida", STATUS_CANCELLED: "Cancelada", STATUS_RECEIVED: "Reativada",
};
export const actionLabel = (action: string) => ACTIONS[action] ?? action;

export const isProduct = (value: string | null): value is Product => value === "TRAVEL" || value === "MILES";
export const isStatus = (value: string | null): value is Status => value !== null && value in STATUS_LABEL;

export const brDate = (date: string | null | undefined) => (date ? date.split("-").reverse().join("/") : "");

/** Próximas situações oferecidas pela interface; a API valida a transição. */
export function nextStatuses(s: Status): Status[] {
  switch (s) {
    case "RECEIVED": return ["CONTACTED", "CONVERTED", "NOT_CONVERTED", "CANCELLED"];
    case "CONTACTED": return ["CONVERTED", "NOT_CONVERTED", "CANCELLED"];
    case "CONVERTED": case "NOT_CONVERTED": return ["CONTACTED", "CANCELLED"];
    case "CANCELLED": return ["RECEIVED"];
  }
}

export const STATUS_ACTION: Record<Status, string> = {
  RECEIVED: "Reativar", CONTACTED: "Marcar em contato", CONVERTED: "Marcar como convertida", NOT_CONVERTED: "Não convertida", CANCELLED: "Cancelar indicação",
};

export function needsReason(from: Status, to: Status): boolean {
  return to === "NOT_CONVERTED" || to === "CANCELLED" || to === "RECEIVED" || (to === "CONTACTED" && from !== "RECEIVED");
}

export type ReferralForm = {
  product: Product | ""; referrerId: string; mode: "crm" | "contact"; referredCustomerId: string; referredName: string; referredPhone: string;
  referredEmail: string; referredOn: string; channel: Channel | ""; channelDetail: string; responsibleId: string; notes: string;
};

export function emptyForm(today: string, product: Product | "" = "", referrerId = ""): ReferralForm {
  return { product, referrerId, mode: "contact", referredCustomerId: "", referredName: "", referredPhone: "", referredEmail: "", referredOn: today, channel: "", channelDetail: "", responsibleId: "", notes: "" };
}

const text = (v: string) => (v.trim() ? v.trim() : null);

/** Valida no navegador o que dá para validar; a API continua sendo a fonte das regras. */
export function toInput(f: ReferralForm, today: string, expectedVersion?: number): ReferralInput {
  if (!f.product) throw new Error("Escolha se a indicação é de Viagens ou de Milhas.");
  if (!f.referrerId) throw new Error("Escolha quem fez a indicação.");
  if (!f.referredOn) throw new Error("Informe a data da indicação.");
  if (f.referredOn > today) throw new Error("A data da indicação não pode estar no futuro.");
  if (!f.channel) throw new Error("Informe a origem da indicação.");
  if (f.channel === "OTHER" && !f.channelDetail.trim()) throw new Error("Descreva a origem quando escolher “Outro”.");
  const crm = f.mode === "crm";
  if (crm && !f.referredCustomerId) throw new Error("Escolha a pessoa indicada.");
  if (crm && f.referredCustomerId === f.referrerId) throw new Error("A pessoa indicada não pode ser a mesma que indicou.");
  if (!crm && !f.referredName.trim()) throw new Error("Informe o nome da pessoa indicada.");
  if (!crm && !f.referredPhone.trim() && !f.referredEmail.trim()) throw new Error("Informe telefone ou e-mail da pessoa indicada.");
  return {
    product: f.product, referrerId: f.referrerId, referredCustomerId: crm ? f.referredCustomerId : null,
    referredName: crm ? null : f.referredName.trim(), referredPhone: crm ? null : text(f.referredPhone), referredEmail: crm ? null : text(f.referredEmail),
    referredOn: f.referredOn, channel: f.channel, channelDetail: f.channel === "OTHER" ? text(f.channelDetail) : text(f.channelDetail),
    responsibleId: f.responsibleId || null, notes: text(f.notes),
    ...(expectedVersion === undefined ? {} : { expectedVersion }),
  };
}

export function referredLabel(r: { referredCustomerName: string | null; referredName: string | null }) {
  return r.referredCustomerName ?? r.referredName ?? "—";
}
