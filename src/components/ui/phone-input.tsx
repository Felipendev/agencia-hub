"use client";

import { useCallback, type InputHTMLAttributes } from "react";

type PhoneInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string;
  onChange: (digits: string) => void;
};

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);

  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;

  // Mobile: 11 digits → (XX) XXXXX-XXXX
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  // Landline: 10 digits → (XX) XXXX-XXXX
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }

  // In-between states
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }

  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function PhoneInput({ value, onChange, className = "", ...props }: PhoneInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
      onChange(raw);
    },
    [onChange],
  );

  return (
    <input
      type="tel"
      inputMode="numeric"
      value={formatPhone(value)}
      onChange={handleChange}
      placeholder="(11) 99999-9999"
      className={`w-full rounded-lg border border-[var(--hub-border)] bg-white px-3 py-2 text-sm text-[var(--hub-blue-dark)] placeholder:text-slate-400 focus:border-[var(--hub-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--hub-blue)]/20 ${className}`}
      {...props}
    />
  );
}
