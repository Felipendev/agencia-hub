import { NextResponse } from "next/server";
import type { CotacaoDetalhes } from "@/types";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { isUuid } from "@/lib/api/quotation-mapper";
import { brPhoneDigits, isValidBrazilianPhone } from "@/lib/br-phone";
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
  /** UUID do vendedor/dono (query ?vendedor= no link público, quando for UUID) */
  referralSellerId?: string;
  /** Código público do vendedor em ?vendedor= quando não for UUID */
  sellerPublicCode?: string | null;
  /** Consentimento LGPD — obrigatório no formulário público */
  consentimentoLgpd?: boolean;
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
  const det = body.detalhes ?? {};
  const telefoneDigits =
    brPhoneDigits((body.telefone ?? "").trim()) ||
    brPhoneDigits((det.celular as string | undefined) ?? "");
  if (!nome || !telefoneDigits) {
    return NextResponse.json(
      { error: "Nome e celular são obrigatórios" },
      { status: 400 },
    );
  }
  if (!isValidBrazilianPhone(telefoneDigits)) {
    return NextResponse.json(
      { error: "Informe um celular válido com DDD (10 ou 11 dígitos)." },
      { status: 400 },
    );
  }

  const temTrecho =
    Array.isArray(det.destinosTrechos) &&
    det.destinosTrechos.some((x) => x?.trim());
  if (!det.destinoForm?.trim() && !det.origem?.trim() && !temTrecho) {
    return NextResponse.json(
      { error: "Informe origem e/ou destino" },
      { status: 400 },
    );
  }

  const referralRaw = (body.referralSellerId ?? "").trim();
  const referralSellerId =
    referralRaw && isUuid(referralRaw) ? referralRaw : undefined;
  const sellerPublicCode = body.sellerPublicCode?.trim() || null;

  const payload = {
    slug,
    nome,
    email,
    telefone: telefoneDigits,
    detalhes: det,
    observacoes: body.observacoes ?? "",
    consentimentoLgpd: body.consentimentoLgpd === true,
    ...(referralSellerId ? { referralSellerId } : {}),
    ...(sellerPublicCode ? { sellerPublicCode } : {}),
  };

  const base = getAgenciaHubApiBaseUrl();
  if (base) {
    try {
      const res = await fetch(`${base}/public/solicitacao/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      const contentType =
        res.headers.get("Content-Type") ?? "application/json";

      if (res.ok) {
        return new NextResponse(text, {
          status: res.status,
          headers: { "Content-Type": contentType },
        });
      }

      let message = "Falha ao enviar.";
      try {
        const j = JSON.parse(text) as {
          message?: string;
          error?: string;
        };
        message = j.error ?? j.message ?? message;
      } catch {
        /* ignore */
      }
      return NextResponse.json({ error: message }, { status: res.status });
    } catch (err) {
      console.error("[solicitacao/submit] Erro ao chamar API Java:", err);
      return NextResponse.json(
        { error: "Erro de conexão com o servidor. Tente novamente." },
        { status: 502 },
      );
    }
  }

  if (process.env.VERCEL === "1") {
    return NextResponse.json(
      {
        error:
          "Serviço de orçamentos não configurado. Defina NEXT_PUBLIC_AGENCIA_HUB_API_URL na Vercel apontando para a API Java.",
      },
      { status: 503 },
    );
  }

  await getPublicConfig(slug);

  try {
    const created = await addSubmission({
      slug,
      nome,
      email,
      telefone: telefoneDigits,
      detalhes: det as CotacaoDetalhes,
      observacoes: body.observacoes ?? "",
      referralSellerId,
      sellerPublicCode,
      consentimentoLgpd: body.consentimentoLgpd === true,
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    console.error("[solicitacao/submit] falha ao persistir localmente", err);
    return NextResponse.json(
      {
        error:
          "Não foi possível registrar o envio no momento. Tente novamente em instantes.",
      },
      { status: 503 },
    );
  }
}
