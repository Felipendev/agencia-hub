import { NextResponse } from "next/server";

/** Cupons de exemplo — substituir por consulta ao banco / serviço real. */
const CUPONS_CADASTRO: Record<string, { expiresAt: string }> = {
  VERAO2026: { expiresAt: "2026-08-31T23:59:59.000Z" },
  AGENCIA10: { expiresAt: "2026-12-31T23:59:59.000Z" },
};

export type CupomValidateResponse = {
  valid: boolean;
  expiresAt?: string;
  message?: string;
};

export async function POST(req: Request) {
  let body: { codigo?: string };
  try {
    body = (await req.json()) as { codigo?: string };
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
  const cadastro = CUPONS_CADASTRO[codigo];
  if (!cadastro) {
    return NextResponse.json({
      valid: false,
      message: "Cupom não encontrado.",
    } satisfies CupomValidateResponse);
  }

  const exp = new Date(cadastro.expiresAt);
  if (Number.isNaN(exp.getTime()) || exp < new Date()) {
    return NextResponse.json({
      valid: false,
      expiresAt: cadastro.expiresAt,
      message: "Este cupom expirou.",
    } satisfies CupomValidateResponse);
  }

  return NextResponse.json({
    valid: true,
    expiresAt: cadastro.expiresAt,
    message: "Cupom válido.",
  } satisfies CupomValidateResponse);
}
