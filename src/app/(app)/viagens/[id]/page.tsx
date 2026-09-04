"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/back-button";
import { useAuth } from "@/contexts/auth-context";
import { formatDateBR, formatDateTimeBR } from "@/lib/format";
import { TRIP_STATUS_LABELS } from "@/lib/constants";

type Segment = { id: string; segmentNumber: number; origin: string | null; destination: string | null; departureAt: string | null; arrivalAt: string | null; airline: string | null; flightNumber: string | null; ticketNumber: string | null };
type TripDetails = {
  trip: { id: string; customerId: string; customerName: string; serviceType: string; bookingLocator: string | null; airline: string | null; status: string; travelStartDate: string | null; travelEndDate: string | null };
  supplierId: string | null; supplierName: string | null; quotationId: string | null; saleId: string | null; saleDate: string | null; notes: string; segments: Segment[];
};

export default function ViagemDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { token, user } = useAuth();
  const isOwner = user?.accountKind === "AGENCY_OWNER";
  const base = process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL;
  const [details, setDetails] = useState<TripDetails | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!base || !token || !id) return;
    const response = await fetch(`${base}/trips/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { setError("Não foi possível carregar a viagem."); return; }
    setDetails(await response.json());
  }, [base, token, id]);

  useEffect(() => { void load(); }, [load]);

  async function changeStatus(status: string) {
    if (!base || !token || !details) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`${base}/trips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customerId: details.trip.customerId,
          supplierId: details.supplierId,
          quotationId: details.quotationId,
          saleId: details.saleId,
          serviceType: details.trip.serviceType,
          bookingLocator: details.trip.bookingLocator,
          airline: details.trip.airline,
          status,
          saleDate: details.saleDate,
          travelStartDate: details.trip.travelStartDate,
          travelEndDate: details.trip.travelEndDate,
          notes: details.notes,
          segments: details.segments.map((segment) => ({ origin: segment.origin, destination: segment.destination, departureAt: segment.departureAt, arrivalAt: segment.arrivalAt, airline: segment.airline, flightNumber: segment.flightNumber, ticketNumber: segment.ticketNumber })),
        }),
      });
      if (!response.ok) { setError("Não foi possível atualizar o status."); return; }
      await load();
    } catch {
      setError("Não foi possível comunicar com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!base || !token) return;
    if (!window.confirm("Excluir esta viagem?")) return;
    const response = await fetch(`${base}/trips/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { setError("Não foi possível excluir a viagem."); return; }
    router.push("/viagens");
  }

  if (error && !details) return <p role="alert" className="text-sm text-red-600">{error}</p>;
  if (!details) return <p className="text-sm text-[var(--hub-text-secondary)]">Carregando…</p>;

  const t = details.trip;

  return (
    <div className="space-y-6">
      <BackButton href="/viagens" label="Viagens" />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--hub-text-primary)]">{t.customerName}</h1>
          <p className="text-sm text-[var(--hub-text-secondary)]">{t.serviceType} · {t.bookingLocator || "sem localizador"}{t.airline ? ` · ${t.airline}` : ""}</p>
        </div>
        <Link href={`/clientes/${t.customerId}`} className="text-sm font-medium text-[var(--hub-blue)] hover:underline">Ver ficha do cliente</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>Itinerário</CardTitle>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-xs font-medium uppercase text-[var(--hub-text-muted)]">Período</dt><dd>{t.travelStartDate ? formatDateBR(t.travelStartDate) : "—"} até {t.travelEndDate ? formatDateBR(t.travelEndDate) : "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase text-[var(--hub-text-muted)]">Data da venda</dt><dd>{details.saleDate ? formatDateBR(details.saleDate) : "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase text-[var(--hub-text-muted)]">Fornecedor</dt><dd>{details.supplierName ?? "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase text-[var(--hub-text-muted)]">Cotação vinculada</dt><dd>{details.quotationId ? <Link href={`/cotacoes/${details.quotationId}`} className="text-[var(--hub-blue)] hover:underline">Ver cotação</Link> : "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase text-[var(--hub-text-muted)]">Venda vinculada</dt><dd>{details.saleId ? <Link href="/vendas" className="text-[var(--hub-blue)] hover:underline">Ver vendas</Link> : "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase text-[var(--hub-text-muted)]">Observações</dt><dd className="whitespace-pre-wrap">{details.notes || "—"}</dd></div>
          </dl>
        </Card>

        <Card>
          <CardTitle>Status</CardTitle>
          <div className="mt-4">
            <Label>Situação atual</Label>
            <Select value={t.status} disabled={saving} onChange={(event) => void changeStatus(event.target.value)}>
              {Object.entries(TRIP_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </div>
          {isOwner && <Button type="button" variant="secondary" className="mt-4 text-red-600" onClick={() => void remove()}>Excluir viagem</Button>}
          {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        </Card>

        <Card>
          <CardTitle>Trechos de voo</CardTitle>
          {details.segments.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--hub-text-muted)]">Nenhum trecho cadastrado.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--hub-border)] text-sm">
              {details.segments.map((segment) => (
                <li key={segment.id} className="space-y-1 py-3 first:pt-0">
                  <p className="font-medium">{segment.origin || "?"} → {segment.destination || "?"}</p>
                  <p className="text-[var(--hub-text-secondary)]">{segment.departureAt ? formatDateTimeBR(segment.departureAt) : "—"} até {segment.arrivalAt ? formatDateTimeBR(segment.arrivalAt) : "—"}</p>
                  <p className="text-[var(--hub-text-muted)]">{segment.airline || "—"} {segment.flightNumber || ""} {segment.ticketNumber ? `· bilhete ${segment.ticketNumber}` : ""}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
