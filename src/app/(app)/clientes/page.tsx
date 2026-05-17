"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { filterClientes, useData } from "@/contexts/data-context";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NovoClienteModal } from "@/components/cliente/NovoClienteModal";
import { EditarClienteModal } from "@/components/cliente/EditarClienteModal";
import { formatDateBR } from "@/lib/format";
import { exportarClientesCSV } from "@/lib/csv-export";
import { CLIENTE_STATUS_LABELS } from "@/lib/constants";
import type { Cliente, ClienteStatus } from "@/types";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  UserCheck,
  UserPlus,
  Download,
  Trash2,
  ChevronRight,
  X,
} from "lucide-react";

// ── Status helpers ────────────────────────────────────────────────────────────

const AVATAR_BG_BY_STATUS: Record<ClienteStatus, string> = {
  ativo: "bg-sky-500",
  prospecto: "bg-violet-500",
  inativo: "bg-slate-400",
};

const AVATAR_RING_BY_STATUS: Record<ClienteStatus, string> = {
  ativo: "ring-sky-200",
  prospecto: "ring-violet-200",
  inativo: "ring-slate-200",
};

const BADGE_CLASS_BY_STATUS: Record<ClienteStatus, string> = {
  ativo: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  prospecto: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  inativo: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(nome: string): string {
  const parts = nome.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  value,
  label,
  stagger,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  stagger: string;
}) {
  return (
    <div
      className={`animate-fade-in-up ${stagger} flex items-center gap-4 rounded-xl border border-[var(--hub-border)] bg-[var(--hub-card)] px-5 py-4 shadow-[var(--hub-shadow-sm)]`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--hub-primary-muted)] text-[var(--hub-primary)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className="font-mono text-2xl font-bold leading-none text-[var(--hub-text-primary)]"
          style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
        >
          {value}
        </p>
        <p className="mt-1 text-xs font-medium text-[var(--hub-text-secondary)]">
          {label}
        </p>
      </div>
    </div>
  );
}

interface ClienteRowProps {
  cliente: Cliente;
  selected: boolean;
  onSelect: (c: Cliente) => void;
  onDeleteRequest: (id: string) => void;
}

function ClienteRow({
  cliente: c,
  selected,
  onSelect,
  onDeleteRequest,
}: ClienteRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(c)}
      className={[
        "group w-full text-left transition-all duration-150",
        "flex items-center gap-3 px-4 py-3",
        "border-l-2",
        selected
          ? "border-[var(--hub-primary)] bg-sky-50/60"
          : "border-transparent hover:border-[var(--hub-primary)] hover:bg-slate-50",
      ].join(" ")}
    >
      {/* Avatar */}
      <div
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ring-2",
          AVATAR_BG_BY_STATUS[c.status],
          AVATAR_RING_BY_STATUS[c.status],
        ].join(" ")}
      >
        {getInitials(c.nome)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-[var(--hub-text-primary)]">
            {c.nome}
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${BADGE_CLASS_BY_STATUS[c.status]}`}
          >
            {CLIENTE_STATUS_LABELS[c.status]}
          </span>
        </div>
        <p className="truncate text-xs text-[var(--hub-text-muted)]">
          {c.email}
          {c.telefone ? ` · ${c.telefone}` : ""}
        </p>
        {c.destinoInteresse && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--hub-bg-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--hub-text-secondary)]">
            <MapPin className="h-2.5 w-2.5" />
            {c.destinoInteresse}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          title="Excluir cliente"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRequest(c.id);
          }}
          className="rounded-md p-1.5 text-[var(--hub-text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <ChevronRight className="h-4 w-4 text-[var(--hub-text-muted)] transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

interface DetailPanelProps {
  cliente: Cliente;
  onClose: () => void;
  onDeleteRequest: (id: string) => void;
  onEdit: (c: Cliente) => void;
}

function DetailPanel({
  cliente: c,
  onClose,
  onDeleteRequest,
  onEdit,
}: DetailPanelProps) {
  return (
    <div className="animate-slide-right flex h-full flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-[var(--hub-border)] px-6 py-4">
        <span className="text-sm font-semibold text-[var(--hub-text-secondary)] uppercase tracking-wide">
          Detalhes do cliente
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-[var(--hub-text-muted)] transition-colors hover:bg-slate-100 hover:text-[var(--hub-text-primary)]"
          aria-label="Fechar painel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 animate-fade-in-up">
        {/* Avatar + name + badge */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={[
              "flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white ring-4",
              AVATAR_BG_BY_STATUS[c.status],
              AVATAR_RING_BY_STATUS[c.status],
            ].join(" ")}
          >
            {getInitials(c.nome)}
          </div>
          <div>
            <Link
              href={`/clientes/${c.id}`}
              className="text-lg font-bold text-[var(--hub-text-primary)] hover:text-[var(--hub-primary)] transition-colors"
            >
              {c.nome}
            </Link>
            <div className="mt-1 flex justify-center">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${BADGE_CLASS_BY_STATUS[c.status]}`}
              >
                {CLIENTE_STATUS_LABELS[c.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Contact rows */}
        <div className="space-y-3 rounded-xl border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] p-4">
          <ContactRow icon={<Mail className="h-4 w-4" />} label="E-mail" value={c.email} />
          {c.telefone && (
            <ContactRow icon={<Phone className="h-4 w-4" />} label="Telefone" value={c.telefone} />
          )}
          {c.destinoInteresse && (
            <ContactRow icon={<MapPin className="h-4 w-4" />} label="Destino de interesse" value={c.destinoInteresse} />
          )}
          <ContactRow
            icon={<Calendar className="h-4 w-4" />}
            label="Data de cadastro"
            value={formatDateBR(c.createdAt)}
          />
        </div>

        {c.observacoes && (
          <div className="rounded-xl border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--hub-text-muted)]">
              Observações
            </p>
            <p className="text-sm text-[var(--hub-text-secondary)] whitespace-pre-line">
              {c.observacoes}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <Link
            href={`/cotacoes?clienteId=${c.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
          >
            Ver cotações
            <ChevronRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => onEdit(c)}
            className="flex w-full items-center justify-center rounded-lg border border-[var(--hub-border)] bg-[var(--hub-card)] px-4 py-2.5 text-sm font-semibold text-[var(--hub-text-primary)] transition-colors hover:bg-slate-50"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onDeleteRequest(c.id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>

        {/* Quick link to full page */}
        <div className="text-center">
          <Link
            href={`/clientes/${c.id}`}
            className="inline-flex items-center gap-1 text-xs text-[var(--hub-text-muted)] hover:text-[var(--hub-primary)] transition-colors"
          >
            Ver página completa
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-[var(--hub-text-muted)]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--hub-text-muted)]">
          {label}
        </p>
        <p className="text-sm text-[var(--hub-text-primary)] break-all">{value}</p>
      </div>
    </div>
  );
}

function EmptyDetailState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--hub-bg-subtle)] text-[var(--hub-text-muted)]">
        <Users className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-[var(--hub-text-secondary)]">
          Selecione um cliente
        </p>
        <p className="mt-1 text-xs text-[var(--hub-text-muted)]">
          Clique em um cliente na lista para ver os detalhes.
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const { clientes, isReady, deleteCliente } = useData();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClienteStatus | "todos">("todos");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [editarCliente, setEditarCliente] = useState<Cliente | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteTarget(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCliente(deleteTarget);
      toast.success("Cliente excluído com sucesso.");
      if (selectedCliente?.id === deleteTarget) {
        setSelectedCliente(null);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir cliente.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteCliente, toast, selectedCliente]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const filtrados = useMemo(
    () => filterClientes(clientes, q, statusFilter),
    [clientes, q, statusFilter],
  );

  const totalAtivos = useMemo(
    () => clientes.filter((c) => c.status === "ativo").length,
    [clientes],
  );
  const totalProspectos = useMemo(
    () => clientes.filter((c) => c.status === "prospecto").length,
    [clientes],
  );

  function handleExportar() {
    exportarClientesCSV(filtrados);
    toast.success(`${filtrados.length} cliente(s) exportado(s)!`);
  }

  function handleSelectCliente(c: Cliente) {
    setSelectedCliente((prev) => (prev?.id === c.id ? null : c));
  }

  if (!isReady) {
    return (
      <p className="text-sm text-[var(--hub-text-secondary)]">Carregando…</p>
    );
  }

  const showDetailOnMobile = selectedCliente !== null;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="animate-fade-in-up stagger-1 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--hub-text-primary)]">
            Clientes
          </h1>
          <span className="rounded-full bg-[var(--hub-bg-subtle)] px-2.5 py-0.5 text-sm font-semibold text-[var(--hub-text-secondary)] ring-1 ring-[var(--hub-border)]">
            {clientes.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportar}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--hub-border)] bg-[var(--hub-card)] px-3 py-2 text-sm font-medium text-[var(--hub-text-secondary)] shadow-[var(--hub-shadow-xs)] transition-colors hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button
            type="button"
            onClick={() => setNovoClienteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-[var(--hub-shadow-sm)] transition-colors hover:opacity-90"
            style={{ backgroundColor: "var(--hub-yellow)" }}
          >
            + Novo cliente
          </button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          value={clientes.length}
          label="Total de clientes"
          stagger="stagger-1"
        />
        <KpiCard
          icon={<UserCheck className="h-5 w-5" />}
          value={totalAtivos}
          label="Ativos"
          stagger="stagger-2"
        />
        <KpiCard
          icon={<UserPlus className="h-5 w-5" />}
          value={totalProspectos}
          label="Prospectos"
          stagger="stagger-3"
        />
      </div>

      {/* ── Split panel ── */}
      <div className="animate-fade-in-up stagger-4 overflow-hidden rounded-xl border border-[var(--hub-border)] bg-[var(--hub-card)] shadow-[var(--hub-shadow-sm)]">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--hub-border)] px-4 py-3">
          <div className="relative flex-1 min-w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--hub-text-muted)]" />
            <input
              type="search"
              placeholder="Buscar por nome…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] py-2 pl-9 pr-3 text-sm text-[var(--hub-text-primary)] placeholder:text-[var(--hub-text-muted)] focus:border-[var(--hub-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--hub-primary)]/20 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ClienteStatus | "todos")
            }
            className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-3 py-2 text-sm text-[var(--hub-text-primary)] focus:border-[var(--hub-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--hub-primary)]/20 transition-colors"
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="prospecto">Prospecto</option>
            <option value="inativo">Inativo</option>
          </select>
          {filtrados.length !== clientes.length && (
            <span className="text-xs text-[var(--hub-text-muted)]">
              {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Body: list + detail */}
        <div className="flex h-[calc(100vh-22rem)] min-h-80">
          {/* Left: Client list */}
          <div
            className={[
              "flex flex-col overflow-y-auto border-r border-[var(--hub-border)]",
              // Mobile: hide list when detail is showing
              showDetailOnMobile ? "hidden lg:flex" : "flex",
              // Width
              "w-full lg:w-[55%]",
            ].join(" ")}
          >
            {filtrados.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
                <Search className="h-8 w-8 text-[var(--hub-text-muted)]" />
                <p className="font-medium text-[var(--hub-text-secondary)]">
                  Nenhum cliente encontrado
                </p>
                <p className="text-xs text-[var(--hub-text-muted)]">
                  Tente ajustar os filtros ou criar um novo cliente.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--hub-border)]">
                {filtrados.map((c) => (
                  <ClienteRow
                    key={c.id}
                    cliente={c}
                    selected={selectedCliente?.id === c.id}
                    onSelect={handleSelectCliente}
                    onDeleteRequest={handleDeleteRequest}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Detail panel */}
          <div
            className={[
              "overflow-hidden",
              // Mobile: show detail panel when client is selected, full width
              showDetailOnMobile
                ? "flex w-full lg:w-[45%]"
                : "hidden lg:flex lg:w-[45%]",
            ].join(" ")}
          >
            {selectedCliente ? (
              <div className="w-full">
                <DetailPanel
                  key={selectedCliente.id}
                  cliente={selectedCliente}
                  onClose={() => setSelectedCliente(null)}
                  onDeleteRequest={handleDeleteRequest}
                  onEdit={(c) => setEditarCliente(c)}
                />
              </div>
            ) : (
              <EmptyDetailState />
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <NovoClienteModal
        open={novoClienteOpen}
        onClose={() => setNovoClienteOpen(false)}
        onCreated={() => {/* lista atualiza via contexto */}}
        keepOpenAfterSave
      />

      {editarCliente && (
        <EditarClienteModal
          open={editarCliente !== null}
          cliente={editarCliente}
          onClose={() => setEditarCliente(null)}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir cliente"
        message="Esta ação remove o cliente de forma permanente, junto com as cotações vinculadas a ele. Não é possível desfazer."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
