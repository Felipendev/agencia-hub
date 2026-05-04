import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import {
  cotacaoToCreateRequest,
  isUuid,
  mergeQuotationApiResponse,
} from "@/lib/api/quotation-mapper";
import type { ApiQuotationResponse } from "@/lib/api/quotation-types";
import type { Cotacao } from "@/types";

function extractApiErrorMessage(
  parsed: ApiQuotationResponse | Record<string, unknown> | null,
  status: number,
): string {
  if (parsed && typeof parsed === "object") {
    const m = (parsed as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return `HTTP ${status}`;
}

/**
 * Envia `POST .../quotations` quando a base URL está definida e `customerId` é UUID.
 * Retorna `null` se a integração remota não se aplica (MVP só local).
 */
export async function createQuotationRemote(
  draft: Cotacao,
): Promise<Cotacao | null> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base || !isUuid(draft.clienteId)) {
    return null;
  }

  const body = cotacaoToCreateRequest(draft);
  const res = await fetch(`${base}/quotations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const parsed = (await res.json().catch(() => null)) as
    | ApiQuotationResponse
    | Record<string, unknown>
    | null;

  if (!res.ok) {
    const msg = extractApiErrorMessage(parsed, res.status);
    throw new Error(msg);
  }

  const api = parsed as ApiQuotationResponse;
  if (!api?.id || !api.customerId) {
    throw new Error("Resposta da API inválida.");
  }

  return mergeQuotationApiResponse(draft, api);
}
