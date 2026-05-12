import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import {
  cotacaoDetalhesToApiDetails,
  cotacaoStatusToApi,
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
 * `PATCH .../quotations/{id}` quando a base URL está definida e o id é UUID.
 * Retorna `null` se a integração remota não se aplica.
 */
export async function updateQuotationRemote(
  current: Cotacao,
  patch: Partial<Cotacao>,
  token?: string | null,
): Promise<Cotacao | null> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base || !isUuid(current.id)) {
    return null;
  }

  // Monta apenas os campos que foram alterados
  const body: Record<string, unknown> = {};

  if (patch.titulo !== undefined) body.title = patch.titulo.trim();
  if (patch.destino !== undefined) body.destination = patch.destino.trim();
  if (patch.valorTotal !== undefined) body.totalAmount = patch.valorTotal;
  if (patch.moeda !== undefined) body.currency = patch.moeda.trim().toUpperCase().slice(0, 3);
  if (patch.status !== undefined) body.status = cotacaoStatusToApi(patch.status);
  if (patch.validade !== undefined) body.validUntil = patch.validade.trim().slice(0, 10);
  if (patch.dataInicioViagem !== undefined) body.travelStartDate = patch.dataInicioViagem?.trim().slice(0, 10) ?? null;
  if (patch.dataFimViagem !== undefined) body.travelEndDate = patch.dataFimViagem?.trim().slice(0, 10) ?? null;
  if (patch.detalhes !== undefined) body.details = cotacaoDetalhesToApiDetails(patch.detalhes);
  if (patch.tags !== undefined) body.tags = patch.tags;
  if (patch.prioridade !== undefined) body.priority = patch.prioridade;
  if (patch.responsavel !== undefined) body.assignee = patch.responsavel?.trim() || null;
  if (patch.observacoes !== undefined) body.internalNotes = patch.observacoes?.trim() ?? "";
  if (patch.atendimentoId !== undefined && isUuid(patch.atendimentoId ?? "")) {
    body.opportunityId = patch.atendimentoId;
  }
  if (patch.vendedorId !== undefined) {
    if (patch.vendedorId && isUuid(patch.vendedorId)) {
      body.sellerId = patch.vendedorId.trim();
    } else {
      body.unsetSeller = true;
    }
  }

  if (Object.keys(body).length === 0) {
    return null; // Nada a atualizar
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${base}/quotations/${current.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });

  const parsed = (await res.json().catch(() => null)) as
    | ApiQuotationResponse
    | Record<string, unknown>
    | null;

  if (!res.ok) {
    throw new Error(extractApiErrorMessage(parsed, res.status));
  }

  const api = parsed as ApiQuotationResponse;
  if (!api?.id || !api.customerId) {
    throw new Error("Resposta da API inválida.");
  }

  // Merge: mantém detalhes locais (PT) e atualiza campos do backend
  const merged = mergeQuotationApiResponse(
    { ...current, ...patch } as Cotacao,
    api,
  );
  return merged;
}
