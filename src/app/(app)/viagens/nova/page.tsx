"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { NovoClienteModal } from "@/components/cliente/NovoClienteModal";
import { TRIP_STATUS_LABELS } from "@/lib/constants";
import type { Cliente } from "@/types";

type Supplier = { id: string; name: string };
type Segment = { origin: string; destination: string; departureAt: string; arrivalAt: string; airline: string; flightNumber: string; ticketNumber: string };

const emptySegment = (): Segment => ({ origin: "", destination: "", departureAt: "", arrivalAt: "", airline: "", flightNumber: "", ticketNumber: "" });
const today = () => new Date().toISOString().slice(0, 10);

export default function NovaViagemPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { token } = useAuth();
  const { clientes, cotacoes } = useData();
  const base = process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL;

  const [customerId, setCustomerId] = useState(params.get("clienteId") ?? "");
  const [quotationId, setQuotationId] = useState(params.get("cotacaoId") ?? "");
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [serviceType, setServiceType] = useState("FLIGHT");
  const [bookingLocator, setBookingLocator] = useState("");
  const [airline, setAirline] = useState("");
  const [status, setStatus] = useState("UPCOMING");
  const [saleDate, setSaleDate] = useState(today);
  const [travelStartDate, setTravelStartDate] = useState("");
  const [travelEndDate, setTravelEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  const cotacao = useMemo(() => cotacoes.find((q) => q.id === quotationId), [cotacoes, quotationId]);

  useEffect(() => {
    if (!cotacao) return;
    setTravelStartDate((current) => current || cotacao.dataInicioViagem || "");
    setTravelEndDate((current) => current || cotacao.dataFimViagem || "");
  }, [cotacao]);

  useEffect(() => {
    if (!base || !token) return;
    void fetch(`${base}/suppliers`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : [])
      .then(setSuppliers)
      .catch(() => setSuppliers([]));
  }, [base, token]);

  const cotacoesDoCliente = cotacoes.filter((q) => q.clienteId === customerId);

  function addSegment() { setSegments((current) => [...current, emptySegment()]); }
  function updateSegment(index: number, patch: Partial<Segment>) { setSegments((current) => current.map((segment, position) => position === index ? { ...segment, ...patch } : segment)); }
  function removeSegment(index: number) { setSegments((current) => current.filter((_, position) => position !== index)); }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setAttempted(true);
    if (!base || !token || !customerId) { setError("Selecione o cliente."); return; }
    setSaving(true);
    try {
      const response = await fetch(`${base}/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customerId,
          supplierId: supplierId || null,
          quotationId: quotationId || null,
          serviceType,
          bookingLocator: bookingLocator || null,
          airline: airline || null,
          status,
          saleDate,
          travelStartDate: travelStartDate || null,
          travelEndDate: travelEndDate || null,
          notes,
          segments: segments
            .filter((segment) => segment.origin || segment.destination || segment.flightNumber)
            .map((segment) => ({
              origin: segment.origin || null,
              destination: segment.destination || null,
              departureAt: segment.departureAt ? new Date(segment.departureAt).toISOString() : null,
              arrivalAt: segment.arrivalAt ? new Date(segment.arrivalAt).toISOString() : null,
              airline: segment.airline || null,
              flightNumber: segment.flightNumber || null,
              ticketNumber: segment.ticketNumber || null,
            })),
        }),
      });
      if (!response.ok) { setError("Não foi possível registrar a viagem. Revise os dados e tente novamente."); return; }
      const created = await response.json() as { trip: { id: string } };
      router.push(`/viagens/${created.trip.id}`);
    } catch {
      setError("Não foi possível comunicar com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--hub-text-primary)]">Nova viagem</h1>
        <p className="text-sm text-[var(--hub-text-secondary)]">Registre localizador e itinerário. Lançamentos financeiros continuam sendo criados à parte.</p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-[var(--hub-border)] bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Cliente *</Label>
            <Select className={attempted && !customerId ? "border-red-500" : ""} value={customerId} aria-invalid={attempted && !customerId} onChange={(event) => { setCustomerId(event.target.value); setQuotationId(""); }}>
              <option value="">Selecione</option>
              {clientes.map((customer) => <option key={customer.id} value={customer.id}>{customer.nome}</option>)}
            </Select>
            <Button type="button" size="sm" variant="ghost" className="mt-1 text-[var(--hub-blue)]" onClick={() => setCustomerModalOpen(true)}>+ Nova pessoa / cliente</Button>
          </div>
          <div>
            <Label>Cotação (opcional)</Label>
            <Select value={quotationId} disabled={!customerId} onChange={(event) => setQuotationId(event.target.value)}>
              <option value="">Sem cotação</option>
              {cotacoesDoCliente.map((quotation) => <option key={quotation.id} value={quotation.id}>{quotation.titulo}</option>)}
            </Select>
          </div>
          <div>
            <Label>Fornecedor (opcional)</Label>
            <Select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
              <option value="">Sem fornecedor</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Tipo de serviço</Label>
            <Select value={serviceType} onChange={(event) => setServiceType(event.target.value)}>
              <option value="FLIGHT">Aéreo</option>
              <option value="PACKAGE">Pacote</option>
              <option value="HOTEL">Hospedagem</option>
              <option value="CRUISE">Cruzeiro</option>
              <option value="OTHER">Outro</option>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div><Label>Localizador</Label><Input value={bookingLocator} onChange={(event) => setBookingLocator(event.target.value)} placeholder="Ex.: ABC123" /></div>
          <div><Label>Companhia</Label><Input value={airline} onChange={(event) => setAirline(event.target.value)} placeholder="Ex.: LATAM" /></div>
          <div>
            <Label>Status</Label>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              {Object.entries(TRIP_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </div>
          <div><Label>Data da venda</Label><Input type="date" value={saleDate} onChange={(event) => setSaleDate(event.target.value)} /></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Início da viagem</Label><Input type="date" value={travelStartDate} onChange={(event) => setTravelStartDate(event.target.value)} /></div>
          <div><Label>Fim da viagem</Label><Input type="date" value={travelEndDate} onChange={(event) => setTravelEndDate(event.target.value)} /></div>
        </div>

        <div><Label>Observações</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Detalhes do atendimento" /></div>

        <div className="space-y-3 rounded-lg bg-[var(--hub-bg-subtle)] p-3">
          <div className="flex items-center justify-between">
            <Label>Trechos de voo (opcional)</Label>
            <Button type="button" size="sm" variant="secondary" onClick={addSegment}>Adicionar trecho</Button>
          </div>
          {segments.map((segment, index) => (
            <div key={index} className="grid gap-2 border-t pt-3 sm:grid-cols-7">
              <Input value={segment.origin} onChange={(event) => updateSegment(index, { origin: event.target.value })} placeholder="Origem" />
              <Input value={segment.destination} onChange={(event) => updateSegment(index, { destination: event.target.value })} placeholder="Destino" />
              <Input type="datetime-local" value={segment.departureAt} onChange={(event) => updateSegment(index, { departureAt: event.target.value })} aria-label="Saída" />
              <Input type="datetime-local" value={segment.arrivalAt} onChange={(event) => updateSegment(index, { arrivalAt: event.target.value })} aria-label="Chegada" />
              <Input value={segment.airline} onChange={(event) => updateSegment(index, { airline: event.target.value })} placeholder="Companhia" />
              <Input value={segment.flightNumber} onChange={(event) => updateSegment(index, { flightNumber: event.target.value })} placeholder="Nº voo" />
              <div className="flex gap-2">
                <Input value={segment.ticketNumber} onChange={(event) => updateSegment(index, { ticketNumber: event.target.value })} placeholder="Nº bilhete" />
                <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => removeSegment(index)}>Remover</Button>
              </div>
            </div>
          ))}
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Registrar viagem"}</Button>
      </form>

      <NovoClienteModal open={customerModalOpen} initialType="cliente" onClose={() => setCustomerModalOpen(false)} onCreated={(customer: Cliente) => { setCustomerId(customer.id); setCustomerModalOpen(false); }} />
    </div>
  );
}
