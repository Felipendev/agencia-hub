"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contractsApi } from "@/lib/contracts/api";
import { SOURCE_LABEL, actionLabel, formatMoment } from "@/lib/contracts/format";
import type { ContractFieldView, TemplateDetail, TemplateSummary } from "@/lib/contracts/types";

type Form = { name: string; description: string; body: string };
const empty: Form = { name: "", description: "", body: "" };

export default function ContractTemplatesPage() {
  const { token, user } = useAuth();
  const canEdit = user?.accountKind === "AGENCY_OWNER";
  const [templates, setTemplates] = useState<TemplateSummary[] | null>(null);
  const [fields, setFields] = useState<ContractFieldView[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState<TemplateDetail | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [editing, setEditing] = useState(false);
  const [viewVersion, setViewVersion] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([contractsApi.listTemplates(token, showArchived), contractsApi.fields(token)])
      .then(([rows, catalog]) => { if (active) { setTemplates(rows); setFields(catalog); } })
      .catch((e: Error) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [token, showArchived]);

  function upsertSummary(detail: TemplateDetail) {
    setTemplates((rows) => {
      const others = (rows ?? []).filter((row) => row.id !== detail.template.id);
      return detail.template.archived && !showArchived ? others : [...others, detail.template].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    });
  }

  async function open(id: string) {
    setError(""); setNotice(""); setViewVersion(null);
    try {
      const detail = await contractsApi.getTemplate(token, id);
      setSelected(detail); setEditing(false); setForm({ name: detail.template.name, description: detail.template.description ?? "", body: detail.body });
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível abrir o modelo."); }
  }

  function startNew() {
    setSelected(null); setForm(empty); setEditing(true); setNotice(""); setError(""); setViewVersion(null);
  }

  function insertField(key: string) {
    const placeholder = `{{${key}}}`;
    const area = bodyRef.current;
    if (!area) { setForm((f) => ({ ...f, body: f.body + placeholder })); return; }
    const start = area.selectionStart ?? form.body.length;
    const end = area.selectionEnd ?? form.body.length;
    const body = form.body.slice(0, start) + placeholder + form.body.slice(end);
    setForm((f) => ({ ...f, body }));
    requestAnimationFrame(() => { area.focus(); area.setSelectionRange(start + placeholder.length, start + placeholder.length); });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const input = { name: form.name, description: form.description, body: form.body };
      const detail = selected
        ? await contractsApi.updateTemplate(token, selected.template.id, { ...input, expectedVersion: selected.template.rowVersion })
        : await contractsApi.createTemplate(token, input);
      const versioned = selected && detail.template.currentVersion > selected.template.currentVersion;
      setSelected(detail); setEditing(false); upsertSummary(detail);
      setNotice(!selected ? "Modelo criado." : versioned
        ? `Conteúdo salvo como versão ${detail.template.currentVersion}. Contratos já emitidos continuam com a versão usada na geração.`
        : "Modelo atualizado.");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar o modelo."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!selected) return;
    setConfirmDelete(false); setBusy(true); setError(""); setNotice("");
    try {
      const outcome = await contractsApi.deleteTemplate(token, selected.template.id, selected.template.rowVersion);
      if (outcome.outcome === "DELETED") {
        setTemplates((rows) => (rows ?? []).filter((row) => row.id !== selected.template.id));
        setSelected(null); setForm(empty);
      } else {
        const detail = await contractsApi.getTemplate(token, selected.template.id);
        setSelected(detail); upsertSummary(detail);
      }
      setNotice(outcome.message);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível excluir o modelo."); }
    finally { setBusy(false); }
  }

  async function restore() {
    if (!selected) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const detail = await contractsApi.restoreTemplate(token, selected.template.id, selected.template.rowVersion);
      setSelected(detail); upsertSummary(detail); setNotice("Modelo reativado.");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível reativar o modelo."); }
    finally { setBusy(false); }
  }

  const shownVersion = selected && viewVersion ? selected.versions.find((v) => v.version === viewVersion) : null;
  const sources = ["CUSTOMER", "AGENCY", "CONTRACT"] as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Modelos de contrato" description="O texto é fornecido pela agência. O AgênciaHub apenas preenche os campos marcados com {{ }}.">
        <Link href="/contratos" className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--hub-bg-subtle)]">Voltar aos contratos</Link>
        {canEdit && <Button onClick={startNew} disabled={busy}>Novo modelo</Button>}
      </PageHeader>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {!canEdit && <p className="text-sm text-[var(--hub-text-muted)]">Somente o gestor da agência cria e altera modelos. Você pode consultá-los e usá-los em rascunhos.</p>}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card padding="p-4" className="space-y-3 self-start">
          <div className="flex items-center justify-between">
            <CardTitle>Modelos da agência</CardTitle>
            <label className="flex items-center gap-1.5 text-xs text-[var(--hub-text-secondary)]">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Arquivados
            </label>
          </div>
          {templates === null && !error && <p className="text-sm text-[var(--hub-text-muted)]">Carregando…</p>}
          {templates?.length === 0 && <p className="text-sm text-[var(--hub-text-muted)]">Nenhum modelo cadastrado.</p>}
          <ul className="space-y-1">
            {templates?.map((row) => (
              <li key={row.id}>
                <button type="button" onClick={() => open(row.id)}
                  className={`w-full rounded-[var(--hub-radius)] px-3 py-2 text-left text-sm hover:bg-[var(--hub-bg-subtle)] ${selected?.template.id === row.id ? "bg-[var(--hub-bg-subtle)]" : ""}`}>
                  <span className="font-medium">{row.name}</span>
                  <span className="block text-xs text-[var(--hub-text-muted)]">v{row.currentVersion} · {row.contractCount} contrato(s){row.archived ? " · arquivado" : ""}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          {(editing || selected) && (
            <Card className="space-y-4">
              {editing ? (
                <form onSubmit={save} className="space-y-4">
                  <CardTitle>{selected ? "Editar modelo" : "Novo modelo"}</CardTitle>
                  {selected && <CardDescription>Alterar o conteúdo cria a versão {selected.template.currentVersion + 1}; as versões anteriores e os documentos emitidos não mudam.</CardDescription>}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><Label htmlFor="template-name" required>Nome</Label><Input id="template-name" required maxLength={200} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                    <div><Label htmlFor="template-description">Descrição</Label><Input id="template-description" maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                  </div>
                  <div>
                    <Label htmlFor="template-body" required>Conteúdo do contrato</Label>
                    <textarea id="template-body" ref={bodyRef} required maxLength={100000} rows={18} value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      className="w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3 font-mono text-sm" />
                    <p className="mt-1 text-xs text-[var(--hub-text-muted)]">Cole o texto da agência e insira os campos abaixo. Campos fora da lista são recusados ao salvar.</p>
                  </div>
                  <div className="space-y-2">
                    {sources.map((source) => (
                      <div key={source}>
                        <p className="mb-1 text-xs font-medium text-[var(--hub-text-secondary)]">{SOURCE_LABEL[source]}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {fields.filter((f) => f.source === source).map((f) => (
                            <button key={f.key} type="button" onClick={() => insertField(f.key)} title={`Inserir {{${f.key}}}`}
                              className="rounded-full border border-[var(--hub-border)] px-2.5 py-1 text-xs hover:bg-[var(--hub-bg-subtle)]">{f.label}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={busy}>{busy ? "Salvando…" : selected ? "Salvar alterações" : "Criar modelo"}</Button>
                    <Button variant="secondary" disabled={busy} onClick={() => { setEditing(false); if (selected) setForm({ name: selected.template.name, description: selected.template.description ?? "", body: selected.body }); }}>Cancelar</Button>
                  </div>
                </form>
              ) : selected && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{selected.template.name}</CardTitle>
                      <CardDescription>{selected.template.description || "Sem descrição"} · versão atual {selected.template.currentVersion}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selected.template.archived ? <Badge tone="muted">Arquivado</Badge> : <Badge tone="success">Ativo</Badge>}
                      {canEdit && !selected.template.archived && <Button variant="secondary" size="sm" disabled={busy} onClick={() => setEditing(true)}>Editar</Button>}
                      {canEdit && !selected.template.archived && <Button variant="secondary" size="sm" disabled={busy} onClick={() => setConfirmDelete(true)}>{selected.template.contractCount > 0 ? "Arquivar" : "Excluir"}</Button>}
                      {canEdit && selected.template.archived && <Button variant="secondary" size="sm" disabled={busy} onClick={restore}>Reativar</Button>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.usedFields.length === 0 && <span className="text-xs text-[var(--hub-text-muted)]">Este modelo não usa campos preenchidos automaticamente.</span>}
                    {selected.usedFields.map((key) => <Badge key={key} tone="muted">{fields.find((f) => f.key === key)?.label ?? key}</Badge>)}
                  </div>
                  <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-[var(--hub-radius)] bg-[var(--hub-bg-subtle)] p-4 text-sm">{shownVersion ? shownVersion.body : selected.body}</pre>
                  <div>
                    <p className="mb-1 text-xs font-medium text-[var(--hub-text-secondary)]">Versões</p>
                    <ul className="space-y-1 text-sm">
                      {selected.versions.map((v) => (
                        <li key={v.version} className="flex flex-wrap items-center gap-2">
                          <button type="button" className="underline" onClick={() => setViewVersion(v.version === selected.template.currentVersion ? null : v.version)}>
                            Versão {v.version}{v.version === selected.template.currentVersion ? " (atual)" : ""}
                          </button>
                          <span className="text-xs text-[var(--hub-text-muted)]">{formatMoment(v.createdAt)} · {v.author}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <details>
                    <summary className="cursor-pointer text-xs font-medium text-[var(--hub-text-secondary)]">Histórico</summary>
                    <ul className="mt-2 space-y-1 text-xs text-[var(--hub-text-muted)]">
                      {selected.history.map((h) => <li key={h.id}>{formatMoment(h.createdAt)} · {actionLabel(h.action)} · {h.author}</li>)}
                    </ul>
                  </details>
                </div>
              )}
            </Card>
          )}
          {!editing && !selected && <p className="text-sm text-[var(--hub-text-muted)]">Selecione um modelo para consultar o conteúdo e as versões.</p>}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={selected && selected.template.contractCount > 0 ? "Arquivar modelo" : "Excluir modelo"}
        message={selected && selected.template.contractCount > 0
          ? "Este modelo já foi usado em contratos. Ele será arquivado para preservar o histórico e deixará de aparecer em novos rascunhos."
          : "O modelo e todas as suas versões serão excluídos definitivamente."}
        confirmLabel={selected && selected.template.contractCount > 0 ? "Arquivar" : "Excluir"}
        destructive
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
