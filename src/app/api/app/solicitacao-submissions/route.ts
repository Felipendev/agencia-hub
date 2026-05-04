import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  listSubmissions,
  removeSubmission,
} from "@/lib/solicitacao-server-store";

export const runtime = "nodejs";

async function requireAuth(): Promise<boolean> {
  const jar = await cookies();
  return jar.get("ah_auth")?.value === "1";
}

export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const submissions = await listSubmissions();
  return NextResponse.json({ submissions });
}

export async function DELETE(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  }
  const ok = await removeSubmission(id);
  if (!ok) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
