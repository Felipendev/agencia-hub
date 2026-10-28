"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { selectClass, textClass } from "@/components/work/work-forms";
import { workApi } from "@/lib/work/api";
import { formatDate, STATE_LABELS, type Member } from "@/lib/work/types";
import { simulationTasksApi, type PlanContext, type Generation, type Step, type Source } from "@/lib/simulation-tasks";

const message = (error: unknown) => error instanceof TypeError ? "A conexão foi interrompida. Não foi possível confirmar a geração. Tente novamente com o formulário preenchido ou consulte a geração existente." : error instanceof Error ? error.message : "Não foi possível concluir a operação.";
const number = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
export function SimulationTasks({ id }: { id: string }) {
  const { token } = useAuth();
  return token ? <Planner key={`${token}:${id}`} token={token} id={id} /> : <p role="alert">Entre no sistema para consultar o plano de Milhas.</p>;
}
function Draft({ data, members, token, id, saved, onBusy }: { data: PlanContext & {simulation: Source}; members: Member[]; token: string; id: string; saved: (g: Generation) => void; onBusy: (busy: boolean) => void }) {
  const [steps, setSteps] = useState<(Step & { key: string })[]>(() => [{ key: crypto.randomUUID(), title: `Revisar meta de acúmulo: ${data.simulation.assumptions.destination}`.slice(0, 180), notes: "", dueOn: data.today }]);
  const [responsible, setResponsible] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const guard = useRef(false);
  function update(key: string, value: Partial<Step>) { setSteps(old => old.map(step => step.key === key ? { ...step, ...value } : step)); }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (guard.current) return;
    if (!responsible || !data.simulation.customerId) { setError("Selecione um responsável ativo e um plano associado a uma pessoa."); return; }
    guard.current = true; setBusy(true); onBusy(true); setError("");
    try {
      const receipt = await simulationTasksApi.generate(token, id, { expectedVersion: data.simulation.version, customerId: data.simulation.customerId, responsibleId: responsible, steps: steps.map(({ title, notes, dueOn }) => ({ title, notes, dueOn })) });
      saved(receipt);
    } catch (ex) { setError(message(ex)); } finally { guard.current = false; setBusy(false); onBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4" aria-label="Revisar tarefas do plano">
    <h2 className="font-semibold">Revisar antes de gerar</h2>
    <p className="text-sm text-[var(--hub-text-secondary)]">A geração será feita uma vez para este plano. Depois, edite e gerencie as tarefas existentes pelo mesmo registro. Hoje: {formatDate(data.today)} (Fortaleza).</p>
    <fieldset disabled={busy} className="space-y-4">
      <div className="max-w-md"><Label htmlFor="plan-responsible">Responsável pelas tarefas</Label><select id="plan-responsible" className={selectClass} required value={responsible} onChange={e => setResponsible(e.target.value)}><option value="">Selecione</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      <ol className="space-y-5">{steps.map((step, i) => <li key={step.key} className="space-y-3 border-t border-[var(--hub-border)] pt-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]"><div><Label htmlFor={`plan-title-${step.key}`}>Tarefa {i + 1}</Label><Input id={`plan-title-${step.key}`} required maxLength={180} value={step.title} onChange={e => update(step.key, { title: e.target.value })} /></div><div><Label htmlFor={`plan-due-${step.key}`}>Prazo {i + 1}</Label><Input id={`plan-due-${step.key}`} type="date" required value={step.dueOn} onChange={e => update(step.key, { dueOn: e.target.value })} /></div></div>
        <div><Label htmlFor={`plan-notes-${step.key}`}>Observações {i + 1}</Label><textarea id={`plan-notes-${step.key}`} maxLength={4000} className={textClass} value={step.notes} onChange={e => update(step.key, { notes: e.target.value })} /></div>
        <Button variant="ghost" size="sm" disabled={steps.length === 1} onClick={() => setSteps(old => old.filter(s => s.key !== step.key))}>Remover tarefa {i + 1}</Button>
      </li>)}</ol>
      <Button variant="secondary" disabled={steps.length >= 20} onClick={() => setSteps(old => [...old, { key: crypto.randomUUID(), title: "", notes: "", dueOn: data.today }])}>Adicionar tarefa ({steps.length}/20)</Button>
      {error && <p role="alert" className="text-sm text-red-700">{error} Seus campos foram preservados. Para revisar uma nova versão, copie suas alterações antes de recarregar.</p>}
      <div><Button type="submit" disabled={!members.length}>{busy ? "Aguardando confirmação…" : "Gerar tarefas de Milhas"}</Button></div>
    </fieldset>
  </form>;
}
function Receipt({ generation }: { generation: Generation }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { panel.current?.focus(); panel.current?.scrollIntoView?.({ block: "nearest" }); }, []);
  const source = generation.snapshot;
  return <section ref={panel} tabIndex={-1} aria-label="Geração existente" className="space-y-3 border-t border-[var(--hub-border)] pt-5">
    <h2 className="font-semibold">Tarefas já geradas</h2>
    <p className="break-words text-sm">Origem: {source.assumptions.title}, versão {source.version} · Pessoa da geração: {source.customerName} · {generation.authorName ?? "Membro da agência"} · {new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "short", timeStyle: "short" }).format(new Date(generation.createdAt))}</p>
    <p className="text-sm">Projeção registrada: {number(source.result.basePoints)} pontos em {source.assumptions.months} meses para {source.assumptions.destination}. Esta origem fica preservada mesmo se o plano mudar. Os prazos e situações abaixo são os atuais das tarefas.</p>
    <p className="text-sm">Premissas registradas: gasto mensal R$ {number(source.assumptions.monthlySpending)}, {number(source.assumptions.pointsPerDollar)} pontos por dólar, câmbio R$ {number(source.assumptions.exchangeRate)} em {formatDate(source.assumptions.exchangeDate)}, {source.assumptions.passengers} passageiro(s), meta de {number(source.result.goalMiles)} milhas. {source.assumptions.scenarios.map(s => `${s.program}: bônus hipotético ${number(s.bonusPercent)}%`).join("; ")}</p>
    <details className="text-sm"><summary className="cursor-pointer font-medium">Tarefas revisadas na geração</summary><ol className="mt-2 list-decimal space-y-2 pl-5">{generation.requested.steps.map((s,i) => <li key={i} className="break-words">{s.title} · {formatDate(s.dueOn)}{s.notes && <p className="whitespace-pre-wrap">{s.notes}</p>}</li>)}</ol></details>
    <ul className="divide-y divide-[var(--hub-border)]">{generation.tasks.map(t => <li key={t.id} className="break-words py-3 text-sm"><p className="font-medium">{t.title}</p><p>{t.deleted ? "Excluída — histórico preservado" : STATE_LABELS[t.state]} · {formatDate(t.dueOn)} · {t.responsibleName ?? "Sem responsável"}</p>{t.notes && <p className="whitespace-pre-wrap">{t.notes}</p>}</li>)}</ul>
    <Link className="inline-flex rounded-md border px-3 py-2 text-sm underline" href={`/milhas/tarefas?simulationId=${source.id}&customerId=${source.customerId}`}>Gerenciar tarefas deste plano</Link>
    <p className="text-sm text-[var(--hub-text-secondary)]">Em Tarefas você pode consultar, editar/reprogramar, concluir, cancelar, reabrir ou excluir ações abertas. Excluir ou alterar uma tarefa não libera outra geração. O comprovante é histórico e não é editável.</p>
  </section>;
}
function Planner({ id, token }: { id: string; token: string }) {
  const [data, setData] = useState<PlanContext | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [memberError, setMemberError] = useState("");
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; simulationTasksApi.get(token, id).then(d => { if (active) { setData(d); setError(""); } }).catch(ex => { if (active) setError(message(ex)); }); return () => { active = false; }; }, [token, id, revision]);
  useEffect(() => { let active = true; workApi.members(token).then(m => { if (active) { setMembers(m); setMemberError(""); } }).catch(ex => { if (active) setMemberError(message(ex)); }); return () => { active = false; }; }, [token, revision]);
  const source = data?.simulation;
  return <div className="space-y-5">
    <PageHeader title="Tarefas do plano de Milhas" description="Revise as ações antes de encaminhá-las ao atendimento." />
    <div className="flex flex-wrap gap-3 text-sm"><Link className="underline" href="/milhas/simulador">Voltar ao simulador</Link><Link className="underline" href="/milhas/simulador/tarefas-geradas">Histórico de gerações</Link>{source?.customerId && <Link className="underline" href={`/milhas/clientes/${source.customerId}`}>Pessoa do plano atual</Link>}<Button size="sm" variant="secondary" disabled={busy} onClick={() => { setData(null); setError(""); setNotice(""); setRevision(v => v + 1); }}>Recarregar plano e geração (descarta a revisão)</Button></div>
    {notice && <p role="status" className="text-sm text-green-800">{notice}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {!data && !error && <p role="status">Carregando plano e geração…</p>}
    {data && !source && data.generation && <p className="text-sm">O plano foi excluído. Seu comprovante e as tarefas continuam disponíveis abaixo.</p>}
    {source && <section className="space-y-2" aria-label="Plano atual"><h2 className="break-words font-semibold">{source.assumptions.title}</h2><p className="text-sm">Pessoa atual: {source.customerName ?? "Sem pessoa — plano legado"} · Versão {source.version}</p><p className="text-sm">{source.assumptions.destination} · {source.assumptions.months} meses · {number(source.result.basePoints)} pontos projetados.</p><p className="text-xs text-[var(--hub-text-muted)]">Projeção hipotética. Gerar tarefas não movimenta saldo, contrata produtos ou cria registros financeiros.</p></section>}
    {data?.generation ? <Receipt generation={data.generation} /> : data && (source?.customerId ? <>
      {memberError && <p role="alert" className="text-red-700 text-sm">Equipe indisponível: {memberError}</p>}
      <Draft key={source.version} data={{...data,simulation:source}} members={members} token={token} id={id} onBusy={setBusy} saved={generation => { setData(old => old ? { ...old, generation } : old); setNotice("Geração confirmada. As tarefas foram salvas em Milhas."); }} />
    </> : <p role="alert">Associe uma pessoa a este plano no simulador antes de gerar tarefas. O cálculo avulso continua disponível.</p>)}
  </div>;
}
