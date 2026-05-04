"use client";

import { useMemo, useState } from "react";
import type { Cliente, Cotacao, CotacaoStatus } from "@/types";
import {
  COTACAO_ARQUIVO_COLUMNS,
  COTACAO_KANBAN_COLUMNS,
} from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import { CotacaoCard } from "@/components/cotacao/CotacaoCard";

type Props = {
  cotacoes: Cotacao[];
  clientes: Cliente[];
  onMove: (cotacaoId: string, newStatus: CotacaoStatus) => void;
};

export function KanbanBoard({ cotacoes, clientes, onMove }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<CotacaoStatus | null>(null);

  const byStatus = useMemo(() => {
    const m = new Map<CotacaoStatus, Cotacao[]>();
    const all = [...COTACAO_KANBAN_COLUMNS, ...COTACAO_ARQUIVO_COLUMNS];
    for (const col of all) {
      m.set(col.id, []);
    }
    for (const c of cotacoes) {
      const list = m.get(c.status);
      if (list) list.push(c);
    }
    return m;
  }, [cotacoes]);

  const clienteMap = useMemo(() => {
    const m = new Map<string, Cliente>();
    clientes.forEach((c) => m.set(c.id, c));
    return m;
  }, [clientes]);

  function sumColumn(status: CotacaoStatus): number {
    return (byStatus.get(status) ?? []).reduce((s, c) => s + c.valorTotal, 0);
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("cotacaoId", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setOverColumn(null);
  }

  function handleDragOver(e: React.DragEvent, status: CotacaoStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverColumn(status);
  }

  function handleDragLeave() {
    setOverColumn(null);
  }

  function handleDrop(e: React.DragEvent, status: CotacaoStatus) {
    e.preventDefault();
    const id = e.dataTransfer.getData("cotacaoId");
    if (id) {
      const cotacao = cotacoes.find((c) => c.id === id);
      if (cotacao && cotacao.status !== status) {
        onMove(id, status);
      }
    }
    setDraggingId(null);
    setOverColumn(null);
  }

  function renderColumn(
    id: CotacaoStatus,
    label: string,
    headerClass: string,
  ) {
    const list = byStatus.get(id) ?? [];
    const total = sumColumn(id);
    const isOver = overColumn === id;
    const isDragging = draggingId !== null;

    return (
      <div
        key={id}
        className={`flex min-h-[200px] min-w-[260px] max-w-[320px] flex-1 flex-col rounded-xl border transition-all duration-150 ${
          isOver
            ? "border-[var(--hub-blue)] bg-sky-50 shadow-md ring-2 ring-[var(--hub-blue)]/30"
            : isDragging
              ? "border-slate-300 bg-slate-100/80"
              : "border-[var(--hub-border)] bg-slate-50/80"
        }`}
        onDragOver={(e) => handleDragOver(e, id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, id)}
      >
        <div
          className={`rounded-t-xl border-b px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide ${headerClass}`}
        >
          {label}{" "}
          <span className="font-normal opacity-80">({list.length})</span>
          <div className="mt-0.5 text-[11px] font-semibold tabular-nums">
            {formatBRL(total)}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-2">
          {list.map((c) => (
            <div
              key={c.id}
              className={`transition-opacity duration-150 ${
                draggingId === c.id ? "opacity-40" : "opacity-100"
              }`}
            >
              <CotacaoCard
                cotacao={c}
                cliente={clienteMap.get(c.clienteId)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            </div>
          ))}
          {isOver && draggingId && (
            <div className="rounded-lg border-2 border-dashed border-[var(--hub-blue)]/50 bg-sky-100/50 p-4 text-center text-xs font-medium text-[var(--hub-blue)]">
              Soltar aqui
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {draggingId !== null && (
        <p className="text-center text-xs text-slate-500">
          Arraste para uma coluna para mover a cotação
        </p>
      )}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COTACAO_KANBAN_COLUMNS.map((col) =>
          renderColumn(col.id, col.label, col.headerClass),
        )}
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Arquivo
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {COTACAO_ARQUIVO_COLUMNS.map((col) =>
            renderColumn(col.id, col.label, col.headerClass),
          )}
        </div>
      </div>
    </div>
  );
}
