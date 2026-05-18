"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImportarSubmissaoModal } from "@/components/cotacao/ImportarSubmissaoModal";
import { useSolicitacaoSubmissions } from "@/hooks/useSolicitacaoSubmissions";
import { X } from "lucide-react";

export function SolicitacaoSubmissionsBanner() {
  const { list, selectedSubmission, setSelectedSubmission, handleImport, mergedClientes } =
    useSolicitacaoSubmissions({ poll: true });
  const [dismissed, setDismissed] = useState(false);

  if (list.length === 0 || dismissed) return null;

  return (
    <>
      <div className="rounded-[var(--hub-radius-lg)] border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-amber-950">
              {list.length === 1
                ? "1 solicitação recebida pelo link público"
                : `${list.length} solicitações recebidas pelo link público`}
            </p>
            <p className="mt-1 text-xs text-amber-900/90">
              Importe para criar ou vincular a um cliente existente e adicionar a
              cotação no quadro.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded p-0.5 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {list.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-2 rounded-[var(--hub-radius)] border border-amber-200/80 bg-white/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <span className="font-medium text-[var(--hub-text-primary)]">{s.nome}</span>
                <span className="ml-2 text-xs text-[var(--hub-text-muted)]">
                  {new Date(s.createdAt).toLocaleString("pt-BR")} · {s.slug}
                  {s.referralSellerName
                    ? ` · ref.: ${s.referralSellerName}`
                    : s.referralSellerId
                      ? " · link com vendedor"
                      : s.sellerPublicCode
                        ? ` · ref. vendedor ${s.sellerPublicCode}`
                        : ""}
                </span>
              </div>
              <Button
                type="button"
                className="shrink-0 text-sm"
                onClick={() => setSelectedSubmission(s)}
              >
                Importar
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {selectedSubmission && (
        <ImportarSubmissaoModal
          open={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          submission={selectedSubmission}
          clientes={mergedClientes}
          onImport={handleImport}
        />
      )}
    </>
  );
}
