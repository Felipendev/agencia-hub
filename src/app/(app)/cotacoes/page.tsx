"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { KanbanBoard } from "@/components/cotacao/KanbanBoard";
import { LinkSolicitacaoModal } from "@/components/cotacao/LinkSolicitacaoModal";
import { SolicitacaoSubmissionsBanner } from "@/components/cotacao/SolicitacaoSubmissionsBanner";
import { useToast } from "@/components/ui/toast";
import { softDeleteQuotation } from "@/lib/api/soft-delete-remote";
import { isUuid } from "@/lib/api/quotation-mapper";
import { COTACAO_STATUS_LABELS } from "@/lib/constants";
import type { CotacaoStatus } from "@/types";
import {
  Search,
  Plus,
  Link2,
  SlidersHorizontal,
  X,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function inDateRange(isoDate: string, from: string, to: string): boolean {
  const d = isoDate.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCotCard({
  icon,
  value,
  label,
  colorClass,
  bgClass,
  stagger,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  colorClass: string;
  bgClass: string;
  stagger: string;
}) {
  return (
    <div
      className={`animate-fade-in-up ${stagger} flex items-center gap-4 rounded-xl border border-[var(--hub-border)] bg-[var(--hub-card)] px-5 py-4 shadow-[var(--hub-shadow-sm)]`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bgClass} ${colorClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className="text-2xl font-bold leading-none text-[var(--hub-text-primary)]"
          style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
        >
          {value}
        </p>
        <p className="mt-1 text-xs font-medium text-[var(--hub-text-secondary)]">{label}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

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
  const [showFilters, setShowFilters] = useState(false);

  const [clienteBuscaTexto, setClienteBuscaTexto] = useState("");
  const [filtroClienteIds, setFiltroClienteIds] = useState<string[] | null>(null);
  const [filtroTag, setFiltroTag] = useState("");
  const [periodoDe, setPeriodoDe] = useState("");
  const [periodoAte, setPeriodoAte] = useState("");
  const [filtroAgente, setFiltroAgente] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroApiStatus, setFiltroApiStatus] = useState<CotacaoStatus | "">("");
  const [filtroApiBusca, setFiltroApiBusca] = useState("");

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
      list = list.filter((c) => inDateRange(c.validade, periodoDe, periodoAte));
    }
    if (busca.trim()) {
      const low = busca.toLowerCase();
      list = list.filter(
        (c) =>
          c.titulo.toLowerCase().includes(low) ||
          c.destino.toLowerCase().includes(low) ||
          c.detalhes.origem.toLowerCase().includes(low) ||
          c.detalhes.destinoForm.toLowerCase().includes(low) ||
          (c.detalhes.destinosTrechos ?? []).some((t) => t.toLowerCase().includes(low)),
      );
    }
    return list;
  }, [cotacoes, filtroClienteIds, filtroTag, periodoDe, periodoAte, filtroAgente, busca]);

  // ── KPI data ──────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const ativas = cotacoes.filter((c) =>
      ["aguardando", "em_cotacao", "aguardando_cliente"].includes(c.status),
    ).length;
    const aprovadas = cotacoes.filter((c) => c.status === "aprovado").length;
    const reprovadas = cotacoes.filter(
      (c) => c.status === "reprovado" || c.status === "expirada",
    ).length;
    return { ativas, aprovadas, reprovadas, total: cotacoes.length };
  }, [cotacoes]);

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

  const hasActiveFilters =
    filtroClienteIds !== null ||
    filtroTag.trim() ||
    periodoDe ||
    periodoAte ||
    filtroAgente.trim() ||
    busca.trim();

  function clearAllFilters() {
    limparBuscaCliente();
    setFiltroTag("");
    setPeriodoDe("");
    setPeriodoAte("");
    setFiltroAgente("");
    setBusca("");
  }

  if (!isReady) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--hub-text-muted)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--hub-primary)] border-t-transparent" />
          <span className="text-sm font-medium">Carregando cotações…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="animate-fade-in-up flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--hub-text-primary)]">Cotações</h1>
          <p className="mt-0.5 text-sm text-[var(--hub-text-secondary)]">
            Gerencie e acompanhe suas cotações de viagem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLinkModalOpen(true)}
            className="flex items-center gap-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-[var(--hub-card)] px-3 py-2 text-sm font-medium text-[var(--hub-text-secondary)] shadow-[var(--hub-shadow-xs)] transition-colors hover:bg-[var(--hub-bg-subtle)] hover:text-[var(--hub-text-primary)]"
          >
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Links</span>
          </button>
          <Link
            href="/cotacoes/nova"
            className="flex items-center gap-2 rounded-[var(--hub-radius)] bg-[var(--hub-yellow)] px-4 py-2 text-sm font-semibold text-[var(--hub-brand-dark)] shadow-[var(--hub-shadow-xs)] transition-colors hover:bg-[var(--hub-yellow-hover)]"
          >
            <Plus className="h-4 w-4" />
            <span>Nova cotação</span>
          </Link>
        </div>
      </div>

      {/* ── KPI Strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCotCard
          icon={<FileText className="h-5 w-5" />}
          value={kpis.total}
          label="Total"
          colorClass="text-[var(--hub-primary)]"
          bgClass="bg-[var(--hub-primary-muted)]"
          stagger="stagger-1"
        />
        <KpiCotCard
          icon={<Clock className="h-5 w-5" />}
          value={kpis.ativas}
          label="Em aberto"
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
          stagger="stagger-2"
        />
        <KpiCotCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          value={kpis.aprovadas}
          label="Aprovadas"
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          stagger="stagger-3"
        />
        <KpiCotCard
          icon={<XCircle className="h-5 w-5" />}
          value={kpis.reprovadas}
          label="Reprovadas"
          colorClass="text-red-500"
          bgClass="bg-red-50"
          stagger="stagger-4"
        />
      </div>

      {/* ── Submissions banner ──────────────────────────────────────────── */}
      <SolicitacaoSubmissionsBanner />

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="animate-fade-in-up stagger-3 overflow-hidden rounded-xl border border-[var(--hub-border)] bg-[var(--hub-card)] shadow-[var(--hub-shadow-sm)]">

        {/* Top row: quick search + toggles */}
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--hub-text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por título, destino ou origem…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] py-2 pl-9 pr-3 text-sm text-[var(--hub-text-primary)] placeholder:text-[var(--hub-text-muted)] focus:border-[var(--hub-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--hub-primary)]"
            />
          </div>

          {/* Client quick search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--hub-text-muted)]" />
            <input
              type="text"
              placeholder="Cliente…"
              value={clienteBuscaTexto}
              onChange={(e) => setClienteBuscaTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); aplicarBuscaCliente(); }
              }}
              className="w-44 rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] py-2 pl-9 pr-3 text-sm text-[var(--hub-text-primary)] placeholder:text-[var(--hub-text-muted)] focus:border-[var(--hub-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--hub-primary)]"
            />
            {filtroClienteIds !== null && (
              <button
                type="button"
                onClick={limparBuscaCliente}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--hub-text-muted)] hover:text-[var(--hub-text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={[
              "flex items-center gap-1.5 rounded-[var(--hub-radius)] border px-3 py-2 text-sm font-medium transition-colors",
              showFilters
                ? "border-[var(--hub-primary)] bg-[var(--hub-primary-muted)] text-[var(--hub-primary)]"
                : "border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] text-[var(--hub-text-secondary)] hover:border-[var(--hub-border-strong)] hover:text-[var(--hub-text-primary)]",
            ].join(" ")}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--hub-primary)] text-[9px] font-bold text-white">
                ✓
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              title="Limpar todos os filtros"
              className="flex items-center gap-1.5 rounded-[var(--hub-radius)] border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="border-t border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]/50 px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">

              {/* Client search (mobile) */}
              <div className="sm:hidden">
                <label className="mb-1 block text-xs font-medium text-[var(--hub-text-secondary)]">
                  Cliente
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome ou e-mail"
                    value={clienteBuscaTexto}
                    onChange={(e) => setClienteBuscaTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); aplicarBuscaCliente(); }
                    }}
                    className="text-sm"
                  />
                  <button
                    type="button"
                    onClick={aplicarBuscaCliente}
                    className="shrink-0 rounded-[var(--hub-radius)] bg-[var(--hub-primary)] px-3 py-1.5 text-xs font-medium text-white"
                  >
                    OK
                  </button>
                </div>
                {filtroClienteIds !== null && filtroClienteIds.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">Nenhum cliente encontrado.</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--hub-text-secondary)]">
                  Tag / identificador
                </label>
                <Input
                  placeholder="Ex.: Europa"
                  value={filtroTag}
                  onChange={(e) => setFiltroTag(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--hub-text-secondary)]">
                  Período — de
                </label>
                <Input
                  type="date"
                  value={periodoDe}
                  onChange={(e) => setPeriodoDe(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--hub-text-secondary)]">
                  Período — até
                </label>
                <Input
                  type="date"
                  value={periodoAte}
                  onChange={(e) => setPeriodoAte(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--hub-text-secondary)]">
                  Responsável
                </label>
                <Select
                  value={filtroAgente}
                  onChange={(e) => setFiltroAgente(e.target.value)}
                  className="text-sm"
                >
                  <option value="">Todos</option>
                  {responsaveisOpcoes.map((nome) => (
                    <option key={nome} value={nome}>{nome}</option>
                  ))}
                </Select>
              </div>

              {/* API filters (when remote) */}
              {hasRemoteApi && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--hub-text-secondary)]">
                      Status (servidor)
                    </label>
                    <Select
                      value={filtroApiStatus}
                      onChange={(e) =>
                        setFiltroApiStatus((e.target.value || "") as CotacaoStatus | "")
                      }
                      className="text-sm"
                    >
                      <option value="">Todos os status</option>
                      {(Object.keys(COTACAO_STATUS_LABELS) as CotacaoStatus[]).map((id) => (
                        <option key={id} value={id}>{COTACAO_STATUS_LABELS[id]}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={aplicarFiltrosServidor}
                      className="flex w-full items-center justify-center gap-1.5 rounded-[var(--hub-radius)] bg-[var(--hub-primary)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Atualizar
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Client-not-found feedback */}
            {filtroClienteIds !== null && filtroClienteIds.length === 0 && (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Nenhum cliente encontrado para essa busca.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Kanban Board ───────────────────────────────────────────────── */}
      <div className="animate-fade-in-up stagger-4">
        <KanbanBoard
          cotacoes={cotacoesFiltradas}
          clientes={clientes}
          onMove={handleMove}
          onDelete={handleDeleteRequest}
        />
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
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
