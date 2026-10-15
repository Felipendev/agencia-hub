"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import { savingsApi } from "@/lib/savings/api";
import { TRIP_STATUS, formatDay, formatMoney } from "@/lib/savings/format";
import type { Report } from "@/lib/savings/types";
import type { Cliente } from "@/types";

const selectClass = "h-10 w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm";

function SavingsOverview() {
  const { token, user } = useAuth();
  const params = useSearchParams();
  const isOwner = user?.accountKind === "AGENCY_OWNER";
  const [customers, setCustomers] = useState<Cliente[]>([]);
  const [customerId, setCustomerId] = useState(params.get("customerId") ?? "");
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    listCustomersRemote(token).then(setCustomers).catch(() => setCustomers([]));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    savingsApi.report(token, { customerId: customerId || undefined, from: from || undefined, to: to || undefined })
      .then((data) => { if (active) { setReport(data); setError(""); } })
      .catch((e: Error) => { if (active) { setReport(null); setError(e.message); } });
    return () => { active = false; };
  }, [token, customerId, from, to]);

  const t = report?.totals;
  const reportHref = `/economia/relatorios${customerId ? `?customerId=${customerId}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}` : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Economia do cliente" description="Resultado realizado das viagens: preço comparável equivalente menos o custo efetivo. Não é lucro da agência nem estimativa de cotação.">
        {isOwner && <Link href={reportHref} className="rounded-[var(--hub-radius)] bg-[var(--hub-blue-dark)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--hub-blue)]">Relatório para o cliente</Link>}
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <Label htmlFor="savings-customer">Pessoa</Label>
          <select id="savings-customer" className={selectClass} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Todas as pessoas</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div><Label htmlFor="savings-from">Partida a partir de</Label><Input id="savings-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label htmlFor="savings-to">Partida até</Label><Input id="savings-to" type="date" min={from || undefined} value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!report && !error && <p className="text-sm text-[var(--hub-text-muted)]">Carregando economia…</p>}

      {t && (
        <div className="grid gap-3 md:grid-cols-4">
          <Card padding="p-4"><p className="text-xs text-[var(--hub-text-muted)]">Economia realizada</p><p className="text-xl font-semibold">{t.savings == null ? "Indisponível" : formatMoney(t.savings)}</p>{t.savingsPercent != null && <p className="text-xs text-[var(--hub-text-muted)]">{t.savingsPercent.toLocaleString("pt-BR")}% do preço comparável</p>}</Card>
          <Card padding="p-4"><p className="text-xs text-[var(--hub-text-muted)]">Preço comparável</p><p className="text-xl font-semibold">{formatMoney(t.comparablePrice)}</p></Card>
          <Card padding="p-4"><p className="text-xs text-[var(--hub-text-muted)]">Custo efetivo</p><p className="text-xl font-semibold">{formatMoney(t.effectiveCost)}</p></Card>
          <Card padding="p-4"><p className="text-xs text-[var(--hub-text-muted)]">Viagens</p><p className="text-xl font-semibold">{t.available} de {t.trips}</p><p className="text-xs text-[var(--hub-text-muted)]">com economia documentada · {t.cancelled} cancelada(s)</p></Card>
        </div>
      )}
      {t && <p className="text-xs text-[var(--hub-text-muted)]">Somente viagens com comparação equivalente, fonte, data, custo e metodologia entram no total. As demais aparecem como indisponíveis, com o motivo.</p>}

      {report && report.rows.length === 0 && <p className="rounded-lg border border-dashed border-[var(--hub-border)] p-6 text-center text-sm text-[var(--hub-text-muted)]">Nenhuma viagem encontrada com esses filtros.</p>}
      {report && report.rows.length > 0 && (
        <div className="overflow-x-auto rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-[var(--hub-bg-subtle)] text-left text-xs text-[var(--hub-text-muted)]">
              <tr><th className="px-4 py-2 font-medium">Viagem</th><th className="px-4 py-2 font-medium">Pessoa</th><th className="px-4 py-2 font-medium">Partida</th><th className="px-4 py-2 font-medium">Resultado</th><th className="px-4 py-2" /></tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.trip.tripId} className="border-t border-[var(--hub-border)] align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.trip.serviceType}{row.trip.airline ? ` · ${row.trip.airline}` : ""}</p>
                    <p className="text-xs text-[var(--hub-text-muted)]">{row.trip.bookingLocator ?? "Sem localizador"} · {TRIP_STATUS[row.trip.status] ?? row.trip.status}</p>
                  </td>
                  <td className="px-4 py-3">{row.trip.customerName}</td>
                  <td className="px-4 py-3">{formatDay(row.trip.travelStartDate)}</td>
                  <td className="px-4 py-3">
                    {row.result.available ? (
                      <span className="font-medium">{formatMoney(row.result.savings)} <span className="text-xs text-[var(--hub-text-muted)]">({row.result.savingsPercent?.toLocaleString("pt-BR")}%)</span></span>
                    ) : (
                      <div><Badge tone="muted">Indisponível</Badge><ul className="mt-1 list-disc pl-4 text-xs text-[var(--hub-text-muted)]">{row.result.reasons.map((r) => <li key={r.code}>{r.label}</li>)}</ul></div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/economia/viagens/${row.trip.tripId}`} className="text-sm font-medium text-[var(--hub-blue-dark)] hover:underline">{row.savingsId ? "Abrir análise" : "Registrar análise"}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function EconomiaPage() {
  return <Suspense fallback={<p className="text-sm text-[var(--hub-text-muted)]">Carregando economia…</p>}><SavingsOverview /></Suspense>;
}
