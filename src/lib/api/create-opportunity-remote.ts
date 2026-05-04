import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import {
  atendimentoToCreateRequest,
  mergeOpportunityApiResponse,
} from "@/lib/api/opportunity-mapper";
import type { ApiOpportunityResponse } from "@/lib/api/opportunity-types";
import { isUuid } from "@/lib/api/quotation-mapper";
import type { Atendimento } from "@/types";

function extractApiErrorMessage(
  parsed: ApiOpportunityResponse | Record<string, unknown> | null,
  status: number,
): string {
  if (parsed && typeof parsed === "object") {
    const m = (parsed as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return `HTTP ${status}`;
}

/**
 * `POST .../opportunities` quando a base URL está definida e `customerId` é UUID.
 * Retorna `null` se a integração remota não se aplica.
 */
export async function createOpportunityRemote(
  draft: Atendimento,
): Promise<Atendimento | null> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base || !isUuid(draft.clienteId)) {
    return null;
  }

  const body = atendimentoToCreateRequest(draft);
  const res = await fetch(`${base}/opportunities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const parsed = (await res.json().catch(() => null)) as
    | ApiOpportunityResponse
    | Record<string, unknown>
    | null;

  if (!res.ok) {
    throw new Error(extractApiErrorMessage(parsed, res.status));
  }

  const api = parsed as ApiOpportunityResponse;
  if (!api?.id || !api.customerId) {
    throw new Error("Resposta da API inválida.");
  }

  return mergeOpportunityApiResponse(draft, api);
}
