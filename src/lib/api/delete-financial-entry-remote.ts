import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { isUuid } from "@/lib/api/quotation-mapper";

/** `DELETE .../financial-entries/{id}` quando a base URL está definida e o id é UUID. */
export async function deleteFinancialEntryRemote(id: string, token?: string | null): Promise<boolean> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base || !isUuid(id)) return false;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${base}/financial-entries/${id}`, { method: "DELETE", headers });

  if (!res.ok && res.status !== 404) {
    const parsed = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(parsed?.message ?? `HTTP ${res.status}`);
  }
  return true;
}
