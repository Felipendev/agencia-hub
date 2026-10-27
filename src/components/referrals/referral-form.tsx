"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHANNEL_LABEL, PRODUCT_LABEL, type ReferralForm } from "@/lib/referrals/format";
import type { Channel, Member, Product } from "@/lib/referrals/types";

export type Option = { id: string; label: string };

const select = "h-10 w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm";

export function ReferralFields({
  form, onChange, people, members, editing, referredLinked, disabled, today,
}: {
  form: ReferralForm;
  onChange: (form: ReferralForm) => void;
  people: Option[] | null;
  members: Member[];
  editing: boolean;
  /** Na edição, indicado já vinculado ao CRM só muda pela operação de vínculo. */
  referredLinked?: boolean;
  disabled?: boolean;
  today: string;
}) {
  const set = <K extends keyof ReferralForm>(key: K, value: ReferralForm[K]) => onChange({ ...form, [key]: value });
  const peopleOptions = people ?? [];
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-[var(--hub-text-secondary)]">Produto <span aria-hidden="true" className="text-red-600">*</span></legend>
        <div className="flex flex-wrap gap-2">
          {(["TRAVEL", "MILES"] as Product[]).map((value) => (
            <label key={value} className={`flex items-center gap-2 rounded-[var(--hub-radius)] border px-3 py-2 text-sm ${form.product === value ? "border-[var(--hub-blue)] bg-[var(--hub-blue)]/5" : "border-[var(--hub-border)]"}`}>
              <input type="radio" name="product" value={value} checked={form.product === value} disabled={disabled || editing} onChange={() => set("product", value)} />
              {PRODUCT_LABEL[value]}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-[var(--hub-text-muted)]">{editing ? "O produto não muda depois de registrado; se estiver errado, cancele e registre outra indicação." : "A mesma pessoa pode ser indicada para Viagens e para Milhas, com acompanhamentos separados."}</p>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="r-referrer" required>Quem indicou</Label>
          <select id="r-referrer" className={select} disabled={disabled} value={form.referrerId} onChange={(e) => set("referrerId", e.target.value)}>
            <option value="">{people === null ? "Carregando pessoas…" : "Escolha a pessoa"}</option>
            {peopleOptions.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div><Label htmlFor="r-date" required>Data da indicação</Label><Input id="r-date" type="date" max={today} disabled={disabled} value={form.referredOn} onChange={(e) => set("referredOn", e.target.value)} /></div>
      </div>

      {!referredLinked && (
        <fieldset className="space-y-3 rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3">
          <legend className="px-1 text-xs font-medium text-[var(--hub-text-secondary)]">Pessoa indicada <span aria-hidden="true" className="text-red-600">*</span></legend>
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-2"><input type="radio" name="mode" checked={form.mode === "contact"} disabled={disabled} onChange={() => set("mode", "contact")} />Ainda não cadastrada</label>
            <label className="flex items-center gap-2"><input type="radio" name="mode" checked={form.mode === "crm"} disabled={disabled || editing} onChange={() => set("mode", "crm")} />Já cadastrada em Pessoas</label>
          </div>
          {form.mode === "crm" ? (
            <div>
              <Label htmlFor="r-referred" required>Pessoa indicada</Label>
              <select id="r-referred" className={select} disabled={disabled} value={form.referredCustomerId} onChange={(e) => set("referredCustomerId", e.target.value)}>
                <option value="">Escolha a pessoa</option>
                {peopleOptions.filter((p) => p.id !== form.referrerId).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <div><Label htmlFor="r-name" required>Nome</Label><Input id="r-name" maxLength={200} disabled={disabled} value={form.referredName} onChange={(e) => set("referredName", e.target.value)} /></div>
              <div><Label htmlFor="r-phone">Telefone</Label><Input id="r-phone" type="tel" maxLength={30} disabled={disabled} value={form.referredPhone} onChange={(e) => set("referredPhone", e.target.value)} /></div>
              <div><Label htmlFor="r-email">E-mail</Label><Input id="r-email" type="email" maxLength={254} disabled={disabled} value={form.referredEmail} onChange={(e) => set("referredEmail", e.target.value)} /></div>
              <p className="text-xs text-[var(--hub-text-muted)] md:col-span-3">Informe telefone ou e-mail. Nada é cadastrado em Pessoas automaticamente; isso pode ser feito depois, na própria indicação.</p>
            </div>
          )}
        </fieldset>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="r-channel" required>Origem</Label>
          <select id="r-channel" className={select} disabled={disabled} value={form.channel} onChange={(e) => set("channel", e.target.value as Channel | "")}>
            <option value="">Escolha</option>
            {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="r-channel-detail" required={form.channel === "OTHER"}>Detalhe da origem</Label>
          <Input id="r-channel-detail" maxLength={200} placeholder="Ex.: grupo da igreja, feira de turismo" disabled={disabled} value={form.channelDetail} onChange={(e) => set("channelDetail", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="r-responsible">Responsável pelo contato</Label>
          <select id="r-responsible" className={select} disabled={disabled} value={form.responsibleId} onChange={(e) => set("responsibleId", e.target.value)}>
            <option value="">Sem responsável</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="r-notes">Observações</Label>
        <textarea id="r-notes" rows={3} maxLength={4000} disabled={disabled} value={form.notes} onChange={(e) => set("notes", e.target.value)} className="w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3 text-sm" />
      </div>
    </div>
  );
}
