import type { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 py-2 text-sm text-[var(--hub-text-primary)] shadow-[var(--hub-shadow-xs)] transition-colors focus:border-[var(--hub-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--hub-blue)]/15 disabled:cursor-not-allowed disabled:bg-[var(--hub-bg-subtle)] ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
