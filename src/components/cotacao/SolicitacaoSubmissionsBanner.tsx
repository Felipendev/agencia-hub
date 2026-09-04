"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImportarSubmissaoModal } from "@/components/cotacao/ImportarSubmissaoModal";
import { useSolicitacaoSubmissions } from "@/hooks/useSolicitacaoSubmissions";
import { useData } from "@/contexts/data-context";
import { RefreshCw, X } from "lucide-react";

const STORAGE_KEY = "submissions-dismissed-ids";

function loadDismissedIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissedIds(ids: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function SolicitacaoSubmissionsBanner() {
  const {
    list, refresh, selectedSubmission, setSelectedSubmission, handleImport, mergedClientes,
    isRefreshing, refreshError,
  } =
    useSolicitacaoSubmissions();
  const { cotacoes } = useData();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(loadDismissedIds);

  const importedPublicIds = useMemo(
    () =>
      new Set(
        cotacoes
          .filter((c) => c.origemCriacao === "formulario_publico" && c.publicSubmissionId)
          .map((c) => c.publicSubmissionId!),
      ),
    [cotacoes],
  );

  const pendingList = list.filter(
    (s) => !dismissedIds.has(s.id) && !importedPublicIds.has(s.id),
  );

  const handleDismiss = useCallback(() => {
    const updated = new Set([...dismissedIds, ...list.map((s) => s.id)]);
    setDismissedIds(updated);
    saveDismissedIds(updated);
  }, [dismissedIds, list]);

  return (
    <>
      <div className="rounded-[var(--hub-radius-lg)] border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-amber-950">
              {pendingList.length === 0
                ? "Solicitações recebidas"
                : pendingList.length === 1
                ? "1 solicitação recebida pelo link público"
                : `${pendingList.length} solicitações recebidas pelo link público`}
            </p>
            <p className="mt-1 text-xs text-amber-900/90">
              {pendingList.length === 0
                ? "Use Atualizar para consultar novas solicitações. Não há consulta automática."
                : "Importe para criar ou vincular a um cliente existente e adicionar a cotação no quadro."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" variant="secondary" size="sm" onClick={() => void refresh()} disabled={isRefreshing}>
              <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            {pendingList.length > 0 && (
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded p-0.5 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
                aria-label="Fechar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {refreshError && <p className="mt-2 text-xs font-medium text-red-700">{refreshError}</p>}
        {pendingList.length > 0 && <ul className="mt-3 space-y-2">
          {pendingList.map((s) => (
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
        </ul>}
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
