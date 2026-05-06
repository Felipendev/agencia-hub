import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SolicitacaoPublicaConfig } from "@/types/solicitacao-publica";
import {
  getPublicConfig,
  upsertConfig,
} from "@/lib/solicitacao-server-store";
import { isValidSolicitacaoSlug } from "@/lib/solicitacao-slug";

export const runtime = "nodejs";

async function requireAuth(): Promise<boolean> {
  const jar = await cookies();
  return jar.get("ah_auth")?.value === "1";
}

export async function GET(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") ?? "demo").trim();
  if (!isValidSolicitacaoSlug(slug)) {
    return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
  }
  const config = await getPublicConfig(slug);
  return NextResponse.json({ config });
}

export async function PUT(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  let body: { config?: SolicitacaoPublicaConfig };
  try {
    body = (await request.json()) as { config?: SolicitacaoPublicaConfig };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const config = body.config;
  if (!config?.slug || !isValidSolicitacaoSlug(config.slug)) {
    return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
  }
  if (!config.tituloPagina?.trim()) {
    return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
  }

  const normalized: SolicitacaoPublicaConfig = {
    ...config,
    slug: config.slug.trim(),
    tituloPagina: config.tituloPagina.trim(),
    textoIntro: (config.textoIntro ?? "").trim(),
    logoDataUrl: config.logoDataUrl ?? null,
    nomeMarca: (config.nomeMarca ?? "Agência").trim() || "Agência",
    linksSociais: Array.isArray(config.linksSociais)
      ? config.linksSociais.filter((l) => l.url?.trim())
      : [],
  };

  try {
    await upsertConfig(normalized);
  } catch (err) {
    console.error("[solicitacao-config] Erro ao salvar configuração:", err);
    return NextResponse.json(
      { error: "Não foi possível salvar a configuração. Em ambientes serverless, o armazenamento em arquivo não é suportado." },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, config: normalized });
}
