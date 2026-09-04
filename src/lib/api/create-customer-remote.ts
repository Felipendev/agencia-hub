import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import {
  clienteToCreateRequest,
  mergeCustomerApiResponse,
} from "@/lib/api/customer-mapper";
import type { ApiCustomerResponse } from "@/lib/api/customer-types";
import type { Cliente } from "@/types";

/** Erro lançado quando a API retorna 409 DUPLICATE_CUSTOMER */
export class DuplicateCustomerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateCustomerError";
  }
}

function extractApiError(
  parsed: ApiCustomerResponse | Record<string, unknown> | null,
  status: number,
): { message: string; code?: string } {
  if (parsed && typeof parsed === "object") {
    const m = (parsed as { message?: unknown; code?: unknown }).message;
    const c = (parsed as { message?: unknown; code?: unknown }).code;
    return {
      message: typeof m === "string" && m.trim() ? m : `HTTP ${status}`,
      code:    typeof c === "string" ? c : undefined,
    };
  }
  return { message: `HTTP ${status}` };
}

/**
 * `POST .../customers` quando a base URL está definida.
 * Lança `DuplicateCustomerError` se a API retornar 409.
 */
export async function createCustomerRemote(
  draft: Cliente,
  token?: string | null,
): Promise<Cliente | null> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base) {
    return null;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const body = clienteToCreateRequest(draft);
  const res = await fetch(`${base}/customers`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const parsed = (await res.json().catch(() => null)) as
    | ApiCustomerResponse
    | Record<string, unknown>
    | null;

  if (!res.ok) {
    const { message, code } = extractApiError(parsed, res.status);
    if (res.status === 409 || code === "DUPLICATE_CUSTOMER") {
      throw new DuplicateCustomerError(message);
    }
    throw new Error(message);
  }

  const api = parsed as ApiCustomerResponse;
  if (!api?.id) {
    throw new Error("Resposta da API inválida.");
  }

  return mergeCustomerApiResponse(draft, api);
}
