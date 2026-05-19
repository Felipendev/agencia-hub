"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImportarSubmissaoModal } from "@/components/cotacao/ImportarSubmissaoModal";
import { useSolicitacaoSubmissions } from "@/hooks/useSolicitacaoSubmissions";
import { useData } from "@/contexts/data-context";
import { COTACAO_STATUS_LABELS } from "@/lib/constants";
import { Inbox, ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { CotacaoStatus } from "@/types";
import type { SolicitacaoPublicSubmission } from "@/types/solicitacao-publica";

const DISMISSED_KEY = "solicitacoes-recebidas-dismissed";

function loadDismissed(): Set<string> {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(DISMISSED_KEY) : null;
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

type PendingItem = {
  kind: "pending";
  id: string;
  nome: string;
  createdAt: string;
  slug: string;
  referralInfo: string;
  submission: SolicitacaoPublicSubmission;
};

type ImportedItem = {
  kind: "imported";
  id: string;
  nome: string;
  createdAt: string;
  slug: string;
  cotacaoStatus: CotacaoStatus;
};

type ListItem = PendingItem | ImportedItem;

const PAGE_SIZE = 10;

function statusStyle(status: CotacaoStatus | "pending"): string {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    aguardando: "bg-slate-50 text-slate-600 ring-slate-200",
    em_cotacao: "bg-sky-50 text-sky-700 ring-sky-200",
    aguardando_cliente: "bg-violet-50 text-violet-700 ring-violet-200",
    aprovado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    reprovado: "bg-red-50 text-red-600 ring-red-200",
    expirada: "bg-orange-50 text-orange-700 ring-orange-200",
    cancelada: "bg-gray-50 text-gray-500 ring-gray-200",
  };
  return `rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${map[status] ?? map.aguardando}`;
}

export function SolicitacoesRecebidasList() {
  const { list, selectedSubmission, setSelectedSubmission, handleImport, mergedClientes } =
    useSolicitacaoSubmissions({ poll: true });
  const { cotacoes, clientes } = useData();
  const [page, setPage] = useState(1);
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  }, []);

  // IDs of submissions that were already imported into cotacoes
  const importedPublicIds = useMemo(
    () =>
      new Set(
        cotacoes
          .filter((c) => c.origemCriacao === "formulario_publico" && c.publicSubmissionId)
          .map((c) => c.publicSubmissionId!),
      ),
    [cotacoes],
  );

  const combined = useMemo<ListItem[]>(() => {
    // Pending submissions: skip ones already imported or locally dismissed
    const pending: PendingItem[] = list
      .filter((s) => !importedPublicIds.has(s.id) && !dismissed.has(s.id))
      .map((s) => ({
        kind: "pending",
        id: s.id,
        nome: s.nome,
        createdAt: s.createdAt,
        slug: s.slug,
        referralInfo: s.referralSellerName
          ? s.referralSellerName
          : s.sellerPublicCode
            ? s.sellerPublicCode
            : "",
        submission: s,
      }));

    // Imported cotações from the public form (exclude dismissed)
    const pendingIds = new Set(list.map((s) => s.id));
    const imported: ImportedItem[] = cotacoes
      .filter(
        (c) =>
          c.origemCriacao === "formulario_publico" &&
          !pendingIds.has(c.publicSubmissionId ?? "") &&
          !dismissed.has(c.publicSubmissionId ?? ""),
      )
      .map((c) => {
        const cliente = clientes.find((cl) => cl.id === c.clienteId);
        const slug = c.tags.find((t) => t !== "formulario-web") ?? c.tags[1] ?? "";
        return {
          kind: "imported",
          id: c.id,
          nome: cliente?.nome ?? c.titulo,
          createdAt: c.createdAt,
          slug,
          cotacaoStatus: c.status,
        };
      });

    // Merge and sort newest first
    return [...pending, ...imported].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [list, cotacoes, clientes, importedPublicIds, dismissed]);

  const totalPages = Math.ceil(combined.length / PAGE_SIZE);
  const pageItems = combined.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (combined.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-[var(--hub-border)] bg-[var(--hub-card)] shadow-[var(--hub-shadow-sm)]">
        <div className="flex items-center gap-2 border-b border-[var(--hub-border)] px-4 py-3">
          <Inbox className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-semibold text-[var(--hub-text-primary)]">
            Solicitações recebidas pelo link público
          </p>
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            {combined.length}
          </span>
        </div>

        <div className="divide-y divide-[var(--hub-border)]">
          {pageItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <span className="font-medium text-[var(--hub-text-primary)]">{item.nome}</span>
                <span className="ml-2 text-xs text-[var(--hub-text-muted)]">
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <span className="hidden shrink-0 text-xs text-[var(--hub-text-muted)] sm:inline">
                {item.slug}
                {item.kind === "pending" && item.referralInfo ? ` · ${item.referralInfo}` : ""}
              </span>
              {item.kind === "pending" ? (
                <>
                  <span className={statusStyle("pending")}>Pendente</span>
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 text-xs"
                    onClick={() => setSelectedSubmission(item.submission)}
                  >
                    Importar
                  </Button>
                  <button
                    type="button"
                    title="Marcar como concluído"
                    className="shrink-0 rounded p-1 text-[var(--hub-text-muted)] hover:bg-emerald-50 hover:text-emerald-700"
                    onClick={() => dismiss(item.id)}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <span className={statusStyle(item.cotacaoStatus)}>
                  {COTACAO_STATUS_LABELS[item.cotacaoStatus]}
                </span>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--hub-border)] px-4 py-2 text-xs text-[var(--hub-text-muted)]">
            <span>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, combined.length)} de{" "}
              {combined.length}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded p-1 hover:bg-[var(--hub-bg-subtle)] disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded p-1 hover:bg-[var(--hub-bg-subtle)] disabled:opacity-40"
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
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
