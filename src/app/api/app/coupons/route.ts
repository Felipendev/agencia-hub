import { NextResponse } from "next/server";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

export const runtime = "nodejs";

function getToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}

async function proxyJson(res: Response) {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return NextResponse.json({ error: body.message ?? "Erro" }, { status: res.status });
  }
  return NextResponse.json(await res.json());
}

export async function GET(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const base = getAgenciaHubApiBaseUrl();
  if (!base) return NextResponse.json([]);

  const res = await fetch(`${base}/agency/coupons`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  return proxyJson(res);
}

export async function POST(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const base = getAgenciaHubApiBaseUrl();
  if (!base) return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 });

  const body = await request.text();
  const res = await fetch(`${base}/agency/coupons`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body,
  });
  return proxyJson(res);
}

export async function PATCH(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  const base = getAgenciaHubApiBaseUrl();
  if (!base) return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 });

  const body = await request.text();
  const res = await fetch(`${base}/agency/coupons/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body,
  });
  return proxyJson(res);
}

export async function DELETE(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  const base = getAgenciaHubApiBaseUrl();
  if (!base) return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 });

  const res = await fetch(`${base}/agency/coupons/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204 || res.ok) return NextResponse.json({ ok: true });
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return NextResponse.json({ error: body.message ?? "Erro" }, { status: res.status });
}
