/**
 * Base URL do backend Spring (com prefixo `/api/v1`), ex.:
 * `NEXT_PUBLIC_AGENCIA_HUB_API_URL=http://localhost:8080/api/v1`
 */
export function getAgenciaHubApiBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}
