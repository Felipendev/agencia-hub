import { NextResponse } from "next/server";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Sua sessão expirou." }, { status: 401 });
  const base = getAgenciaHubApiBaseUrl();
  if (!base) return NextResponse.json({ error: "A API de importação não está configurada." }, { status: 503 });
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data;")) return NextResponse.json({ error: "Envie um arquivo." }, { status: 400 });
  const limit = 4 * 1024 * 1024 + 65536;
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
  try {
    let size = 0;
    const chunks: ArrayBuffer[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); return NextResponse.json({ error: "Envie um arquivo de até 4 MB." }, { status: 413 }); }
      chunks.push(Uint8Array.from(value).buffer);
    }
    const response = await fetch(`${base}/flight-imports`, {
      method: "POST", headers: { Authorization: authorization, "Content-Type": contentType },
      body: new Blob(chunks), signal: AbortSignal.any([request.signal, AbortSignal.timeout(55000)]), cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return NextResponse.json({ error: payload?.message ?? "Não foi possível importar. Continue manualmente." }, { status: response.status });
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "A leitura não foi concluída. Aguarde antes de tentar novamente ou preencha manualmente." }, { status: 502 });
  } finally { reader.releaseLock(); }
}
