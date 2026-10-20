"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FORMAT_LABEL, PRODUCT_LABEL } from "@/lib/agenda/format";
import { ZONES, toZonedIso } from "@/lib/agenda/time";
import type { AppointmentInput, Format, Member, Product } from "@/lib/agenda/types";

export type AppointmentForm = {
  product: Product | "";
  customerId: string;
  tripId: string;
  title: string;
  purpose: string;
  date: string;
  time: string;
  durationMinutes: string;
  timeZone: string;
  format: Format | "";
  location: string;
  meetingUrl: string;
  responsibleId: string;
};

export type Option = { id: string; label: string };

const select = "h-10 w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm";
const text = (v: string) => (v.trim() ? v.trim() : null);

/** Converte o formulário no contrato da API; o horário vai com o offset do fuso escolhido. */
export function toInput(form: AppointmentForm, expectedVersion?: number): AppointmentInput {
  if (!form.product) throw new Error("Escolha se o atendimento é de Viagens ou de Milhas.");
  if (!form.customerId) throw new Error("Escolha a pessoa do atendimento.");
  if (!form.title.trim()) throw new Error("Informe o título.");
  if (!form.date || !form.time) throw new Error("Informe a data e o horário.");
  if (!form.responsibleId) throw new Error("Escolha o responsável.");
  if (!form.format) throw new Error("Escolha o formato do atendimento.");
  const duration = Number(form.durationMinutes);
  if (!Number.isInteger(duration) || duration < 5 || duration > 720) throw new Error("A duração deve ficar entre 5 minutos e 12 horas.");
  return {
    customerId: form.customerId,
    product: form.product,
    tripId: form.product === "TRAVEL" && form.tripId ? form.tripId : null,
    title: form.title.trim(),
    purpose: text(form.purpose),
    startsAt: toZonedIso(form.date, form.time, form.timeZone),
    durationMinutes: duration,
    timeZone: form.timeZone,
    format: form.format,
    location: text(form.location),
    meetingUrl: text(form.meetingUrl),
    responsibleId: form.responsibleId,
    ...(expectedVersion === undefined ? {} : { expectedVersion }),
  };
}

export function AppointmentFields({
  form, onChange, members, customers, trips, editing, disabled,
}: {
  form: AppointmentForm;
  onChange: (form: AppointmentForm) => void;
  members: Member[];
  customers: Option[] | null;
  trips: Option[];
  editing: boolean;
  disabled?: boolean;
}) {
  const set = <K extends keyof AppointmentForm>(key: K, value: AppointmentForm[K]) => onChange({ ...form, [key]: value });
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-[var(--hub-text-secondary)]">Produto <span aria-hidden="true" className="text-red-600">*</span></legend>
        <div className="flex flex-wrap gap-2">
          {(["TRAVEL", "MILES"] as Product[]).map((value) => (
            <label key={value} className={`flex items-center gap-2 rounded-[var(--hub-radius)] border px-3 py-2 text-sm ${form.product === value ? "border-[var(--hub-blue)] bg-[var(--hub-blue)]/5" : "border-[var(--hub-border)]"}`}>
              <input type="radio" name="product" value={value} checked={form.product === value} disabled={disabled || editing}
                onChange={() => onChange({ ...form, product: value, tripId: value === "TRAVEL" ? form.tripId : "" })} />
              {PRODUCT_LABEL[value]}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-[var(--hub-text-muted)]">{editing ? "O produto e a pessoa não mudam depois de criados." : "A mesma pessoa pode ter atendimentos de Viagens e de Milhas, filtrados separadamente."}</p>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="appt-customer" required>Pessoa</Label>
          <select id="appt-customer" className={select} required disabled={disabled || editing} value={form.customerId} onChange={(e) => onChange({ ...form, customerId: e.target.value, tripId: "" })}>
            <option value="">{customers === null ? "Carregando pessoas…" : "Escolha a pessoa"}</option>
            {(customers ?? []).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div><Label htmlFor="appt-title" required>Título</Label><Input id="appt-title" required maxLength={180} disabled={disabled} value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
        <div><Label htmlFor="appt-date" required>Data</Label><Input id="appt-date" type="date" required disabled={disabled} value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label htmlFor="appt-time" required>Início</Label><Input id="appt-time" type="time" required disabled={disabled} value={form.time} onChange={(e) => set("time", e.target.value)} /></div>
          <div><Label htmlFor="appt-duration" required>Duração (min)</Label><Input id="appt-duration" type="number" min={5} max={720} step={5} required disabled={disabled} value={form.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} /></div>
        </div>
        <div>
          <Label htmlFor="appt-zone">Fuso do horário</Label>
          <select id="appt-zone" className={select} disabled={disabled} value={form.timeZone} onChange={(e) => set("timeZone", e.target.value)}>
            {ZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
            {!ZONES.some((z) => z.id === form.timeZone) && <option value={form.timeZone}>{form.timeZone}</option>}
          </select>
        </div>
        <div>
          <Label htmlFor="appt-responsible" required>Responsável</Label>
          <select id="appt-responsible" className={select} required disabled={disabled} value={form.responsibleId} onChange={(e) => set("responsibleId", e.target.value)}>
            <option value="">Escolha</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="appt-format" required>Formato</Label>
          <select id="appt-format" className={select} required disabled={disabled} value={form.format} onChange={(e) => set("format", e.target.value as Format | "")}>
            <option value="">Escolha</option>
            {(Object.keys(FORMAT_LABEL) as Format[]).map((f) => <option key={f} value={f}>{FORMAT_LABEL[f]}</option>)}
          </select>
        </div>
        <div><Label htmlFor="appt-location">Local</Label><Input id="appt-location" maxLength={300} disabled={disabled} value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
        <div><Label htmlFor="appt-url">Link da reunião</Label><Input id="appt-url" type="url" maxLength={2048} placeholder="https://" disabled={disabled} value={form.meetingUrl} onChange={(e) => set("meetingUrl", e.target.value)} /></div>
        {form.product === "TRAVEL" && (
          <div>
            <Label htmlFor="appt-trip">Viagem relacionada (opcional)</Label>
            <select id="appt-trip" className={select} disabled={disabled || !form.customerId} value={form.tripId} onChange={(e) => set("tripId", e.target.value)}>
              <option value="">Nenhuma</option>
              {trips.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="appt-purpose">Objetivo</Label>
        <textarea id="appt-purpose" rows={3} maxLength={2000} disabled={disabled} value={form.purpose} onChange={(e) => set("purpose", e.target.value)} className="w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-3 text-sm" />
      </div>
    </div>
  );
}
