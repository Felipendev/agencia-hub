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
import { ReferralFields, type Option } from "@/components/referrals/referral-form";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import { AGENCY_ZONE, todayIn } from "@/lib/agenda/time";
import { referralsApi } from "@/lib/referrals/api";
import {
  CHANNEL_LABEL, PRODUCT_LABEL, STATUS_ACTION, STATUS_LABEL, STATUS_TONE, actionLabel, brDate, needsReason, nextStatuses, referredLabel, toInput,
  type ReferralForm,
} from "@/lib/referrals/format";
import type { Detail, Member, Referral, Status } from "@/lib/referrals/types";

const area = "w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3 text-sm";
const select = "h-10 w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm";
const muted = "text-xs text-[var(--hub-text-muted)]";

function formFromReferral(r: Referral): ReferralForm {
  return {
    product: r.product, referrerId: r.referrerId, mode: r.referredCustomerId ? "crm" : "contact", referredCustomerId: r.referredCustomerId ?? "",
    referredName: r.referredName ?? "", referredPhone: r.referredPhone ?? "", referredEmail: r.referredEmail ?? "", referredOn: r.referredOn,
    channel: r.channel, channelDetail: r.channelDetail ?? "", responsibleId: r.responsibleId ?? "", notes: r.notes ?? "",
  };
}

const STATUS_NOTICE: Record<Status, string> = {
  RECEIVED: "Indicação reativada.", CONTACTED: "Indicação em contato.", CONVERTED: "Indicação marcada como convertida.",
  NOT_CONVERTED: "Indicação marcada como não convertida.", CANCELLED: "Indicação cancelada. O registro e o histórico foram preservados.",
};

function ReferralPage() {
  const { token } = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const params = useSearchParams();
  const today = todayIn();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [form, setForm] = useState<ReferralForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [people, setPeople] = useState<Option[] | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [target, setTarget] = useState<Status | null>(null);
  const [reason, setReason] = useState("");
  const [convertedOn, setConvertedOn] = useState(today);
  const [saleId, setSaleId] = useState("");
  const [sales, setSales] = useState<{ customerId: string; options: Option[] }>({ customerId: "", options: [] });
  const [linkTo, setLinkTo] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(params.get("criada") ? "Indicação registrada." : "");
  const [loadError, setLoadError] = useState("");

  const apply = useCallback((next: Detail) => { setDetail(next); setForm(formFromReferral(next.referral)); }, []);

  useEffect(() => {
    if (!token || !id) return;
    let active = true;
    referralsApi.get(token, id).then((d) => { if (active) apply(d); }).catch((e: Error) => { if (active) setLoadError(e.message); });
    listCustomersRemote(token)
      .then((rows) => { if (active) setPeople(rows.map((c) => ({ id: c.id, label: c.telefone ? `${c.nome} · ${c.telefone}` : c.email ? `${c.nome} · ${c.email}` : c.nome }))); })
      .catch(() => { if (active) setPeople([]); });
    referralsApi.members(token).then((m) => { if (active) setMembers(m); }).catch(() => undefined);
    return () => { active = false; };
  }, [token, id, apply]);

  const referredCustomerId = detail?.referral.referredCustomerId ?? "";
  const travel = detail?.referral.product === "TRAVEL";
  useEffect(() => {
    if (!token || !referredCustomerId || !travel || target !== "CONVERTED") return;
    referralsApi.salesOf(token, referredCustomerId)
      .then((rows) => setSales({ customerId: referredCustomerId, options: rows.map((s) => ({ id: s.id, label: `${brDate(s.saleDate) || "Sem data"}${s.totalAmount != null ? ` · ${s.totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : ""}` })) }))
      .catch(() => setSales({ customerId: referredCustomerId, options: [] }));
  }, [token, referredCustomerId, travel, target]);

  async function run(action: () => Promise<string | void>) {
    setBusy(true); setError(""); setNotice("");
    try { const message = await action(); if (message) setNotice(message); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível concluir a ação."); }
    finally { setBusy(false); }
  }

  if (loadError) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{loadError}</p>;
  if (!detail || !form) return <p className="text-sm text-[var(--hub-text-muted)]">Carregando indicação…</p>;

  const r = detail.referral;
  const cancelled = r.status === "CANCELLED";
  const reasonRequired = target ? needsReason(r.status, target) : false;
  const canSubmitStatus = target && (!reasonRequired || reason.trim()) && (target !== "CONVERTED" || convertedOn);

  const openStatus = (to: Status) => { setTarget(to); setReason(""); setConvertedOn(today); setSaleId(""); setError(""); setNotice(""); };

  const changeStatus = () => run(async () => {
    if (!target) return;
    const next = await referralsApi.status(token, id, { status: target, reason, convertedOn: target === "CONVERTED" ? convertedOn : undefined, saleId: target === "CONVERTED" ? saleId : undefined }, r.version);
    apply(next);
    const done = target;
    setTarget(null);
    return STATUS_NOTICE[done];
  });

  const createAndLink = () => run(async () => {
    const person = await referralsApi.createPerson(token, { name: r.referredName ?? "", phone: r.referredPhone, email: r.referredEmail });
    setPeople((rows) => [...(rows ?? []), { id: person.id, label: person.name }]);
    try {
      apply(await referralsApi.linkReferred(token, id, person.id, r.version));
    } catch (e) {
      throw new Error(`A pessoa foi cadastrada em Pessoas, mas não foi vinculada: ${e instanceof Error ? e.message : "tente vincular novamente."}`);
    }
    return "Pessoa cadastrada como prospecto e vinculada à indicação.";
  });

  return (
    <div className="space-y-6">
      <PageHeader title={`${r.referrerName} → ${referredLabel(r)}`} description={`Indicação de ${brDate(r.referredOn)} · ${CHANNEL_LABEL[r.channel]}${r.channelDetail ? ` · ${r.channelDetail}` : ""}`}>
        <Badge tone="muted">{PRODUCT_LABEL[r.product]}</Badge>
        <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
        <Link href={`/indicacoes?product=${r.product}`} className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--hub-bg-subtle)]">Indicações</Link>
      </PageHeader>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {detail.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Atenção: o contato informado coincide com</p>
          <ul className="mt-1 list-disc pl-5">
            {detail.warnings.map((w) => (
              <li key={`${w.kind}-${w.id}`}>
                {w.kind === "CUSTOMER" ? <>a pessoa cadastrada <Link href={`/clientes/${w.id}`} className="underline">{w.label}</Link>. Considere vincular a indicação a ela.</> : <>outra indicação ativa: <Link href={`/indicacoes/${w.id}`} className="underline">{w.label}</Link>.</>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card className="space-y-4">
        <div>
          <CardTitle>Indicação</CardTitle>
          <CardDescription>
            {cancelled ? `Cancelada: ${r.statusReason}. Reative para editar.` : r.statusReason ? `${STATUS_LABEL[r.status]} — ${r.statusReason}` : "Créditos de indicação ainda não são controlados pelo sistema."}
          </CardDescription>
        </div>

        {editing ? (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void run(async () => {
            const next = await referralsApi.update(token, id, toInput(form, today, r.version));
            const changed = next.referral.version !== r.version;
            apply(next); setEditing(false);
            return changed ? "Indicação atualizada." : "Nenhuma alteração para salvar.";
          }); }}>
            <ReferralFields form={form} onChange={setForm} people={people} members={members} editing referredLinked={Boolean(r.referredCustomerId)} disabled={busy} today={today} />
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>Salvar alterações</Button>
              <Button variant="secondary" disabled={busy} onClick={() => { setForm(formFromReferral(r)); setEditing(false); }}>Cancelar edição</Button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-3 text-sm md:grid-cols-3">
            <div><dt className={muted}>Quem indicou</dt><dd><Link href={`/clientes/${r.referrerId}`} className="underline">{r.referrerName}</Link></dd></div>
            <div>
              <dt className={muted}>Pessoa indicada</dt>
              <dd>{r.referredCustomerId ? <Link href={`/clientes/${r.referredCustomerId}`} className="underline">{r.referredCustomerName}</Link> : <>{r.referredName} <span className={muted}>(ainda não cadastrada)</span></>}</dd>
            </div>
            {!r.referredCustomerId && <div><dt className={muted}>Contato</dt><dd>{[r.referredPhone, r.referredEmail].filter(Boolean).join(" · ")}</dd></div>}
            <div><dt className={muted}>Responsável</dt><dd>{r.responsibleName ?? "Sem responsável"}</dd></div>
            {r.convertedOn && <div><dt className={muted}>Convertida em</dt><dd>{brDate(r.convertedOn)}{r.saleId ? <> · <Link href="/vendas" className="underline">venda vinculada</Link></> : null}</dd></div>}
            {r.notes && <div className="md:col-span-3"><dt className={muted}>Observações</dt><dd className="whitespace-pre-wrap">{r.notes}</dd></div>}
          </dl>
        )}

        {!editing && (
          <div className="flex flex-wrap gap-2">
            {!cancelled && <Button variant="secondary" disabled={busy} onClick={() => setEditing(true)}>Editar</Button>}
            {nextStatuses(r.status).map((s) => (
              <Button key={s} variant={s === "CANCELLED" ? "danger" : s === "CONVERTED" ? "primary" : "secondary"} disabled={busy} onClick={() => openStatus(s)}>
                {r.status !== "RECEIVED" && s === "CONTACTED" ? "Reabrir" : STATUS_ACTION[s]}
              </Button>
            ))}
            {!r.everConverted && <Button variant="ghost" disabled={busy} onClick={() => setConfirmDelete(true)}>Excluir</Button>}
          </div>
        )}
        {r.everConverted && <p className={muted}>Indicações que já foram convertidas não são excluídas, para preservar a base de créditos futuros. Use o cancelamento.</p>}

        {target && (
          <div className="space-y-3 rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3">
            <p className="text-sm font-medium">{r.status !== "RECEIVED" && target === "CONTACTED" ? "Reabrir indicação" : STATUS_ACTION[target]}</p>
            {target === "CONVERTED" && !r.referredCustomerId && (
              <p className="text-sm text-amber-900">Vincule a pessoa indicada a um cadastro (abaixo) antes de marcar como convertida.</p>
            )}
            {target === "CONVERTED" && (
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label htmlFor="s-converted" required>Data da conversão</Label><Input id="s-converted" type="date" min={r.referredOn} max={today} value={convertedOn} onChange={(e) => setConvertedOn(e.target.value)} /></div>
                {travel && (
                  <div>
                    <Label htmlFor="s-sale">Venda da pessoa indicada (opcional)</Label>
                    <select id="s-sale" className={select} value={saleId} disabled={!r.referredCustomerId} onChange={(e) => setSaleId(e.target.value)}>
                      <option value="">Nenhuma</option>
                      {(sales.customerId === referredCustomerId ? sales.options : []).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}
            {(reasonRequired || target === "CONVERTED") && (
              <div>
                <Label htmlFor="s-reason" required={reasonRequired}>{target === "CANCELLED" ? "Motivo do cancelamento" : target === "NOT_CONVERTED" ? "Por que não converteu" : target === "RECEIVED" ? "Motivo para reativar" : target === "CONVERTED" ? "Observação" : "Motivo para reabrir"}</Label>
                <textarea id="s-reason" rows={2} maxLength={1000} className={area} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            )}
            <div className="flex gap-2">
              <Button variant={target === "CANCELLED" ? "danger" : "primary"} disabled={busy || !canSubmitStatus || (target === "CONVERTED" && !r.referredCustomerId)} onClick={changeStatus}>Confirmar</Button>
              <Button variant="secondary" disabled={busy} onClick={() => setTarget(null)}>Voltar</Button>
            </div>
          </div>
        )}
      </Card>

      {!r.referredCustomerId && !cancelled && (
        <Card className="space-y-3">
          <CardTitle>Vincular a pessoa indicada ao cadastro</CardTitle>
          <CardDescription>Necessário para marcar como convertida. O cadastro em Pessoas não é alterado; o contato digitado continua no histórico da indicação.</CardDescription>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[240px] flex-1">
              <Label htmlFor="link-person">Pessoa já cadastrada</Label>
              <select id="link-person" className={select} disabled={busy} value={linkTo} onChange={(e) => setLinkTo(e.target.value)}>
                <option value="">{people === null ? "Carregando pessoas…" : "Escolha a pessoa"}</option>
                {(people ?? []).filter((p) => p.id !== r.referrerId).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <Button variant="secondary" disabled={busy || !linkTo} onClick={() => run(async () => { apply(await referralsApi.linkReferred(token, id, linkTo, r.version)); setLinkTo(""); return "Pessoa indicada vinculada ao cadastro."; })}>Vincular</Button>
            <Button variant="ghost" disabled={busy} onClick={createAndLink}>Cadastrar “{r.referredName}” como prospecto</Button>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Histórico</CardTitle>
        <ul className="mt-3 space-y-1.5 text-sm">
          {detail.history.map((h) => (
            <li key={h.id}>
              <span className={muted}>{new Date(h.createdAt).toLocaleString("pt-BR", { timeZone: AGENCY_ZONE, dateStyle: "short", timeStyle: "short" })}</span> · {actionLabel(h.action)}
              {typeof h.detail?.reason === "string" && h.detail.reason && <span className="text-[var(--hub-text-secondary)]"> — {h.detail.reason}</span>}
              <span className={muted}> · {h.author}</span>
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir indicação"
        message="Use a exclusão apenas para indicação registrada por engano. Ela fica registrada no histórico. As pessoas envolvidas não são alteradas."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => { setConfirmDelete(false); void run(async () => { await referralsApi.remove(token, id, r.version); router.push(`/indicacoes?product=${r.product}`); }); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

export default function IndicacaoPage() {
  return <Suspense fallback={<p className="text-sm text-[var(--hub-text-muted)]">Carregando indicação…</p>}><ReferralPage /></Suspense>;
}
