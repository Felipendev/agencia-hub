"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import {
  IconBriefcase,
  IconChevronRight,
  IconDocument,
  IconLayout,
  IconMenu,
  IconUsers,
  IconWallet,
  IconX,
  TrashIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { TrialBanner } from "@/components/ui/trial-banner";
import { TermsAcceptanceModal } from "@/components/ui/terms-acceptance-modal";
import { ChangePasswordModal } from "@/components/ui/change-password-modal";

// ─── Tipos ───────────────────────────────────────────────────────────────────

const iconMap = {
  layout:    IconLayout,
  users:     IconUsers,
  briefcase: IconBriefcase,
  document:  IconDocument,
  wallet:    IconWallet,
  trash:     TrashIcon,
} as const;

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof iconMap;
  ownerOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
  ownerOnly?: boolean;
};

// ─── Navegação por grupos ─────────────────────────────────────────────────────

const OWNER_GROUPS: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard",    label: "Dashboard",    icon: "layout"    },
      { href: "/cotacoes",     label: "Cotacoes",     icon: "document"  },
      { href: "/clientes",     label: "Clientes",     icon: "users"     },
      { href: "/lixeira",      label: "Lixeira",      icon: "trash"     },
    ],
  },
  {
    label: "Operacional",
    items: [
      { href: "/atendimentos", label: "Atendimentos",        icon: "briefcase" },
      { href: "/calculadora",  label: "Calculadora de Milhas", icon: "document"  },
    ],
  },
  {
    label: "Financeiro",
    ownerOnly: true,
    items: [
      { href: "/financeiro",   label: "Financeiro",   icon: "wallet"    },
    ],
  },
  {
    label: "Equipe",
    ownerOnly: true,
    items: [
      { href: "/vendedores/convidar", label: "Convidar Vendedores", icon: "users" },
    ],
  },
  {
    label: "Agencia",
    ownerOnly: true,
    items: [
      { href: "/agencia",      label: "Agencia",      icon: "layout"    },
    ],
  },
];

const SELLER_GROUPS: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/meu-painel",   label: "Meu Painel",       icon: "layout"   },
      { href: "/cotacoes",     label: "Minhas Cotações",  icon: "document" },
      { href: "/clientes",     label: "Meus Clientes",    icon: "users"    },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/minhas-comissoes", label: "Minhas Comissões", icon: "wallet" },
    ],
  },
];

// ─── Componente de grupo colapsavel ──────────────────────────────────────────

function NavGroup({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(true); // começa aberto

  return (
    <div className="mb-1">
      {/* Header do grupo */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors"
      >
        {group.label}
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M8 10.5L2.5 5h11L8 10.5z" />
        </svg>
      </button>

      {/* Items */}
      {open && (
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
                {active && (
                  <IconChevronRight className="ml-auto h-3.5 w-3.5 text-[var(--hub-yellow)]" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar content (extracted to avoid re-creation during render) ──────────

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
    <nav className="flex flex-1 flex-col gap-0 p-3 overflow-y-auto">
      {groups.map((group) => (
        <NavGroup
          key={group.label}
          group={group}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

// ─── Shell principal ──────────────────────────────────────────────────────────

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const empresa  = user?.empresa ?? "Agencia";
  const nome     = user?.nome    ?? "Usuario";
  const role     = user?.role    ?? "OWNER";
  const [viewAsSeller, setViewAsSeller] = useState(false);
  const groups   = (role === "SELLER" || viewAsSeller) ? SELLER_GROUPS : OWNER_GROUPS;

  return (
    <div className="flex min-h-screen bg-[var(--hub-bg)]">
      {/* Terms acceptance blocking modal */}
      <TermsAcceptanceModal />
      {/* Force password change blocking modal */}
      <ChangePasswordModal />

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--hub-border)] bg-[var(--hub-blue-dark)] text-white lg:flex">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--hub-yellow)] text-xs font-bold text-[var(--hub-blue-dark)]">
            AH
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-white/50 uppercase tracking-wide">AgênciasHub</p>
            <p className="truncate text-sm font-semibold leading-tight">{empresa}</p>
          </div>
        </div>

        <SidebarContent groups={groups} pathname={pathname} />

        {/* Footer com role */}
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-bold uppercase tracking-wide ${
                role === "OWNER"
                  ? "bg-[var(--hub-yellow)] text-[var(--hub-blue-dark)]"
                  : "bg-white/20 text-white"
              }`}
            >
              {role === "OWNER" ? "Gestor" : "Vendedor"}
            </span>
            <p className="truncate text-xs text-white/40">{user?.email}</p>
          </div>
          {role === "OWNER" && (
            <button
              type="button"
              onClick={() => setViewAsSeller(!viewAsSeller)}
              className="mt-2 w-full rounded-lg border border-white/20 px-3 py-1.5 text-[10px] font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              {viewAsSeller ? "← Voltar ao perfil Gestor" : "👁 Ver como Vendedor"}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(260px,100%)] flex-col bg-[var(--hub-blue-dark)] text-white transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <span className="text-base font-bold tracking-tight">AgênciasHub</span>
          <button
            type="button"
            className="rounded-lg p-2 text-white/70 hover:bg-white/10"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent groups={groups} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[var(--hub-border)] bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--hub-blue)] hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <p className="truncate text-sm font-semibold text-[var(--hub-blue-dark)] hidden sm:block">
              {empresa}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch />
            <NotificationBell />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[var(--hub-blue-dark)]">{nome}</p>
              <p className="text-xs text-slate-500">
                {role === "OWNER" ? "Gestor" : "Vendedor"}
              </p>
            </div>
            <Button
              variant="secondary"
              className="!py-1.5 text-xs"
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
        <main className="flex-1 px-4 py-6 lg:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
