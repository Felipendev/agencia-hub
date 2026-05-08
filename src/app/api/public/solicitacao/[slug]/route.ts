import { NextResponse } from "next/server";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { getPublicConfig } from "@/lib/solicitacao-server-store";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const decodedSlug = decodeURIComponent(slug);
  const base = getAgenciaHubApiBaseUrl();

  if (base) {
    try {
      const res = await fetch(
        `${base}/public/solicitacao-config/${encodeURIComponent(decodedSlug)}`,
        { headers: { "Content-Type": "application/json" } },
      );
      if (res.ok) {
        const config = await res.json();
        return NextResponse.json({ config });
      }
      // If backend returns error, fall through to default
    } catch (err) {
      console.error("[public/solicitacao] Erro ao buscar config do backend:", err);
    }
  }

  // Fallback: use local mock store if backend is unavailable
  const config = await getPublicConfig(decodedSlug);
  return NextResponse.json({ config });
}
