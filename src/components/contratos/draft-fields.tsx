"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTRACT_FIELD_INPUT, type DraftForm } from "@/lib/contracts/format";
import type { ContractFieldView, TemplateSummary } from "@/lib/contracts/types";

const highlight = "border-amber-400 ring-2 ring-amber-200";

/** Campos editáveis do rascunho, com destaque para os que o modelo exige e estão vazios. */
export function DraftFields({
  form,
  onChange,
  templates,
  missing,
  disabled,
}: {
  form: DraftForm;
  onChange: (form: DraftForm) => void;
  templates: TemplateSummary[];
  missing: ContractFieldView[];
  disabled?: boolean;
}) {
  const missingInputs = new Set(missing.map((f) => CONTRACT_FIELD_INPUT[f.key]).filter(Boolean));
  const cls = (key: keyof DraftForm) => (missingInputs.has(key) ? highlight : "");
  const set = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) => onChange({ ...form, [key]: value });
  const selectedTemplate = templates.find((t) => t.id === form.templateId);
  const selectClass = "h-10 w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="draft-template" required>Modelo</Label>
          <select id="draft-template" required disabled={disabled} className={selectClass} value={form.templateId}
            onChange={(e) => onChange({ ...form, templateId: e.target.value, templateVersion: null })}>
            <option value="">Escolha um modelo</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.archived ? " (arquivado)" : ""}</option>)}
          </select>
          {selectedTemplate && form.templateVersion != null && form.templateVersion < selectedTemplate.currentVersion && (
            <p className="mt-1 text-xs text-amber-700">
              Este rascunho usa a versão {form.templateVersion}; a versão atual é {selectedTemplate.currentVersion}.{" "}
              {!disabled && !selectedTemplate.archived && (
                <button type="button" className="underline" onClick={() => set("templateVersion", selectedTemplate.currentVersion)}>Usar a versão atual</button>
              )}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="draft-title" required>Título</Label>
          <Input id="draft-title" required maxLength={200} disabled={disabled} className={cls("title")} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="draft-plan">Plano ou serviço</Label>
          <Input id="draft-plan" maxLength={200} disabled={disabled} className={cls("planName")} value={form.planName} onChange={(e) => set("planName", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="draft-price">Valor total (R$)</Label>
          <Input id="draft-price" inputMode="decimal" placeholder="1.200,00" disabled={disabled} className={cls("price")} value={form.price} onChange={(e) => set("price", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="draft-start">Início da vigência</Label>
          <Input id="draft-start" type="date" disabled={disabled} className={cls("startDate")} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="draft-end">Fim da vigência</Label>
          <Input id="draft-end" type="date" min={form.startDate || undefined} disabled={disabled} className={cls("endDate")} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="draft-payment">Forma de pagamento</Label>
          <select id="draft-payment" disabled={disabled} className={`${selectClass} ${cls("paymentMode")}`} value={form.paymentMode}
            onChange={(e) => onChange({ ...form, paymentMode: e.target.value as DraftForm["paymentMode"], installments: e.target.value === "INSTALLMENTS" ? form.installments : "" })}>
            <option value="">Não informada</option>
            <option value="CASH">À vista</option>
            <option value="INSTALLMENTS">Parcelado</option>
          </select>
        </div>
        {form.paymentMode === "INSTALLMENTS" && (
          <div>
            <Label htmlFor="draft-installments" required>Número de parcelas</Label>
            <Input id="draft-installments" type="number" min={2} max={120} required disabled={disabled} className={cls("installments")} value={form.installments} onChange={(e) => set("installments", e.target.value)} />
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="draft-terms">Condições de pagamento</Label>
        <textarea id="draft-terms" maxLength={2000} rows={3} disabled={disabled} value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)}
          className={`w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3 text-sm ${cls("paymentTerms")}`} />
      </div>
      <div>
        <Label htmlFor="draft-notes">Observações internas</Label>
        <textarea id="draft-notes" maxLength={4000} rows={2} disabled={disabled} value={form.notes} onChange={(e) => set("notes", e.target.value)}
          className="w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3 text-sm" />
        <p className="mt-1 text-xs text-[var(--hub-text-muted)]">Não aparecem no documento. Salvar o contrato não cria venda, receita nem cobrança.</p>
      </div>
    </div>
  );
}

/** Lista dos campos que o modelo usa e ainda não têm valor. */
export function MissingFields({ missing, customerId }: { missing: ContractFieldView[]; customerId: string }) {
  if (missing.length === 0) return null;
  const fromCustomer = missing.some((f) => f.source === "CUSTOMER");
  const fromAgency = missing.some((f) => f.source === "AGENCY");
  return (
    <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="font-medium">Preencha antes de gerar o documento:</p>
      <ul className="mt-1 list-disc pl-5">
        {missing.map((f) => <li key={f.key}>{f.label}</li>)}
      </ul>
      {fromCustomer && <p className="mt-2">Dados da pessoa são atualizados no <Link className="underline" href={`/clientes/${customerId}`}>cadastro da pessoa</Link>.</p>}
      {fromAgency && <p className="mt-1">Dados da agência são atualizados em <Link className="underline" href="/agencia">Minha agência</Link>.</p>}
    </div>
  );
}
