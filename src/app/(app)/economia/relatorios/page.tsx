"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import { SavingsApiError, saveBlob, savingsApi } from "@/lib/savings/api";
import { ADJUSTMENT_LABEL, COST_LABEL, SOURCE_LABEL, TRIP_STATUS, formatDay, formatMoment, formatMoney } from "@/lib/savings/format";
import type { ReportContent, ReportInput, ReportOptions, SharedReportSummary } from "@/lib/savings/types";
import type { Cliente } from "@/types";

const HIDE: [keyof ReportOptions, string][] = [
  ["hideCustomerName", "Ocultar o nome da pessoa (aparece como “Cliente”)"],
  ["hideLocators", "Ocultar localizadores"],
  ["hideSources", "Ocultar fontes, links e origem dos custos"],
  ["hideNotes", "Ocultar observações internas"],
];

function SharedReports() {
  const { token, user } = useAuth();
  const params = useSearchParams();
  const isOwner = user?.accountKind === "AGENCY_OWNER";
  const [customers, setCustomers] = useState<Cliente[]>([]);
  const [customerId, setCustomerId] = useState(params.get("customerId") ?? "");
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");
  const [options, setOptions] = useState<ReportOptions>({ hideCustomerName: false, hideLocators: true, hideSources: false, hideNotes: true, title: "", message: "" });
  const [preview, setPreview] = useState<ReportContent | null>(null);
  const [reports, setReports] = useState<SharedReportSummary[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SharedReportSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!token || !isOwner) return;
    listCustomersRemote(token).then(setCustomers).catch(() => setCustomers([]));
  }, [token, isOwner]);

  useEffect(() => {
    if (!token || !isOwner) return;
    let active = true;
    savingsApi.listReports(token, customerId || undefined).then((rows) => { if (active) setReports(rows); }).catch((e: Error) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [token, isOwner, customerId]);

  if (!isOwner) {
    return <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Somente o gestor da agência gera relatórios para o cliente. <Link href="/economia" className="underline">Voltar à economia</Link></p>;
  }

  const input = (): ReportInput => {
    if (!customerId) throw new Error("Escolha a pessoa do relatório.");
    if (from && to && to < from) throw new Error("O fim do período não pode ser anterior ao início.");
    return { customerId, from: from || null, to: to || null, options };
  };

  async function run(action: () => Promise<string | void>) {
    setBusy(true); setError(""); setNotice("");
    try { const message = await action(); if (message) setNotice(message); }
    catch (e) { if (e instanceof SavingsApiError && e.status === 409) setPreview(null); setError(e instanceof Error ? e.message : "Não foi possível concluir a ação."); }
    finally { setBusy(false); }
  }

  // Qualquer mudança invalida a prévia: o gestor revisa exatamente o que será gerado.
  const change = (update: () => void) => { update(); setPreview(null); };

  return (
    <div className="space-y-6">
      <PageHeader title="Relatório de economia para o cliente" description="Revise a prévia e escolha o que ocultar antes de gerar. O relatório gerado é um retrato fixo: não muda se a análise for editada depois.">
        <Link href="/economia" className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--hub-bg-subtle)]">Voltar</Link>
      </PageHeader>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label htmlFor="report-customer" required>Pessoa</Label>
            <select id="report-customer" className="h-10 w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm" value={customerId} onChange={(e) => change(() => setCustomerId(e.target.value))}>
              <option value="">Escolha a pessoa</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div><Label htmlFor="report-from">Partida a partir de</Label><Input id="report-from" type="date" value={from} onChange={(e) => change(() => setFrom(e.target.value))} /></div>
          <div><Label htmlFor="report-to">Partida até</Label><Input id="report-to" type="date" min={from || undefined} value={to} onChange={(e) => change(() => setTo(e.target.value))} /></div>
          <div><Label htmlFor="report-title">Título</Label><Input id="report-title" maxLength={200} placeholder="Relatório de economia em viagens" value={options.title} onChange={(e) => change(() => setOptions({ ...options, title: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label htmlFor="report-message">Mensagem ao cliente</Label><Input id="report-message" maxLength={2000} value={options.message} onChange={(e) => change(() => setOptions({ ...options, message: e.target.value }))} /></div>
        </div>
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="mb-1 text-xs font-medium text-[var(--hub-text-secondary)]">Dados pessoais e internos</legend>
          {HIDE.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(options[key])} onChange={(e) => change(() => setOptions({ ...options, [key]: e.target.checked }))} /> {label}</label>
          ))}
        </fieldset>
        <p className="text-xs text-[var(--hub-text-muted)]">As opções ocultam os campos indicados. Revise também os textos livres, descrições e links da prévia antes de compartilhar.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={busy || !customerId} onClick={() => run(async () => { setPreview(await savingsApi.previewReport(token, input())); })}>Ver prévia</Button>
          <Button disabled={busy || !preview} onClick={() => run(async () => {
            const created = await savingsApi.createReport(token, { ...input(), expectedPreviewHash: preview!.previewHash });
            setReports((rows) => [{ id: created.id, customerId: created.customerId, title: created.content.title, from: created.from, to: created.to, trips: created.content.totals.trips, savings: created.content.totals.savings, author: created.author, createdAt: created.createdAt }, ...(rows ?? [])]);
            setPreview(null);
            return "Relatório gerado. Baixe o PDF para compartilhar com o cliente.";
          })}>Gerar relatório</Button>
        </div>
        {!preview && <p className="text-xs text-[var(--hub-text-muted)]">A geração fica disponível depois de revisar a prévia com as opções atuais.</p>}
      </Card>

      {preview && (
        <Card className="space-y-3">
          <CardTitle>Prévia — {preview.title}</CardTitle>
          <CardDescription>{preview.customerLabel} · {preview.from || preview.to ? `${formatDay(preview.from)} a ${formatDay(preview.to)}` : "todas as viagens"}{preview.message ? ` · ${preview.message}` : ""}</CardDescription>
          <p className="text-sm">Economia realizada: <strong>{preview.totals.savings == null ? "indisponível" : formatMoney(preview.totals.savings)}</strong> · {preview.totals.available} de {preview.totals.trips} viagem(ns) com base documentada</p>
          <ul className="space-y-2 text-sm">
            {preview.lines.map((line, i) => (
              <li key={i} className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3">
                <p className="font-medium">{line.service}{line.airline ? ` · ${line.airline}` : ""}{line.locator ? ` · ${line.locator}` : ""} · {formatDay(line.travelStartDate)}</p>
                <p className="text-xs">Situação: {TRIP_STATUS[line.status] ?? line.status}{line.travelEndDate ? ` · Volta: ${formatDay(line.travelEndDate)}` : ""}</p>
                <p className="text-xs">Comparativo: {line.route ?? "não informado"} · {line.passengers ?? "—"} passageiro(s) · {line.fareConditions ?? "tarifa não informada"} · Bagagem: {line.baggage ?? "não informada"}</p>
                {line.comparisonOutboundDate && <p className="text-xs">Datas do comparativo: {formatDay(line.comparisonOutboundDate)}{line.comparisonReturnDate ? ` a ${formatDay(line.comparisonReturnDate)}` : " (somente ida)"}</p>}
                {line.researchedOn && <p className="text-xs">Pesquisa: {formatDay(line.researchedOn)}{line.sourceType ? ` · ${SOURCE_LABEL[line.sourceType]}` : ""}</p>}
                {line.differences && <p className="text-xs">Diferenças: {line.differences}</p>}
                {(line.costs ?? []).map((cost, index) => <p key={`cost-${index}`} className="text-xs">Custo — {COST_LABEL[cost.kind]}: {formatMoney(cost.amount)} · {cost.description}{cost.origin ? ` (origem: ${cost.origin})` : ""}</p>)}
                {(line.adjustments ?? []).map((adjustment, index) => <p key={`adjustment-${index}`} className="text-xs">Ajuste — {ADJUSTMENT_LABEL[adjustment.kind]}: {formatMoney(adjustment.amount)} em {formatDay(adjustment.date)} · {adjustment.description}</p>)}
                {line.methodology && <p className="text-xs">Metodologia: {line.methodology}</p>}
                {line.available
                  ? <p>Economia {formatMoney(line.savings)} ({line.savingsPercent?.toLocaleString("pt-BR")}%) · comparável {formatMoney(line.comparablePrice)} · custo {formatMoney(line.effectiveCost)}</p>
                  : <p className="text-[var(--hub-text-muted)]">Indisponível: {line.unavailableReasons.join("; ")}</p>}
                {line.source && <p className="break-words text-xs text-[var(--hub-text-muted)]">Fonte: {line.source}</p>}
                {line.notes && <p className="text-xs text-[var(--hub-text-muted)]">Observações: {line.notes}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="space-y-3">
        <CardTitle>Relatórios gerados</CardTitle>
        {reports === null && <CardDescription>Carregando…</CardDescription>}
        {reports?.length === 0 && <CardDescription>Nenhum relatório gerado{customerId ? " para esta pessoa" : ""}.</CardDescription>}
        <ul className="space-y-2 text-sm">
          {reports?.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{r.title}</span>
              <span className="text-xs text-[var(--hub-text-muted)]">{r.trips} viagem(ns) · {r.savings == null ? "economia indisponível" : formatMoney(r.savings)} · {formatMoment(r.createdAt)} · {r.author}</span>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(async () => { saveBlob(await savingsApi.reportPdf(token, r.id), `relatorio-economia-${r.createdAt.slice(0, 10)}.pdf`); })}>Baixar PDF</Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmDelete(r)}>Excluir</Button>
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Excluir relatório"
        message="O retrato gerado será excluído. PDFs já enviados ao cliente não são afetados. A exclusão fica registrada no histórico."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          const target = confirmDelete;
          setConfirmDelete(null);
          if (target) void run(async () => { await savingsApi.deleteReport(token, target.id); setReports((rows) => (rows ?? []).filter((r) => r.id !== target.id)); return "Relatório excluído."; });
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

export default function RelatoriosEconomiaPage() {
  return <Suspense fallback={<p className="text-sm text-[var(--hub-text-muted)]">Carregando…</p>}><SharedReports /></Suspense>;
}
