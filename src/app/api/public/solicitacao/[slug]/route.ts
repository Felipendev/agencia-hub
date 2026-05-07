import { NextResponse } from "next/server";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

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

  // Fallback: return a default config if backend is unavailable
  const defaultConfig = {
    slug: decodedSlug,
    tituloPagina: "Solicitação de Orçamento",
    textoIntro:
      "Preencha os dados abaixo em poucos minutos. Nossa equipe retorna o mais rápido possível, priorizando viagens com datas mais próximas.",
    logoDataUrl: null,
    nomeMarca: "AgenciaHub",
    linksSociais: [
      { id: "d1", tipo: "whatsapp", url: "https://wa.me/", label: "WhatsApp" },
      { id: "d2", tipo: "instagram", url: "https://instagram.com/", label: "Instagram" },
      { id: "d3", tipo: "email", url: "mailto:contato@agencia.com", label: "E-mail" },
    ],
  };
  return NextResponse.json({ config: defaultConfig });
}
