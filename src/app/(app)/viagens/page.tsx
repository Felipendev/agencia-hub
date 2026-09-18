"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { formatDateBR } from "@/lib/format";
import { TRIP_STATUS_LABELS } from "@/lib/constants";

type Trip = { id: string; customerId: string; customerName: string; serviceType: string; bookingLocator: string | null; airline: string | null; status: string; travelStartDate: string | null; travelEndDate: string | null; createdAt: string };
type TripView = "UPCOMING" | "IN_PROGRESS" | "PAST" | "ALL";
type TripSort = "TRAVEL_START_ASC" | "TRAVEL_START_DESC" | "CREATED_AT_DESC";

const sortLabels: Record<TripSort, string> = { TRAVEL_START_ASC: "Partida mais próxima", TRAVEL_START_DESC: "Partida mais distante", CREATED_AT_DESC: "Cadastro mais recente" };
const viewLabels: Record<TripView, string> = { UPCOMING: "Próximas", IN_PROGRESS: "Em andamento", PAST: "Passadas", ALL: "Todas" };

function localToday() { const now = new Date(); const offset = now.getTimezoneOffset() * 60_000; return new Date(now.getTime() - offset).toISOString().slice(0, 10); }
function monthBounds(offset: number) { const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth() + offset, 1); const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0); const asDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; return { from: asDate(start), to: asDate(end) }; }
function monthTitle(date: string) { return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`)); }
function isInProgress(trip: Trip, today: string) { return Boolean(trip.travelStartDate && trip.travelStartDate <= today && (!trip.travelEndDate || trip.travelEndDate >= today)); }
function isPast(trip: Trip, today: string) { const finalDate = trip.travelEndDate || trip.travelStartDate; return Boolean(finalDate && finalDate < today); }

function TripRow({ trip, clienteNome }: { trip: Trip; clienteNome: string | undefined }) {
  return <Link href={`/viagens/${trip.id}`} className="grid gap-2 border-b p-4 text-left text-sm last:border-b-0 hover:bg-[var(--hub-bg-subtle)] sm:grid-cols-6"><span className="font-medium">{clienteNome ?? trip.customerName}</span><span>{trip.serviceType}</span><span>{trip.bookingLocator || "Sem localizador"}</span><span>{trip.travelStartDate ? formatDateBR(trip.travelStartDate) : "Sem data"}</span><span>{trip.travelEndDate ? formatDateBR(trip.travelEndDate) : "—"}</span><span>{TRIP_STATUS_LABELS[trip.status] ?? trip.status}</span></Link>;
}

export default function ViagensPage() {
  const { token, user } = useAuth();
  const { clientes, isReady, hasRemoteApi, syncClientesFromApi } = useData();
  const base = process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL;
  const preferencesKey = `agencia-hub:trip-view:${user?.id ?? "anonymous"}`;
  const [trips, setTrips] = useState<Trip[]>([]); const [customerId, setCustomerId] = useState(""); const [locator, setLocator] = useState(""); const [status, setStatus] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [view, setView] = useState<TripView>("UPCOMING"); const [sort, setSort] = useState<TripSort>("TRAVEL_START_ASC"); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  useEffect(() => { try { const saved = localStorage.getItem(preferencesKey); if (!saved) return; const parsed = JSON.parse(saved) as { view?: TripView; sort?: TripSort }; if (parsed.view && viewLabels[parsed.view]) setView(parsed.view); if (parsed.sort && sortLabels[parsed.sort]) setSort(parsed.sort); } catch { /* preferência local pode ser descartada */ } }, [preferencesKey]);
  useEffect(() => { localStorage.setItem(preferencesKey, JSON.stringify({ view, sort })); }, [preferencesKey, view, sort]);
  useEffect(() => { if (!isReady || !hasRemoteApi || !token) return; void syncClientesFromApi().catch(() => undefined); }, [isReady, hasRemoteApi, token, syncClientesFromApi]);

  const load = useCallback(async () => {
    if (!base || !token) return;
    setLoading(true); setError(""); const params = new URLSearchParams();
    if (customerId) params.set("customerId", customerId); if (locator) params.set("locator", locator); if (status) params.set("status", status); if (from) params.set("from", from); if (to) params.set("to", to); params.set("sort", sort);
    try { const response = await fetch(`${base}/trips?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) { setError("Não foi possível carregar as viagens."); return; } setTrips(await response.json()); } catch { setError("Não foi possível comunicar com o servidor."); } finally { setLoading(false); }
  }, [base, token, customerId, locator, status, from, to, sort]);
  useEffect(() => { void load(); }, [load]);

  const clienteNome = useMemo(() => Object.fromEntries(clientes.map((c) => [c.id, c.nome])), [clientes]);
  const today = localToday();
  const visibleTrips = useMemo(() => trips.filter((trip) => view === "IN_PROGRESS" ? isInProgress(trip, today) : view === "PAST" ? isPast(trip, today) : view === "UPCOMING" ? Boolean(trip.travelStartDate && trip.travelStartDate > today && !isPast(trip, today)) : true), [trips, today, view]);
  const inProgress = visibleTrips.filter((trip) => isInProgress(trip, today)); const dated = visibleTrips.filter((trip) => trip.travelStartDate && !isInProgress(trip, today)); const undated = visibleTrips.filter((trip) => !trip.travelStartDate);
  const monthGroups = useMemo(() => { const groups = new Map<string, Trip[]>(); dated.forEach((trip) => { const key = trip.travelStartDate!.slice(0, 7); groups.set(key, [...(groups.get(key) ?? []), trip]); }); return [...groups.entries()]; }, [dated]);
  const setMonth = (offset: number) => { const bounds = monthBounds(offset); setFrom(bounds.from); setTo(bounds.to); };

  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-[var(--hub-text-primary)]">Viagens</h1><p className="text-sm text-[var(--hub-text-secondary)]">Acompanhe emissões por período, proximidade e status.</p></div><Link href="/viagens/nova" className="inline-flex rounded-[var(--hub-radius)] bg-[var(--hub-blue-dark)] px-4 py-2 text-sm font-medium text-white">+ Nova viagem</Link></div>
    <section className="space-y-3 rounded-xl border border-[var(--hub-border)] bg-white p-4"><div className="flex flex-wrap gap-2" aria-label="Visualização de viagens">{(Object.keys(viewLabels) as TripView[]).map((value) => <button key={value} type="button" onClick={() => setView(value)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${view === value ? "bg-[var(--hub-blue-dark)] text-white" : "bg-[var(--hub-bg-subtle)] text-[var(--hub-text-secondary)]"}`}>{viewLabels[value]}</button>)}<button type="button" onClick={() => setMonth(0)} className="rounded-full border border-[var(--hub-border)] px-3 py-1.5 text-sm">Este mês</button><button type="button" onClick={() => setMonth(1)} className="rounded-full border border-[var(--hub-border)] px-3 py-1.5 text-sm">Próximo mês</button></div><div className="grid gap-3 md:grid-cols-6"><div><Label>Cliente</Label><Select value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">Todos</option>{clientes.map((customer) => <option key={customer.id} value={customer.id}>{customer.nome}</option>)}</Select></div><div><Label>Localizador</Label><Input value={locator} onChange={(event) => setLocator(event.target.value)} placeholder="Ex.: ABC123" /></div><div><Label>Status</Label><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos</option>{Object.entries(TRIP_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div><div><Label>Partida de</Label><Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div><div><Label>Partida até</Label><Input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div><div><Label>Ordenar por</Label><Select value={sort} onChange={(event) => setSort(event.target.value as TripSort)}>{(Object.keys(sortLabels) as TripSort[]).map((value) => <option key={value} value={value}>{sortLabels[value]}</option>)}</Select></div></div></section>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="overflow-hidden rounded-xl border border-[var(--hub-border)] bg-white"><div className="border-b p-4 font-semibold">{loading ? "Carregando…" : `${visibleTrips.length} viagem(ns)`}</div>{!loading && inProgress.length > 0 && <section><h2 className="bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">Em andamento</h2>{inProgress.map((trip) => <TripRow key={trip.id} trip={trip} clienteNome={clienteNome[trip.customerId]} />)}</section>}{!loading && monthGroups.map(([month, rows]) => <section key={month}><h2 className="bg-[var(--hub-bg-subtle)] px-4 py-2 text-sm font-semibold capitalize">{monthTitle(`${month}-01`)}</h2>{rows.map((trip) => <TripRow key={trip.id} trip={trip} clienteNome={clienteNome[trip.customerId]} />)}</section>)}{!loading && undated.length > 0 && <section><h2 className="bg-[var(--hub-bg-subtle)] px-4 py-2 text-sm font-semibold">Sem data de partida</h2>{undated.map((trip) => <TripRow key={trip.id} trip={trip} clienteNome={clienteNome[trip.customerId]} />)}</section>}{!loading && visibleTrips.length === 0 && <p className="p-8 text-center text-sm text-[var(--hub-text-muted)]">Nenhuma viagem encontrada para os filtros informados.</p>}</div>
  </div>;
}
