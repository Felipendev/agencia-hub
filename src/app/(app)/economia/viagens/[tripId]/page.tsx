"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EVIDENCE_ACCEPT, evidenceProblem, saveBlob, savingsApi } from "@/lib/savings/api";
import {
  ADJUSTMENT_LABEL,
  COST_LABEL,
  MILES_LABEL,
  SOURCE_LABEL,
  TRIP_STATUS,
  actionLabel,
  dataFromForm,
  formFromData,
  formatDay,
  formatMoment,
  formatMoney,
  todayInAgencyZone,
  type SavingsForm,
} from "@/lib/savings/format";
import type { AdjustmentKind, CostKind, MilesUsage, SavingsResult, SavingsView, SourceType, VersionView } from "@/lib/savings/types";

const selectClass = "h-10 w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm";
const areaClass = "w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3 text-sm";

function ResultPanel({ result }: { result: SavingsResult }) {
  if (!result.available) {
    return (
      <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <p className="font-medium">Economia indisponível</p>
        <ul className="mt-1 list-disc pl-5">{result.reasons.map((r) => <li key={r.code}>{r.label}</li>)}</ul>
        {result.effectiveCost != null && <p className="mt-2 text-xs">Custo efetivo registrado até agora: {formatMoney(result.effectiveCost)}</p>}
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div><p className="text-xs text-[var(--hub-text-muted)]">Economia realizada</p><p className="text-xl font-semibold">{formatMoney(result.savings)}</p><p className="text-xs text-[var(--hub-text-muted)]">{result.savingsPercent?.toLocaleString("pt-BR")}% do preço comparável</p></div>
      <div><p className="text-xs text-[var(--hub-text-muted)]">Preço comparável</p><p className="text-lg font-medium">{formatMoney(result.comparablePrice)}</p></div>
      <div><p className="text-xs text-[var(--hub-text-muted)]">Custo efetivo</p><p className="text-lg font-medium">{formatMoney(result.effectiveCost)}</p><p className="text-xs text-[var(--hub-text-muted)]">custos {formatMoney(result.baseCost)} · ajustes {formatMoney(result.adjustments)}</p></div>
    </div>
  );
}

export default function TripSavingsPage() {
  const { token } = useAuth();
  const { tripId } = useParams<{ tripId: string }>();
  const [view, setView] = useState<SavingsView | null>(null);
  const [form, setForm] = useState<SavingsForm | null>(null);
  const [version, setVersion] = useState<VersionView | null>(null);
  const [evidence, setEvidence] = useState<File | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [confirm, setConfirm] = useState<{ kind: "analysis" } | { kind: "evidence"; id: string; filename: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");

  const apply = useCallback((next: SavingsView) => { setView(next); setForm(formFromData(next.data)); }, []);

  useEffect(() => {
    if (!token || !tripId) return;
    let active = true;
    savingsApi.get(token, tripId).then((data) => { if (active) apply(data); }).catch((e: Error) => { if (active) setLoadError(e.message); });
    return () => { active = false; };
  }, [token, tripId, apply]);

  async function run(action: () => Promise<string | void>) {
    setBusy(true); setError(""); setNotice("");
    try { const message = await action(); if (message) setNotice(message); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível concluir a ação."); }
    finally { setBusy(false); }
  }

  if (loadError) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{loadError}</p>;
  if (!view || !form) return <p className="text-sm text-[var(--hub-text-muted)]">Carregando análise…</p>;

  const trip = view.trip;
  const set = <K extends keyof SavingsForm>(key: K, value: SavingsForm[K]) => setForm({ ...form, [key]: value });
  const today = todayInAgencyZone();

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const next = await savingsApi.save(token, tripId, dataFromForm(form), view.version);
      const created = view.version === 0;
      const changed = next.version !== view.version;
      apply(next); setVersion(null);
      return created ? "Análise registrada." : changed ? `Análise salva como versão ${next.version}. As versões anteriores ficam no histórico.` : "Nenhuma alteração para salvar.";
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Economia da viagem" description={`${trip.customerName} · ${trip.serviceType}${trip.airline ? ` · ${trip.airline}` : ""} · ${trip.bookingLocator ?? "sem localizador"} · partida ${formatDay(trip.travelStartDate)}`}>
        <Badge tone={trip.status === "CANCELLED" ? "muted" : "default"}>{TRIP_STATUS[trip.status] ?? trip.status}</Badge>
        <Link href={`/economia?customerId=${trip.customerId}`} className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--hub-bg-subtle)]">Economia da pessoa</Link>
        <Link href={`/viagens/${trip.tripId}`} className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--hub-bg-subtle)]">Abrir viagem</Link>
      </PageHeader>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      <Card className="space-y-3">
        <CardTitle>Resultado {view.savingsId ? `(versão ${view.version})` : ""}</CardTitle>
        <CardDescription>Calculado pela API com os dados salvos. Não altera vendas, financeiro, cotação ou viagem.</CardDescription>
        <ResultPanel result={view.result} />
      </Card>

      <form onSubmit={save} className="space-y-6">
        <Card className="space-y-4">
          <CardTitle>Preço comparável em dinheiro</CardTitle>
          <div className="grid gap-4 md:grid-cols-3">
            <div><Label htmlFor="price">Preço total da alternativa (R$)</Label><Input id="price" inputMode="decimal" placeholder="5.000,00" disabled={busy} value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
            <div>
              <Label htmlFor="source-type">Tipo de fonte</Label>
              <select id="source-type" className={selectClass} disabled={busy} value={form.sourceType} onChange={(e) => set("sourceType", e.target.value as "" | SourceType)}>
                <option value="">Escolha</option>
                {(Object.keys(SOURCE_LABEL) as SourceType[]).map((k) => <option key={k} value={k}>{SOURCE_LABEL[k]}</option>)}
              </select>
            </div>
            <div><Label htmlFor="researched-on">Data da pesquisa</Label><Input id="researched-on" type="date" max={today} disabled={busy} value={form.researchedOn} onChange={(e) => set("researchedOn", e.target.value)} /></div>
            <div className="md:col-span-2"><Label htmlFor="source-description">Fonte (onde o preço foi encontrado)</Label><Input id="source-description" maxLength={500} disabled={busy} value={form.sourceDescription} onChange={(e) => set("sourceDescription", e.target.value)} /></div>
            <div><Label htmlFor="source-url">Link da fonte</Label><Input id="source-url" type="url" maxLength={2048} placeholder="https://" disabled={busy} value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} /></div>
          </div>
        </Card>

        <Card className="space-y-4">
          <CardTitle>Equivalência da comparação</CardTitle>
          <CardDescription>Registre o que foi comparado. Sem as quatro confirmações, a economia fica indisponível.</CardDescription>
          <div className="grid gap-4 md:grid-cols-3">
            <div><Label htmlFor="route">Rota</Label><Input id="route" maxLength={300} placeholder="FOR → LIS → FOR" disabled={busy} value={form.route} onChange={(e) => set("route", e.target.value)} /></div>
            <div><Label htmlFor="outbound">Ida</Label><Input id="outbound" type="date" disabled={busy} value={form.outboundDate} onChange={(e) => set("outboundDate", e.target.value)} /></div>
            <div><Label htmlFor="return">Volta</Label><Input id="return" type="date" min={form.outboundDate || undefined} disabled={busy} value={form.returnDate} onChange={(e) => set("returnDate", e.target.value)} /></div>
            <div><Label htmlFor="passengers">Passageiros</Label><Input id="passengers" type="number" min={1} max={99} disabled={busy} value={form.passengers} onChange={(e) => set("passengers", e.target.value)} /></div>
            <div><Label htmlFor="fare">Cabine/tarifa</Label><Input id="fare" maxLength={300} disabled={busy} value={form.fareConditions} onChange={(e) => set("fareConditions", e.target.value)} /></div>
            <div><Label htmlFor="baggage">Bagagem</Label><Input id="baggage" maxLength={300} disabled={busy} value={form.baggage} onChange={(e) => set("baggage", e.target.value)} /></div>
          </div>
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="sr-only">Confirmações de equivalência</legend>
            {([["sameRoute", "Mesma rota"], ["sameDates", "Mesmas datas"], ["samePassengers", "Mesmos passageiros"], ["equivalentConditions", "Bagagem e tarifa equivalentes"]] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy} checked={form[key]} onChange={(e) => set(key, e.target.checked)} /> {label}</label>
            ))}
          </fieldset>
          <div><Label htmlFor="differences">Diferenças conhecidas</Label><textarea id="differences" rows={2} maxLength={1000} className={areaClass} disabled={busy} value={form.differences} onChange={(e) => set("differences", e.target.value)} /></div>
        </Card>

        <Card className="space-y-4">
          <CardTitle>Custo efetivo para o cliente</CardTitle>
          <CardDescription>Inclua tudo o que o cliente pagou, com taxas e honorários em linhas próprias. O custo das milhas só entra quando conhecido e com a origem registrada.</CardDescription>
          <fieldset className="space-y-1">
            <legend className="mb-1 text-xs font-medium text-[var(--hub-text-secondary)]">Uso de milhas na emissão</legend>
            {(Object.keys(MILES_LABEL) as MilesUsage[]).map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm"><input type="radio" name="miles" disabled={busy} checked={form.milesUsage === k} onChange={() => set("milesUsage", k)} /> {MILES_LABEL[k]}</label>
            ))}
          </fieldset>
          {form.costs.map((line, i) => (
            <div key={i} className="grid gap-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3 md:grid-cols-[1.2fr_0.8fr_1.5fr_1.2fr_auto]">
              <div>
                <Label htmlFor={`cost-kind-${i}`}>Tipo</Label>
                <select id={`cost-kind-${i}`} className={selectClass} disabled={busy} value={line.kind} onChange={(e) => set("costs", form.costs.map((l, j) => j === i ? { ...l, kind: e.target.value as CostKind } : l))}>
                  {(Object.keys(COST_LABEL) as CostKind[]).map((k) => <option key={k} value={k}>{COST_LABEL[k]}</option>)}
                </select>
              </div>
              <div><Label htmlFor={`cost-amount-${i}`}>Valor (R$)</Label><Input id={`cost-amount-${i}`} inputMode="decimal" required disabled={busy} value={line.amount} onChange={(e) => set("costs", form.costs.map((l, j) => j === i ? { ...l, amount: e.target.value } : l))} /></div>
              <div><Label htmlFor={`cost-description-${i}`}>Descrição</Label><Input id={`cost-description-${i}`} required maxLength={300} disabled={busy} value={line.description} onChange={(e) => set("costs", form.costs.map((l, j) => j === i ? { ...l, description: e.target.value } : l))} /></div>
              <div>
                <Label htmlFor={`cost-origin-${i}`}>{line.kind === "MILES_ACQUISITION" ? "Origem das milhas *" : "Origem"}</Label>
                <Input id={`cost-origin-${i}`} maxLength={300} required={line.kind === "MILES_ACQUISITION"} placeholder={line.kind === "MILES_ACQUISITION" ? "Compra, clube, transferência…" : ""} disabled={busy} value={line.origin} onChange={(e) => set("costs", form.costs.map((l, j) => j === i ? { ...l, origin: e.target.value } : l))} />
              </div>
              <div className="flex items-end"><Button variant="ghost" size="sm" disabled={busy} onClick={() => set("costs", form.costs.filter((_, j) => j !== i))} aria-label={`Remover custo ${i + 1}`}>Remover</Button></div>
            </div>
          ))}
          <Button variant="secondary" size="sm" disabled={busy || form.costs.length >= 30} onClick={() => set("costs", [...form.costs, { kind: "AGENCY_PAYMENT", amount: "", description: "", origin: "", miles: "" }])}>Adicionar custo</Button>
        </Card>

        <Card className="space-y-4">
          <CardTitle>Cancelamentos, reembolsos e remarcações</CardTitle>
          {form.adjustments.length === 0 && <CardDescription>Nenhum ajuste registrado.</CardDescription>}
          {form.adjustments.map((adj, i) => (
            <div key={i} className="grid gap-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3 md:grid-cols-[1.5fr_0.8fr_0.8fr_1.5fr_auto]">
              <div>
                <Label htmlFor={`adj-kind-${i}`}>Tipo</Label>
                <select id={`adj-kind-${i}`} className={selectClass} disabled={busy} value={adj.kind} onChange={(e) => set("adjustments", form.adjustments.map((a, j) => j === i ? { ...a, kind: e.target.value as AdjustmentKind } : a))}>
                  {(Object.keys(ADJUSTMENT_LABEL) as AdjustmentKind[]).map((k) => <option key={k} value={k}>{ADJUSTMENT_LABEL[k]}</option>)}
                </select>
              </div>
              <div><Label htmlFor={`adj-amount-${i}`}>Valor (R$)</Label><Input id={`adj-amount-${i}`} inputMode="decimal" required disabled={busy} value={adj.amount} onChange={(e) => set("adjustments", form.adjustments.map((a, j) => j === i ? { ...a, amount: e.target.value } : a))} /></div>
              <div><Label htmlFor={`adj-date-${i}`}>Data</Label><Input id={`adj-date-${i}`} type="date" max={today} required disabled={busy} value={adj.date} onChange={(e) => set("adjustments", form.adjustments.map((a, j) => j === i ? { ...a, date: e.target.value } : a))} /></div>
              <div><Label htmlFor={`adj-description-${i}`}>Descrição</Label><Input id={`adj-description-${i}`} required maxLength={300} disabled={busy} value={adj.description} onChange={(e) => set("adjustments", form.adjustments.map((a, j) => j === i ? { ...a, description: e.target.value } : a))} /></div>
              <div className="flex items-end"><Button variant="ghost" size="sm" disabled={busy} onClick={() => set("adjustments", form.adjustments.filter((_, j) => j !== i))} aria-label={`Remover ajuste ${i + 1}`}>Remover</Button></div>
            </div>
          ))}
          <Button variant="secondary" size="sm" disabled={busy || form.adjustments.length >= 30} onClick={() => set("adjustments", [...form.adjustments, { kind: "REFUND", amount: "", date: today, description: "" }])}>Adicionar ajuste</Button>
        </Card>

        <Card className="space-y-4">
          <div><Label htmlFor="methodology">Metodologia</Label><textarea id="methodology" rows={3} maxLength={4000} className={areaClass} placeholder="Como a comparação foi feita: onde, quando e com quais critérios." disabled={busy} value={form.methodology} onChange={(e) => set("methodology", e.target.value)} /></div>
          <div><Label htmlFor="notes">Observações internas</Label><textarea id="notes" rows={2} maxLength={2000} className={areaClass} disabled={busy} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || !token}>{busy ? "Salvando…" : view.savingsId ? "Salvar alterações" : "Registrar análise"}</Button>
            <Button variant="ghost" disabled={busy} onClick={() => setForm(formFromData(view.data))}>Descartar alterações</Button>
            {view.savingsId && <Button variant="secondary" disabled={busy} onClick={() => setConfirm({ kind: "analysis" })}>Excluir análise</Button>}
          </div>
        </Card>
      </form>

      {view.savingsId && (
        <Card className="space-y-3">
          <CardTitle>Evidências do preço comparável</CardTitle>
          {view.evidence.length === 0 && <CardDescription>Nenhuma evidência anexada.</CardDescription>}
          <ul className="space-y-2 text-sm">
            {view.evidence.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{e.filename}</span>
                <span className="text-xs text-[var(--hub-text-muted)]">{e.description ? `${e.description} · ` : ""}{formatMoment(e.createdAt)} · {e.author}</span>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(async () => { saveBlob(await savingsApi.evidence(token, tripId, e.id), e.filename); })}>Baixar</Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirm({ kind: "evidence", id: e.id, filename: e.filename })}>Excluir</Button>
              </li>
            ))}
          </ul>
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label htmlFor="evidence-file">Arquivo (PDF ou imagem, até 5 MB)</Label><Input id="evidence-file" type="file" accept={EVIDENCE_ACCEPT} onChange={(e) => setEvidence(e.target.files?.[0] ?? null)} /></div>
            <div><Label htmlFor="evidence-description">Descrição</Label><Input id="evidence-description" maxLength={500} value={evidenceDescription} onChange={(e) => setEvidenceDescription(e.target.value)} /></div>
            <div className="flex items-end">
              <Button variant="secondary" disabled={busy || !evidence} onClick={() => run(async () => {
                const problem = evidenceProblem(evidence);
                if (problem) throw new Error(problem);
                await savingsApi.addEvidence(token, tripId, evidence!, evidenceDescription);
                apply(await savingsApi.get(token, tripId));
                setEvidence(null); setEvidenceDescription("");
                return "Evidência anexada.";
              })}>Anexar</Button>
            </div>
          </div>
        </Card>
      )}

      {view.versions.length > 0 && (
        <Card className="space-y-3">
          <CardTitle>Versões e histórico</CardTitle>
          <ul className="space-y-1 text-sm">
            {view.versions.map((v) => (
              <li key={v.version} className="flex flex-wrap items-center gap-2">
                <button type="button" className="underline" onClick={() => run(async () => { setVersion(v.version === view.version ? null : await savingsApi.version(token, tripId, v.version)); })}>
                  Versão {v.version}{v.version === view.version ? " (atual)" : ""}
                </button>
                <span className="text-xs text-[var(--hub-text-muted)]">{formatMoment(v.createdAt)} · {v.author}</span>
              </li>
            ))}
          </ul>
          {version && (
            <div className="space-y-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3">
              <div className="flex items-center justify-between"><p className="text-sm font-medium">Versão {version.version} — somente leitura</p><Button size="sm" variant="ghost" onClick={() => setVersion(null)}>Fechar</Button></div>
              <ResultPanel result={version.result} />
              <p className="text-xs text-[var(--hub-text-muted)]">Preço {formatMoney(version.data.comparison?.price)} · {version.data.costs.length} custo(s) · {version.data.adjustments.length} ajuste(s){version.data.methodology ? ` · ${version.data.methodology}` : ""}</p>
            </div>
          )}
          <details>
            <summary className="cursor-pointer text-xs font-medium text-[var(--hub-text-secondary)]">Histórico</summary>
            <ul className="mt-2 space-y-1 text-xs text-[var(--hub-text-muted)]">{view.history.map((h) => <li key={h.id}>{formatMoment(h.createdAt)} · {actionLabel(h.action)} · {h.author}</li>)}</ul>
          </details>
        </Card>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "evidence" ? "Excluir evidência" : "Excluir análise"}
        message={confirm?.kind === "evidence" ? `Excluir “${confirm.filename}”?` : "A análise, suas versões e evidências serão excluídas. A exclusão fica registrada no histórico, e relatórios já gerados não mudam."}
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          const current = confirm;
          setConfirm(null);
          if (current?.kind === "evidence") {
            void run(async () => { await savingsApi.deleteEvidence(token, tripId, current.id); apply(await savingsApi.get(token, tripId)); return "Evidência excluída."; });
          } else if (current) {
            void run(async () => { await savingsApi.remove(token, tripId, view.version); apply(await savingsApi.get(token, tripId)); setVersion(null); return "Análise excluída."; });
          }
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
