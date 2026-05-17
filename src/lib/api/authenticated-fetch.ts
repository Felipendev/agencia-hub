import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

/**
 * Wrapper de fetch que injeta o Bearer token automaticamente.
 * Despacha o evento 'auth:unauthorized' em window quando o servidor retorna 401,
 * sinalizando ao AuthProvider para encerrar a sessão.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base) throw new Error("NEXT_PUBLIC_AGENCIA_HUB_API_URL não configurada.");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${base}${path}`, { ...options, headers });

  const parsed = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
    }
    const msg =
      parsed && typeof parsed === "object" && "message" in parsed
        ? (parsed as { message: string }).message
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return parsed as T;
}
