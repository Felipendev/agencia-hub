"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppointmentFields, toInput, type AppointmentForm, type Option } from "@/components/agenda/appointment-form";
import { agendaApi, saveBlob } from "@/lib/agenda/api";
import { FORMAT_LABEL, PRODUCT_LABEL, STATUS_LABEL, STATUS_TONE, actionLabel, durationLabel, hasStarted } from "@/lib/agenda/format";
import { formatInZone, fromIso } from "@/lib/agenda/time";
import type { Detail, Member, Minutes, NextStep, Status } from "@/lib/agenda/types";

const area = "w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3 text-sm";

type MinutesForm = { participants: string; summary: string; decisions: string[]; nextSteps: { description: string; owner: string; dueOn: string }[] };

function minutesForm(m: Minutes | null | undefined): MinutesForm {
  return {
    participants: m?.participants ?? "",
    summary: m?.summary ?? "",
    decisions: m?.decisions.length ? [...m.decisions] : [""],
    nextSteps: m?.nextSteps.length ? m.nextSteps.map((s) => ({ description: s.description, owner: s.owner ?? "", dueOn: s.dueOn ?? "" })) : [],
  };
}

function minutesData(f: MinutesForm): Minutes {
  const text = (v: string) => (v.trim() ? v.trim() : null);
  return {
    participants: text(f.participants),
    summary: text(f.summary),
    decisions: f.decisions.map((d) => d.trim()).filter(Boolean),
    nextSteps: f.nextSteps.filter((s) => s.description.trim()).map((s): NextStep => ({ description: s.description.trim(), owner: text(s.owner), dueOn: s.dueOn || null })),
  };
}

function formFromDetail(d: Detail): AppointmentForm {
  const a = d.appointment;
  const local = fromIso(a.startsAt, a.timeZone);
  return {
    product: a.product, customerId: a.customerId, tripId: a.tripId ?? "", title: a.title, purpose: a.purpose ?? "",
    date: local.date, time: local.time, durationMinutes: String(a.durationMinutes), timeZone: a.timeZone, format: a.format,
    location: a.location ?? "", meetingUrl: a.meetingUrl ?? "", responsibleId: a.responsibleId,
  };
}

function AppointmentPage() {
  const { token } = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const params = useSearchParams();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [form, setForm] = useState<AppointmentForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [minutes, setMinutes] = useState<MinutesForm>(minutesForm(null));
  const [viewVersion, setViewVersion] = useState<{ version: number; data: Minutes; author: string; createdAt: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [trips, setTrips] = useState<Option[]>([]);
  const [reasonFor, setReasonFor] = useState<Status | null>(null);
  const [reason, setReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(params.get("criado") ? "Compromisso agendado." : "");
  const [loadError, setLoadError] = useState("");

  const apply = useCallback((next: Detail) => {
    setDetail(next);
    setForm(formFromDetail(next));
    setMinutes(minutesForm(next.minutes?.data));
  }, []);

  useEffect(() => {
    if (!token || !id) return;
    let active = true;
    Promise.all([agendaApi.get(token, id), agendaApi.members(token)])
      .then(([data, team]) => { if (active) { apply(data); setMembers(team); } })
      .catch((e: Error) => { if (active) setLoadError(e.message); });
    return () => { active = false; };
  }, [token, id, apply]);

  const customerId = detail?.appointment.customerId;
  const isTravel = detail?.appointment.product === "TRAVEL";
  useEffect(() => {
    if (!token || !customerId || !isTravel || !editing) return;
    agendaApi.tripsOf(token, customerId)
      .then((rows) => setTrips(rows.map((t) => ({ id: t.id, label: `${t.serviceType}${t.bookingLocator ? ` · ${t.bookingLocator}` : ""}` }))))
      .catch(() => setTrips([]));
  }, [token, customerId, isTravel, editing]);

  async function run(action: () => Promise<string | void>) {
    setBusy(true); setError(""); setNotice("");
    try { const message = await action(); if (message) setNotice(message); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível concluir a ação."); }
    finally { setBusy(false); }
  }

  if (loadError) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{loadError}</p>;
  if (!detail || !form) return <p className="text-sm text-[var(--hub-text-muted)]">Carregando compromisso…</p>;

  const a = detail.appointment;
  const scheduled = a.status === "SCHEDULED";
  const started = hasStarted(a);
  const canMinutes = a.status === "SCHEDULED" || a.status === "COMPLETED";
  const minutesVersion = detail.minutes?.version ?? 0;

  const changeStatus = (status: Status, why = "") => run(async () => {
    apply(await agendaApi.status(token, id, status, why, a.version));
    setReasonFor(null); setReason("");
    return { COMPLETED: "Marcado como realizado.", NO_SHOW: "Marcado como não compareceu.", CANCELLED: "Compromisso cancelado. O histórico e a ata foram preservados.", SCHEDULED: "Compromisso reaberto." }[status];
  });

  return (
    <div className="space-y-6">
      <PageHeader title={a.title} description={`${a.customerName} · ${formatInZone(a.startsAt, a.timeZone)} (${a.timeZone}) · ${durationLabel(a.durationMinutes)}`}>
        <Badge tone="muted">{PRODUCT_LABEL[a.product]}</Badge>
        <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
        <Link href={`/agenda?customerId=${a.customerId}&product=${a.product}`} className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--hub-bg-subtle)]">Agenda da pessoa</Link>
      </PageHeader>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {detail.overlaps.length > 0 && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Atenção: {a.responsibleName} tem outro compromisso no mesmo horário — {detail.overlaps.map((o) => `${o.title} (${formatInZone(o.startsAt, a.timeZone, false)})`).join(", ")}.
        </p>
      )}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Compromisso</CardTitle>
            <CardDescription>
              {scheduled ? "Agendado: pode ser editado, reagendado ou cancelado." : a.status === "CANCELLED" ? `Cancelado: ${a.statusReason}. Não muda mais de estado; crie outro compromisso se necessário.` : `${STATUS_LABEL[a.status]}${a.statusReason ? ` — ${a.statusReason}` : ""}. Para alterar, reabra o compromisso.`}
            </CardDescription>
          </div>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(async () => { saveBlob(await agendaApi.ics(token, id), `compromisso-${a.startsAt.slice(0, 10)}.ics`); })}>Baixar .ics</Button>
        </div>

        {editing ? (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void run(async () => {
            const next = await agendaApi.update(token, id, toInput(form, a.version));
            const changed = next.appointment.version !== a.version;
            apply(next); setEditing(false);
            return changed ? "Compromisso atualizado." : "Nenhuma alteração para salvar.";
          }); }}>
            <AppointmentFields form={form} onChange={setForm} members={members} customers={[{ id: a.customerId, label: a.customerName }]} trips={trips} editing disabled={busy} />
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>Salvar alterações</Button>
              <Button variant="secondary" disabled={busy} onClick={() => { setForm(formFromDetail(detail)); setEditing(false); }}>Cancelar edição</Button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-3 text-sm md:grid-cols-3">
            <div><dt className="text-xs text-[var(--hub-text-muted)]">Quando</dt><dd>{formatInZone(a.startsAt, a.timeZone)} · {durationLabel(a.durationMinutes)}</dd></div>
            <div><dt className="text-xs text-[var(--hub-text-muted)]">Formato</dt><dd>{FORMAT_LABEL[a.format]}{a.location ? ` · ${a.location}` : ""}</dd></div>
            <div><dt className="text-xs text-[var(--hub-text-muted)]">Responsável</dt><dd>{a.responsibleName}</dd></div>
            {a.meetingUrl && /^https?:\/\//i.test(a.meetingUrl) && <div><dt className="text-xs text-[var(--hub-text-muted)]">Link</dt><dd><a href={a.meetingUrl} target="_blank" rel="noopener noreferrer" className="underline">Abrir reunião</a></dd></div>}
            {a.tripId && <div><dt className="text-xs text-[var(--hub-text-muted)]">Viagem</dt><dd><Link href={`/viagens/${a.tripId}`} className="underline">Abrir viagem</Link></dd></div>}
            {a.purpose && <div className="md:col-span-3"><dt className="text-xs text-[var(--hub-text-muted)]">Objetivo</dt><dd className="whitespace-pre-wrap">{a.purpose}</dd></div>}
          </dl>
        )}

        {!editing && (
          <div className="flex flex-wrap gap-2">
            {scheduled && <Button variant="secondary" disabled={busy} onClick={() => setEditing(true)}>Editar ou reagendar</Button>}
            {scheduled && started && <Button disabled={busy} onClick={() => changeStatus("COMPLETED")}>Marcar como realizado</Button>}
            {scheduled && started && !detail.minutes && <Button variant="secondary" disabled={busy} onClick={() => changeStatus("NO_SHOW")}>Não compareceu</Button>}
            {scheduled && <Button variant="danger" disabled={busy} onClick={() => { setReasonFor("CANCELLED"); setReason(""); }}>Cancelar compromisso</Button>}
            {(a.status === "COMPLETED" || a.status === "NO_SHOW") && <Button variant="secondary" disabled={busy} onClick={() => { setReasonFor("SCHEDULED"); setReason(""); }}>Reabrir</Button>}
            {scheduled && !detail.minutes && <Button variant="ghost" disabled={busy} onClick={() => setConfirmDelete(true)}>Excluir</Button>}
          </div>
        )}
        {scheduled && !started && <p className="text-xs text-[var(--hub-text-muted)]">“Realizado” e “Não compareceu” ficam disponíveis a partir do horário de início.</p>}
        {scheduled && detail.minutes && <p className="text-xs text-[var(--hub-text-muted)]">Compromissos com ata não são excluídos; use o cancelamento para preservar o registro.</p>}

        {reasonFor && (
          <div className="space-y-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3">
            <Label htmlFor="status-reason" required>{reasonFor === "CANCELLED" ? "Motivo do cancelamento" : "Motivo para reabrir"}</Label>
            <textarea id="status-reason" rows={2} maxLength={1000} className={area} value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-2">
              <Button variant={reasonFor === "CANCELLED" ? "danger" : "primary"} disabled={busy || !reason.trim()} onClick={() => changeStatus(reasonFor, reason)}>
                {reasonFor === "CANCELLED" ? "Confirmar cancelamento" : "Reabrir compromisso"}
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => setReasonFor(null)}>Voltar</Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <CardTitle>Ata {detail.minutes ? `(versão ${minutesVersion})` : ""}</CardTitle>
        <CardDescription>
          {canMinutes
            ? "Cada correção gera uma nova versão; as anteriores ficam consultáveis. Próximos passos são registrados como texto e não criam tarefas automaticamente."
            : detail.minutes ? "Ata preservada. Reabra o compromisso para corrigir." : "Atas são registradas em compromissos agendados ou realizados."}
        </CardDescription>
        {canMinutes ? (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void run(async () => {
            const next = await agendaApi.saveMinutes(token, id, minutesData(minutes), minutesVersion);
            const changed = (next.minutes?.version ?? 0) !== minutesVersion;
            apply(next); setViewVersion(null);
            return minutesVersion === 0 ? "Ata registrada." : changed ? `Ata salva como versão ${next.minutes?.version}.` : "Nenhuma alteração na ata.";
          }); }}>
            <div><Label htmlFor="m-participants">Participantes</Label><Input id="m-participants" maxLength={1000} disabled={busy} value={minutes.participants} onChange={(e) => setMinutes({ ...minutes, participants: e.target.value })} /></div>
            <div><Label htmlFor="m-summary">Resumo</Label><textarea id="m-summary" rows={5} maxLength={20000} className={area} disabled={busy} value={minutes.summary} onChange={(e) => setMinutes({ ...minutes, summary: e.target.value })} /></div>
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-[var(--hub-text-secondary)]">Decisões</legend>
              {minutes.decisions.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <Input aria-label={`Decisão ${i + 1}`} maxLength={1000} disabled={busy} value={d} onChange={(e) => setMinutes({ ...minutes, decisions: minutes.decisions.map((x, j) => (j === i ? e.target.value : x)) })} />
                  <Button size="sm" variant="ghost" disabled={busy} aria-label={`Remover decisão ${i + 1}`} onClick={() => setMinutes({ ...minutes, decisions: minutes.decisions.filter((_, j) => j !== i) })}>Remover</Button>
                </div>
              ))}
              <Button size="sm" variant="secondary" disabled={busy || minutes.decisions.length >= 50} onClick={() => setMinutes({ ...minutes, decisions: [...minutes.decisions, ""] })}>Adicionar decisão</Button>
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-[var(--hub-text-secondary)]">Próximos passos</legend>
              {minutes.nextSteps.map((s, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
                  <Input aria-label={`Próximo passo ${i + 1}`} maxLength={1000} disabled={busy} value={s.description} onChange={(e) => setMinutes({ ...minutes, nextSteps: minutes.nextSteps.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) })} />
                  <Input aria-label={`Responsável do passo ${i + 1}`} placeholder="Responsável" maxLength={200} disabled={busy} value={s.owner} onChange={(e) => setMinutes({ ...minutes, nextSteps: minutes.nextSteps.map((x, j) => (j === i ? { ...x, owner: e.target.value } : x)) })} />
                  <Input aria-label={`Prazo do passo ${i + 1}`} type="date" disabled={busy} value={s.dueOn} onChange={(e) => setMinutes({ ...minutes, nextSteps: minutes.nextSteps.map((x, j) => (j === i ? { ...x, dueOn: e.target.value } : x)) })} />
                  <Button size="sm" variant="ghost" disabled={busy} aria-label={`Remover passo ${i + 1}`} onClick={() => setMinutes({ ...minutes, nextSteps: minutes.nextSteps.filter((_, j) => j !== i) })}>Remover</Button>
                </div>
              ))}
              <Button size="sm" variant="secondary" disabled={busy || minutes.nextSteps.length >= 50} onClick={() => setMinutes({ ...minutes, nextSteps: [...minutes.nextSteps, { description: "", owner: "", dueOn: "" }] })}>Adicionar próximo passo</Button>
            </fieldset>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>{minutesVersion === 0 ? "Registrar ata" : "Salvar nova versão"}</Button>
              <Button variant="ghost" disabled={busy} onClick={() => setMinutes(minutesForm(detail.minutes?.data))}>Descartar alterações</Button>
            </div>
          </form>
        ) : detail.minutes && <MinutesReadOnly data={detail.minutes.data} />}

        {detail.minutesVersions.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--hub-text-secondary)]">Versões da ata</p>
            <ul className="space-y-1 text-sm">
              {detail.minutesVersions.map((v) => (
                <li key={v.version} className="flex flex-wrap items-center gap-2">
                  <button type="button" className="underline" onClick={() => run(async () => { setViewVersion(v.version === minutesVersion ? null : await agendaApi.minutesVersion(token, id, v.version)); })}>
                    Versão {v.version}{v.version === minutesVersion ? " (atual)" : ""}
                  </button>
                  <span className="text-xs text-[var(--hub-text-muted)]">{new Date(v.createdAt).toLocaleString("pt-BR", { timeZone: a.timeZone, dateStyle: "short", timeStyle: "short" })} · {v.author}</span>
                </li>
              ))}
            </ul>
            {viewVersion && (
              <div className="mt-2 space-y-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3">
                <div className="flex items-center justify-between"><p className="text-sm font-medium">Versão {viewVersion.version} — somente leitura</p><Button size="sm" variant="ghost" onClick={() => setViewVersion(null)}>Fechar</Button></div>
                <MinutesReadOnly data={viewVersion.data} />
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Histórico</CardTitle>
        <ul className="mt-3 space-y-1.5 text-sm">
          {detail.history.map((h) => (
            <li key={h.id}>
              <span className="text-xs text-[var(--hub-text-muted)]">{new Date(h.createdAt).toLocaleString("pt-BR", { timeZone: a.timeZone, dateStyle: "short", timeStyle: "short" })}</span> · {actionLabel(h.action)}
              {typeof h.detail?.reason === "string" && <span className="text-[var(--hub-text-secondary)]"> — {h.detail.reason}</span>}
              {typeof h.detail?.previousStartsAt === "string" && <span className="text-[var(--hub-text-secondary)]"> — antes: {formatInZone(h.detail.previousStartsAt, a.timeZone)}</span>}
              <span className="text-xs text-[var(--hub-text-muted)]"> · {h.author}</span>
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir compromisso"
        message="Use a exclusão apenas para compromisso cadastrado por engano. Ela fica registrada no histórico. Para desmarcar um atendimento combinado, prefira cancelar."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => { setConfirmDelete(false); void run(async () => { await agendaApi.remove(token, id, a.version); router.push(`/agenda?customerId=${a.customerId}`); }); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function MinutesReadOnly({ data }: { data: Minutes }) {
  return (
    <div className="space-y-2 text-sm">
      {data.participants && <p><span className="text-xs text-[var(--hub-text-muted)]">Participantes:</span> {data.participants}</p>}
      {data.summary && <p className="whitespace-pre-wrap">{data.summary}</p>}
      {data.decisions.length > 0 && <div><p className="text-xs text-[var(--hub-text-muted)]">Decisões</p><ul className="list-disc pl-5">{data.decisions.map((d, i) => <li key={i}>{d}</li>)}</ul></div>}
      {data.nextSteps.length > 0 && <div><p className="text-xs text-[var(--hub-text-muted)]">Próximos passos</p><ul className="list-disc pl-5">{data.nextSteps.map((s, i) => <li key={i}>{s.description}{s.owner ? ` — ${s.owner}` : ""}{s.dueOn ? ` · até ${s.dueOn.split("-").reverse().join("/")}` : ""}</li>)}</ul></div>}
    </div>
  );
}

export default function CompromissoPage() {
  return <Suspense fallback={<p className="text-sm text-[var(--hub-text-muted)]">Carregando compromisso…</p>}><AppointmentPage /></Suspense>;
}
