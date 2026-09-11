import { NextResponse } from "next/server";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

export const runtime = "nodejs";

export type CupomValidateResponse = {
  valid: boolean;
  expiresAt?: string;
  message?: string;
};

function getToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function POST(req: Request) {
  let body: { codigo?: string; slug?: string; email?: string };
  try {
    body = (await req.json()) as { codigo?: string; slug?: string; email?: string };
  } catch {
    return NextResponse.json(
      { valid: false, message: "Requisição inválida." } satisfies CupomValidateResponse,
      { status: 400 },
    );
  }

  const raw = body.codigo?.trim();
  if (!raw || raw.length < 4) {
    return NextResponse.json({
      valid: false,
      message: "Informe um código com pelo menos 4 caracteres.",
    } satisfies CupomValidateResponse);
  }
  const codigo = raw.toUpperCase();

  const base = getAgenciaHubApiBaseUrl();
  if (!base) {
    return NextResponse.json({
      valid: false,
      message: "Serviço de cupons não está disponível.",
    } satisfies CupomValidateResponse);
  }

  try {
    // Formulário público: resolve a agência pelo slug, sem autenticação.
    // Cliente vê só aceito/recusado — nunca validade, limite de uso ou histórico (TODO-035).
    if (body.slug) {
      const email = body.email?.trim();
      if (!email) {
        return NextResponse.json({ valid: false, message: "Informe seu e-mail para validar o cupom." } satisfies CupomValidateResponse);
      }
      const res = await fetch(
        `${base}/public/coupons/validate?slug=${encodeURIComponent(body.slug)}&code=${encodeURIComponent(codigo)}&email=${encodeURIComponent(email)}`,
      );
      if (!res.ok) {
        return NextResponse.json({ valid: false, message: "Não foi possível validar agora." } satisfies CupomValidateResponse);
      }
      const data = (await res.json()) as { valid: boolean };
      return NextResponse.json({
        valid: data.valid,
        message: data.valid ? "Cupom válido." : "Cupom inválido.",
      } satisfies CupomValidateResponse);
    }

    // Uso interno autenticado (dono criando cotação diretamente): valida contra os cupons da própria agência.
    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ valid: false, message: "Não autorizado." } satisfies CupomValidateResponse, { status: 401 });
    }
    const res = await fetch(`${base}/agency/coupons`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json({ valid: false, message: "Não foi possível validar agora." } satisfies CupomValidateResponse);
    }
    const list = (await res.json()) as { code: string; expiresAt?: string; active: boolean; maxUses?: number; usedCount: number }[];
    const now = new Date();
    const found = list.find((c) => c.code.toUpperCase() === codigo);
    const exceeded = !!found?.maxUses && found.usedCount >= found.maxUses;
    if (!found || !found.active || (found.expiresAt && new Date(found.expiresAt) < now) || exceeded) {
      return NextResponse.json({
        valid: false,
        expiresAt: found?.expiresAt,
        message: !found ? "Cupom não encontrado." : exceeded ? "Este cupom atingiu o limite de usos." : "Este cupom expirou ou está inativo.",
      } satisfies CupomValidateResponse);
    }
    return NextResponse.json({
      valid: true,
      expiresAt: found.expiresAt,
      message: "Cupom válido.",
    } satisfies CupomValidateResponse);
  } catch (e) {
    console.error("[cupom/validate]", e);
    return NextResponse.json({ valid: false, message: "Não foi possível validar agora. Tente de novo." } satisfies CupomValidateResponse);
  }
}
