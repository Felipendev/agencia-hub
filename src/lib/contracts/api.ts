import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import type {
  AttachmentMeta,
  ContractDetail,
  ContractFieldView,
  ContractStatus,
  ContractSummary,
  Product,
  DeleteOutcome,
  DocumentMeta,
  DocumentView,
  DraftInput,
  ExistingReceivable,
  Preview,
  TemplateDetail,
  TemplateInput,
  TemplateSummary,
  TemplateVersion,
} from "./types";

/** Erro da API com status e campos faltantes, para a interface destacar sem perder o rascunho. */
export class ContractApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly missingFields: ContractFieldView[] = [],
  ) {
    super(message);
    this.name = "ContractApiError";
  }
}

const FALLBACK: Record<number, string> = {
  403: "Seu perfil não tem permissão para esta ação.",
  404: "Registro não encontrado. Ele pode ter sido excluído.",
  409: "O registro foi alterado por outra pessoa. Recarregue e tente novamente.",
};

async function call(token: string | null | undefined, path: string, init: RequestInit = {}): Promise<Response> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base || !token) throw new ContractApiError("Conecte-se ao sistema para acessar os contratos.", 0);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (typeof init.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...init, headers });
  } catch {
    throw new ContractApiError("Sem conexão com o serviço. Nada foi salvo; tente novamente.", 0);
  }
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:unauthorized", { detail: token }));
    }
    const data = (await response.json().catch(() => null)) as { message?: string; code?: string; missingFields?: ContractFieldView[] } | null;
    throw new ContractApiError(
      data?.message || FALLBACK[response.status] || "Não foi possível concluir a ação. Tente novamente.",
      response.status,
      data?.code,
      data?.missingFields ?? [],
    );
  }
  return response;
}

async function json<T>(token: string | null | undefined, path: string, init?: RequestInit): Promise<T> {
  return (await call(token, path, init)).json() as Promise<T>;
}

const body = (value: unknown) => JSON.stringify(value);

export const contractsApi = {
  fields: (token?: string | null) => json<ContractFieldView[]>(token, "/contract-templates/fields"),
  listTemplates: (token: string | null | undefined, includeArchived = false, product?: Product) => {
    const query = new URLSearchParams();
    if (includeArchived) query.set("includeArchived", "true");
    if (product) query.set("product", product);
    const suffix = query.toString();
    return json<TemplateSummary[]>(token, `/contract-templates${suffix ? `?${suffix}` : ""}`);
  },
  getTemplate: (token: string | null | undefined, id: string) => json<TemplateDetail>(token, `/contract-templates/${id}`),
  templateVersion: (token: string | null | undefined, id: string, version: number) =>
    json<TemplateVersion>(token, `/contract-templates/${id}/versions/${version}`),
  createTemplate: (token: string | null | undefined, input: TemplateInput) =>
    json<TemplateDetail>(token, "/contract-templates", { method: "POST", body: body(input) }),
  updateTemplate: (token: string | null | undefined, id: string, input: TemplateInput) =>
    json<TemplateDetail>(token, `/contract-templates/${id}`, { method: "PATCH", body: body(input) }),
  deleteTemplate: (token: string | null | undefined, id: string, expectedVersion: number) =>
    json<DeleteOutcome>(token, `/contract-templates/${id}?expectedVersion=${expectedVersion}`, { method: "DELETE" }),
  restoreTemplate: (token: string | null | undefined, id: string, expectedVersion: number) =>
    json<TemplateDetail>(token, `/contract-templates/${id}/restore?expectedVersion=${expectedVersion}`, { method: "POST" }),

  list: (token: string | null | undefined, filters: { customerId?: string; product?: Product; status?: ContractStatus } = {}) => {
    const query = new URLSearchParams();
    if (filters.customerId) query.set("customerId", filters.customerId);
    if (filters.product) query.set("product", filters.product);
    if (filters.status) query.set("status", filters.status);
    const suffix = query.toString();
    return json<ContractSummary[]>(token, `/contracts${suffix ? `?${suffix}` : ""}`);
  },
  get: (token: string | null | undefined, id: string) => json<ContractDetail>(token, `/contracts/${id}`),
  /** A chave de idempotência evita rascunhos duplicados quando o envio é repetido. */
  create: (token: string | null | undefined, requestKey: string, input: DraftInput) =>
    json<ContractDetail>(token, "/contracts", { method: "POST", body: body(input), headers: { "Idempotency-Key": requestKey } }),
  update: (token: string | null | undefined, id: string, input: DraftInput) =>
    json<ContractDetail>(token, `/contracts/${id}`, { method: "PATCH", body: body(input) }),
  remove: async (token: string | null | undefined, id: string, expectedVersion: number) => {
    await call(token, `/contracts/${id}?expectedVersion=${expectedVersion}`, { method: "DELETE" });
  },
  preview: (token: string | null | undefined, id: string) => json<Preview>(token, `/contracts/${id}/preview`),
  generate: (token: string | null | undefined, id: string, expectedVersion: number) =>
    json<DocumentMeta>(token, `/contracts/${id}/documents`, { method: "POST", body: body({ expectedVersion }) }),
  document: (token: string | null | undefined, id: string, version: number) =>
    json<DocumentView>(token, `/contracts/${id}/documents/${version}`),
  documentPdf: async (token: string | null | undefined, id: string, version: number) =>
    (await call(token, `/contracts/${id}/documents/${version}/pdf`)).blob(),
  send: (token: string | null | undefined, id: string, expectedVersion: number, sentOn: string) =>
    json<ContractDetail>(token, `/contracts/${id}/send`, { method: "POST", body: body({ expectedVersion, sentOn }) }),
  revise: (token: string | null | undefined, id: string, expectedVersion: number, reason: string) =>
    json<ContractDetail>(token, `/contracts/${id}/revise`, { method: "POST", body: body({ expectedVersion, reason }) }),
  cancel: (token: string | null | undefined, id: string, expectedVersion: number, reason: string) =>
    json<ContractDetail>(token, `/contracts/${id}/cancel`, { method: "POST", body: body({ expectedVersion, reason }) }),
  sign: (token: string | null | undefined, id: string, input: { expectedVersion: number; signedOn: string; note: string; file: File }) => {
    const form = new FormData();
    form.set("expectedVersion", String(input.expectedVersion));
    form.set("signedOn", input.signedOn);
    if (input.note.trim()) form.set("note", input.note.trim());
    form.set("file", input.file);
    return json<ContractDetail>(token, `/contracts/${id}/sign`, { method: "POST", body: form });
  },
  addAttachment: (token: string | null | undefined, id: string, file: File, description: string) => {
    const form = new FormData();
    form.set("file", file);
    if (description.trim()) form.set("description", description.trim());
    return json<AttachmentMeta>(token, `/contracts/${id}/attachments`, { method: "POST", body: form });
  },
  attachment: async (token: string | null | undefined, id: string, attachmentId: string) =>
    (await call(token, `/contracts/${id}/attachments/${attachmentId}`)).blob(),
  deleteAttachment: async (token: string | null | undefined, id: string, attachmentId: string) => {
    await call(token, `/contracts/${id}/attachments/${attachmentId}`, { method: "DELETE" });
  },
  linkReceivable: (token: string | null | undefined, id: string, receivableId: string) =>
    json<ContractDetail>(token, `/contracts/${id}/receivables/${receivableId}`, { method: "PUT" }),
  unlinkReceivable: (token: string | null | undefined, id: string, receivableId: string) =>
    json<ContractDetail>(token, `/contracts/${id}/receivables/${receivableId}`, { method: "DELETE" }),
  /** Consulta somente leitura da API financeira existente; nada é criado nela. */
  receivablesOf: (token: string | null | undefined, customerId: string) =>
    json<ExistingReceivable[]>(token, `/sales/receivables?customerId=${encodeURIComponent(customerId)}`),
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const UPLOAD_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx";
const UPLOAD_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Valida o arquivo antes do envio; a API repete a validação. */
export function uploadProblem(file: File | null): string | null {
  if (!file) return "Escolha um arquivo.";
  if (file.size === 0) return "O arquivo está vazio.";
  if (file.size > MAX_UPLOAD_BYTES) return "O arquivo pode ter até 5 MB.";
  if (!UPLOAD_TYPES.has(file.type)) return "Envie PDF, imagem (JPG, PNG, WEBP) ou documento Word.";
  return null;
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
