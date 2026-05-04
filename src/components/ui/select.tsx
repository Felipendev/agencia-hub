import type { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-[var(--hub-border)] bg-white px-3 py-2 text-sm text-[var(--hub-blue-dark)] focus:border-[var(--hub-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--hub-blue)]/20 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
