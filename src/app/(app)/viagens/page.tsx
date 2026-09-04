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

type Trip = {
  id: string;
  customerId: string;
  customerName: string;
  serviceType: string;
  bookingLocator: string | null;
  airline: string | null;
  status: string;
  travelStartDate: string | null;
  travelEndDate: string | null;
};

export default function ViagensPage() {
  const { token } = useAuth();
  const { clientes } = useData();
  const base = process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL;
  const [trips, setTrips] = useState<Trip[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [locator, setLocator] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!base || !token) return;
    setLoading(true); setError("");
    const params = new URLSearchParams();
    if (customerId) params.set("customerId", customerId);
    if (locator) params.set("locator", locator);
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const response = await fetch(`${base}/trips?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) { setError("Não foi possível carregar as viagens."); return; }
      setTrips(await response.json());
    } catch {
      setError("Não foi possível comunicar com o servidor.");
    } finally {
      setLoading(false);
    }
  }, [base, token, customerId, locator, status, from, to]);

  useEffect(() => { void load(); }, [load]);

  const clienteNome = useMemo(() => Object.fromEntries(clientes.map((c) => [c.id, c.nome])), [clientes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--hub-text-primary)]">Viagens</h1>
          <p className="text-sm text-[var(--hub-text-secondary)]">Passagens e pacotes já emitidos, com localizador e itinerário.</p>
        </div>
        <Link href="/viagens/nova" className="inline-flex rounded-[var(--hub-radius)] bg-[var(--hub-blue-dark)] px-4 py-2 text-sm font-medium text-white">+ Nova viagem</Link>
      </div>

      <section className="rounded-xl border border-[var(--hub-border)] bg-white p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <Label>Cliente</Label>
            <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Todos</option>
              {clientes.map((customer) => <option key={customer.id} value={customer.id}>{customer.nome}</option>)}
            </Select>
          </div>
          <div>
            <Label>Localizador</Label>
            <Input value={locator} onChange={(event) => setLocator(event.target.value)} placeholder="Ex.: ABC123" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Todos</option>
              {Object.entries(TRIP_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </div>
          <div>
            <Label>Viagem — início</Label>
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </div>
          <div>
            <Label>Viagem — fim</Label>
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
        </div>
      </section>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-[var(--hub-border)] bg-white">
        <div className="border-b p-4 font-semibold">{loading ? "Carregando…" : "Resultado da busca"}</div>
        {trips.map((trip) => (
          <Link key={trip.id} href={`/viagens/${trip.id}`} className="grid w-full grid-cols-5 gap-2 border-b p-4 text-left text-sm last:border-b-0 hover:bg-[var(--hub-bg-subtle)]">
            <span>{clienteNome[trip.customerId] ?? trip.customerName}</span>
            <span>{trip.serviceType}</span>
            <span>{trip.bookingLocator || "sem localizador"}</span>
            <span>{trip.travelStartDate ? formatDateBR(trip.travelStartDate) : "—"}</span>
            <span>{TRIP_STATUS_LABELS[trip.status] ?? trip.status}</span>
          </Link>
        ))}
        {!loading && trips.length === 0 && <p className="p-8 text-center text-sm text-[var(--hub-text-muted)]">Nenhuma viagem encontrada para os filtros informados.</p>}
      </div>
    </div>
  );
}
