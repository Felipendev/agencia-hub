import { NextResponse } from "next/server";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

export const runtime = "nodejs";

type CheckinPreferencesDTO = {
  startEnabled: boolean;
  startDays: number;
  endEnabled: boolean;
  endDays: number;
};

const DEFAULTS: CheckinPreferencesDTO = {
  startEnabled: false,
  startDays: 2,
  endEnabled: false,
  endDays: 2,
};

function getToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function GET(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const base = getAgenciaHubApiBaseUrl();
  if (!base) return NextResponse.json(DEFAULTS);

  const res = await fetch(`${base}/agency/checkin-notifications/preferences`, {
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

  let body: CheckinPreferencesDTO;
  try {
    body = (await request.json()) as CheckinPreferencesDTO;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const base = getAgenciaHubApiBaseUrl();
  if (!base) return NextResponse.json(body);

  const res = await fetch(`${base}/agency/checkin-notifications/preferences`, {
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
