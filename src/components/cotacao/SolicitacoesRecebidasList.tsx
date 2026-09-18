"use client";

import { useMemo, useState } from "react";
import { Archive, Inbox, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportarSubmissaoModal } from "@/components/cotacao/ImportarSubmissaoModal";
import { useSolicitacaoSubmissions } from "@/hooks/useSolicitacaoSubmissions";
import type { SolicitacaoPublicSubmission } from "@/types/solicitacao-publica";

type Tab = "PENDING" | "CONVERTED" | "ARCHIVED" | "DELETED";
const tabs: { id: Tab; label: string }[] = [
  { id: "PENDING", label: "Pendentes" }, { id: "CONVERTED", label: "Convertidas" },
  { id: "ARCHIVED", label: "Arquivadas" }, { id: "DELETED", label: "Lixeira" },
];
function statusOf(submission: SolicitacaoPublicSubmission): Tab { return (submission.status ?? "PENDING") as Tab; }

export function SolicitacoesRecebidasList() {
  const { list, selectedSubmission, setSelectedSubmission, handleImport, mergedClientes, updateStatus } = useSolicitacaoSubmissions();
  const [tab, setTab] = useState<Tab>("PENDING");
  const [changingId, setChangingId] = useState<string | null>(null);
  const visible = useMemo(() => list.filter((submission) => statusOf(submission) === tab), [list, tab]);
  async function changeStatus(submission: SolicitacaoPublicSubmission, status: "PENDING" | "ARCHIVED" | "DELETED") {
    setChangingId(submission.id); try { await updateStatus(submission, status); } finally { setChangingId(null); }
  }
  if (list.length === 0) return null;
  return <>
    <section className="rounded-xl border border-[var(--hub-border)] bg-[var(--hub-card)] shadow-[var(--hub-shadow-sm)]">
      <div className="flex items-center gap-2 border-b border-[var(--hub-border)] px-4 py-3"><Inbox className="h-4 w-4 text-amber-500" /><p className="text-sm font-semibold text-[var(--hub-text-primary)]">Caixa de entrada do link público</p></div>
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--hub-border)] px-3 py-2">{tabs.map((item) => {
        const count = list.filter((submission) => statusOf(submission) === item.id).length;
        return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`rounded-full px-3 py-1 text-xs font-medium ${tab === item.id ? "bg-[var(--hub-text-primary)] text-white" : "text-[var(--hub-text-muted)] hover:bg-[var(--hub-bg-subtle)]"}`}>{item.label} ({count})</button>;
      })}</div>
      <div className="divide-y divide-[var(--hub-border)]">
        {visible.length === 0 && <p className="px-4 py-6 text-sm text-[var(--hub-text-muted)]">Nenhuma solicitação nesta lista.</p>}
        {visible.map((submission) => {
          const busy = changingId === submission.id;
          return <div key={submission.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <div className="min-w-0 flex-1"><p className="font-medium text-[var(--hub-text-primary)]">{submission.nome}</p><p className="text-xs text-[var(--hub-text-muted)]">{new Date(submission.createdAt).toLocaleString("pt-BR")} · {submission.slug}{submission.referralSellerName ? ` · ${submission.referralSellerName}` : ""}</p></div>
            {tab === "PENDING" && <><Button type="button" variant="secondary" className="text-xs" onClick={() => setSelectedSubmission(submission)}>Criar cotação</Button><button type="button" disabled={busy} title="Arquivar" onClick={() => void changeStatus(submission, "ARCHIVED")} className="rounded p-1 text-[var(--hub-text-muted)] hover:bg-[var(--hub-bg-subtle)]"><Archive className="h-4 w-4" /></button><button type="button" disabled={busy} title="Mover para lixeira" onClick={() => void changeStatus(submission, "DELETED")} className="rounded p-1 text-[var(--hub-text-muted)] hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></>}
            {tab === "ARCHIVED" && <><Button type="button" variant="secondary" className="text-xs" onClick={() => void changeStatus(submission, "PENDING")} disabled={busy}>Reabrir</Button><button type="button" disabled={busy} title="Mover para lixeira" onClick={() => void changeStatus(submission, "DELETED")} className="rounded p-1 text-[var(--hub-text-muted)] hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></>}
            {tab === "DELETED" && <Button type="button" variant="secondary" className="text-xs" onClick={() => void changeStatus(submission, "PENDING")} disabled={busy}><RotateCcw className="mr-1 h-3.5 w-3.5" />Restaurar</Button>}
            {tab === "CONVERTED" && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Cotação criada</span>}
          </div>;
        })}
      </div>
    </section>
    {selectedSubmission && <ImportarSubmissaoModal open onClose={() => setSelectedSubmission(null)} submission={selectedSubmission} clientes={mergedClientes} onImport={handleImport} />}
  </>;
}
