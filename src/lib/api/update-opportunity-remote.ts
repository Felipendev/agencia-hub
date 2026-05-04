import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import {
  atendimentoStatusToApi,
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
 * `PATCH .../opportunities/{id}` quando a base URL está definida e o id é UUID.
 * Retorna `null` se a integração remota não se aplica.
 */
export async function updateOpportunityRemote(
  current: Atendimento,
  patch: Partial<Atendimento>,
): Promise<Atendimento | null> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base || !isUuid(current.id)) {
    return null;
  }

  const body: Record<string, unknown> = {};

  if (patch.titulo !== undefined) body.title = patch.titulo.trim();
  if (patch.destino !== undefined) body.destination = patch.destino.trim();
  if (patch.valorEstimado !== undefined) body.estimatedAmount = patch.valorEstimado;
  if (patch.status !== undefined) body.status = atendimentoStatusToApi(patch.status);
  if (patch.dataPrevistaViagem !== undefined) body.expectedTravelDate = patch.dataPrevistaViagem.trim().slice(0, 10);
  if (patch.observacoes !== undefined) body.notes = patch.observacoes?.trim() ?? "";

  if (Object.keys(body).length === 0) {
    return null;
  }

  const res = await fetch(`${base}/opportunities/${current.id}`, {
    method: "PATCH",
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

  return mergeOpportunityApiResponse({ ...current, ...patch } as Atendimento, api);
}
