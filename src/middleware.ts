import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/clientes",
  "/financeiro",
  "/atendimentos",
  "/cotacoes",
  "/vendedores",
  "/meu-painel",
  "/agencia",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!needsAuth) return NextResponse.next();

  const auth = request.cookies.get("ah_auth");
  if (!auth?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard", "/dashboard/:path*",
    "/clientes", "/clientes/:path*",
    "/financeiro", "/financeiro/:path*",
    "/atendimentos", "/atendimentos/:path*",
    "/cotacoes", "/cotacoes/:path*",
    "/vendedores", "/vendedores/:path*",
    "/meu-painel", "/meu-painel/:path*",
    "/agencia", "/agencia/:path*",
  ],
};
