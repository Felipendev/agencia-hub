"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { agendaApi } from "@/lib/agenda/api";
import { FORMAT_LABEL, PRODUCT_LABEL, STATUS_LABEL, STATUS_TONE, durationLabel, isProduct } from "@/lib/agenda/format";
import { AGENCY_ZONE, addDays, formatInZone, fromIso, todayIn } from "@/lib/agenda/time";
import type { Appointment, Member, Product, Status } from "@/lib/agenda/types";

const select = "h-10 w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm";

function dayLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const label = new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function AgendaList() {
  const { token } = useAuth();
  const params = useSearchParams();
  const today = todayIn();
  const customerId = params.get("customerId") ?? "";
  const initialProduct = params.get("product");
  const [product, setProduct] = useState<"" | Product>(isProduct(initialProduct) ? initialProduct : "");
  const [status, setStatus] = useState<"" | Status>("");
  const [responsibleId, setResponsibleId] = useState("");
  const [from, setFrom] = useState(customerId ? "" : today);
  const [to, setTo] = useState(customerId ? "" : addDays(today, 30));
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [rows, setRows] = useState<Appointment[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    agendaApi.members(token).then(setMembers).catch(() => setMembers([]));
  }, [token]);

  // A busca nas atas só dispara após uma pausa curta na digitação.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    agendaApi.list(token, { customerId: customerId || undefined, product: product || undefined, status: status || undefined, responsibleId: responsibleId || undefined, from: from || undefined, to: to || undefined, q: query || undefined })
      .then((data) => { if (active) { setRows(data); setError(""); } })
      .catch((e: Error) => { if (active) { setRows(null); setError(e.message); } });
    return () => { active = false; };
  }, [token, customerId, product, status, responsibleId, from, to, query]);

  // Agrupamento pelo dia no fuso da agência, o mesmo usado pelos filtros.
  const days = useMemo(() => {
    const groups = new Map<string, Appointment[]>();
    for (const row of rows ?? []) {
      const day = fromIso(row.startsAt, AGENCY_ZONE).date;
      groups.set(day, [...(groups.get(day) ?? []), row]);
    }
    return [...groups.entries()];
  }, [rows]);

  const newQuery = new URLSearchParams();
  if (customerId) newQuery.set("customerId", customerId);
  if (product) newQuery.set("product", product);

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda e atas" description="Compromissos com as pessoas, por produto, e as atas dos atendimentos. Não sincroniza com agendas externas; use “Baixar .ics” para importar manualmente.">
        <Link href={`/agenda/novo${newQuery.size ? `?${newQuery}` : ""}`} className="rounded-[var(--hub-radius)] bg-[var(--hub-blue-dark)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--hub-blue)]">Novo compromisso</Link>
      </PageHeader>
      {customerId && <p className="text-sm text-[var(--hub-text-secondary)]">Mostrando os compromissos de uma pessoa. <Link href="/agenda" className="underline">Ver toda a agenda</Link></p>}

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div><Label htmlFor="f-from">De</Label><Input id="f-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label htmlFor="f-to">Até</Label><Input id="f-to" type="date" min={from || undefined} value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div>
          <Label htmlFor="f-product">Produto</Label>
          <select id="f-product" className={select} value={product} onChange={(e) => setProduct(e.target.value as "" | Product)}>
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
        <div>
          <Label htmlFor="f-responsible">Responsável</Label>
          <select id="f-responsible" className={select} value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)}>
            <option value="">Todos</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div><Label htmlFor="f-q">Buscar nas atas</Label><Input id="f-q" maxLength={200} placeholder="Decisão, assunto…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <p className="text-xs text-[var(--hub-text-muted)]">Datas e agrupamento no horário de Fortaleza. Cada compromisso mostra o horário no fuso em que foi marcado.</p>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {rows === null && !error && <p className="text-sm text-[var(--hub-text-muted)]">Carregando agenda…</p>}
      {rows?.length === 0 && <p className="rounded-lg border border-dashed border-[var(--hub-border)] p-6 text-center text-sm text-[var(--hub-text-muted)]">Nenhum compromisso encontrado com esses filtros.</p>}

      {days.map(([day, items]) => (
        <section key={day} className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--hub-text-secondary)]">{dayLabel(day)}{day === today ? " · hoje" : ""}</h2>
          <ul className="divide-y divide-[var(--hub-border)] rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white">
            {items.map((a) => (
              <li key={a.id}>
                <Link href={`/agenda/${a.id}`} className="flex flex-wrap items-center gap-3 p-4 text-sm hover:bg-[var(--hub-bg-subtle)]">
                  <span className="w-28 font-medium tabular-nums">{formatInZone(a.startsAt, a.timeZone, false)}{a.timeZone !== AGENCY_ZONE ? <span className="block text-xs font-normal text-[var(--hub-text-muted)]">{a.timeZone}</span> : null}</span>
                  <span className="min-w-[200px] flex-1">
                    <span className={`font-medium ${a.status === "CANCELLED" ? "line-through" : ""}`}>{a.title}</span>
                    <span className="block text-xs text-[var(--hub-text-muted)]">{a.customerName} · {FORMAT_LABEL[a.format]} · {durationLabel(a.durationMinutes)} · {a.responsibleName}</span>
                  </span>
                  <Badge tone="muted">{PRODUCT_LABEL[a.product]}</Badge>
                  <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  {a.minutesVersion && <Badge tone="success">Ata</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function AgendaPage() {
  return <Suspense fallback={<p className="text-sm text-[var(--hub-text-muted)]">Carregando agenda…</p>}><AgendaList /></Suspense>;
}
