"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { stagesApi } from "@/lib/stages/api";
import {
  KIND_LABEL, STATUS_LABEL, STATUS_TONE, actionLabel, brDate, dayLabel, emptyForm, endLabel, eventNote, formFromStage, groupByDay, startLabel, toInput,
  type StageForm,
} from "@/lib/stages/format";
import { AGENCY_ZONE, ZONES, formatInZone } from "@/lib/agenda/time";
import type { Itinerary, LibraryResource, Stage, StageDetail, StageKind, StageStatus, TripAttachment } from "@/lib/stages/types";

const area = "w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3 text-sm";
const muted = "text-xs text-[var(--hub-text-muted)]";

type Run = (action: () => Promise<string | void>) => Promise<void>;
type Editor = { mode: "create"; key: string } | { mode: "edit"; stage: Stage };

const newKey = () => crypto.randomUUID();

function StagesPage() {
  const { token } = useAuth();
  const { id: tripId } = useParams<{ id: string }>();
  const [data, setData] = useState<Itinerary | null>(null);
  const [attachments, setAttachments] = useState<TripAttachment[]>([]);
  const [library, setLibrary] = useState<LibraryResource[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [form, setForm] = useState<StageForm>(emptyForm(AGENCY_ZONE));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");

  const reload = useCallback(async () => {
    const next = await stagesApi.itinerary(token, tripId);
    setData(next);
    return next;
  }, [token, tripId]);

  useEffect(() => {
    if (!token || !tripId) return;
    let active = true;
    stagesApi.itinerary(token, tripId)
      .then((next) => { if (active) setData(next); })
      .catch((e: Error) => { if (active) setLoadError(e.message); });
    // Anexos e Biblioteca são opcionais: a falha não impede o roteiro.
    stagesApi.attachments(token, tripId).then((rows) => { if (active) setAttachments(rows); }).catch(() => undefined);
    stagesApi.library(token).then((rows) => { if (active) setLibrary(rows); }).catch(() => undefined);
    return () => { active = false; };
  }, [token, tripId]);

  const run: Run = async (action) => {
    setBusy(true); setError(""); setNotice("");
    try { const message = await action(); if (message) setNotice(message); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível concluir a ação."); }
    finally { setBusy(false); }
  };

  /** Atualiza a etapa e o histórico com a resposta confirmada da API. */
  const applyDetail = (detail: StageDetail) => {
    setData((current) => {
      if (!current) return current;
      const others = current.stages.filter((s) => s.id !== detail.stage.id);
      const stages = [...others, detail.stage].sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id));
      const history = [...detail.history, ...current.history.filter((h) => h.stageId !== detail.stage.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { trip: detail.trip, stages, history };
    });
  };

  if (loadError) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{loadError}</p>;
  if (!data) return <p className="text-sm text-[var(--hub-text-muted)]">Carregando etapas…</p>;

  const trip = data.trip;
  const tripCancelled = trip.status === "CANCELLED";
  const period = trip.travelStartDate || trip.travelEndDate ? `${brDate(trip.travelStartDate) || "?"} a ${brDate(trip.travelEndDate) || "?"}` : "período não informado";

  const openCreate = () => {
    setForm(emptyForm(data.stages.at(-1)?.timeZone ?? AGENCY_ZONE, trip.travelStartDate ?? ""));
    setEditor({ mode: "create", key: newKey() });
    setError(""); setNotice("");
  };

  const submit = () => run(async () => {
    if (!editor) return;
    if (editor.mode === "create") {
      const created = await stagesApi.create(token, tripId, editor.key, toInput(form));
      applyDetail(created);
      setEditor(null);
      return "Etapa adicionada ao roteiro.";
    }
    const next = await stagesApi.update(token, tripId, editor.stage.id, toInput(form, editor.stage.version));
    applyDetail(next);
    setEditor(null);
    return next.stage.version !== editor.stage.version ? "Etapa atualizada." : "Nenhuma alteração para salvar.";
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Etapas da viagem" description={`${trip.customerName} · ${trip.serviceType}${trip.bookingLocator ? ` · ${trip.bookingLocator}` : ""} · ${period}`}>
        <Link href={`/viagens/${tripId}`} className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--hub-bg-subtle)]">Voltar para a viagem</Link>
        {!tripCancelled && !editor && <Button onClick={openCreate}>Nova etapa</Button>}
      </PageHeader>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {tripCancelled && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">A viagem está cancelada. As etapas continuam consultáveis, mas novas etapas só podem ser incluídas depois de reativar a viagem.</p>}

      <p className={muted}>Hotel, transfer e atividades da viagem. Trechos aéreos continuam no cadastro da viagem. As etapas não criam despesas, vendas nem anexos.</p>

      {editor && (
        <Card className="space-y-4">
          <CardTitle>{editor.mode === "create" ? "Nova etapa" : `Editar: ${editor.stage.title}`}</CardTitle>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
            <StageFields form={form} onChange={setForm} disabled={busy} />
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>{editor.mode === "create" ? "Adicionar etapa" : "Salvar alterações"}</Button>
              <Button variant="secondary" disabled={busy} onClick={() => setEditor(null)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {data.stages.length === 0 ? (
        <Card><CardDescription>Nenhuma etapa registrada. {tripCancelled ? "" : "Use “Nova etapa” para incluir hotel, transfer ou atividade."}</CardDescription></Card>
      ) : (
        groupByDay(data.stages).map((group) => (
          <section key={group.date} className="space-y-3" aria-label={dayLabel(group.date)}>
            <h2 className="text-sm font-semibold text-[var(--hub-text-secondary)] first-letter:uppercase">{dayLabel(group.date)}</h2>
            {group.stages.map((stage) => (
              <StageCard key={stage.id} stage={stage} tripId={tripId} token={token} busy={busy} run={run} onDetail={applyDetail}
                attachments={attachments} library={library}
                onAttachmentUploaded={(a) => setAttachments((rows) => [...rows, a])}
                onDeleted={() => reload()}
                onEdit={() => { setForm(formFromStage(stage)); setEditor({ mode: "edit", stage }); setError(""); setNotice(""); }}
                editingThis={editor?.mode === "edit" && editor.stage.id === stage.id} />
            ))}
          </section>
        ))
      )}

      <Card>
        <CardTitle>Histórico</CardTitle>
        {data.history.length === 0 ? <CardDescription>Sem registros.</CardDescription> : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {data.history.map((h) => {
              const note = eventNote(h);
              return (
                <li key={h.id}>
                  <span className={muted}>{new Date(h.createdAt).toLocaleString("pt-BR", { timeZone: AGENCY_ZONE, dateStyle: "short", timeStyle: "short" })}</span> · {actionLabel(h.action)}
                  {note && <span className="text-[var(--hub-text-secondary)]"> — {note}</span>}
                  {typeof h.detail?.previousStartsAt === "string" && typeof h.detail?.timeZone === "string" && (
                    <span className="text-[var(--hub-text-secondary)]"> — antes: {formatInZone(h.detail.previousStartsAt, typeof h.detail.previousTimeZone === "string" ? h.detail.previousTimeZone : h.detail.timeZone)}
                      {typeof h.detail.previousEndsAt === "string" && <> até {formatInZone(h.detail.previousEndsAt, typeof h.detail.previousTimeZone === "string" ? h.detail.previousTimeZone : h.detail.timeZone)}</>}
                    </span>
                  )}
                  <span className={muted}> · {h.author}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StageFields({ form, onChange, disabled }: { form: StageForm; onChange: (f: StageForm) => void; disabled: boolean }) {
  const set = (patch: Partial<StageForm>) => onChange({ ...form, ...patch });
  const transfer = form.kind === "TRANSFER";
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Label htmlFor="s-kind" required>Tipo</Label>
        <Select id="s-kind" disabled={disabled} value={form.kind} onChange={(e) => set({ kind: e.target.value as StageKind })}>
          {(Object.keys(KIND_LABEL) as StageKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </Select>
      </div>
      <div><Label htmlFor="s-title" required>Título</Label><Input id="s-title" maxLength={180} disabled={disabled} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder={transfer ? "Aeroporto → hotel" : form.kind === "HOTEL" ? "Nome do hotel" : "Passeio, ingresso…"} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label htmlFor="s-start-date" required>{startLabel(form.kind)} — data</Label><Input id="s-start-date" type="date" disabled={disabled} value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} /></div>
        <div><Label htmlFor="s-start-time" required>{startLabel(form.kind)} — hora</Label><Input id="s-start-time" type="time" disabled={disabled} value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label htmlFor="s-end-date">{endLabel(form.kind)} — data</Label><Input id="s-end-date" type="date" disabled={disabled} value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} /></div>
        <div><Label htmlFor="s-end-time">{endLabel(form.kind)} — hora</Label><Input id="s-end-time" type="time" disabled={disabled} value={form.endTime} onChange={(e) => set({ endTime: e.target.value })} /></div>
      </div>
      <div>
        <Label htmlFor="s-zone">Fuso do local</Label>
        <Select id="s-zone" disabled={disabled} value={form.timeZone} onChange={(e) => set({ timeZone: e.target.value })}>
          {(ZONES.some((z) => z.id === form.timeZone) ? ZONES : [...ZONES, { id: form.timeZone, label: form.timeZone }]).map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
        </Select>
      </div>
      <div><Label htmlFor="s-people">Pessoas</Label><Input id="s-people" type="number" min={1} max={99} disabled={disabled} value={form.people} onChange={(e) => set({ people: e.target.value })} /></div>
      <div><Label htmlFor="s-provider">Fornecedor ou prestador</Label><Input id="s-provider" maxLength={200} disabled={disabled} value={form.provider} onChange={(e) => set({ provider: e.target.value })} /></div>
      <div><Label htmlFor="s-code">Código de confirmação ou voucher</Label><Input id="s-code" maxLength={100} disabled={disabled} value={form.confirmationCode} onChange={(e) => set({ confirmationCode: e.target.value })} /></div>
      {transfer ? (
        <>
          <div><Label htmlFor="s-origin">Origem</Label><Input id="s-origin" maxLength={300} disabled={disabled} value={form.origin} onChange={(e) => set({ origin: e.target.value })} /></div>
          <div><Label htmlFor="s-destination">Destino</Label><Input id="s-destination" maxLength={300} disabled={disabled} value={form.destination} onChange={(e) => set({ destination: e.target.value })} /></div>
        </>
      ) : (
        <div className="md:col-span-2"><Label htmlFor="s-location">Endereço ou local</Label><Input id="s-location" maxLength={500} disabled={disabled} value={form.location} onChange={(e) => set({ location: e.target.value })} /></div>
      )}
      <div className="md:col-span-2"><Label htmlFor="s-notes">Observações</Label><textarea id="s-notes" rows={3} maxLength={4000} className={area} disabled={disabled} value={form.notes} onChange={(e) => set({ notes: e.target.value })} /></div>
    </div>
  );
}

type CardProps = {
  stage: Stage; tripId: string; token: string | null | undefined; busy: boolean; run: Run; onDetail: (d: StageDetail) => void;
  attachments: TripAttachment[]; library: LibraryResource[]; onAttachmentUploaded: (a: TripAttachment) => void;
  onDeleted: () => Promise<unknown>; onEdit: () => void; editingThis: boolean;
};

function StageCard({ stage: s, tripId, token, busy, run, onDetail, attachments, library, onAttachmentUploaded, onDeleted, onEdit, editingThis }: CardProps) {
  const [reasonFor, setReasonFor] = useState<StageStatus | null>(null);
  const [reason, setReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [attachmentId, setAttachmentId] = useState("");
  const [libraryId, setLibraryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const cancelled = s.status === "CANCELLED";
  const linked = new Set(s.links.map((l) => l.targetId));
  const freeAttachments = attachments.filter((a) => !linked.has(a.id));
  const freeLibrary = library.filter((r) => !linked.has(r.id));

  const changeStatus = (status: StageStatus, why = "") => run(async () => {
    onDetail(await stagesApi.status(token, tripId, s.id, status, why, s.version));
    setReasonFor(null); setReason("");
    return { CONFIRMED: "Etapa confirmada.", PLANNED: cancelled ? "Etapa reativada como prevista." : "Etapa voltou a prevista.", CANCELLED: "Etapa cancelada. O registro e os vínculos foram preservados." }[status];
  });

  const download = (targetId: string, filename: string) => run(async () => {
    const blob = await stagesApi.download(token, targetId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
  });

  return (
    <article aria-label={s.title}><Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="default">{KIND_LABEL[s.kind]}</Badge>
            <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
            <h3 className={`text-sm font-semibold ${cancelled ? "line-through text-[var(--hub-text-muted)]" : ""}`}>{s.title}</h3>
          </div>
          <p className="mt-1 text-sm">
            {startLabel(s.kind)}: {formatInZone(s.startsAt, s.timeZone)}
            {s.endsAt && <> · {endLabel(s.kind)}: {formatInZone(s.endsAt, s.timeZone)}</>}
            <span className={muted}> ({s.timeZone})</span>
          </p>
          {cancelled && s.statusReason && <p className="text-sm text-red-700">Cancelada: {s.statusReason}</p>}
        </div>
      </div>

      <dl className="grid gap-2 text-sm md:grid-cols-3">
        {s.provider && <div><dt className={muted}>Fornecedor</dt><dd>{s.provider}</dd></div>}
        {s.confirmationCode && <div><dt className={muted}>Confirmação</dt><dd className="font-mono">{s.confirmationCode}</dd></div>}
        {s.people != null && <div><dt className={muted}>Pessoas</dt><dd>{s.people}</dd></div>}
        {(s.origin || s.destination) && <div className="md:col-span-2"><dt className={muted}>Trajeto</dt><dd>{s.origin ?? "?"} → {s.destination ?? "?"}</dd></div>}
        {s.location && <div className="md:col-span-3"><dt className={muted}>Local</dt><dd>{s.location}</dd></div>}
        {s.notes && <div className="md:col-span-3"><dt className={muted}>Observações</dt><dd className="whitespace-pre-wrap">{s.notes}</dd></div>}
      </dl>

      {s.warnings.map((w) => <p key={w} className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">Atenção: {w}</p>)}

      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--hub-text-secondary)]">Documentos vinculados</p>
        {s.links.length === 0 ? <p className={muted}>Nenhum documento vinculado.</p> : (
          <ul className="space-y-1 text-sm">
            {s.links.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2">
                <Badge tone="muted">{l.type === "ATTACHMENT" ? "Anexo da viagem" : "Biblioteca"}</Badge>
                {l.type === "ATTACHMENT"
                  ? <button type="button" className="underline" onClick={() => download(l.targetId, l.title ?? "anexo")}>{l.title}</button>
                  : <Link href="/biblioteca" className="underline">{l.title}</Link>}
                {l.detail && l.type === "ATTACHMENT" && <span className={muted}>{l.detail}</span>}
                <Button size="sm" variant="ghost" disabled={busy} aria-label={`Desvincular ${l.title}`}
                  onClick={() => run(async () => { onDetail(await stagesApi.unlink(token, tripId, s.id, l.type === "ATTACHMENT" ? "attachments" : "library", l.targetId)); return "Vínculo removido. O documento continua na viagem ou na Biblioteca."; })}>
                  Desvincular
                </Button>
              </li>
            ))}
          </ul>
        )}
        {!cancelled && (
          <div className="grid gap-2 md:grid-cols-3">
            <div className="flex gap-2">
              <Select aria-label={`Anexo da viagem para ${s.title}`} disabled={busy || freeAttachments.length === 0} value={attachmentId} onChange={(e) => setAttachmentId(e.target.value)}>
                <option value="">{freeAttachments.length ? "Anexo da viagem…" : attachments.length ? "Todos os anexos já vinculados" : "Viagem sem anexos"}</option>
                {freeAttachments.map((a) => <option key={a.id} value={a.id}>{a.filename}{a.description ? ` — ${a.description}` : ""}</option>)}
              </Select>
              <Button size="sm" variant="secondary" disabled={busy || !attachmentId}
                onClick={() => run(async () => { onDetail(await stagesApi.link(token, tripId, s.id, "attachments", attachmentId)); setAttachmentId(""); return "Anexo vinculado à etapa."; })}>Vincular</Button>
            </div>
            <div className="flex gap-2">
              <Select aria-label={`Material da Biblioteca para ${s.title}`} disabled={busy || freeLibrary.length === 0} value={libraryId} onChange={(e) => setLibraryId(e.target.value)}>
                <option value="">{freeLibrary.length ? "Material da Biblioteca…" : library.length ? "Todos os materiais já vinculados" : "Biblioteca vazia"}</option>
                {freeLibrary.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </Select>
              <Button size="sm" variant="secondary" disabled={busy || !libraryId}
                onClick={() => run(async () => { onDetail(await stagesApi.link(token, tripId, s.id, "library", libraryId)); setLibraryId(""); return "Material vinculado à etapa."; })}>Vincular</Button>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[var(--hub-radius)] border border-dashed border-[var(--hub-border)] px-3 py-2 text-xs text-[var(--hub-text-secondary)] hover:bg-[var(--hub-bg-subtle)]">
                <input aria-label={`Novo arquivo para ${s.title}`} type="file" accept=".pdf,.txt,.csv,.jpg,.jpeg,.png,.webp" disabled={busy} className="sr-only"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                <span className="truncate">{file ? file.name : "Escolher novo arquivo (até 5 MB)"}</span>
              </label>
              <Button size="sm" variant="secondary" disabled={busy || !file} onClick={() => run(async () => {
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) throw new Error("O arquivo deve ter até 5 MB.");
                const uploaded = await stagesApi.upload(token, tripId, file, s.title);
                onAttachmentUploaded(uploaded);
                setFile(null);
                try {
                  onDetail(await stagesApi.link(token, tripId, s.id, "attachments", uploaded.id));
                } catch (e) {
                  throw new Error(`O arquivo foi salvo nos anexos da viagem, mas não foi vinculado: ${e instanceof Error ? e.message : "tente vincular novamente."}`);
                }
                return "Arquivo enviado aos anexos da viagem e vinculado à etapa.";
              })}>Enviar</Button>
            </div>
          </div>
        )}
      </div>

      {!editingThis && (
        <div className="flex flex-wrap gap-2">
          {!cancelled && <Button size="sm" variant="secondary" disabled={busy} onClick={onEdit}>Editar</Button>}
          {s.status === "PLANNED" && <Button size="sm" disabled={busy} onClick={() => changeStatus("CONFIRMED")}>Confirmar</Button>}
          {s.status === "CONFIRMED" && <Button size="sm" variant="secondary" disabled={busy} onClick={() => changeStatus("PLANNED")}>Voltar a prevista</Button>}
          {!cancelled && <Button size="sm" variant="danger" disabled={busy} onClick={() => { setReasonFor("CANCELLED"); setReason(""); }}>Cancelar etapa</Button>}
          {cancelled && <Button size="sm" variant="secondary" disabled={busy} onClick={() => { setReasonFor("PLANNED"); setReason(""); }}>Reativar</Button>}
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmDelete(true)}>Excluir</Button>
        </div>
      )}

      {reasonFor && (
        <div className="space-y-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3">
          <Label htmlFor={`reason-${s.id}`} required>{reasonFor === "CANCELLED" ? "Motivo do cancelamento" : "Motivo para reativar"}</Label>
          <textarea id={`reason-${s.id}`} rows={2} maxLength={1000} className={area} value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" variant={reasonFor === "CANCELLED" ? "danger" : "primary"} disabled={busy || !reason.trim()} onClick={() => changeStatus(reasonFor, reason)}>
              {reasonFor === "CANCELLED" ? "Confirmar cancelamento" : "Reativar etapa"}
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setReasonFor(null)}>Voltar</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir etapa"
        message="A etapa e seus vínculos serão removidos do roteiro; os anexos continuam na viagem e os materiais na Biblioteca. A exclusão fica registrada no histórico. Para manter o registro, prefira cancelar."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => { setConfirmDelete(false); void run(async () => { await stagesApi.remove(token, tripId, s.id, s.version); await onDeleted(); return "Etapa excluída."; }); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </Card></article>
  );
}

export default function EtapasDaViagemPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  return <Suspense fallback={<p className="text-sm text-[var(--hub-text-muted)]">Carregando etapas…</p>}><StagesPage key={`${id}:${token ?? ""}`} /></Suspense>;
}
