"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { KanbanBoard } from "@/components/cotacao/KanbanBoard";
import { LinkSolicitacaoModal } from "@/components/cotacao/LinkSolicitacaoModal";
import { SolicitacaoSubmissionsBanner } from "@/components/cotacao/SolicitacaoSubmissionsBanner";
import { useToast } from "@/components/ui/toast";
import { softDeleteQuotation } from "@/lib/api/soft-delete-remote";
import { isUuid } from "@/lib/api/quotation-mapper";
import { COTACAO_STATUS_LABELS } from "@/lib/constants";
import type { CotacaoStatus } from "@/types";

function inDateRange(isoDate: string, from: string, to: string): boolean {
  const d = isoDate.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export default function CotacoesPage() {
  const { user, token } = useAuth();
  const {
    clientes,
    cotacoes,
    updateCotacao,
    isReady,
    hasRemoteApi,
    syncCotacoesFromApi,
  } = useData();

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  /** Texto no campo; filtro só muda ao clicar em Pesquisar */
  const [clienteBuscaTexto, setClienteBuscaTexto] = useState("");
  /** `null` = sem filtro por cliente; `[]` = busca sem resultados; senão ids dos clientes encontrados */
  const [filtroClienteIds, setFiltroClienteIds] = useState<string[] | null>(
    null,
  );
  const [filtroTag, setFiltroTag] = useState("");
  const [periodoDe, setPeriodoDe] = useState("");
  const [periodoAte, setPeriodoAte] = useState("");
  const [filtroAgente, setFiltroAgente] = useState("");
  const [busca, setBusca] = useState("");
  /** Filtros enviados ao backend Spring (`GET /quotations`). */
  const [filtroApiStatus, setFiltroApiStatus] = useState<CotacaoStatus | "">(
    "",
  );
  const [filtroApiBusca, setFiltroApiBusca] = useState("");

  // ── Soft-delete state ──────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const toast = useToast();

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteTarget(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    if (hasRemoteApi && token) {
      try {
        await softDeleteQuotation(deleteTarget, token);
        syncCotacoesFromApi({ token });
        toast.success("Cotação excluída com sucesso.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao excluir cotação.");
      }
    } else {
      // Modo local: remove da lista em memória via updateCotacao (marca como cancelada)
      updateCotacao(deleteTarget, { status: "cancelada" as CotacaoStatus });
      toast.success("Cotação excluída com sucesso.");
    }
    setDeleteTarget(null);
  }, [deleteTarget, token, hasRemoteApi, syncCotacoesFromApi, updateCotacao, toast]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const responsaveisOpcoes = useMemo(() => {
    const set = new Set<string>();
    for (const c of cotacoes) {
      const r = c.responsavel?.trim();
      if (r) set.add(r);
    }
    const u = user?.nome?.trim();
    if (u) set.add(u);
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [cotacoes, user?.nome]);

  const cotacoesFiltradas = useMemo(() => {
    let list = cotacoes;
    if (filtroClienteIds !== null) {
      if (filtroClienteIds.length === 0) {
        list = [];
      } else {
        const permitidos = new Set(filtroClienteIds);
        list = list.filter((c) => permitidos.has(c.clienteId));
      }
    }
    if (filtroAgente.trim()) {
      list = list.filter((c) => c.responsavel === filtroAgente);
    }
    if (filtroTag.trim()) {
      const low = filtroTag.toLowerCase();
      list = list.filter(
        (c) =>
          c.tags.some((t) => t.toLowerCase().includes(low)) ||
          c.titulo.toLowerCase().includes(low),
      );
    }
    if (periodoDe || periodoAte) {
      list = list.filter((c) =>
        inDateRange(c.validade, periodoDe, periodoAte),
      );
    }
    if (busca.trim()) {
      const low = busca.toLowerCase();
      list = list.filter(
        (c) =>
          c.titulo.toLowerCase().includes(low) ||
          c.destino.toLowerCase().includes(low) ||
          c.detalhes.origem.toLowerCase().includes(low) ||
          c.detalhes.destinoForm.toLowerCase().includes(low) ||
          (c.detalhes.destinosTrechos ?? []).some((t) =>
            t.toLowerCase().includes(low),
          ),
      );
    }
    return list;
  }, [
    cotacoes,
    filtroClienteIds,
    filtroTag,
    periodoDe,
    periodoAte,
    filtroAgente,
    busca,
  ]);

  function handleMove(id: string, status: CotacaoStatus) {
    updateCotacao(id, { status });
  }

  function aplicarBuscaCliente() {
    const q = clienteBuscaTexto.trim().toLowerCase();
    if (!q) {
      setFiltroClienteIds(null);
      return;
    }
    const ids = clientes
      .filter(
        (cl) =>
          cl.nome.toLowerCase().includes(q) ||
          cl.email.toLowerCase().includes(q),
      )
      .map((cl) => cl.id);
    setFiltroClienteIds(ids);
  }

  function limparBuscaCliente() {
    setClienteBuscaTexto("");
    setFiltroClienteIds(null);
  }

  function aplicarFiltrosServidor() {
    const cust =
      filtroClienteIds?.length === 1 && isUuid(filtroClienteIds[0]) ?
        filtroClienteIds[0]
      : undefined;
    void syncCotacoesFromApi({
      status: filtroApiStatus || undefined,
      search: filtroApiBusca.trim() || undefined,
      customerId: cust,
      token,
    });
  }

  useEffect(() => {
    if (!isReady || !hasRemoteApi) return;
    void syncCotacoesFromApi({ token });
  }, [isReady, hasRemoteApi, syncCotacoesFromApi, token]);

  if (!isReady) {
    return <p className="text-sm text-slate-600">Carregando…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">
            Cotações
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setLinkModalOpen(true)}>
            Links
          </Button>
          <Link
            href="/cotacoes/nova"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--hub-yellow)] px-4 py-2.5 text-sm font-semibold text-[var(--hub-blue-dark)] shadow-sm transition-colors hover:bg-[var(--hub-yellow-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hub-yellow)] focus-visible:ring-offset-2"
          >
            Nova cotação
          </Link>
        </div>
      </div>

      <SolicitacaoSubmissionsBanner />

      {hasRemoteApi ?
        <div className="rounded-xl border border-sky-200 bg-sky-50/90 px-4 py-4 shadow-sm">
          <p className="text-sm font-semibold text-[var(--hub-blue-dark)]">
            Atualizar lista do servidor
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Use os filtros abaixo e clique em &quot;Atualizar lista&quot; para buscar
            novamente no servidor. A busca por cliente acima continua refinando o
            quadro localmente.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="api-st">Status</Label>
              <Select
                id="api-st"
                value={filtroApiStatus}
                onChange={(e) =>
                  setFiltroApiStatus((e.target.value || "") as CotacaoStatus | "")
                }
                className="mt-1"
              >
                <option value="">Todos os status</option>
                {(Object.keys(COTACAO_STATUS_LABELS) as CotacaoStatus[]).map(
                  (id) => (
                    <option key={id} value={id}>
                      {COTACAO_STATUS_LABELS[id]}
                    </option>
                  ),
                )}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="api-q">Busca (título, destino ou nome do cliente)</Label>
              <Input
                id="api-q"
                className="mt-1"
                placeholder="Texto para o parâmetro search"
                value={filtroApiBusca}
                onChange={(e) => setFiltroApiBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    aplicarFiltrosServidor();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                className="w-full"
                onClick={aplicarFiltrosServidor}
              >
                Atualizar lista
              </Button>
            </div>
          </div>
        </div>
      : null}

      <div className="rounded-xl border border-[var(--hub-border)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[var(--hub-border)] pb-4">
          <div>
            <Label htmlFor="fc-busca">Cliente</Label>
            <div className="mt-1 flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-end">
              <Input
                id="fc-busca"
                className="min-w-0 flex-1"
                placeholder="Nome ou e-mail do cliente"
                value={clienteBuscaTexto}
                onChange={(e) => setClienteBuscaTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    aplicarBuscaCliente();
                  }
                }}
              />
              <div className="flex shrink-0 gap-2">
                <Button type="button" onClick={aplicarBuscaCliente}>
                  Pesquisar
                </Button>
                <Button type="button" variant="secondary" onClick={limparBuscaCliente}>
                  Limpar
                </Button>
              </div>
            </div>
            {filtroClienteIds !== null && filtroClienteIds.length === 0 ? (
              <p className="mt-2 text-xs font-medium text-amber-800">
                Nenhum cliente encontrado.
              </p>
            ) : null}
          </div>
        </div>
        <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div>
            <Label htmlFor="ft">Tag / identificador</Label>
            <Input
              id="ft"
              placeholder="Ex.: Europa"
              value={filtroTag}
              onChange={(e) => setFiltroTag(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fd">Período (validade) — de</Label>
            <Input
              id="fd"
              type="date"
              value={periodoDe}
              onChange={(e) => setPeriodoDe(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fa">Período — até</Label>
            <Input
              id="fa"
              type="date"
              value={periodoAte}
              onChange={(e) => setPeriodoAte(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fu">Responsável</Label>
            <Select
              id="fu"
              value={filtroAgente}
              onChange={(e) => setFiltroAgente(e.target.value)}
            >
              <option value="">Todos</option>
              {responsaveisOpcoes.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="fb">Busca rápida</Label>
            <Input
              id="fb"
              placeholder="Título, destino, origem…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
      </div>

      <KanbanBoard
        cotacoes={cotacoesFiltradas}
        clientes={clientes}
        onMove={handleMove}
        onDelete={handleDeleteRequest}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir cotação"
        message="Tem certeza de que deseja excluir esta cotação? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <LinkSolicitacaoModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        sellerPublicCode={
          user?.accountKind === "SALES_AGENT" && user.linkPublicCode ?
            user.linkPublicCode
          : null
        }
      />
    </div>
  );
}
