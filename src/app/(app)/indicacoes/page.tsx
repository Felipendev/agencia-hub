"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { referralsApi } from "@/lib/referrals/api";
import { CHANNEL_LABEL, PRODUCT_LABEL, STATUS_LABEL, STATUS_TONE, brDate, isProduct, isStatus, referredLabel } from "@/lib/referrals/format";
import type { Product, Referral, Status, Summary } from "@/lib/referrals/types";

const select = "h-10 w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm";

function ReferralsList() {
  const { token } = useAuth();
  const params = useSearchParams();
  const customerId = params.get("customerId") ?? "";
  const initialProduct = params.get("product");
  const initialStatus = params.get("status");
  const [product, setProduct] = useState<"" | Product>(isProduct(initialProduct) ? initialProduct : "");
  const [status, setStatus] = useState<"" | Status>(isStatus(initialStatus) ? initialStatus : "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Referral[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    referralsApi.list(token, { customerId: customerId || undefined, product: product || undefined, status: status || undefined, from: from || undefined, to: to || undefined, q: query || undefined })
      .then((data) => { if (active) { setRows(data); setError(""); } })
      .catch((e: Error) => { if (active) { setRows(null); setError(e.message); } });
    return () => { active = false; };
  }, [token, customerId, product, status, from, to, query]);

  useEffect(() => {
    if (!token || customerId) return;
    let active = true;
    referralsApi.summary(token, { product: product || undefined, from: from || undefined, to: to || undefined })
      .then((data) => { if (active) setSummary(data); })
      .catch(() => { if (active) setSummary(null); });
    return () => { active = false; };
  }, [token, customerId, product, from, to]);

  const newQuery = new URLSearchParams();
  if (customerId) newQuery.set("referrerId", customerId);
  if (product) newQuery.set("product", product);

  return (
    <div className="space-y-6">
      <PageHeader title="Indicações" description="Quem indicou quem, por produto, e o andamento de cada contato.">
        <Link href={`/indicacoes/nova${newQuery.size ? `?${newQuery}` : ""}`} className="rounded-[var(--hub-radius)] bg-[var(--hub-blue-dark)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--hub-blue)]">Nova indicação</Link>
      </PageHeader>
      <p className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] p-3 text-xs text-[var(--hub-text-secondary)]">
        Créditos de indicação ainda não são controlados pelo sistema. Esta área registra as indicações e o resultado; nenhum desconto, cupom, comissão ou lançamento financeiro é criado.
      </p>
      {customerId && <p className="text-sm text-[var(--hub-text-secondary)]">Mostrando as indicações feitas e recebidas por uma pessoa. <Link href={product ? `/indicacoes?product=${product}` : "/indicacoes"} className="underline">Ver todas</Link></p>}

      {summary && !customerId && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Resumo por situação">
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <button key={s} type="button" onClick={() => setStatus(status === s ? "" : s)}
              className={`rounded-[var(--hub-radius-lg)] border bg-white p-3 text-left ${status === s ? "border-[var(--hub-blue)]" : "border-[var(--hub-border)]"}`}>
              <span className="block text-xs text-[var(--hub-text-muted)]">{STATUS_LABEL[s]}</span>
              <span className="text-xl font-semibold tabular-nums">{summary.counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        <div>
          <Label htmlFor="f-product">Produto</Label>
          <select id="f-product" className={select} value={product} onChange={(e) => { setProduct(e.target.value as "" | Product); setRows(null); setSummary(null); setError(""); }}>
            <option value="">Viagens e Milhas</option><option value="TRAVEL">Viagens</option><option value="MILES">Milhas</option>
          </select>
        </div>
        <div>
          <Label htmlFor="f-status">Situação</Label>
          <select id="f-status" className={select} value={status} onChange={(e) => setStatus(e.target.value as "" | Status)}>
            <option value="">Todas</option>
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <div><Label htmlFor="f-from">Indicadas de</Label><Input id="f-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label htmlFor="f-to">Até</Label><Input id="f-to" type="date" min={from || undefined} value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div><Label htmlFor="f-q">Buscar</Label><Input id="f-q" maxLength={200} placeholder="Nome, telefone, e-mail…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {rows === null && !error && <p className="text-sm text-[var(--hub-text-muted)]">Carregando indicações…</p>}
      {rows?.length === 0 && <p className="rounded-lg border border-dashed border-[var(--hub-border)] p-6 text-center text-sm text-[var(--hub-text-muted)]">Nenhuma indicação encontrada com esses filtros.</p>}

      {rows && rows.length > 0 && (
        <ul className="divide-y divide-[var(--hub-border)] rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/indicacoes/${r.id}`} className="flex flex-wrap items-center gap-3 p-4 text-sm hover:bg-[var(--hub-bg-subtle)]">
                <span className="w-24 tabular-nums text-[var(--hub-text-secondary)]">{brDate(r.referredOn)}</span>
                <span className="min-w-[220px] flex-1">
                  <span className={`font-medium ${r.status === "CANCELLED" ? "line-through" : ""}`}>{r.referrerName} → {referredLabel(r)}</span>
                  <span className="block text-xs text-[var(--hub-text-muted)]">
                    {CHANNEL_LABEL[r.channel]}{r.channelDetail ? ` · ${r.channelDetail}` : ""}{r.responsibleName ? ` · ${r.responsibleName}` : ""}{!r.referredCustomerId ? " · ainda não cadastrada" : ""}
                  </span>
                </span>
                <Badge tone="muted">{PRODUCT_LABEL[r.product]}</Badge>
                <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {summary && !customerId && summary.topReferrers.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--hub-text-secondary)]">Quem mais indicou{product ? ` · ${PRODUCT_LABEL[product]}` : ""}</h2>
          <ul className="space-y-1 text-sm">
            {summary.topReferrers.map((t) => (
              <li key={t.customerId}>
                <Link href={`/indicacoes?customerId=${t.customerId}${product ? `&product=${product}` : ""}`} className="underline">{t.name}</Link>
                <span className="text-[var(--hub-text-muted)]"> · {t.total} {t.total === 1 ? "indicação" : "indicações"}, {t.converted} {t.converted === 1 ? "convertida" : "convertidas"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ReferralsRoute() {
  const params = useSearchParams();
  const { token } = useAuth();
  return <ReferralsList key={`${params.toString()}:${token ?? ""}`} />;
}

export default function IndicacoesPage() {
  return <Suspense fallback={<p className="text-sm text-[var(--hub-text-muted)]">Carregando indicações…</p>}><ReferralsRoute /></Suspense>;
}
