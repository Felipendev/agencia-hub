import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--hub-blue-dark)] text-white shadow-[var(--hub-shadow-xs)] hover:bg-[var(--hub-blue)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--hub-blue)] focus-visible:ring-offset-2",
  secondary:
    "bg-white text-[var(--hub-text-primary)] border border-[var(--hub-border)] shadow-[var(--hub-shadow-xs)] hover:bg-[var(--hub-bg-subtle)] hover:border-[var(--hub-border-strong)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--hub-blue)]",
  ghost:
    "text-[var(--hub-text-secondary)] hover:bg-[var(--hub-bg-subtle)] hover:text-[var(--hub-text-primary)] active:scale-[0.98]",
  danger:
    "bg-red-600 text-white shadow-[var(--hub-shadow-xs)] hover:bg-red-700 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-[var(--hub-radius)] font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
