"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { accumulationReport, calculateAccumulation, type AccumulationAssumptions, type SavedSimulation } from "@/lib/accumulation-simulation";

const initial: AccumulationAssumptions = { title: "Novo cenário", monthlySpending: 10000, pointsPerDollar: 2, exchangeRate: 5, exchangeDate: new Date().toISOString().slice(0, 10), months: 12, passengers: 1, milesPerPassenger: 80000, destination: "", scenarios: [{ program: "Programa escolhido", bonusPercent: 0 }] };
const count = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

export default function SimuladorAcumuloPage() {
  const { token } = useAuth();
  const base = getAgenciaHubApiBaseUrl();
  const [input, setInput] = useState(initial);
  const [saved, setSaved] = useState<SavedSimulation[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const result = calculateAccumulation(input);

  useEffect(() => {
    if (!token || !base) return;
    const controller = new AbortController();
    fetch(`${base}/accumulation-simulations`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async r => { if (!r.ok) throw new Error("Não foi possível carregar as simulações salvas."); return r.json() as Promise<SavedSimulation[]>; })
      .then(rows => { setSaved(rows); setLoaded(true); })
      .catch((e: Error) => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [base, token]);

  async function request(path: string, init: RequestInit) {
    if (!token || !base) throw new Error("Conecte-se para salvar simulações da agência.");
    const response = await fetch(`${base}/accumulation-simulations${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } });
    if (!response.ok) { const data = await response.json().catch(() => null); throw new Error(data?.message || "Não foi possível concluir a operação."); }
    return response;
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!result || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const row: SavedSimulation = await (await request("", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) })).json();
      setSaved(rows => [row, ...rows]); setLoaded(true); setNotice("Simulação salva para consulta pela equipe. Alterações futuras podem ser salvas como um novo cenário.");
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao salvar."); } finally { setBusy(false); }
  }
  async function remove(row: SavedSimulation) {
    if (!window.confirm(`Excluir a simulação “${row.assumptions.title}”?`)) return;
    setBusy(true); setError(""); setNotice("");
    try { await request(`/${row.id}`, { method: "DELETE" }); setSaved(rows => rows.filter(r => r.id !== row.id)); setNotice("Simulação excluída."); }
    catch (e) { setError(e instanceof Error ? e.message : "Erro ao excluir."); } finally { setBusy(false); }
  }
  function download(assumptions = input, projection = result) {
    if (!projection) return;
    const url = URL.createObjectURL(new Blob([accumulationReport(assumptions, projection)], { type: "text/html;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "simulacao-acumulo.html"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const field = (key: keyof AccumulationAssumptions, value: string | number) => { setInput(current => ({ ...current, [key]: value })); setNotice(""); };
  const numeric = (key: "monthlySpending" | "pointsPerDollar" | "exchangeRate" | "months" | "passengers" | "milesPerPassenger", label: string, min: number, max: number, step = "1") => <label className="space-y-1 text-sm">{label}<Input type="number" required min={min} max={max} step={step} value={Number.isNaN(input[key]) ? "" : input[key]} onChange={e => field(key, e.target.value === "" ? NaN : Number(e.target.value))} /></label>;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold">Simulador de acúmulo</h1><p className="text-sm text-muted-foreground">Planeje pontos e metas de viagem a partir dos gastos do cliente.</p></div>
    <p className="rounded-xl border bg-white p-4 text-sm">Os valores iniciais são um exemplo. Informe as condições do cliente. Bônus são hipóteses e cada programa é uma alternativa; os resultados não são somados nem alteram saldos reais.</p>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    <form onSubmit={save} className="space-y-5 rounded-xl border bg-white p-5">
      <h2 className="font-semibold">Premissas do planejamento</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1 text-sm">Nome da simulação<Input required maxLength={200} value={input.title} onChange={e => field("title", e.target.value)} /></label>
        <label className="space-y-1 text-sm">Destino ou objetivo<Input required maxLength={200} placeholder="Ex.: viagem para Lisboa" value={input.destination} onChange={e => field("destination", e.target.value)} /></label>
        {numeric("monthlySpending", "Gasto mensal (R$)", 0, 10000000, "0.01")}
        {numeric("pointsPerDollar", "Pontos por dólar", 0, 100, "0.01")}
        {numeric("exchangeRate", "Câmbio informado (R$ por US$)", 0.01, 1000000, "0.0001")}
        <label className="space-y-1 text-sm">Data do câmbio<Input type="date" required max={new Date().toISOString().slice(0, 10)} value={input.exchangeDate} onChange={e => field("exchangeDate", e.target.value)} /></label>
        {numeric("months", "Prazo (meses)", 1, 120)}
        {numeric("passengers", "Passageiros", 1, 99)}
        {numeric("milesPerPassenger", "Meta de milhas por passageiro", 1, 1000000000)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Cenários de transferência</h2><Button type="button" variant="secondary" disabled={input.scenarios.length >= 10} onClick={() => setInput(current => ({ ...current, scenarios: [...current.scenarios, { program: "", bonusPercent: 0 }] }))}>Adicionar programa</Button></div>
      {input.scenarios.map((scenario, index) => <div key={index} className="flex flex-wrap items-end gap-3">
        <label className="flex-1 space-y-1 text-sm">Programa<Input required maxLength={100} value={scenario.program} onChange={e => setInput(current => ({ ...current, scenarios: current.scenarios.map((s, i) => i === index ? { ...s, program: e.target.value } : s) }))} /></label>
        <label className="space-y-1 text-sm">Bônus hipotético (%)<Input type="number" required min={0} max={1000} step="0.01" value={Number.isNaN(scenario.bonusPercent) ? "" : scenario.bonusPercent} onChange={e => setInput(current => ({ ...current, scenarios: current.scenarios.map((s, i) => i === index ? { ...s, bonusPercent: e.target.value === "" ? NaN : Number(e.target.value) } : s) }))} /></label>
        <Button type="button" variant="secondary" aria-label={`Remover programa ${index + 1}`} onClick={() => setInput(current => ({ ...current, scenarios: current.scenarios.filter((_, i) => i !== index) }))}>Remover</Button>
      </div>)}
      {!result && <p role="alert" className="text-sm text-red-700">Revise os valores, prazos e programas para calcular a projeção.</p>}
      <Button disabled={busy || !result || !token || !base} type="submit">{busy ? "Salvando…" : "Salvar novo cenário"}</Button>
    </form>
    {result && <section className="space-y-4 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Projeção do planejamento</h2><Button variant="secondary" onClick={() => download()}>Baixar relatório</Button></div>
      <div className="grid gap-4 md:grid-cols-3">{[["Pontos por mês", result.monthlyPoints], ["Pontos no período", result.basePoints], ["Meta do grupo", result.goalMiles]].map(([label, value]) => <div key={String(label)} className="border-l-2 border-slate-300 pl-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{count(Number(value))}</p></div>)}</div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-3">Programa</th><th>Bônus hipotético</th><th>Milhas projetadas</th><th>Meta</th></tr></thead><tbody>{result.scenarios.map((s, i) => <tr key={i} className="border-b"><td className="py-3">{s.program}</td><td>{count(s.bonusPercent)}%</td><td>{count(s.projectedMiles)}</td><td>{s.goalReached ? "Alcançada no cenário" : `Faltam ${count(s.remainingMiles)} milhas`}</td></tr>)}</tbody></table></div>
      <p className="text-xs text-muted-foreground">Fórmula: gasto mensal ÷ câmbio × pontos por dólar × meses. O bônus é aplicado separadamente por programa. A meta não garante disponibilidade de passagem. Abra o relatório baixado para imprimir ou salvar em PDF.</p>
    </section>}
    <section className="space-y-3"><h2 className="font-semibold">Simulações salvas da agência</h2>
      {!saved.length && <p className="text-sm text-muted-foreground">{loaded ? "Nenhuma simulação salva." : error ? "Não foi possível consultar as simulações." : "Carregando simulações…"}</p>}
      <div className="grid gap-4 md:grid-cols-2">{saved.map(row => <article key={row.id} className="space-y-3 rounded-xl border bg-white p-5"><h3 className="font-semibold">{row.assumptions.title}</h3><p className="text-sm text-muted-foreground">{row.assumptions.destination} · {row.assumptions.months} meses · {new Date(row.createdAt).toLocaleDateString("pt-BR")}</p><p className="text-sm">{count(row.result.basePoints)} pontos estimados · meta de {count(row.result.goalMiles)} milhas</p><div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={busy} onClick={() => { setInput(row.assumptions); setNotice("Cenário carregado. As alterações serão salvas como uma nova simulação."); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Consultar cenário</Button><Button variant="secondary" onClick={() => download(row.assumptions, row.result)}>Baixar relatório</Button><Button variant="secondary" disabled={busy} onClick={() => remove(row)}>Excluir</Button></div></article>)}</div>
    </section>
  </div>;
}
