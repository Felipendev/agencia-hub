"use client";
import { useState, type InputHTMLAttributes } from "react";
import { normalizePhone, splitPhone } from "@/lib/international-phone";
import { formatBrPhoneDisplay } from "@/lib/br-phone";
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & { value: string; onChange: (phone: string) => void };
export function PhoneInput({ value, onChange, className = "", disabled, ...props }: Props) {
  const parts = splitPhone(value);
  const [draft, setDraft] = useState({ country: parts.country, value });
  const country = draft.value === value ? draft.country : parts.country;
  const normalized = normalizePhone(value);
  const national = country && normalized.startsWith(`+${country}`) ? normalized.slice(country.length + 1) : parts.national;
  const emit = (code: string, number: string) => { const next = number ? `+${code}${number}` : ""; setDraft({ country: code, value: next }); onChange(next); };
  const style = "rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 py-2 text-sm text-[var(--hub-blue-dark)] focus:border-[var(--hub-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--hub-blue)]/20";
  return <div className="flex min-w-0 gap-2">
    <label className="flex shrink-0 items-center gap-1"><span aria-hidden="true">+</span><input
      aria-label={`Código do país${props.id ? ` — ${props.id}` : ""}`} title="Código do país (DDI)" inputMode="numeric" value={country}
      disabled={disabled} maxLength={3} className={`${style} w-20`} onChange={(e) => {
        const code = e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 3);
        if (code) emit(code, national); else setDraft({ country: "", value });
      }} /></label>
    <input {...props} disabled={disabled} type="tel" inputMode="tel" autoComplete="tel-national"
      value={country === "55" ? formatBrPhoneDisplay(national) : national}
      placeholder={country === "55" ? "(11) 99999-9999" : "Número sem o código do país"}
      className={`${style} min-w-0 flex-1 ${className}`} onChange={(e) => {
        if (/^(\+|00)/.test(e.target.value)) { const next = splitPhone(e.target.value); emit(next.country, next.national); }
        else emit(country || "55", e.target.value.replace(/\D/g, "").slice(0, 15 - (country || "55").length));
      }} />
  </div>;
}
