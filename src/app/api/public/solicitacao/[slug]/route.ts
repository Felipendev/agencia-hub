import { NextResponse } from "next/server";
import { getPublicConfig } from "@/lib/solicitacao-server-store";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const config = await getPublicConfig(decodeURIComponent(slug));
  return NextResponse.json({ config });
}
