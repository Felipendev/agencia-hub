"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { useData } from "@/contexts/data-context";
import { carregarTabelas, getValorMilheiro } from "@/lib/tabelas-milhas";
import { PageHeader } from "@/components/layout/page-header";
import { ImportarVoos } from "@/components/cotacao/ImportarVoos";
import { FlightOptionForm } from "@/components/cotacao/FlightOptionForm";
import { emptyCotacaoDetalhes } from "@/lib/cotacao-defaults";
import { buildFlightPlan, commercialFlights, importedDraft, newFlightDraft, type FlightDraft, type FlightImportResult } from "@/lib/flight-plan";
import type { Cotacao } from "@/types";

function Calculator({ initial }: { initial?: Cotacao }) {
  const router = useRouter();
  const { clientes, cotacoes, addCotacao, saveCotacaoFlightPlan, hasRemoteApi, isReady, syncClientesFromApi } = useData();
  const [tables] = useState(carregarTabelas);
  const [targetId, setTargetId] = useState(initial?.id ?? "");
  const [loadedTargetId, setLoadedTargetId] = useState(initial?.id ?? "");
  const [clienteId, setClienteId] = useState(initial?.clienteId ?? "");
  const [title, setTitle] = useState(initial?.titulo ?? "");
  const [options, setOptions] = useState<FlightDraft[]>(() => initial?.flightPlan
    ? initial.flightPlan.options.map((o) => ({ ...o, incluir: true, avisos: [] })) : [newFlightDraft()]);
  const [principal, setPrincipal] = useState(initial?.flightPlan?.selectedOptionId ?? "");
  const [error, setError] = useState("");
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [busy, setBusy] = useState(false);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [clientesLoadError, setClientesLoadError] = useState("");
  const saving = useRef(false);
  const target = cotacoes.find((c) => c.id === targetId);

  const loadClientes = useCallback(async () => {
    if (!hasRemoteApi) return;
    setClientesLoading(true);
    setClientesLoadError("");
    try {
      await syncClientesFromApi();
    } catch {
      setClientesLoadError("Não foi possível carregar as pessoas da agência.");
    } finally {
      setClientesLoading(false);
    }
  }, [hasRemoteApi, syncClientesFromApi]);

  useEffect(() => {
    if (!isReady) return;
    void loadClientes();
  }, [isReady, loadClientes]);

  useEffect(() => {
    const included = options.filter((option) => option.incluir);
    if (included.length === 1 && principal !== included[0].id) {
      setPrincipal(included[0].id);
    } else if (principal && !included.some((option) => option.id === principal)) {
      setPrincipal("");
    }
  }, [options, principal]);

  function imported(result: FlightImportResult): boolean {
    const additions = result.extraction.offers.map((offer) => {
      const draft = importedDraft(offer, result.id);
      const cia = tables.cias.find((c) => c.nome.toUpperCase().includes((offer.airline ?? "__").toUpperCase()));
      if (cia) { draft.cia = cia.nome; draft.corCia = cia.cor; draft.calculo.custoPorMilheiro = getValorMilheiro(cia, draft.calculo.milhasIda); }
      draft.avisos = [...result.extraction.warnings, ...draft.avisos];
      return draft;
    });
    // A repeated upload never overwrites manually reviewed values.
    if (options.some((o) => o.calculo.importacaoId === result.id)) { setError("Este arquivo já foi adicionado. Mantivemos suas correções nas opções existentes."); return false; }
    if (options.length + additions.length > 20) { setError("Limite de 20 opções. Remova opções antes de importar outras."); return false; }
    setOptions((current) => {
      const next = [...current.filter((o) => !(o.nome === "Opção de voo" && !o.cia && !o.calculo.importacaoId
      && o.calculo.milhasIda === 0 && o.calculo.taxas === 0 && o.calculo.taxasAdicionais === 0
      && o.calculo.custoPorMilheiro === 0 && o.calculo.valorMala === 0 && o.calculo.qtdMalas === 0
      && !o.calculo.revisado && o.qtdPessoas === 1 && o.segmentos.length === 1
      && Object.values(o.segmentos[0]).every((v) => v == null))), ...additions];
      return next;
    }); setError(""); return true;
  }
  function loadSaved() {
    if (!target?.flightPlan) return;
    setOptions(target.flightPlan.options.map((o) => ({ ...o, incluir: true, avisos: [] })));
    setLoadedTargetId(target.id);
    setPrincipal(target.flightPlan.selectedOptionId); setClienteId(target.clienteId); setTitle(target.titulo); setError("");
  }
  async function save() {
    if (saving.current) return;
    setAttemptedSave(true);
    setError("");
    try {
      const existing = target?.flightPlan && loadedTargetId !== target.id
        ? target.flightPlan.options.map((o) => ({ ...o, incluir: true, avisos: [] })) : [];
      const plan = buildFlightPlan([...existing, ...options], principal);
      if (!targetId && !clienteId) throw new Error("Selecione um cliente.");
      if (targetId && !target) throw new Error("Cotação não encontrada.");
      saving.current = true; setBusy(true);
      if (targetId) {
        await saveCotacaoFlightPlan(targetId, plan);
        router.push(`/cotacoes/${targetId}`);
        return;
      }
      const selected = plan.options.find((o) => o.id === principal)!;
      const first = selected.segmentos[0], last = selected.segmentos[selected.segmentos.length - 1];
      const route = selected.segmentos.map((s) => `${s.origin || "A confirmar"} → ${s.destination || "A confirmar"}`).join(" / ");
      const nova = await addCotacao({
        clienteId, titulo: title.trim() || `Cotação ${route}`, destino: route, valorTotal: selected.precoTotal,
        moeda: "BRL", status: "em_cotacao", validade: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        dataInicioViagem: first.departureDate || undefined, dataFimViagem: last.arrivalDate || undefined, observacoes: "",
        detalhes: { ...emptyCotacaoDetalhes(), servicosDesejados: ["passagem"], origem: first.origin || "", destinoForm: first.destination || "",
          destinosTrechos: selected.segmentos.map((s) => `${s.origin || "A confirmar"} → ${s.destination || "A confirmar"}`), dataIda: first.departureDate || "",
          dataVolta: selected.calculo.tipo === "ida_volta" ? last.departureDate || "" : "", adultos: selected.qtdPessoas,
          usaMilhas: true, malasDespachadas: selected.calculo.qtdMalas > 0, qtdMalas: String(selected.calculo.qtdMalas) },
        tags: ["milhas"], prioridade: false, responsavel: "", flightPlan: plan, opcoesVoo: commercialFlights(plan),
      });
      router.push(`/cotacoes/${nova.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar a cotação."); }
    finally { saving.current = false; setBusy(false); }
  }
  return <div className="space-y-5">
    <PageHeader title="Calculadora de Milhas" description="Importe ou preencha os voos, confira os custos e prepare a cotação.">
      <Link href="/calculadora/milheiro" className="text-sm text-[var(--hub-blue)] hover:underline">Precificar milheiro</Link>
    </PageHeader>
    <fieldset disabled={busy} className="space-y-5">
      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Salvar em<Select value={targetId} onChange={(e) => { setTargetId(e.target.value); setError(""); }}>
            <option value="">Nova cotação</option>{cotacoes.map((c) => <option key={c.id} value={c.id}>{c.titulo} — {clientes.find((p) => p.id === c.clienteId)?.nome ?? "Cliente"}</option>)}
          </Select></label>
          {!targetId && <ClientePicker id="calc-cliente" label="Cliente" required invalid={attemptedSave && !clienteId} clientes={clientes} value={clienteId} onChange={setClienteId} loading={clientesLoading} loadError={clientesLoadError} onRetryLoad={() => void loadClientes()} />}
          {!targetId && <label className="text-sm">Título (opcional)<Input value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} placeholder="Cotação de passagens" /></label>}
          {target?.flightPlan && <div><Button type="button" variant="secondary" onClick={loadSaved}>Carregar opções salvas</Button><p className="mt-1 text-xs">Substitui o rascunho da calculadora pelas opções desta cotação.</p></div>}
        </div>
      </Card>
      <ImportarVoos onImport={imported} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Opções de voo</h2>
        <Button type="button" variant="secondary" disabled={options.length >= 20} onClick={() => setOptions((current) => [...current, newFlightDraft()])}>Adicionar opção manual</Button>
      </div>
      {attemptedSave && !targetId && !clienteId && <p className="text-sm text-red-600" role="alert">Selecione um cliente.</p>}
      {attemptedSave && !options.some((option) => option.incluir && option.id === principal) && <p className="text-sm text-red-600" role="alert">Escolha uma opção principal da cotação.</p>}
      {options.map((option) => <FlightOptionForm key={option.id} option={option} tables={tables} principal={principal === option.id} showValidationErrors={attemptedSave}
        onPrincipal={() => setPrincipal(option.id)}
        onChange={(changed) => setOptions((current) => current.map((o) => o.id === changed.id ? changed : o))}
        onRemove={() => setOptions((current) => current.filter((o) => o.id !== option.id))} />)}
      <Card>
        <p className="text-sm">Os preços são recalculados a cada alteração. A opção marcada define o total; as alternativas não são somadas.</p>
        {targetId && <p className="mt-2 text-sm font-medium">Ao salvar, o total atual da cotação será substituído pelo preço desta opção. Valores de outros serviços não serão somados. Confira também as datas e o destino no cadastro da cotação.</p>}
        <p className="mt-1 text-sm text-[var(--hub-text-secondary)]">O PDF mostra os voos e preços finais. A memória de cálculo fica no detalhe interno.</p>
        {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
        {principal && (() => { const chosen = options.find((option) => option.id === principal); return chosen ? <p className="mt-3 text-sm font-medium">Preço da cotação: {chosen.precoTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} — definido pela opção “{chosen.nome || "sem nome"}”.</p> : null; })()}
        <Button type="button" className="mt-4" onClick={() => void save()} disabled={busy || !options.some((o) => o.incluir)}>{busy ? "Salvando…" : targetId ? "Atualizar voos da cotação" : "Criar cotação com voos"}</Button>
      </Card>
    </fieldset>
  </div>;
}
function CalculatorLoader() {
  const params = useSearchParams();
  const { cotacoes, isReady } = useData();
  const id = params.get("cotacao");
  if (!isReady) return <p>Carregando calculadora…</p>;
  const current = id ? cotacoes.find((c) => c.id === id) : undefined;
  if (id && !current) return <p>Cotação não encontrada. <Link href="/calculadora">Abrir calculadora</Link></p>;
  return <Calculator key={id ?? "nova"} initial={current} />;
}
export default function CalculadoraMilhasPage() {
  return <Suspense fallback={<p>Carregando calculadora…</p>}><CalculatorLoader /></Suspense>;
}
