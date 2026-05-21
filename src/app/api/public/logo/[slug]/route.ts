import { NextResponse } from "next/server";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { getPublicConfig } from "@/lib/solicitacao-server-store";
import { isValidSolicitacaoSlug } from "@/lib/solicitacao-slug";

export const runtime = "nodejs";

// Cache a imagem por 1 hora no CDN/browser
const CACHE_HEADER = "public, max-age=3600, s-maxage=3600";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const decodedSlug = decodeURIComponent(slug);

  if (!isValidSolicitacaoSlug(decodedSlug)) {
    return new NextResponse("Not found", { status: 404 });
  }

  let logoDataUrl: string | null = null;

  // Tenta buscar no backend primeiro
  const base = getAgenciaHubApiBaseUrl();
  if (base) {
    try {
      const res = await fetch(
        `${base}/public/solicitacao-config/${encodeURIComponent(decodedSlug)}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { logoDataUrl?: string | null };
        logoDataUrl = data.logoDataUrl ?? null;
      }
    } catch {
      /* fallback para server store */
    }
  }

  // Fallback: server store local (dev)
  if (!logoDataUrl) {
    try {
      const config = await getPublicConfig(decodedSlug);
      logoDataUrl = config.logoDataUrl ?? null;
    } catch {
      /* ignore */
    }
  }

  if (!logoDataUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Parseia o data URI: data:[mediatype];base64,[data]
  const match = logoDataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) {
    return new NextResponse("Invalid logo format", { status: 422 });
  }

  const [, mimeType, base64Data] = match;
  const buffer = Buffer.from(base64Data, "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": CACHE_HEADER,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
