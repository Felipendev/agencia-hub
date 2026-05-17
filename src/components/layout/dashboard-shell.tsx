"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import {
  IconDocument,
  IconLayout,
  IconMenu,
  IconUsers,
  IconWallet,
  IconX,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { TrialBanner } from "@/components/ui/trial-banner";
import { TermsAcceptanceModal } from "@/components/ui/terms-acceptance-modal";
import { ChangePasswordModal } from "@/components/ui/change-password-modal";
import { IdleTimeout } from "@/components/idle-timeout";

const iconMap = {
  layout:   IconLayout,
  users:    IconUsers,
  document: IconDocument,
  wallet:   IconWallet,
} as const;

type NavItem = { href: string; label: string; icon: keyof typeof iconMap };
type NavGroup = { label: string; items: NavItem[] };

const OWNER_GROUPS: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard",   label: "Dashboard",             icon: "layout"   },
      { href: "/cotacoes",    label: "Cotações",              icon: "document" },
      { href: "/clientes",    label: "Clientes",              icon: "users"    },
    ],
  },
  {
    label: "Operacional",
    items: [
      { href: "/calculadora", label: "Calculadora de Milhas", icon: "document" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/financeiro",  label: "Financeiro",            icon: "wallet"   },
    ],
  },
  {
    label: "Equipe",
    items: [
      { href: "/vendedores",          label: "Equipe",              icon: "users"  },
      { href: "/vendedores/convidar", label: "Convidar Agente",     icon: "users"  },
    ],
  },
  {
    label: "Configurações",
    items: [
      { href: "/agencia", label: "Agência", icon: "layout" },
    ],
  },
];

const SELLER_GROUPS: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/meu-painel",  label: "Meu Painel",            icon: "layout"   },
      { href: "/cotacoes",    label: "Cotações",              icon: "document" },
      { href: "/clientes",    label: "Clientes",              icon: "users"    },
    ],
  },
  {
    label: "Operacional",
    items: [
      { href: "/calculadora", label: "Calculadora de Milhas", icon: "document" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/minhas-comissoes", label: "Minhas Comissões", icon: "wallet" },
    ],
  },
];

function NavGroupSection({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="mb-4">
      <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
        {group.label}
      </p>
      <div className="space-y-0.5">
        {group.items.map((item) => {
          const Icon = iconMap[item.icon];
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/meu-painel" &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-2.5 rounded-[var(--hub-radius)] px-3 py-2 text-sm transition-all ${
                active
                  ? "bg-white/15 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
                  : "text-white/65 hover:bg-white/8 hover:text-white/90"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 transition-opacity ${active ? "opacity-100" : "opacity-60 group-hover:opacity-80"}`} />
              <span className="flex-1 truncate">{item.label}</span>
              {active && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hub-yellow)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SidebarContent({
  groups,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <NavGroupSection
          key={group.label}
          group={group}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isReady } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewAsSeller, setViewAsSeller] = useState(false);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--hub-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--hub-blue-muted)] border-t-[var(--hub-blue)]" />
          <p className="text-sm text-[var(--hub-text-muted)]">Carregando…</p>
        </div>
      </div>
    );
  }

  const empresa     = user?.empresa     ?? "Agência";
  const nome        = user?.nome        ?? "Usuário";
  const accountKind = user?.accountKind ?? "AGENCY_OWNER";
  const isOwner     = accountKind === "AGENCY_OWNER";
  const groups      = (!isOwner || viewAsSeller) ? SELLER_GROUPS : OWNER_GROUPS;

  const roleLabel = isOwner ? "Gestor" : "Vendedor";
  const initials  = nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-screen bg-[var(--hub-bg)]">
      <IdleTimeout />
      <TermsAcceptanceModal />
      <ChangePasswordModal />

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 flex-col bg-[var(--hub-blue-dark)] text-white lg:flex">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-white/8 px-4">
          <Image src="/compass.svg" alt="Compass" width={28} height={28} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/40">AgênciasHub</p>
            <p className="truncate text-xs font-semibold leading-tight text-white/90">{empresa}</p>
          </div>
        </div>

        <SidebarContent groups={groups} pathname={pathname} />

        {/* Footer */}
        <div className="border-t border-white/8 px-3 py-3 space-y-2">
          <div className="flex items-center gap-2 rounded-[var(--hub-radius)] px-2 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white/90 leading-tight">{nome}</p>
              <p className="text-[10px] text-white/40 leading-tight">{roleLabel}</p>
            </div>
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() => setViewAsSeller(!viewAsSeller)}
              className="w-full rounded-[var(--hub-radius-sm)] border border-white/10 px-3 py-1.5 text-[10px] font-medium text-white/50 transition-colors hover:border-white/20 hover:bg-white/8 hover:text-white/80"
            >
              {viewAsSeller ? "← Perfil Gestor" : "Ver como Vendedor"}
            </button>
          )}
          <button
            type="button"
            onClick={() => { logout(); router.push("/login"); }}
            className="w-full rounded-[var(--hub-radius-sm)] border border-white/10 px-3 py-1.5 text-[10px] font-medium text-white/50 transition-colors hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ──────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-200 ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Mobile drawer ───────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(240px,85%)] flex-col bg-[var(--hub-blue-dark)] text-white shadow-[var(--hub-shadow-lg)] transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/8 px-4">
          <div className="flex items-center gap-2">
            <Image src="/compass.svg" alt="Compass" width={24} height={24} />
            <span className="text-sm font-bold tracking-tight text-white/90">AgênciasHub</span>
          </div>
          <button
            type="button"
            className="rounded-[var(--hub-radius-sm)] p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <SidebarContent groups={groups} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[var(--hub-border)] bg-white/95 px-4 shadow-[var(--hub-shadow-xs)] backdrop-blur supports-[backdrop-filter]:bg-white/85 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-[var(--hub-radius-sm)] p-1.5 text-[var(--hub-text-secondary)] hover:bg-[var(--hub-bg-subtle)] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <p className="hidden truncate text-sm font-semibold text-[var(--hub-text-primary)] sm:block">
              {empresa}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch />
            <NotificationBell />
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-[var(--hub-text-primary)] leading-tight">{nome}</p>
              <p className="text-[10px] text-[var(--hub-text-muted)] leading-tight">{roleLabel}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { logout(); router.push("/login"); }}
            >
              Sair
            </Button>
          </div>
        </header>

        <TrialBanner
          trialEndsAt={user?.trialEndsAt ?? null}
          status={user?.agencyStatus ?? ""}
        />

        <main className="flex-1 px-4 py-6 lg:px-6 lg:py-8 animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}
