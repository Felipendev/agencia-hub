"use client";

import { Button } from "@/components/ui/button";
import { ImportarSubmissaoModal } from "@/components/cotacao/ImportarSubmissaoModal";
import { useSolicitacaoSubmissions } from "@/hooks/useSolicitacaoSubmissions";
import { Inbox } from "lucide-react";

export function SolicitacoesRecebidasList() {
  const { list, selectedSubmission, setSelectedSubmission, handleImport, mergedClientes } =
    useSolicitacaoSubmissions();

  if (list.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-[var(--hub-border)] bg-[var(--hub-card)] shadow-[var(--hub-shadow-sm)]">
        <div className="flex items-center gap-2 border-b border-[var(--hub-border)] px-4 py-3">
          <Inbox className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-semibold text-[var(--hub-text-primary)]">
            Solicitações recebidas pelo link público
          </p>
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            {list.length}
          </span>
        </div>
        <div className="divide-y divide-[var(--hub-border)]">
          {list.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-4 py-2.5 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium text-[var(--hub-text-primary)]">
                  {s.nome}
                </span>
                <span className="ml-2 text-xs text-[var(--hub-text-muted)]">
                  {new Date(s.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <span className="hidden shrink-0 text-xs text-[var(--hub-text-muted)] sm:inline">
                {s.slug}
                {s.referralSellerName
                  ? ` · ${s.referralSellerName}`
                  : s.sellerPublicCode
                    ? ` · ${s.sellerPublicCode}`
                    : ""}
              </span>
              <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                Pendente
              </span>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 text-xs"
                onClick={() => setSelectedSubmission(s)}
              >
                Importar
              </Button>
            </div>
          ))}
        </div>
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
