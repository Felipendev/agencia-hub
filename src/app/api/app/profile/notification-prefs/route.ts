import { NextResponse } from "next/server";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

export const runtime = "nodejs";

type NotificationPrefsDTO = { notifEmailSubmissao: boolean };

function getToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function GET(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const base = getAgenciaHubApiBaseUrl();
  if (!base) {
    // Sem API Java: retorna padrão para que o frontend não quebre
    return NextResponse.json({ notifEmailSubmissao: true });
  }

  const res = await fetch(`${base}/profile/notification-prefs`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return NextResponse.json({ error: body.message ?? "Erro" }, { status: res.status });
  }
  return NextResponse.json(await res.json());
}

export async function PUT(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: NotificationPrefsDTO;
  try {
    body = (await request.json()) as NotificationPrefsDTO;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const base = getAgenciaHubApiBaseUrl();
  if (!base) {
    return NextResponse.json(body); // sem API, ecoa de volta
  }

  const res = await fetch(`${base}/profile/notification-prefs`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { message?: string };
    return NextResponse.json({ error: b.message ?? "Erro" }, { status: res.status });
  }
  return NextResponse.json(await res.json());
}
