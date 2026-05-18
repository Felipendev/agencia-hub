"use client";

import { useState } from "react";
import { COTACAO_STATUS_LABELS } from "@/lib/constants";
import type { Cliente, Cotacao } from "@/types";
import { formatBRL, formatDateBR } from "@/lib/format";
import { EditarCotacaoModal } from "@/components/cotacao/EditarCotacaoModal";
import { EnviarWhatsAppModal } from "@/components/cotacao/EnviarWhatsAppModal";
import { EditIcon, EyeIcon, UserIcon, TagIcon, WhatsAppIcon, TrashIcon } from "@/components/icons";
import { FunilBadge } from "@/components/cliente/FunilBadge";

type Props = {
  cotacao: Cotacao;
  cliente?: Cliente;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd?: () => void;
  onDelete?: (id: string) => void;
};

function ActionButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="group/btn relative flex h-7 w-7 items-center justify-center rounded text-[var(--hub-text-muted)] transition-colors hover:bg-[var(--hub-bg-subtle)] hover:text-[var(--hub-blue)]"
    >
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-white group-hover/btn:block">
        {title}
      </span>
    </button>
  );
}

export function CotacaoCard({ cotacao, cliente, onDragStart, onDragEnd, onDelete }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const created = cotacao.createdAt.slice(0, 10);

  const temTelefone = !!(
    cliente?.whatsapp ||
    cliente?.telefone ||
    cotacao.detalhes.whatsapp ||
    cotacao.detalhes.celular
  );

  return (
    <>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, cotacao.id)}
        onDragEnd={onDragEnd}
        className="cursor-grab rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white p-3 shadow-sm transition-shadow active:cursor-grabbing active:shadow-lg"
      >
        {/* Linha superior: data + responsável + valor */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[var(--hub-text-muted)]">
            <span>{formatDateBR(created)}</span>
            <span className="text-[var(--hub-border)]">·</span>
            <span className="max-w-[90px] truncate font-medium text-[var(--hub-text-secondary)]">
              {cotacao.responsavel}
            </span>
          </div>
          <span className="text-sm font-semibold tabular-nums text-[var(--hub-blue-dark)]">
            {formatBRL(cotacao.valorTotal)}
          </span>
        </div>

        {/* Título */}
        <p className="mt-2 font-semibold leading-snug text-[var(--hub-blue-dark)]">
          {cotacao.titulo}
        </p>

        {/* Status */}
        <div className="mt-1.5">
          <span className="inline-flex rounded border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--hub-text-primary)]">
            {COTACAO_STATUS_LABELS[cotacao.status]}
          </span>
        </div>

        {/* Cliente */}
        <p className="mt-1.5 text-sm text-[var(--hub-text-primary)]">{cliente?.nome ?? "—"}</p>
        <FunilBadge value={cliente?.avaliacao} />

        {(cotacao.origemCriacao ||
          cotacao.criadoPorNome ||
          cotacao.vendedorNome) && (
          <p className="mt-1 text-[10px] leading-snug text-[var(--hub-text-muted)]">
            {cotacao.origemCriacao === "formulario_publico" ?
              "Formulário público"
            : cotacao.origemCriacao === "interna" ?
              "Interna"
            : null}
            {cotacao.criadoPorNome ? ` · ${cotacao.criadoPorNome}` : ""}
            {cotacao.vendedorNome ? ` · Vend.: ${cotacao.vendedorNome}` : ""}
          </p>
        )}

        {/* Tags e prioridade */}
        {(cotacao.prioridade || cotacao.tags.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {cotacao.prioridade && (
              <span className="rounded bg-[var(--hub-yellow)]/40 px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--hub-blue-dark)]">
                Prioridade
              </span>
            )}
            {cotacao.tags.map((t) => (
              <span
                key={t}
                className="rounded border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-1.5 py-0.5 text-[10px] text-[var(--hub-text-secondary)]"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Barra de ações */}
        <div
          className="mt-3 flex items-center justify-end gap-0.5 border-t border-[var(--hub-border)] pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          {cliente && (
            <ActionButton
              title="Ver cliente"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/clientes/${cliente.id}`;
              }}
            >
              <UserIcon className="h-4 w-4" />
            </ActionButton>
          )}

          {cotacao.tags.length > 0 && (
            <ActionButton
              title={cotacao.tags.map((t) => `#${t}`).join(" ")}
              onClick={(e) => e.stopPropagation()}
            >
              <TagIcon className="h-4 w-4" />
            </ActionButton>
          )}

          <ActionButton
            title="Ver cotacao"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/cotacoes/${cotacao.id}`;
            }}
          >
            <EyeIcon className="h-4 w-4" />
          </ActionButton>

          <ActionButton
            title="Editar cotacao"
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
          >
            <EditIcon className="h-4 w-4" />
          </ActionButton>

          {cliente && temTelefone && (
            <ActionButton
              title="Enviar por WhatsApp"
              onClick={(e) => {
                e.stopPropagation();
                setWaOpen(true);
              }}
            >
              <WhatsAppIcon className="h-4 w-4 text-emerald-500" />
            </ActionButton>
          )}

          {onDelete && (
            <ActionButton
              title="Excluir cotação"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(cotacao.id);
              }}
            >
              <TrashIcon className="h-4 w-4 text-red-400" />
            </ActionButton>
          )}
        </div>
      </div>

      <EditarCotacaoModal
        cotacao={cotacao}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      {cliente && (
        <EnviarWhatsAppModal
          cotacao={cotacao}
          cliente={cliente}
          open={waOpen}
          onClose={() => setWaOpen(false)}
        />
      )}
    </>
  );
}
