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
  "/calculadora",
  "/configuracoes",
];

const ADMIN_PREFIXES = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdmin = ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!needsAuth && !isAdmin) return NextResponse.next();

  const auth = request.cookies.get("ah_auth");
  if (!auth?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  // Admin routes: check ah_role cookie set at login
  if (isAdmin) {
    const role = request.cookies.get("ah_role");
    if (role?.value !== "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
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
    "/calculadora", "/calculadora/:path*",
    "/configuracoes", "/configuracoes/:path*",
    "/admin", "/admin/:path*",
  ],
};
