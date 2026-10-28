"use client";
import { useEffect, useRef, useState } from "react";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { selectClass, textClass } from "@/components/work/work-forms";
import { followupApi, type Followup, type Product, type Member, type State } from "@/lib/followups/api";
import type { Cliente } from "@/types";

export type Editor = { type: "edit"; row?: Followup } | { type: "state"; row: Followup; state: State } | { type: "delete"; row: Followup };
export function FollowupEditor({ editor, product, token, customers, members, customerId, saved, cancel }: {
  editor: Editor; product: Product; token: string; customers: Cliente[]; members: Member[]; customerId: string;
  saved: (message: string) => void; cancel: () => void;
}) {
  const row = editor.row;
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { panel.current?.focus(); panel.current?.scrollIntoView?.({ block: "nearest" }); }, []);
  const [person, setPerson] = useState(row?.customerId ?? customerId);
  const [title, setTitle] = useState(row?.title ?? "");
  const [notes, setNotes] = useState(row?.notes ?? "");
  const [dueOn, setDueOn] = useState(row?.dueOn ?? "");
  const [responsible, setResponsible] = useState(row?.responsibleId ?? "");
  const [reason, setReason] = useState("");
  const [key] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const guard = useRef(false);
  const [error, setError] = useState("");
  const heading = editor.type === "delete" ? "Excluir ação?" : editor.type === "state" ? editor.state === "DONE" ? "Concluir ação" : editor.state === "OPEN" ? "Reabrir ação" : "Cancelar ação" : row ? "Editar ou reprogramar ação" : "Nova ação comercial";
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (guard.current) return;
    guard.current = true; setBusy(true); setError("");
    try {
      if (editor.type === "edit") {
        if (!person || !responsible) throw new Error("Selecione a pessoa e o responsável.");
        await followupApi.save(token, { product, customerId: person, title, notes, dueOn, responsibleId: responsible, expectedVersion: row?.version ?? 0 }, row?.id, key);
      } else if (editor.type === "state") await followupApi.state(token, editor.row, editor.state, reason);
      else await followupApi.remove(token, editor.row);
      saved(editor.type === "delete" ? "Ação excluída. O histórico foi preservado." : "Ação salva.");
    } catch (ex) { setError(ex instanceof TypeError ? "A conexão foi interrompida. Não foi possível confirmar a operação; tente novamente sem fechar este formulário." : ex instanceof Error ? ex.message : "Não foi possível confirmar a operação. Tente novamente."); }
    finally { guard.current = false; setBusy(false); }
  }
  return <section ref={panel} tabIndex={-1} aria-label={heading} className="rounded-lg border border-[var(--hub-border)] bg-white p-4">
    <h2 className="mb-3 font-semibold">{heading}</h2>
    <form onSubmit={submit} className="space-y-3">
      {editor.type === "edit" ? <>
        <p className="text-sm text-[var(--hub-text-secondary)]">Produto: {product === "MILES" ? "Milhas" : "Viagens"}. {row ? "Pessoa e produto são preservados." : "Selecione uma pessoa ou prospecto já cadastrado no CRM."}</p>
        <ClientePicker id="followup-person" label="Pessoa ou prospecto" clientes={customers} value={person} onChange={setPerson} required disabled={!!row || busy} showNovoButton={false} />
        <div><Label htmlFor="followup-title">Próxima ação</Label><Input id="followup-title" required maxLength={180} value={title} onChange={e => setTitle(e.target.value)} disabled={busy} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="followup-due">Prazo</Label><Input id="followup-due" type="date" required value={dueOn} onChange={e => setDueOn(e.target.value)} disabled={busy} /></div>
          <div><Label htmlFor="followup-responsible">Responsável</Label><select id="followup-responsible" required className={selectClass} value={responsible} onChange={e => setResponsible(e.target.value)} disabled={busy}>
            <option value="">Selecione</option>{row && !members.some(m => m.id === row.responsibleId) && <option value={row.responsibleId} disabled>{row.responsibleName} (inativo; selecione outro)</option>}{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select></div>
        </div>
        <div><Label htmlFor="followup-notes">Observações</Label><textarea id="followup-notes" className={textClass} maxLength={4000} value={notes} onChange={e => setNotes(e.target.value)} disabled={busy} /></div>
      </> : <>
        <p className="break-words text-sm">{row?.title} · {row?.customerName}</p>
        {editor.type === "delete" ? <p className="text-sm">A ação sairá da lista. Seu histórico será preservado e continuará sujeito à revisão de dados pessoais.</p> : <div>
          <Label htmlFor="followup-reason">{editor.state === "DONE" ? "Resultado do contato (opcional)" : "Motivo"}</Label>
          <textarea id="followup-reason" className={textClass} required={editor.state !== "DONE"} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} disabled={busy} />
        </div>}
      </>}
      {error && <p role="alert" className="text-sm text-red-700">{error} Em caso de conflito, copie suas alterações e recarregue a lista antes de tentar novamente.</p>}
      <div className="flex flex-wrap gap-2"><Button type="submit" variant={editor.type === "delete" ? "danger" : "primary"} disabled={busy}>{busy ? "Aguardando confirmação…" : editor.type === "delete" ? "Confirmar exclusão" : "Salvar ação"}</Button><Button variant="secondary" disabled={busy} onClick={cancel}>Voltar à lista</Button></div>
    </form>
  </section>;
}
