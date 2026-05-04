type Tone = "default" | "success" | "warning" | "muted" | "danger";

const tones: Record<Tone, string> = {
  default: "bg-[var(--hub-blue)]/10 text-[var(--hub-blue)]",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-[var(--hub-yellow)]/25 text-[var(--hub-blue-dark)]",
  muted: "bg-slate-100 text-slate-700",
  danger: "bg-red-50 text-red-800",
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
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
