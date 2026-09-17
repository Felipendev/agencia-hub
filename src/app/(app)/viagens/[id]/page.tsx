"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BackButton } from "@/components/ui/back-button";
import { useAuth } from "@/contexts/auth-context";
import { formatDateBR, formatDateTimeBR } from "@/lib/format";
import { TRIP_STATUS_LABELS } from "@/lib/constants";

type Segment = { id: string; segmentNumber: number; origin: string | null; destination: string | null; departureAt: string | null; arrivalAt: string | null; airline: string | null; flightNumber: string | null; ticketNumber: string | null };
type TripDetails = {
  trip: { id: string; customerId: string; customerName: string; serviceType: string; bookingLocator: string | null; airline: string | null; status: string; travelStartDate: string | null; travelEndDate: string | null };
  supplierId: string | null; supplierName: string | null; quotationId: string | null; saleId: string | null; saleDate: string | null; notes: string; segments: Segment[];
};
type Attachment = { id: string; filename: string; contentType: string; size: number };

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
  const [editing, setEditing] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!base || !token || !id) return;
    const response = await fetch(`${base}/trips/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { setError("Não foi possível carregar a viagem."); return; }
    setDetails(await response.json());
    const attachmentResponse = await fetch(`${base}/attachments/trips/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (attachmentResponse.ok) setAttachments(await attachmentResponse.json());
  }, [base, token, id]);

  useEffect(() => { void load(); }, [load]);

  function patchTrip(patch: Partial<TripDetails["trip"]> | { notes: string } | { segments: Segment[] }) {
    setDetails((current) => current ? { ...current, ...("notes" in patch ? { notes: patch.notes } : {}), ...("segments" in patch ? { segments: patch.segments } : {}), trip: { ...current.trip, ...patch } } : current);
  }

  async function saveTrip(next = details) {
    if (!base || !token || !next) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`${base}/trips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customerId: next.trip.customerId, supplierId: next.supplierId, quotationId: next.quotationId, saleId: next.saleId,
          serviceType: next.trip.serviceType, bookingLocator: next.trip.bookingLocator, airline: next.trip.airline, status: next.trip.status,
          saleDate: next.saleDate, travelStartDate: next.trip.travelStartDate, travelEndDate: next.trip.travelEndDate, notes: next.notes,
          segments: next.segments.map((segment) => ({ origin: segment.origin, destination: segment.destination, departureAt: segment.departureAt || null, arrivalAt: segment.arrivalAt || null, airline: segment.airline, flightNumber: segment.flightNumber, ticketNumber: segment.ticketNumber })),
        }),
      });
      if (!response.ok) { setError("Não foi possível salvar as alterações da viagem."); return; }
      setEditing(false);
      await load();
    } catch {
      setError("Não foi possível comunicar com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAttachment(file: File | null) {
    if (!base || !token || !file) return;
    if (file.size > 5 * 1024 * 1024) { setError("O anexo deve ter até 5 MB."); return; }
    setUploading(true); setError("");
    try {
      const data = new FormData(); data.append("file", file);
      const response = await fetch(`${base}/attachments/trips/${id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: data });
      if (!response.ok) { setError("Não foi possível enviar o anexo."); return; }
      await load();
    } catch { setError("Não foi possível comunicar com o servidor."); } finally { setUploading(false); }
  }

  async function downloadAttachment(attachment: Attachment) {
    if (!base || !token) return;
    try {
      const response = await fetch(`${base}/attachments/${attachment.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) { setError("Não foi possível baixar o anexo."); return; }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = attachment.filename; link.click(); URL.revokeObjectURL(url);
    } catch { setError("Não foi possível comunicar com o servidor."); }
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
            <Select value={t.status} disabled={saving || editing} onChange={(event) => void saveTrip({ ...details, trip: { ...t, status: event.target.value } })}>
              {Object.entries(TRIP_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </div>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => setEditing((value) => !value)}>{editing ? "Cancelar edição" : "Editar viagem"}</Button>
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

      {editing && <Card>
        <div className="flex items-center justify-between gap-4"><CardTitle>Editar viagem</CardTitle><Button type="button" disabled={saving} onClick={() => void saveTrip()}>{saving ? "Salvando…" : "Salvar alterações"}</Button></div>
        <p className="mt-1 text-sm text-[var(--hub-text-secondary)]">Atualize localizador, datas, companhia, observações e trechos quando houver alteração de voo ou serviço.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div><Label>Tipo de serviço</Label><Input value={t.serviceType} onChange={(e) => patchTrip({ serviceType: e.target.value })} /></div>
          <div><Label>Localizador</Label><Input value={t.bookingLocator ?? ""} onChange={(e) => patchTrip({ bookingLocator: e.target.value })} /></div>
          <div><Label>Companhia</Label><Input value={t.airline ?? ""} onChange={(e) => patchTrip({ airline: e.target.value })} /></div>
          <div><Label>Data da venda</Label><Input type="date" value={details.saleDate ?? ""} onChange={(e) => setDetails({ ...details, saleDate: e.target.value || null })} /></div>
          <div><Label>Início da viagem</Label><Input type="date" value={t.travelStartDate ?? ""} onChange={(e) => patchTrip({ travelStartDate: e.target.value })} /></div>
          <div><Label>Fim da viagem</Label><Input type="date" value={t.travelEndDate ?? ""} onChange={(e) => patchTrip({ travelEndDate: e.target.value })} /></div>
          <div className="md:col-span-3"><Label>Observações</Label><Textarea value={details.notes} onChange={(e) => patchTrip({ notes: e.target.value })} /></div>
        </div>
        <div className="mt-5 border-t border-[var(--hub-border)] pt-4"><div className="flex items-center justify-between"><Label>Trechos de voo</Label><Button type="button" size="sm" variant="secondary" onClick={() => patchTrip({ segments: [...details.segments, { id: `new-${Date.now()}`, segmentNumber: details.segments.length + 1, origin: "", destination: "", departureAt: "", arrivalAt: "", airline: "", flightNumber: "", ticketNumber: "" }] })}>Adicionar trecho</Button></div>
          <div className="mt-3 space-y-3">{details.segments.map((segment, index) => <div key={segment.id} className="grid gap-2 rounded-lg border border-[var(--hub-border)] p-3 md:grid-cols-4"><Input value={segment.origin ?? ""} placeholder="Origem" onChange={(e) => patchTrip({ segments: details.segments.map((s, i) => i === index ? { ...s, origin: e.target.value } : s) })} /><Input value={segment.destination ?? ""} placeholder="Destino" onChange={(e) => patchTrip({ segments: details.segments.map((s, i) => i === index ? { ...s, destination: e.target.value } : s) })} /><Input type="datetime-local" value={toLocalInput(segment.departureAt)} onChange={(e) => patchTrip({ segments: details.segments.map((s, i) => i === index ? { ...s, departureAt: e.target.value ? new Date(e.target.value).toISOString() : null } : s) })} /><Input type="datetime-local" value={toLocalInput(segment.arrivalAt)} onChange={(e) => patchTrip({ segments: details.segments.map((s, i) => i === index ? { ...s, arrivalAt: e.target.value ? new Date(e.target.value).toISOString() : null } : s) })} /><Input value={segment.airline ?? ""} placeholder="Companhia" onChange={(e) => patchTrip({ segments: details.segments.map((s, i) => i === index ? { ...s, airline: e.target.value } : s) })} /><Input value={segment.flightNumber ?? ""} placeholder="Voo" onChange={(e) => patchTrip({ segments: details.segments.map((s, i) => i === index ? { ...s, flightNumber: e.target.value } : s) })} /><Input value={segment.ticketNumber ?? ""} placeholder="Bilhete" onChange={(e) => patchTrip({ segments: details.segments.map((s, i) => i === index ? { ...s, ticketNumber: e.target.value } : s) })} /><Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => patchTrip({ segments: details.segments.filter((_, i) => i !== index) })}>Remover</Button></div>)}</div>
        </div>
      </Card>}

      <Card>
        <CardTitle>Documentos da viagem</CardTitle>
        <p className="mt-1 text-sm text-[var(--hub-text-secondary)]">Centralize contratos, vouchers, bilhetes e demais arquivos desta viagem.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3"><Input className="max-w-md" type="file" disabled={uploading} accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,text/csv" onChange={(e) => void uploadAttachment(e.target.files?.[0] ?? null)} /><span className="text-xs text-[var(--hub-text-muted)]">PDF, imagem ou texto · até 5 MB</span></div>
        {attachments.length === 0 ? <p className="mt-4 text-sm text-[var(--hub-text-muted)]">Nenhum documento anexado.</p> : <ul className="mt-4 divide-y divide-[var(--hub-border)]">{attachments.map((attachment) => <li key={attachment.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="truncate">{attachment.filename}</span><button type="button" className="shrink-0 font-medium text-[var(--hub-blue)] hover:underline" onClick={() => void downloadAttachment(attachment)}>Baixar</button></li>)}</ul>}
      </Card>
    </div>
  );
}

function toLocalInput(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}
