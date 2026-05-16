type Tone = "default" | "success" | "warning" | "muted" | "danger";

const tones: Record<Tone, string> = {
  default: "bg-[var(--hub-blue)]/10 text-[var(--hub-blue)] ring-1 ring-inset ring-[var(--hub-blue)]/15",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  muted:   "bg-[var(--hub-bg-subtle)] text-[var(--hub-text-muted)] ring-1 ring-inset ring-[var(--hub-border)]",
  danger:  "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--hub-radius-sm)] px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
