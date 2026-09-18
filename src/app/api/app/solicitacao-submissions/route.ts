import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import type { CotacaoDetalhes } from "@/types";
import type { SolicitacaoPublicSubmission } from "@/types/solicitacao-publica";
import {
  isLocalSolicitacaoStoreEnabled,
  listSubmissions,
  removeSubmission,
  updateSubmissionStatus,
} from "@/lib/solicitacao-server-store";

export const runtime = "nodejs";

function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

async function cookieAuth(): Promise<boolean> {
  const jar = await cookies();
  return jar.get("ah_auth")?.value === "1";
}

function normalizeSubmissions(rows: unknown): SolicitacaoPublicSubmission[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    const o = r as Record<string, unknown>;
    const createdRaw = o.createdAt;
    let createdAt: string;
    if (typeof createdRaw === "string") {
      createdAt = createdRaw;
    } else if (createdRaw instanceof Date) {
      createdAt = createdRaw.toISOString();
    } else {
      createdAt = new Date().toISOString();
    }
    return {
      id: String(o.id ?? ""),
      slug: String(o.slug ?? ""),
      createdAt,
      nome: String(o.nome ?? ""),
      email: String(o.email ?? ""),
      telefone: String(o.telefone ?? ""),
      referralSellerId:
        o.referralSellerId != null && String(o.referralSellerId).trim() ?
          String(o.referralSellerId)
        : undefined,
      referralSellerName:
        o.referralSellerName != null && String(o.referralSellerName).trim() ?
          String(o.referralSellerName)
        : undefined,
      detalhes: (o.detalhes ?? {}) as CotacaoDetalhes,
      observacoes: String(o.observacoes ?? ""),
      status: ["PENDING", "CONVERTED", "ARCHIVED", "DELETED"].includes(String(o.status))
        ? String(o.status) as SolicitacaoPublicSubmission["status"]
        : "PENDING",
      statusUpdatedAt: typeof o.statusUpdatedAt === "string" ? o.statusUpdatedAt : undefined,
      convertedAt: typeof o.convertedAt === "string" ? o.convertedAt : null,
    };
  });
}

export async function GET(request: Request) {
  const token = getTokenFromRequest(request);
  const hasCookie = await cookieAuth();
  if (!token && !hasCookie) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const base = getAgenciaHubApiBaseUrl();
  if (base && token) {
    try {
      const res = await fetch(`${base}/agency/solicitacao-submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        return NextResponse.json(
          { error: body.message ?? "Erro ao listar submissões" },
          { status: res.status },
        );
      }
      const rows = (await res.json()) as unknown;
      return NextResponse.json({ submissions: normalizeSubmissions(rows) });
    } catch (e) {
      console.error("[solicitacao-submissions] GET:", e);
      return NextResponse.json(
        { error: "Erro de conexão com o servidor" },
        { status: 502 },
      );
    }
  }

  if (!hasCookie) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!isLocalSolicitacaoStoreEnabled()) {
    return NextResponse.json(
      { error: "Serviço de solicitações não está disponível em produção." },
      { status: 503 },
    );
  }
  const submissions = await listSubmissions();
  return NextResponse.json({ submissions });
}

export async function DELETE(request: Request) {
  const token = getTokenFromRequest(request);
  const hasCookie = await cookieAuth();
  if (!token && !hasCookie) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  }

  const base = getAgenciaHubApiBaseUrl();
  if (base && token) {
    try {
      const res = await fetch(
        `${base}/agency/solicitacao-submissions/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 204 || res.ok) {
        return NextResponse.json({ ok: true });
      }
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      return NextResponse.json(
        { error: body.message ?? "Não foi possível remover" },
        { status: res.status },
      );
    } catch (e) {
      console.error("[solicitacao-submissions] DELETE:", e);
      return NextResponse.json(
        { error: "Erro de conexão com o servidor" },
        { status: 502 },
      );
    }
  }

  if (!hasCookie) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!isLocalSolicitacaoStoreEnabled()) {
    return NextResponse.json(
      { error: "Serviço de solicitações não está disponível em produção." },
      { status: 503 },
    );
  }
  const ok = await removeSubmission(id);
  if (!ok) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const token = getTokenFromRequest(request);
  const hasCookie = await cookieAuth();
  if (!token && !hasCookie) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const base = getAgenciaHubApiBaseUrl();
  if (!base || !token) {
    if (!hasCookie || !isLocalSolicitacaoStoreEnabled()) return NextResponse.json({ error: "A caixa de entrada exige a API configurada." }, { status: 503 });
    const status = (payload as { status?: unknown }).status;
    if (status !== "PENDING" && status !== "ARCHIVED" && status !== "DELETED" && status !== "CONVERTED") return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    const ok = await updateSubmissionStatus(id, status);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  try {
    const res = await fetch(`${base}/agency/solicitacao-submissions/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok || res.status === 204) return NextResponse.json({ ok: true });
    const body = await res.json().catch(() => ({})) as { message?: string };
    return NextResponse.json({ error: body.message ?? "Não foi possível atualizar a solicitação" }, { status: res.status });
  } catch (error) {
    console.error("[solicitacao-submissions] PATCH:", error);
    return NextResponse.json({ error: "Erro de conexão com o servidor" }, { status: 502 });
  }
}
