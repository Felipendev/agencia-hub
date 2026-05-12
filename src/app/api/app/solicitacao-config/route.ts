import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { isValidSolicitacaoSlug } from "@/lib/solicitacao-slug";
import { upsertConfig } from "@/lib/solicitacao-server-store";
import type { SolicitacaoPublicaConfig } from "@/types/solicitacao-publica";

export const runtime = "nodejs";

/**
 * Reads the JWT token from the ah_token cookie or localStorage-synced header.
 * The frontend stores the token in localStorage and sets ah_auth cookie for middleware.
 * For server-side API routes, we need the token forwarded via Authorization header.
 */
function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

async function requireAuth(request: Request): Promise<string | null> {
  // First try Authorization header (preferred)
  const token = getTokenFromRequest(request);
  if (token) return token;

  // Fallback: check ah_auth cookie exists (for backward compat during transition)
  const jar = await cookies();
  if (jar.get("ah_auth")?.value === "1") {
    // Token not available server-side from cookie alone.
    // Return null to signal we can't proxy with auth.
    return null;
  }
  return null;
}

async function hasLocalAuth(request: Request, token: string | null): Promise<boolean> {
  if (token) return true;
  const jar = await cookies();
  return jar.get("ah_auth")?.value === "1";
}

export async function GET(request: Request) {
  const base = getAgenciaHubApiBaseUrl();
  const token = await requireAuth(request);
  const slug = new URL(request.url).searchParams.get("slug");
  const slugQs = slug ? `?slug=${encodeURIComponent(slug)}` : "";

  // If we have a backend API configured and a token, proxy to Spring Boot
  if (base && token) {
    try {
      const res = await fetch(
        `${base}/agency/solicitacao-config${slugQs}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: (body as { message?: string }).message ?? "Erro ao carregar configuração" },
          { status: res.status },
        );
      }
      const config = await res.json();
      return NextResponse.json({ config });
    } catch (err) {
      console.error("[solicitacao-config] Erro ao buscar do backend:", err);
      return NextResponse.json(
        { error: "Erro de conexão com o servidor" },
        { status: 502 },
      );
    }
  }

  // No backend configured or no auth — return unauthorized
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function PUT(request: Request) {
  const token = await requireAuth(request);
  const base = getAgenciaHubApiBaseUrl();

  const localAuth = await hasLocalAuth(request, token);
  if ((base && !token) || (!base && !localAuth)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: { config?: Partial<SolicitacaoPublicaConfig> };
  try {
    body = await request.json();
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

  // Map to the Spring Boot API request format
  const apiBody: SolicitacaoPublicaConfig = {
    slug: config.slug.trim(),
    tituloPagina: config.tituloPagina.trim(),
    textoIntro: (config.textoIntro ?? "").trim(),
    logoDataUrl: config.logoDataUrl ?? null,
    nomeMarca: (config.nomeMarca ?? "Agência").trim() || "Agência",
    linksSociais: Array.isArray(config.linksSociais) ? config.linksSociais : [],
  };

  if (!base) {
    await upsertConfig(apiBody);
    return NextResponse.json({ ok: true, config: apiBody });
  }

  try {
    const res = await fetch(`${base}/agency/solicitacao-config`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiBody),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: (errBody as { message?: string }).message ?? "Erro ao salvar configuração" },
        { status: res.status },
      );
    }

    const saved = await res.json();
    return NextResponse.json({ ok: true, config: saved });
  } catch (err) {
    console.error("[solicitacao-config] Erro ao salvar no backend:", err);
    return NextResponse.json(
      { error: "Erro de conexão com o servidor" },
      { status: 502 },
    );
  }
}
