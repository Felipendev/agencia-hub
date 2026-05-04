import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import {
  apiQuotationResponseToCotacao,
  isUuid,
} from "@/lib/api/quotation-mapper";
import type {
  ApiQuotationResponse,
  ApiQuotationStatus,
} from "@/lib/api/quotation-types";
import type { Cotacao } from "@/types";

export type ListQuotationsRemoteParams = {
  customerId?: string;
  status?: ApiQuotationStatus;
  search?: string;
};

function extractMessage(parsed: unknown): string | null {
  if (parsed && typeof parsed === "object" && "message" in parsed) {
    const m = (parsed as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return null;
}

/** GET `/quotations` com filtros opcionais — espelha o Spring Boot. */
export async function listQuotationsRemote(
  params: ListQuotationsRemoteParams = {},
): Promise<Cotacao[]> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base) {
    throw new Error("NEXT_PUBLIC_AGENCIA_HUB_API_URL não configurada.");
  }

  const sp = new URLSearchParams();
  if (params.customerId && isUuid(params.customerId)) {
    sp.set("customerId", params.customerId.trim());
  }
  if (params.status) {
    sp.set("status", params.status);
  }
  if (params.search?.trim()) {
    sp.set("search", params.search.trim());
  }

  const qs = sp.toString();
  const url = `${base}/quotations${qs ? `?${qs}` : ""}`;
  const res = await fetch(url);

  const parsed = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(parsed) ?? `HTTP ${res.status}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Resposta da API inválida: esperado array de cotações.");
  }

  return (parsed as ApiQuotationResponse[]).map(apiQuotationResponseToCotacao);
}
