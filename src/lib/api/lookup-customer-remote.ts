import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { mergeCustomerApiResponse } from "@/lib/api/customer-mapper";
import type { ApiCustomerResponse } from "@/lib/api/customer-types";
import type { Cliente } from "@/types";

/**
 * Busca um cliente ativo por e-mail ou telefone (GET /customers/lookup).
 * Usado quando o POST de criação retorna duplicidade mas o cliente não está na lista local.
 */
export async function lookupCustomerRemote(
  token: string,
  params: { email?: string; phone?: string },
): Promise<Cliente | null> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base || !token) return null;
  const qs = new URLSearchParams();
  if (params.email?.trim()) qs.set("email", params.email.trim());
  if (params.phone?.trim()) qs.set("phone", params.phone.trim());
  if ([...qs.keys()].length === 0) return null;

  const res = await fetch(`${base}/customers/lookup?${qs.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  const api = (await res.json()) as ApiCustomerResponse;
  return mergeCustomerApiResponse(
    {
      nome: "",
      email: "",
      telefone: "",
      destinoInteresse: "—",
      status: "prospecto",
      observacoes: "",
      id: api.id,
      createdAt:
        api.createdAt && api.createdAt.includes("T") ?
          api.createdAt.slice(0, 10)
        : (api.createdAt ?? ""),
    },
    api,
  );
}
