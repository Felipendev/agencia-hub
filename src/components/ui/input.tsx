import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 py-2 text-sm text-[var(--hub-text-primary)] shadow-[var(--hub-shadow-xs)] placeholder:text-[var(--hub-text-muted)] transition-colors focus:border-[var(--hub-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--hub-blue)]/15 disabled:cursor-not-allowed disabled:bg-[var(--hub-bg-subtle)] disabled:text-[var(--hub-text-muted)] ${className}`}
      {...props}
    />
  );
}
