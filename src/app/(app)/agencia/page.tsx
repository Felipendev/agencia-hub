"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AbaAgencia } from "./_aba-agencia";
import { AbaEndereco } from "./_aba-endereco";
import { AbaFormulario } from "./_aba-formulario";
import { AbaEquipe } from "./_aba-equipe";
import { AbaSeguranca } from "./_aba-seguranca";
import { AbaNotificacoes } from "./_aba-notificacoes";
import { PageHeader } from "@/components/layout/page-header";

type Aba = "agencia" | "endereco" | "formulario" | "equipe" | "seguranca" | "notificacoes";

const ABAS: { id: Aba; label: string }[] = [
  { id: "agencia",       label: "Agência"               },
  { id: "endereco",      label: "Endereço"              },
  { id: "formulario",    label: "Formulário de Cotação" },
  { id: "equipe",        label: "Equipe"                },
  { id: "seguranca",     label: "Segurança"             },
  { id: "notificacoes",  label: "Notificações"          },
];

const VALID_ABAS = new Set<string>(ABAS.map((a) => a.id));

export default function AgenciaPage() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Persist active tab via URL search param ?aba=xxx
  const abaFromUrl = searchParams.get("aba") ?? "";
  const aba: Aba = VALID_ABAS.has(abaFromUrl) ? (abaFromUrl as Aba) : "agencia";

  const setAba = useCallback((newAba: Aba) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("aba", newAba);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  if (user?.accountKind !== "AGENCY_OWNER") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[var(--hub-text-muted)]">Acesso restrito ao gestor da agência.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agência"
        description="Gerencie os dados da sua agência, formulário público e equipe."
      />

      {/* Abas */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--hub-border)]">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors ${
              aba === a.id
                ? "border-b-2 border-[var(--hub-blue)] text-[var(--hub-blue)]"
                : "text-[var(--hub-text-muted)] hover:text-[var(--hub-text-secondary)]"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === "agencia"      && <AbaAgencia />}
      {aba === "endereco"     && <AbaEndereco />}
      {aba === "formulario"   && <AbaFormulario />}
      {aba === "equipe"       && <AbaEquipe token={token} />}
      {aba === "seguranca"    && <AbaSeguranca />}
      {aba === "notificacoes" && <AbaNotificacoes />}
    </div>
  );
}
