import type { ContractDetail, ContractStatus, DraftInput, PaymentMode, Product } from "./types";

export const PRODUCT_LABEL: Record<Product, string> = { TRAVEL: "Viagens", MILES: "Milhas" };

export const isProduct = (value: string | null | undefined): value is Product => value === "TRAVEL" || value === "MILES";

export const STATUS_LABEL: Record<ContractStatus, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviado",
  SIGNED: "Assinado",
  CANCELLED: "Cancelado",
};

export const STATUS_TONE: Record<ContractStatus, "default" | "success" | "warning" | "muted" | "danger"> = {
  DRAFT: "warning",
  SENT: "default",
  SIGNED: "success",
  CANCELLED: "muted",
};

export const PAYMENT_LABEL: Record<PaymentMode, string> = { CASH: "À vista", INSTALLMENTS: "Parcelado" };

export const SOURCE_LABEL = { CUSTOMER: "Cadastro da pessoa", AGENCY: "Dados da agência", CONTRACT: "Termos do contrato" } as const;

const ACTION_LABEL: Record<string, string> = {
  TEMPLATE_CREATED: "Modelo criado",
  TEMPLATE_UPDATED: "Modelo editado",
  TEMPLATE_VERSIONED: "Nova versão do modelo",
  TEMPLATE_ARCHIVED: "Modelo arquivado",
  TEMPLATE_RESTORED: "Modelo reativado",
  TEMPLATE_DELETED: "Modelo excluído",
  CONTRACT_CREATED: "Rascunho criado",
  CONTRACT_UPDATED: "Rascunho editado",
  CONTRACT_DELETED: "Rascunho excluído",
  DOCUMENT_GENERATED: "Documento gerado",
  CONTRACT_SENT: "Marcado como enviado",
  REVISION_STARTED: "Revisão iniciada",
  CONTRACT_SIGNED: "Assinatura registrada com evidência",
  CONTRACT_CANCELLED: "Contrato cancelado",
  ATTACHMENT_ADDED: "Anexo adicionado",
  ATTACHMENT_DELETED: "Anexo excluído",
  RECEIVABLE_LINKED: "Recebível vinculado",
  RECEIVABLE_UNLINKED: "Recebível desvinculado",
};

export const actionLabel = (action: string) => ACTION_LABEL[action] ?? action;

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatMoney = (value: number | null | undefined) => (value == null ? "—" : money.format(value));

/** Datas `yyyy-MM-dd` são exibidas sem conversão de fuso, para não mudar o dia. */
export function formatDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [year, month, day] = iso.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : iso;
}

export function formatMoment(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "short", timeStyle: "short" });
}

/** Data de hoje no fuso da agência, no formato aceito pela API. */
export function todayInAgencyZone(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export type DraftForm = {
  templateId: string;
  templateVersion: number | null;
  title: string;
  planName: string;
  price: string;
  startDate: string;
  endDate: string;
  paymentMode: "" | PaymentMode;
  installments: string;
  paymentTerms: string;
  notes: string;
};

export const emptyDraftForm = (templateId = ""): DraftForm => ({
  templateId,
  templateVersion: null,
  title: "",
  planName: "",
  price: "",
  startDate: "",
  endDate: "",
  paymentMode: "",
  installments: "",
  paymentTerms: "",
  notes: "",
});

export function formFromDetail(detail: ContractDetail): DraftForm {
  const c = detail.contract;
  return {
    templateId: c.templateId,
    templateVersion: c.templateVersion,
    title: c.title,
    planName: c.planName ?? "",
    price: c.price == null ? "" : c.price.toFixed(2).replace(".", ","),
    startDate: c.startDate ?? "",
    endDate: c.endDate ?? "",
    paymentMode: detail.paymentMode ?? "",
    installments: detail.installments == null ? "" : String(detail.installments),
    paymentTerms: detail.paymentTerms ?? "",
    notes: detail.notes ?? "",
  };
}

/** Converte "1.234,56" ou "1234.56" em número; vazio vira `null`, inválido lança erro legível. */
export function parsePrice(raw: string): number | null {
  const text = raw.trim().replace(/^R\$\s*/i, "");
  if (!text) return null;
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error("Informe o valor com até 2 casas decimais, por exemplo 1.200,00.");
  return Number(normalized);
}

export function toDraftInput(customerId: string, product: Product | "", form: DraftForm, expectedVersion?: number): DraftInput {
  if (!product) throw new Error("Escolha se o contrato é de Viagens ou de Milhas.");
  if (!form.title.trim()) throw new Error("Informe o título do contrato.");
  if (!form.templateId) throw new Error("Escolha um modelo de contrato.");
  if (form.startDate && form.endDate && form.endDate < form.startDate) throw new Error("O fim da vigência não pode ser anterior ao início.");
  const installments = form.paymentMode === "INSTALLMENTS" ? Number(form.installments) : null;
  if (form.paymentMode === "INSTALLMENTS" && (!Number.isInteger(installments) || (installments ?? 0) < 2 || (installments ?? 0) > 120)) {
    throw new Error("Informe de 2 a 120 parcelas para pagamento parcelado.");
  }
  const text = (value: string) => (value.trim() ? value.trim() : null);
  return {
    customerId,
    product,
    templateId: form.templateId,
    templateVersion: form.templateVersion,
    title: form.title.trim(),
    planName: text(form.planName),
    price: parsePrice(form.price),
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    paymentMode: form.paymentMode || null,
    installments,
    paymentTerms: text(form.paymentTerms),
    notes: text(form.notes),
    ...(expectedVersion === undefined ? {} : { expectedVersion }),
  };
}

/** Campos do formulário que alimentam cada chave do contrato, para destaque. */
export const CONTRACT_FIELD_INPUT: Record<string, keyof DraftForm> = {
  "contrato.titulo": "title",
  "contrato.plano": "planName",
  "contrato.valor": "price",
  "contrato.vigenciaInicio": "startDate",
  "contrato.vigenciaFim": "endDate",
  "contrato.formaPagamento": "paymentMode",
  "contrato.parcelas": "installments",
  "contrato.condicoesPagamento": "paymentTerms",
};
