import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-[var(--hub-border)] bg-white px-3 py-2 text-sm text-[var(--hub-blue-dark)] placeholder:text-slate-400 focus:border-[var(--hub-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--hub-blue)]/20 ${className}`}
      {...props}
    />
  );
}
