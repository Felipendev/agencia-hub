import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--hub-yellow)] text-[var(--hub-blue-dark)] font-semibold shadow-sm hover:bg-[var(--hub-yellow-hover)] focus-visible:ring-2 focus-visible:ring-[var(--hub-yellow)] focus-visible:ring-offset-2",
  secondary:
    "bg-white text-[var(--hub-blue)] border border-[var(--hub-blue-muted)] hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[var(--hub-blue)]",
  ghost:
    "text-[var(--hub-blue)] hover:bg-white/10 dark:hover:bg-white/5",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500",
};

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
