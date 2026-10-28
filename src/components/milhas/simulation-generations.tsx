"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { simulationTasksApi, type GenerationSummary } from "@/lib/simulation-tasks";

export function SimulationGenerations() {
  const { token } = useAuth();
  return token ? <Directory key={token} token={token} /> : <p role="alert">Entre no sistema para consultar gerações de tarefas.</p>;
}
function Directory({ token }: { token: string }) {
  const [rows, setRows] = useState<GenerationSummary[] | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState("");
  useEffect(() => { let active = true; simulationTasksApi.list(token).then(data => { if (active) { setRows(data); setError(""); } }).catch(ex => { if (active) setError(ex instanceof Error ? ex.message : "Não foi possível consultar as gerações."); }); return () => { active = false; }; }, [token, revision]);
  const visible = rows?.filter(row => `${row.title} ${row.customerName}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")));
  return <div className="space-y-5">
    <PageHeader title="Histórico de gerações" description="Comprovantes dos planos de Milhas, inclusive após excluir o plano ou suas tarefas." />
    <Link className="text-sm underline" href="/milhas/simulador">Voltar ao simulador</Link>
    <Input aria-label="Buscar plano ou pessoa" placeholder="Buscar plano ou pessoa" value={query} onChange={e => setQuery(e.target.value)} />
    {error && <p role="alert" className="text-sm text-red-700">{error} <Button variant="secondary" onClick={() => setRevision(v => v + 1)}>Tentar novamente</Button></p>}
    {!rows && !error && <p role="status">Carregando gerações…</p>}
    {visible?.length === 0 && <p className="text-sm">Nenhuma geração encontrada com essa busca.</p>}
    <ul className="divide-y divide-[var(--hub-border)]">{visible?.map(row => <li key={row.sourceId} className="space-y-2 break-words py-4"><h2 className="font-semibold">{row.title}</h2><p className="text-sm">{row.customerName} · Versão {row.version} · {new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "short", timeStyle: "short" }).format(new Date(row.createdAt))}{row.planDeleted ? " · Plano excluído" : ""}</p><Link className="text-sm underline" href={`/milhas/simulador/${row.sourceId}/tarefas`}>Consultar comprovante e tarefas</Link></li>)}</ul>
    <p className="text-xs text-[var(--hub-text-muted)]">Comprovantes preservam a origem da geração. As tarefas são editadas, concluídas, canceladas ou excluídas no atendimento de Milhas.</p>
  </div>;
}
