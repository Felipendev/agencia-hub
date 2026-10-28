"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { selectClass } from "@/components/work/work-forms";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import { workApi } from "@/lib/work/api";
import { followupApi, STATE_LABEL, dateLabel, type Product, type State, type Bucket, type Board, type Event, type Member } from "@/lib/followups/api";
import type { Cliente } from "@/types";
import { FollowupEditor, type Editor } from "./followup-editor";

const ACTION: Record<string, string> = { CREATED: "Criada", UPDATED: "Editada", RESCHEDULED: "Reprogramada", REOPENED: "Reaberta", DONE: "Concluída", CANCELLED: "Cancelada", DELETED: "Excluída" };
const BUCKETS: { value: Bucket; label: string; count?: keyof Board["counts"] }[] = [{ value: "ALL", label: "Todos os prazos" }, { value: "OVERDUE", label: "Atrasadas", count: "overdue" }, { value: "TODAY", label: "Hoje", count: "today" }, { value: "UPCOMING", label: "Próximas", count: "upcoming" }];
function History({ token, id, close }: { token: string; id: string; close: () => void }) {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => { let active = true; followupApi.history(token, id).then(data => { if (active) { setEvents(data); setError(""); } }).catch(ex => { if (active) setError(ex instanceof Error ? ex.message : "Falha ao ler histórico."); }); return () => { active = false; }; }, [token, id, retry]);
  return <section aria-label="Histórico da ação" className="rounded-lg border border-[var(--hub-border)] bg-white p-4 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Histórico da ação</h2><Button variant="secondary" onClick={close}>Fechar histórico</Button></div>
    {error && <p role="alert">{error} <Button variant="secondary" onClick={() => setRetry(v => v + 1)}>Tentar novamente</Button></p>}
    {!events && !error && <p>Carregando histórico…</p>}
    <ol className="space-y-4">{events?.map(e => <li key={e.id} className="break-words border-t border-[var(--hub-border)] pt-3 text-sm">
      <p className="font-medium">{ACTION[e.action] ?? e.action} · {e.authorName ?? "Membro da agência"}</p>
      <p className="text-xs text-[var(--hub-text-muted)]">{new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "short", timeStyle: "short" }).format(new Date(e.createdAt))}</p>
      {e.snapshot.before && <p>Antes: {e.snapshot.before.title} · {dateLabel(e.snapshot.before.dueOn)} · {e.snapshot.before.responsibleName} · {STATE_LABEL[e.snapshot.before.state]}</p>}
      <p>Depois: {e.snapshot.after.title} · {dateLabel(e.snapshot.after.dueOn)} · {e.snapshot.after.responsibleName} · {e.snapshot.after.deleted ? "Excluída" : STATE_LABEL[e.snapshot.after.state]}</p>
      {e.snapshot.before?.notes && <p className="whitespace-pre-wrap">Observações anteriores: {e.snapshot.before.notes}</p>}
      {e.snapshot.after.notes && <p className="whitespace-pre-wrap">Observações: {e.snapshot.after.notes}</p>}
      {e.snapshot.after.stateReason && <p className="whitespace-pre-wrap">Motivo/resultado: {e.snapshot.after.stateReason}</p>}
    </li>)}</ol>
  </section>;
}
function BoardInner({ product, token, initialCustomer }: { product: Product; token: string; initialCustomer: string }) {
  const [customer, setCustomer] = useState(initialCustomer);
  const [responsible, setResponsible] = useState("");
  const [state, setState] = useState<State | "" | "DELETED">("OPEN");
  const [bucket, setBucket] = useState<Bucket>("ALL");
  const [revision, setRevision] = useState(0);
  const [references, setReferences] = useState<{ customers: Cliente[]; members: Member[] } | null>(null);
  const [referenceError, setReferenceError] = useState("");
  const [referenceRetry, setReferenceRetry] = useState(0);
  const [result, setResult] = useState<{ key: string; board?: Board; error?: string } | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [history, setHistory] = useState("");
  const [notice, setNotice] = useState("");
  const requestKey = JSON.stringify([product, customer, responsible, state, bucket, revision]);
  const current = result?.key === requestKey ? result : null;
  useEffect(() => {
    let active = true;
    Promise.all([listCustomersRemote(token), workApi.members(token)]).then(([customers, members]) => { if (active) { setReferences({ customers, members }); setReferenceError(""); } }).catch(ex => { if (active) setReferenceError(ex instanceof Error ? ex.message : "Falha ao carregar pessoas e equipe."); });
    return () => { active = false; };
  }, [token, referenceRetry]);
  useEffect(() => {
    let active = true;
    followupApi.list(token, { product, customerId: customer || undefined, responsibleId: responsible || undefined, state: state === "DELETED" ? undefined : state || undefined, bucket, deleted: state === "DELETED" })
      .then(board => { if (active) setResult({ key: requestKey, board }); }).catch(ex => { if (active) setResult({ key: requestKey, error: ex instanceof Error ? ex.message : "Falha ao consultar ações." }); });
    return () => { active = false; };
  }, [token, product, customer, responsible, state, bucket, requestKey]);
  const data = current?.board;
  function saved(message: string) { setNotice(message); setEditor(null); setRevision(v => v + 1); }
  function open(value: Editor) { setNotice(""); setHistory(""); setEditor(value); }
  return <div className="space-y-5">
    <PageHeader title="Acompanhamento comercial" description={`${product === "MILES" ? "Milhas" : "Viagens"}: próximas ações por pessoa ou prospecto, com prazo e responsável.`}>
      <Button disabled={!references || !!editor} onClick={() => open({ type: "edit" })}>Nova ação</Button>
    </PageHeader>
    <p className="text-sm text-[var(--hub-text-secondary)]">{data ? `Hoje: ${dateLabel(data.today)} (Fortaleza). ` : "Datas no horário de Fortaleza. "}Próximas inclui todas as datas depois de hoje. Os totais mostram ações abertas da pessoa e do responsável filtrados.</p>
    {notice && <p role="status" className="text-sm text-green-800">{notice}</p>}
    {referenceError && <p role="alert" className="text-sm text-red-700">{referenceError} <Button variant="secondary" onClick={() => setReferenceRetry(v => v + 1)}>Recarregar pessoas e equipe</Button></p>}
    {!editor && <>
      <div className="grid gap-3 sm:grid-cols-3">
        <ClientePicker id="followup-filter-person" label="Filtrar pessoa ou prospecto" clientes={references?.customers ?? []} value={customer} onChange={setCustomer} showNovoButton={false} loading={!references && !referenceError} />
        <div><Label htmlFor="followup-filter-responsible">Responsável</Label><select id="followup-filter-responsible" className={selectClass} value={responsible} onChange={e => setResponsible(e.target.value)}><option value="">Todos</option>{references?.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div><Label htmlFor="followup-filter-state">Situação</Label><select id="followup-filter-state" className={selectClass} value={state} onChange={e => setState(e.target.value as State | "" | "DELETED")}><option value="">Todas</option>{Object.entries(STATE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}<option value="DELETED">Excluídas (histórico)</option></select></div>
      </div>
      <div aria-label="Filtrar por prazo" className="flex flex-wrap gap-2">{BUCKETS.map(b => <Button key={b.value} variant={bucket === b.value ? "primary" : "secondary"} aria-pressed={bucket === b.value} onClick={() => setBucket(b.value)}>{b.label}{b.count && data ? ` (${data.counts[b.count]})` : ""}</Button>)}</div>
    </>}
    {editor && references && <FollowupEditor key={`${editor.type}:${editor.row?.id ?? "new"}:${editor.type === "state" ? editor.state : ""}`} editor={editor} product={product} token={token} customers={references.customers} members={references.members} customerId={customer} saved={saved} cancel={() => setEditor(null)} />}
    {history && <History key={history} token={token} id={history} close={() => setHistory("")} />}
    {current?.error && <p role="alert" className="text-sm text-red-700">{current.error} <Button variant="secondary" onClick={() => setRevision(v => v + 1)}>Recarregar lista</Button></p>}
    {!current && <p role="status" className="text-sm">Carregando ações…</p>}
    {data?.items.length === 0 && <p className="rounded-lg border border-dashed border-[var(--hub-border)] p-5 text-sm">Nenhuma ação encontrada com esses filtros.</p>}
    <ul className="divide-y divide-[var(--hub-border)]">{data?.items.map(row => <li key={row.id} className="py-4 space-y-2">
      <div className="flex flex-wrap justify-between gap-2"><h2 className="min-w-0 break-words font-semibold">{row.title}</h2><span className="text-sm">{row.deleted ? "Excluída" : STATE_LABEL[row.state]}</span></div>
      <p className="break-words text-sm"><Link className="underline" href={product === "MILES" ? `/milhas/clientes/${row.customerId}` : `/clientes/${row.customerId}`}>{row.customerName}</Link> · {row.responsibleName}</p>
      <p className={`text-sm ${row.state === "OPEN" && row.dueOn < data.today ? "font-medium text-red-700" : "text-[var(--hub-text-secondary)]"}`}>Prazo: {dateLabel(row.dueOn)}{row.state === "OPEN" && row.dueOn < data.today ? " · Atrasada" : ""}</p>
      {row.notes && <p className="whitespace-pre-wrap break-words text-sm">{row.notes}</p>}
      {row.stateReason && <p className="whitespace-pre-wrap break-words text-sm">Motivo/resultado: {row.stateReason}</p>}
      <div className="flex flex-wrap gap-2">
        {!row.deleted && (row.state === "OPEN" ? <><Button size="sm" disabled={!!editor || !references} onClick={() => open({ type: "state", row, state: "DONE" })}>Concluir</Button><Button size="sm" variant="secondary" disabled={!!editor || !references} onClick={() => open({ type: "edit", row })}>Editar / reprogramar</Button><Button size="sm" variant="secondary" disabled={!!editor || !references} onClick={() => open({ type: "state", row, state: "CANCELLED" })}>Cancelar ação</Button><Button size="sm" variant="ghost" disabled={!!editor || !references} onClick={() => open({ type: "delete", row })}>Excluir</Button></> : <Button size="sm" variant="secondary" disabled={!!editor || !references} onClick={() => open({ type: "state", row, state: "OPEN" })}>Reabrir com motivo</Button>)}
        <Button size="sm" variant="ghost" disabled={!!editor} onClick={() => setHistory(row.id)}>Histórico</Button>
      </div>
    </li>)}</ul>
    <p className="text-xs text-[var(--hub-text-muted)]">Ações encerradas são reabertas antes de editar ou excluir. Excluir retira da lista e preserva o histórico.</p>
  </div>;
}
export function FollowupBoard({ product }: { product: Product }) {
  const { token } = useAuth();
  const params = useSearchParams();
  const customer = params.get("customerId") ?? "";
  return token ? <BoardInner key={`${product}:${token}:${customer}`} product={product} token={token} initialCustomer={customer} /> : <p role="alert">Entre no sistema para acessar o acompanhamento comercial.</p>;
}
