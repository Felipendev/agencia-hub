"use client";

import { useState } from "react";
import { useTimeline } from "@/contexts/timeline-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClockIcon } from "@/components/icons";
import { formatDateTimeBR } from "@/lib/format";
import type { TimelineEvent } from "@/types/timeline";

type Props = {
  entityType: "cliente" | "cotacao";
  entityId: string;
};

export function TimelineView({ entityType, entityId }: Props) {
  const { getEventsForEntity, addNote } = useTimeline();
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");

  const events = getEventsForEntity(entityType, entityId);

  function handleAddNote() {
    if (!noteText.trim()) return;
    addNote(entityType, entityId, noteText.trim());
    setNoteText("");
    setShowNoteForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--hub-blue-dark)]">
          Histórico de Atividades
        </h3>
        <Button
          type="button"
          variant="secondary"
          className="text-xs"
          onClick={() => setShowNoteForm(!showNoteForm)}
        >
          {showNoteForm ? "Cancelar" : "+ Adicionar Nota"}
        </Button>
      </div>

      {showNoteForm && (
        <div className="rounded-lg border border-[var(--hub-border)] bg-slate-50 p-4">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Digite sua nota..."
            rows={3}
          />
          <Button
            type="button"
            className="mt-2"
            onClick={handleAddNote}
            disabled={!noteText.trim()}
          >
            Salvar Nota
          </Button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Nenhuma atividade registrada ainda
        </div>
      ) : (
        <div className="relative space-y-4 border-l-2 border-slate-200 pl-6">
          {events.map((event) => (
            <TimelineItem key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const iconColor = {
    cliente_criado: "bg-blue-500",
    cliente_atualizado: "bg-blue-400",
    cotacao_criada: "bg-amber-500",
    cotacao_status_mudou: "bg-amber-600",
    cotacao_atualizada: "bg-amber-400",
    lancamento_criado: "bg-purple-500",
    nota_adicionada: "bg-slate-500",
  }[event.type];

  return (
    <div className="relative">
      <div
        className={`absolute -left-[29px] flex h-6 w-6 items-center justify-center rounded-full ${iconColor}`}
      >
        <ClockIcon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="rounded-lg border border-[var(--hub-border)] bg-white p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-semibold text-[var(--hub-blue-dark)]">
              {event.title}
            </p>
            <p className="mt-1 text-sm text-slate-700">{event.description}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span>{formatDateTimeBR(event.createdAt)}</span>
          <span>·</span>
          <span>{event.createdBy}</span>
        </div>
      </div>
    </div>
  );
}
