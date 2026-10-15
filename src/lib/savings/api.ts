import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import type { EvidenceMeta, Report, ReportContent, ReportInput, SavingsData, SavingsRow, SavingsView, SharedReport, SharedReportSummary, VersionView } from "./types";

/** Erro da API com o status, para a interface manter o formulário e explicar o motivo. */
export class SavingsApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "SavingsApiError";
  }
}

const FALLBACK: Record<number, string> = {
  403: "Seu perfil não tem permissão para esta ação.",
  404: "Registro não encontrado. Ele pode ter sido excluído.",
  409: "A análise foi alterada por outra pessoa. Recarregue antes de salvar.",
};

async function call(token: string | null | undefined, path: string, init: RequestInit = {}): Promise<Response> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base || !token) throw new SavingsApiError("Conecte-se ao sistema para acessar a economia das viagens.", 0);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (typeof init.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...init, headers });
  } catch {
    throw new SavingsApiError("Sem conexão com o serviço. Nada foi salvo; tente novamente.", 0);
  }
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth:unauthorized", { detail: token }));
    const data = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
    throw new SavingsApiError(data?.message || FALLBACK[response.status] || "Não foi possível concluir a ação. Tente novamente.", response.status, data?.code);
  }
  return response;
}

const json = async <T,>(token: string | null | undefined, path: string, init?: RequestInit) => (await call(token, path, init)).json() as Promise<T>;

export type Period = { customerId?: string; from?: string; to?: string };

function query(period: Period & { available?: boolean }) {
  const params = new URLSearchParams();
  if (period.customerId) params.set("customerId", period.customerId);
  if (period.from) params.set("from", period.from);
  if (period.to) params.set("to", period.to);
  if (period.available !== undefined) params.set("available", String(period.available));
  const text = params.toString();
  return text ? `?${text}` : "";
}

export const savingsApi = {
  list: (token: string | null | undefined, period: Period & { available?: boolean } = {}) => json<SavingsRow[]>(token, `/savings${query(period)}`),
  report: (token: string | null | undefined, period: Period = {}) => json<Report>(token, `/savings/report${query(period)}`),
  get: (token: string | null | undefined, tripId: string) => json<SavingsView>(token, `/trips/${tripId}/savings`),
  /** `expectedVersion` 0 cria; a versão atual edita o mesmo registro. */
  save: (token: string | null | undefined, tripId: string, data: SavingsData, expectedVersion: number) =>
    json<SavingsView>(token, `/trips/${tripId}/savings`, { method: "PUT", body: JSON.stringify({ data, expectedVersion }) }),
  remove: async (token: string | null | undefined, tripId: string, expectedVersion: number) => {
    await call(token, `/trips/${tripId}/savings?expectedVersion=${expectedVersion}`, { method: "DELETE" });
  },
  version: (token: string | null | undefined, tripId: string, version: number) => json<VersionView>(token, `/trips/${tripId}/savings/versions/${version}`),
  addEvidence: (token: string | null | undefined, tripId: string, file: File, description: string) => {
    const form = new FormData();
    form.set("file", file);
    if (description.trim()) form.set("description", description.trim());
    return json<EvidenceMeta>(token, `/trips/${tripId}/savings/evidence`, { method: "POST", body: form });
  },
  evidence: async (token: string | null | undefined, tripId: string, id: string) => (await call(token, `/trips/${tripId}/savings/evidence/${id}`)).blob(),
  deleteEvidence: async (token: string | null | undefined, tripId: string, id: string) => {
    await call(token, `/trips/${tripId}/savings/evidence/${id}`, { method: "DELETE" });
  },
  previewReport: (token: string | null | undefined, input: ReportInput) =>
    json<ReportContent>(token, "/savings/shared-reports/preview", { method: "POST", body: JSON.stringify(input) }),
  createReport: (token: string | null | undefined, input: ReportInput) =>
    json<SharedReport>(token, "/savings/shared-reports", { method: "POST", body: JSON.stringify(input) }),
  listReports: (token: string | null | undefined, customerId?: string) =>
    json<SharedReportSummary[]>(token, `/savings/shared-reports${customerId ? `?customerId=${encodeURIComponent(customerId)}` : ""}`),
  reportPdf: async (token: string | null | undefined, id: string) => (await call(token, `/savings/shared-reports/${id}/pdf`)).blob(),
  deleteReport: async (token: string | null | undefined, id: string) => {
    await call(token, `/savings/shared-reports/${id}`, { method: "DELETE" });
  },
};

const EVIDENCE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
export const EVIDENCE_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";

export function evidenceProblem(file: File | null): string | null {
  if (!file) return "Escolha um arquivo.";
  if (file.size === 0) return "O arquivo está vazio.";
  if (file.size > 5 * 1024 * 1024) return "O arquivo pode ter até 5 MB.";
  if (!EVIDENCE_TYPES.has(file.type)) return "Envie PDF ou imagem (JPG, PNG, WEBP).";
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
