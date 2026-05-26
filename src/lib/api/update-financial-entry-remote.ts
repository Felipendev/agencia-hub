import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import {
  lancamentoCategoriaToApi,
  lancamentoStatusToApi,
  lancamentoTipoToApi,
  mergeFinancialApiResponse,
} from "@/lib/api/financial-mapper";
import type { ApiFinancialEntryResponse } from "@/lib/api/financial-types";
import { isUuid } from "@/lib/api/quotation-mapper";
import type { LancamentoFinanceiro } from "@/types";

function extractApiErrorMessage(
  parsed: ApiFinancialEntryResponse | Record<string, unknown> | null,
  status: number,
): string {
  if (parsed && typeof parsed === "object") {
    const m = (parsed as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return `HTTP ${status}`;
}

/**
 * `PATCH .../financial-entries/{id}` quando a base URL está definida e o id é UUID.
 * Retorna `null` se a integração remota não se aplica.
 */
export async function updateFinancialEntryRemote(
  current: LancamentoFinanceiro,
  patch: Partial<LancamentoFinanceiro>,
  token?: string | null,
): Promise<LancamentoFinanceiro | null> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base || !isUuid(current.id)) {
    return null;
  }

  const body: Record<string, unknown> = {};

  if (patch.descricao !== undefined) body.description = patch.descricao.trim();
  if (patch.tipo !== undefined) body.type = lancamentoTipoToApi(patch.tipo);
  if (patch.categoria !== undefined) body.category = lancamentoCategoriaToApi(patch.categoria);
  if (patch.valor !== undefined) body.amount = patch.valor;
  if (patch.data !== undefined) body.entryDate = patch.data.trim().slice(0, 10);
  if (patch.status !== undefined) body.status = lancamentoStatusToApi(patch.status);
  if (patch.clienteId !== undefined) {
    body.customerId = patch.clienteId && isUuid(patch.clienteId) ? patch.clienteId : null;
  }
  if (patch.contaBancaria !== undefined) {
    body.bankAccount = patch.contaBancaria?.trim() || null;
  }

  if (Object.keys(body).length === 0) {
    return null;
  }

  const res = await fetch(`${base}/financial-entries/${current.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const parsed = (await res.json().catch(() => null)) as
    | ApiFinancialEntryResponse
    | Record<string, unknown>
    | null;

  if (!res.ok) {
    throw new Error(extractApiErrorMessage(parsed, res.status));
  }

  const api = parsed as ApiFinancialEntryResponse;
  if (!api?.id) {
    throw new Error("Resposta da API inválida.");
  }

  return mergeFinancialApiResponse({ ...current, ...patch } as LancamentoFinanceiro, api);
}
