"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { fmtBRL } from "@/lib/calculadora-milhas";
import type { FlightPlan } from "@/lib/flight-plan";

function Snapshot({ plan }: { plan: FlightPlan }) {
  return <div className="mt-3 space-y-4">{plan.options.map((o) => <div key={o.id} className="rounded-lg border border-[var(--hub-border)] p-3">
    <p className="font-semibold">{o.cia} — {o.nome}{o.id === plan.selectedOptionId ? " · Opção usada no total" : ""}</p>
    {o.segmentos.map((s, i) => <p key={i} className="mt-1 text-sm">{s.origin} → {s.destination} · {s.departureDate} {s.departureTime} → {s.arrivalDate} {s.arrivalTime} · {s.durationMinutes} min · {s.stops} parada(s)</p>)}
    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
      <div><dt>Milhas de ida / volta por pessoa</dt><dd>{o.calculo.milhasIda.toLocaleString("pt-BR")} / {o.calculo.milhasVolta.toLocaleString("pt-BR")}</dd></div>
      <div><dt>Custo do milheiro</dt><dd>{fmtBRL(o.calculo.custoPorMilheiro)}</dd></div>
      <div><dt>Custo das milhas por pessoa</dt><dd>{fmtBRL(o.calculo.custoMilhas ?? 0)}</dd></div>
      <div><dt>Parcela em dinheiro / taxas por pessoa</dt><dd>{fmtBRL(o.calculo.taxas)}</dd></div>
      <div><dt>Taxas adicionais por pessoa</dt><dd>{fmtBRL(o.calculo.taxasAdicionais)}</dd></div>
      <div><dt>Base por pessoa</dt><dd>{fmtBRL(o.calculo.basePorPessoa ?? 0)}</dd></div>
      <div><dt>Configuração do lucro</dt><dd>{o.calculo.lucroConfig.usarPct ? `${o.calculo.lucroConfig.pct}% sobre a base` : "Sem percentual"}{o.calculo.lucroConfig.usarFixo ? ` + ${fmtBRL(o.calculo.lucroConfig.fixo)} por pessoa` : ""}</dd></div>
      <div><dt>Lucro por pessoa</dt><dd>{fmtBRL(o.calculo.lucroPorPessoa ?? 0)}</dd></div>
      <div><dt>Venda para {o.qtdPessoas} passageiro(s)</dt><dd className="font-semibold">{fmtBRL(o.precoTotal)}</dd></div>
    </dl>
    {o.calculo.importacaoId && <p className="mt-2 break-all text-xs text-[var(--hub-text-muted)]">Origem: {o.calculo.arquivoOrigem ?? "Arquivo importado"} · {o.calculo.importadoEm ?? ""} · Importação: {o.calculo.importacaoId}</p>}
  </div>)}
    {plan.savedAt && <p className="text-xs text-[var(--hub-text-muted)]">Salvo em {new Date(plan.savedAt).toLocaleString("pt-BR")}{plan.savedBy ? ` · Responsável: ${plan.savedByName || plan.savedBy}` : ""}</p>}
  </div>;
}
export function FlightPlanDetails({ quotationId, plan }: { quotationId: string; plan?: FlightPlan }) {
  const { token } = useAuth();
  const [history, setHistory] = useState<FlightPlan[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function loadHistory() {
    const base = getAgenciaHubApiBaseUrl();
    if (!base || !token) { setError("Histórico disponível quando a API está conectada."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`${base}/quotations/${encodeURIComponent(quotationId)}/flight-history`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível carregar o histórico.");
      setHistory(await response.json());
    } catch { setError("Não foi possível carregar o histórico."); }
    finally { setBusy(false); }
  }
  return <Card>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-semibold">Voos e memória de cálculo — uso interno</h2>
      <Link href={`/calculadora?cotacao=${encodeURIComponent(quotationId)}`} className="text-sm text-[var(--hub-blue)] hover:underline">{plan ? "Editar na calculadora" : "Adicionar voos"}</Link>
    </div>
    <p className="mt-1 text-sm text-[var(--hub-text-secondary)]">Milhas, custos, taxas internas e lucro não aparecem no PDF ou na mensagem do cliente.</p>
    {plan ? <Snapshot plan={plan} /> : <p className="mt-3 text-sm">Nenhum cálculo de voo salvo.</p>}
    {plan && <button type="button" disabled={busy} onClick={() => void loadHistory()} className="mt-4 text-sm text-[var(--hub-blue)]">{busy ? "Carregando…" : "Consultar últimas 50 versões"}</button>}
    {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    {history?.map((item, index) => <details key={`${item.savedAt}-${index}`} className="mt-3 border-t border-[var(--hub-border)] pt-3"><summary className="cursor-pointer text-sm">Versão de {item.savedAt ? new Date(item.savedAt).toLocaleString("pt-BR") : "data não informada"}</summary><Snapshot plan={item} /></details>)}
  </Card>;
}
