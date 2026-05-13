import { NextResponse } from "next/server";
import type { CotacaoDetalhes } from "@/types";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { addSubmission, getPublicConfig } from "@/lib/solicitacao-server-store";
import { isValidSolicitacaoSlug } from "@/lib/solicitacao-slug";

export const runtime = "nodejs";

type Body = {
  slug?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  detalhes?: Partial<CotacaoDetalhes>;
  observacoes?: string;
  sellerPublicCode?: string | null;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim();
  if (!slug || !isValidSolicitacaoSlug(slug)) {
    return NextResponse.json({ error: "Identificador da página inválido" }, { status: 400 });
  }

  const nome = (body.nome ?? "").trim();
  const email = (body.email ?? "").trim();
  const telefone = (body.telefone ?? "").trim();
  if (!nome || !telefone) {
    return NextResponse.json(
      { error: "Nome e celular são obrigatórios" },
      { status: 400 },
    );
  }

  const det = body.detalhes ?? {};
  const temTrecho =
    Array.isArray(det.destinosTrechos) &&
    det.destinosTrechos.some((x) => x?.trim());
  if (!det.destinoForm?.trim() && !det.origem?.trim() && !temTrecho) {
    return NextResponse.json(
      { error: "Informe origem e/ou destino" },
      { status: 400 },
    );
  }

  const sellerPublicCode = body.sellerPublicCode?.trim() || null;

  const base = getAgenciaHubApiBaseUrl();
  if (base) {
    try {
      const res = await fetch(`${base}/public/solicitacao/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          nome,
          email,
          telefone,
          detalhes: det,
          observacoes: body.observacoes ?? "",
          referralSellerId: null,
          sellerPublicCode,
        }),
      });

      const rawText = await res.text();
      let payload: {
        ok?: boolean;
        id?: string;
        message?: string;
        code?: string;
      } = {};
      if (rawText) {
        try {
          payload = JSON.parse(rawText) as typeof payload;
        } catch {
          return NextResponse.json(
            { error: "Resposta inválida do servidor." },
            { status: 502 },
          );
        }
      }

      if (!res.ok) {
        const status =
          res.status >= 400 && res.status < 600 ? res.status : 502;
        return NextResponse.json(
          { error: payload.message ?? "Falha ao enviar." },
          { status },
        );
      }

      return NextResponse.json({
        ok: true,
        id: payload.id ?? "",
      });
    } catch (err) {
      console.error("[public/solicitacao/submit] Erro ao enviar ao backend:", err);
      return NextResponse.json(
        { error: "Não foi possível contactar o servidor." },
        { status: 502 },
      );
    }
  }

  await getPublicConfig(slug);

  const created = await addSubmission({
    slug,
    nome,
    email,
    telefone,
    detalhes: det as CotacaoDetalhes,
    observacoes: body.observacoes ?? "",
    sellerPublicCode,
  });

  return NextResponse.json({ ok: true, id: created.id });
}
