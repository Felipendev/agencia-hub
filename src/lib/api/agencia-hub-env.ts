/**
 * Base URL do backend Spring (com prefixo `/api/v1`).
 * Em rotas server-side prefira AGENCIA_HUB_API_URL (não exposta ao bundle).
 * Fallback: NEXT_PUBLIC_AGENCIA_HUB_API_URL (legado / backward-compat).
 */
export function getAgenciaHubApiBaseUrl(): string | null {
  const raw = (
    process.env.AGENCIA_HUB_API_URL ?? process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL
  )?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

/**
 * Retorna true se a API remota está configurada.
 * Seguro para componentes client — lê apenas NEXT_PUBLIC_HAS_REMOTE_API (boolean),
 * nunca expõe a URL real no bundle.
 */
export function getHasRemoteApi(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_HAS_REMOTE_API?.trim() ||
    process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL?.trim(),
  );
}
