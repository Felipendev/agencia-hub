import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import {
  lancamentoToCreateRequest,
  mergeFinancialApiResponse,
} from "@/lib/api/financial-mapper";
import type { ApiFinancialEntryResponse } from "@/lib/api/financial-types";
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
 * `POST .../financial-entries` quando a base URL está definida.
 * Retorna `null` se a integração remota não se aplica.
 */
export async function createFinancialEntryRemote(
  draft: LancamentoFinanceiro,
  token?: string | null,
): Promise<LancamentoFinanceiro | null> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base) {
    return null;
  }

  const body = lancamentoToCreateRequest(draft);
  const res = await fetch(`${base}/financial-entries`, {
    method: "POST",
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

  return mergeFinancialApiResponse(draft, api);
}
