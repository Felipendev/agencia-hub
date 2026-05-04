import { NextResponse } from "next/server";
import type { CotacaoDetalhes } from "@/types";
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

  await getPublicConfig(slug);

  const created = await addSubmission({
    slug,
    nome,
    email,
    telefone,
    detalhes: det as CotacaoDetalhes,
    observacoes: body.observacoes ?? "",
  });

  return NextResponse.json({ ok: true, id: created.id });
}
