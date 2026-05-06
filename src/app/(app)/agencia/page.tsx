"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AbaAgencia } from "./_aba-agencia";
import { AbaEndereco } from "./_aba-endereco";
import { AbaFormulario } from "./_aba-formulario";
import { AbaEquipe } from "./_aba-equipe";
import { AbaSeguranca } from "./_aba-seguranca";

type Aba = "agencia" | "endereco" | "formulario" | "equipe" | "seguranca";

const ABAS: { id: Aba; label: string }[] = [
  { id: "agencia",    label: "Agencia"               },
  { id: "endereco",   label: "Endereco"              },
  { id: "formulario", label: "Formulario de Cotacao" },
  { id: "equipe",     label: "Equipe"                },
  { id: "seguranca",  label: "Segurança"             },
];

export default function AgenciaPage() {
  const { user, token } = useAuth();
  const [aba, setAba] = useState<Aba>("agencia");

  if (user?.role !== "OWNER") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Acesso restrito ao dono da agencia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">Agencia</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gerencie os dados da sua agencia, formulario publico e equipe.
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b border-[var(--hub-border)]">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              aba === a.id
                ? "border-b-2 border-[var(--hub-blue)] text-[var(--hub-blue)]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === "agencia"    && <AbaAgencia />}
      {aba === "endereco"   && <AbaEndereco />}
      {aba === "formulario" && <AbaFormulario />}
      {aba === "equipe"     && <AbaEquipe token={token} />}
      {aba === "seguranca"  && <AbaSeguranca />}
    </div>
  );
}
