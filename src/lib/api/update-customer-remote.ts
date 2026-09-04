import { apiFetch } from "@/lib/api/authenticated-fetch";
import {
  clientePatchToApi,
  mergeCustomerApiResponse,
} from "@/lib/api/customer-mapper";
import type { ApiCustomerResponse } from "@/lib/api/customer-types";
import { isUuid } from "@/lib/api/quotation-mapper";
import type { Cliente } from "@/types";

/** Atualiza o cliente no backend e devolve o estado conciliado com a resposta. */
export async function updateCustomerRemote(
  current: Cliente,
  patch: Partial<Cliente>,
  token: string,
): Promise<Cliente> {
  if (!isUuid(current.id)) {
    throw new Error("Este cliente ainda não foi sincronizado com a API.");
  }

  const body = clientePatchToApi(patch);
  if (Object.keys(body).length === 0) {
    return { ...current, ...patch };
  }

  const api = await apiFetch<ApiCustomerResponse>(
    `/customers/${current.id}`,
    { method: "PATCH", body: JSON.stringify(body) },
    token,
  );
  return mergeCustomerApiResponse({ ...current, ...patch }, api);
}
