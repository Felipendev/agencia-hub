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
import { DraftFields, MissingFields } from "@/components/contratos/draft-fields";
import { ContractApiError, UPLOAD_ACCEPT, contractsApi, saveBlob, uploadProblem } from "@/lib/contracts/api";
import {
  PRODUCT_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  actionLabel,
  formFromDetail,
  formatDay,
  formatMoment,
  formatMoney,
  toDraftInput,
  todayInAgencyZone,
  type DraftForm,
} from "@/lib/contracts/format";
import type { ContractDetail, ContractFieldView, DocumentView, ExistingReceivable, TemplateSummary } from "@/lib/contracts/types";

type Confirm = { kind: "delete" } | { kind: "attachment"; id: string; filename: string } | { kind: "unlink"; id: string } | null;

const textareaClass = "w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3 text-sm";

function ContractPage() {
  const { token, user } = useAuth();
  const isOwner = user?.accountKind === "AGENCY_OWNER";
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const params = useSearchParams();
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [form, setForm] = useState<DraftForm | null>(null);
  const [missing, setMissing] = useState<ContractFieldView[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [documentView, setDocumentView] = useState<DocumentView | null>(null);
  const [receivableOptions, setReceivableOptions] = useState<ExistingReceivable[] | null>(null);
  const [selectedReceivable, setSelectedReceivable] = useState("");
  const [sentOn, setSentOn] = useState(todayInAgencyZone());
  const [signedOn, setSignedOn] = useState(todayInAgencyZone());
  const [signNote, setSignNote] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentDescription, setAttachmentDescription] = useState("");
  const [reasonFor, setReasonFor] = useState<"cancel" | "revise" | null>(null);
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(params.get("criado") ? "Rascunho criado. Revise os dados e gere o documento." : "");
  const [loadError, setLoadError] = useState("");

  const apply = useCallback((next: ContractDetail) => {
    setDetail(next);
    setForm(formFromDetail(next));
    setMissing(next.missingFields);
  }, []);

  useEffect(() => {
    if (!token || !id) return;
    let active = true;
    Promise.all([contractsApi.get(token, id), contractsApi.listTemplates(token, true)])
      .then(([data, models]) => { if (active) { apply(data); setTemplates(models); } })
      .catch((e: Error) => { if (active) setLoadError(e.message); });
    return () => { active = false; };
  }, [token, id, apply]);

  useEffect(() => {
    if (!token || !detail || detail.receivables === null || receivableOptions !== null) return;
    contractsApi.receivablesOf(token, detail.contract.customerId).then(setReceivableOptions).catch(() => setReceivableOptions([]));
  }, [token, detail, receivableOptions]);

  /** Executa uma ação e só mostra sucesso após a resposta da API. */
  async function run(action: () => Promise<string | void>) {
    setBusy(true); setError(""); setNotice("");
    try {
      const message = await action();
      if (message) setNotice(message);
    } catch (e) {
      if (e instanceof ContractApiError && e.missingFields.length) setMissing(e.missingFields);
      setError(e instanceof Error ? e.message : "Não foi possível concluir a ação.");
    } finally {
      setBusy(false);
    }
  }

  if (loadError) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{loadError}</p>;
  if (!detail || !form) return <p className="text-sm text-[var(--hub-text-muted)]">Carregando contrato…</p>;

  const c = detail.contract;
  const version = c.rowVersion;
  const isDraft = c.status === "DRAFT";
  const linkedIds = new Set((detail.receivables ?? []).map((r) => r.receivableId));
  const available = (receivableOptions ?? []).filter((r) => !linkedIds.has(r.id));
  const evidenceAttachment = detail.attachments.find((a) => a.kind === "SIGNED_EVIDENCE");
  const activeTemplates = templates.filter((t) => t.product === c.product && (!t.archived || t.id === form.templateId));
  const dirty = isDraft && JSON.stringify(form) !== JSON.stringify(formFromDetail(detail));

  const save = () => run(async () => {
    const next = await contractsApi.update(token, id, toDraftInput(c.customerId, c.product, form, version));
    apply(next); setPreview(null);
    return next.contract.rowVersion === version ? "Nenhuma alteração para salvar." : "Rascunho salvo.";
  });

  const generate = () => run(async () => {
    const doc = await contractsApi.generate(token, id, version);
    apply(await contractsApi.get(token, id));
    return doc.version === c.latestDocumentVersion
      ? `O documento v${doc.version} já corresponde aos dados atuais.`
      : `Documento v${doc.version} gerado. Ele preserva os dados e a versão do modelo usados agora.`;
  });

  const showPreview = () => run(async () => {
    const data = await contractsApi.preview(token, id);
    setPreview(data.content); setMissing(data.missingFields);
  });

  const openDocument = (v: number) => run(async () => { setDocumentView(await contractsApi.document(token, id, v)); });
  const downloadPdf = (v: number) => run(async () => { saveBlob(await contractsApi.documentPdf(token, id, v), `contrato-v${v}.pdf`); });

  const send = () => run(async () => {
    apply(await contractsApi.send(token, id, version, sentOn));
    return "Contrato marcado como enviado. Para alterar, inicie uma revisão.";
  });

  const sign = () => run(async () => {
    const problem = uploadProblem(evidence);
    if (problem) throw new Error(problem);
    apply(await contractsApi.sign(token, id, { expectedVersion: version, signedOn, note: signNote, file: evidence! }));
    setEvidence(null); setSignNote("");
    return "Assinatura registrada com a evidência anexada.";
  });

  const submitReason = () => run(async () => {
    if (!reason.trim()) throw new Error("Informe o motivo.");
    const next = reasonFor === "cancel"
      ? await contractsApi.cancel(token, id, version, reason)
      : await contractsApi.revise(token, id, version, reason);
    apply(next); setReasonFor(null); setReason("");
    return reasonFor === "cancel" ? "Contrato cancelado. Documentos e anexos permanecem no histórico." : "Revisão iniciada. Edite o rascunho e gere uma nova versão do documento.";
  });

  const addAttachment = () => run(async () => {
    const problem = uploadProblem(attachment);
    if (problem) throw new Error(problem);
    await contractsApi.addAttachment(token, id, attachment!, attachmentDescription);
    apply(await contractsApi.get(token, id));
    setAttachment(null); setAttachmentDescription("");
    return "Anexo adicionado.";
  });

  const link = () => run(async () => {
    if (!selectedReceivable) throw new Error("Escolha um recebível.");
    apply(await contractsApi.linkReceivable(token, id, selectedReceivable));
    setSelectedReceivable("");
    return "Recebível vinculado. Nenhum lançamento financeiro foi criado ou alterado.";
  });

  const onConfirm = () => {
    const current = confirm;
    setConfirm(null);
    if (!current) return;
    if (current.kind === "delete") {
      void run(async () => { await contractsApi.remove(token, id, version); router.push("/contratos"); });
    } else if (current.kind === "attachment") {
      void run(async () => { await contractsApi.deleteAttachment(token, id, current.id); apply(await contractsApi.get(token, id)); return "Anexo excluído."; });
    } else {
      void run(async () => { apply(await contractsApi.unlinkReceivable(token, id, current.id)); return "Vínculo removido."; });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={c.title} description={`${c.customerName} · ${c.templateName} (modelo v${c.templateVersion})`}>
        <Badge tone="muted">{PRODUCT_LABEL[c.product]}</Badge>
        <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
        <Link href={`/contratos?customerId=${c.customerId}&product=${c.product}`} className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--hub-bg-subtle)]">Contratos da pessoa</Link>
      </PageHeader>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      <Card className="space-y-3">
        <CardTitle>Situação</CardTitle>
        {isDraft && (
          <CardDescription>
            Rascunho editável. Gerar o documento grava um retrato imutável dos dados e da versão do modelo; mudanças posteriores no cadastro não alteram documentos já gerados.
            {c.latestDocumentVersion && !c.documentCurrent && " O rascunho foi alterado depois do último documento: gere uma nova versão antes de enviar."}
          </CardDescription>
        )}
        {c.status === "SENT" && <CardDescription>Enviado em {formatDay(detail.sentOn)} (documento v{c.latestDocumentVersion}). Para registrar a assinatura, anexe o documento assinado ou outra evidência. Não há assinatura eletrônica integrada.</CardDescription>}
        {c.status === "SIGNED" && <CardDescription>Assinatura registrada em {formatDay(detail.signedOn)} com evidência anexada{evidenceAttachment ? ` (${evidenceAttachment.filename})` : ""}. Contratos assinados não são editados nem excluídos; use o cancelamento se necessário.</CardDescription>}
        {c.status === "CANCELLED" && <CardDescription>Cancelado em {formatMoment(detail.cancelledAt)}. Motivo: {detail.cancelReason}. O histórico, os documentos e os anexos foram preservados.</CardDescription>}

        <div className="flex flex-wrap items-end gap-3">
          {isDraft && (
            <>
              <Button onClick={generate} disabled={busy || dirty || missing.length > 0}>Gerar documento</Button>
              {dirty && <span className="text-xs text-amber-700">Salve o rascunho antes de gerar ou enviar.</span>}
              {c.documentCurrent && !dirty && (
                <div className="flex items-end gap-2">
                  <div><Label htmlFor="sent-on">Data de envio</Label><Input id="sent-on" type="date" max={todayInAgencyZone()} value={sentOn} onChange={(e) => setSentOn(e.target.value)} /></div>
                  <Button variant="secondary" onClick={send} disabled={busy || !sentOn}>Marcar como enviado</Button>
                </div>
              )}
              {!c.latestDocumentVersion && <Button variant="secondary" onClick={() => setConfirm({ kind: "delete" })} disabled={busy}>Excluir rascunho</Button>}
            </>
          )}
          {c.status === "SENT" && <Button variant="secondary" onClick={() => { setReasonFor("revise"); setReason(""); }} disabled={busy}>Iniciar revisão</Button>}
          {c.status !== "CANCELLED" && (isDraft || isOwner) && (
            <Button variant="danger" onClick={() => { setReasonFor("cancel"); setReason(""); }} disabled={busy}>Cancelar contrato</Button>
          )}
        </div>
        {isDraft && c.latestDocumentVersion && <p className="text-xs text-[var(--hub-text-muted)]">Rascunhos com documento gerado não são excluídos; use o cancelamento para preservar o documento.</p>}
        {!isDraft && c.status !== "CANCELLED" && !isOwner && <p className="text-xs text-[var(--hub-text-muted)]">Somente o gestor cancela contratos enviados ou assinados.</p>}

        {reasonFor && (
          <div className="space-y-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3">
            <Label htmlFor="reason" required>{reasonFor === "cancel" ? "Motivo do cancelamento" : "Motivo da revisão"}</Label>
            <textarea id="reason" rows={2} maxLength={1000} className={textareaClass} value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-2">
              <Button variant={reasonFor === "cancel" ? "danger" : "primary"} onClick={submitReason} disabled={busy || !reason.trim()}>
                {reasonFor === "cancel" ? "Confirmar cancelamento" : "Reabrir como rascunho"}
              </Button>
              <Button variant="secondary" onClick={() => setReasonFor(null)} disabled={busy}>Voltar</Button>
            </div>
          </div>
        )}

        {c.status === "SENT" && (
          <div className="grid gap-3 rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3 md:grid-cols-3">
            <div><Label htmlFor="signed-on" required>Data da assinatura</Label><Input id="signed-on" type="date" min={detail.sentOn ?? undefined} max={todayInAgencyZone()} value={signedOn} onChange={(e) => setSignedOn(e.target.value)} /></div>
            <div><Label htmlFor="evidence" required>Evidência (PDF, imagem ou Word, até 5 MB)</Label><Input id="evidence" type="file" accept={UPLOAD_ACCEPT} onChange={(e) => setEvidence(e.target.files?.[0] ?? null)} /></div>
            <div><Label htmlFor="sign-note">Observação</Label><Input id="sign-note" maxLength={1000} placeholder="Ex.: assinado em papel na agência" value={signNote} onChange={(e) => setSignNote(e.target.value)} /></div>
            <div className="md:col-span-3"><Button onClick={sign} disabled={busy || !evidence || !signedOn}>Registrar assinatura</Button></div>
          </div>
        )}
      </Card>

      {isDraft && (
        <Card className="space-y-4">
          <CardTitle>Dados do rascunho</CardTitle>
          <MissingFields missing={missing} customerId={c.customerId} />
          <DraftFields form={form} onChange={setForm} templates={activeTemplates} missing={missing} disabled={busy} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={busy}>Salvar rascunho</Button>
            <Button variant="secondary" onClick={showPreview} disabled={busy}>Revisar texto com os dados atuais</Button>
            <Button variant="ghost" onClick={() => setForm(formFromDetail(detail))} disabled={busy}>Descartar alterações</Button>
          </div>
          {preview !== null && (
            <div>
              <p className="mb-1 text-xs text-[var(--hub-text-muted)]">Pré-visualização (não é um documento emitido). Campos pendentes aparecem entre colchetes.</p>
              <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-[var(--hub-radius)] bg-[var(--hub-bg-subtle)] p-4 text-sm">{preview}</pre>
            </div>
          )}
        </Card>
      )}

      {!isDraft && (
        <Card>
          <CardTitle>Termos</CardTitle>
          <dl className="mt-3 grid gap-3 text-sm md:grid-cols-3">
            <div><dt className="text-xs text-[var(--hub-text-muted)]">Plano</dt><dd>{c.planName ?? "—"}</dd></div>
            <div><dt className="text-xs text-[var(--hub-text-muted)]">Valor</dt><dd>{formatMoney(c.price)}</dd></div>
            <div><dt className="text-xs text-[var(--hub-text-muted)]">Vigência</dt><dd>{formatDay(c.startDate)}{c.endDate ? ` a ${formatDay(c.endDate)}` : ""}</dd></div>
          </dl>
        </Card>
      )}

      <Card className="space-y-3">
        <CardTitle>Documentos emitidos</CardTitle>
        {detail.documents.length === 0 && <CardDescription>Nenhum documento gerado ainda.</CardDescription>}
        <ul className="space-y-2 text-sm">
          {detail.documents.map((d) => (
            <li key={d.version} className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Versão {d.version}</span>
              <span className="text-xs text-[var(--hub-text-muted)]">modelo v{d.templateVersion} · {formatMoment(d.createdAt)} · {d.author} · SHA-256 {d.contentSha256.slice(0, 12)}…</span>
              <Button size="sm" variant="secondary" onClick={() => openDocument(d.version)} disabled={busy}>Ver texto</Button>
              <Button size="sm" variant="secondary" onClick={() => downloadPdf(d.version)} disabled={busy}>Baixar PDF</Button>
            </li>
          ))}
        </ul>
        {documentView && (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs text-[var(--hub-text-muted)]">Documento v{documentView.document.version} — conteúdo preservado na emissão.</p>
              <Button size="sm" variant="ghost" onClick={() => setDocumentView(null)}>Fechar</Button>
            </div>
            <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-[var(--hub-radius)] bg-[var(--hub-bg-subtle)] p-4 text-sm">{documentView.renderedContent}</pre>
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <CardTitle>Anexos</CardTitle>
        {detail.attachments.length === 0 && <CardDescription>Nenhum anexo.</CardDescription>}
        <ul className="space-y-2 text-sm">
          {detail.attachments.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2">
              {a.kind === "SIGNED_EVIDENCE" && <Badge tone="success">Evidência de assinatura</Badge>}
              <span className="font-medium">{a.filename}</span>
              <span className="text-xs text-[var(--hub-text-muted)]">{a.description ? `${a.description} · ` : ""}{formatMoment(a.createdAt)} · {a.author}</span>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(async () => { saveBlob(await contractsApi.attachment(token, id, a.id), a.filename); })}>Baixar</Button>
              {a.kind === "SUPPORTING" && c.status !== "CANCELLED" && (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirm({ kind: "attachment", id: a.id, filename: a.filename })}>Excluir</Button>
              )}
            </li>
          ))}
        </ul>
        {c.status !== "CANCELLED" && (
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label htmlFor="attachment">Arquivo (até 5 MB)</Label><Input id="attachment" type="file" accept={UPLOAD_ACCEPT} onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} /></div>
            <div><Label htmlFor="attachment-description">Descrição</Label><Input id="attachment-description" maxLength={1000} value={attachmentDescription} onChange={(e) => setAttachmentDescription(e.target.value)} /></div>
            <div className="flex items-end"><Button variant="secondary" onClick={addAttachment} disabled={busy || !attachment}>Adicionar anexo</Button></div>
          </div>
        )}
      </Card>

      {detail.receivables !== null && (
        <Card className="space-y-3">
          <CardTitle>Recebíveis vinculados</CardTitle>
          <CardDescription>Vínculo opcional com recebíveis que já existem no financeiro. O contrato nunca cria venda, receita ou cobrança.</CardDescription>
          {detail.receivables.length === 0 && <p className="text-sm text-[var(--hub-text-muted)]">Nenhum recebível vinculado.</p>}
          <ul className="space-y-2 text-sm">
            {detail.receivables.map((r) => (
              <li key={r.receivableId} className="flex flex-wrap items-center gap-2">
                <span>Parcela {r.installmentNumber} · {formatMoney(r.amount)} · vence {formatDay(r.dueDate)} · {r.status === "PAID" ? "quitado" : "pendente"}</span>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirm({ kind: "unlink", id: r.receivableId })}>Desvincular</Button>
              </li>
            ))}
          </ul>
          {c.status !== "CANCELLED" && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[280px]">
                <Label htmlFor="receivable">Recebível existente da pessoa</Label>
                <select id="receivable" className="h-10 w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm" value={selectedReceivable} onChange={(e) => setSelectedReceivable(e.target.value)}>
                  <option value="">{receivableOptions === null ? "Carregando…" : available.length ? "Escolha um recebível" : "Nenhum recebível disponível"}</option>
                  {available.map((r) => <option key={r.id} value={r.id}>Parcela {r.installmentNumber}/{r.installmentsTotal} · {formatMoney(r.amount)} · vence {formatDay(r.dueDate)}</option>)}
                </select>
              </div>
              <Button variant="secondary" onClick={link} disabled={busy || !selectedReceivable}>Vincular</Button>
            </div>
          )}
        </Card>
      )}

      <Card>
        <CardTitle>Histórico</CardTitle>
        <ul className="mt-3 space-y-1.5 text-sm">
          {detail.history.map((h) => (
            <li key={h.id}>
              <span className="text-xs text-[var(--hub-text-muted)]">{formatMoment(h.createdAt)}</span> · {actionLabel(h.action)}
              {typeof h.detail?.reason === "string" && <span className="text-[var(--hub-text-secondary)]"> — {h.detail.reason}</span>}
              <span className="text-xs text-[var(--hub-text-muted)]"> · {h.author}</span>
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "delete" ? "Excluir rascunho" : confirm?.kind === "attachment" ? "Excluir anexo" : "Desvincular recebível"}
        message={confirm?.kind === "delete" ? "O rascunho será excluído definitivamente. Esta ação fica registrada no histórico."
          : confirm?.kind === "attachment" ? `Excluir “${confirm.filename}”?`
          : "O recebível continuará no financeiro; apenas o vínculo com este contrato será removido."}
        confirmLabel={confirm?.kind === "unlink" ? "Desvincular" : "Excluir"}
        destructive
        onConfirm={onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

export default function ContratoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--hub-text-muted)]">Carregando contrato…</p>}>
      <ContractPage />
    </Suspense>
  );
}
