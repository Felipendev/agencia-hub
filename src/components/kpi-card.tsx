const accentColors = {
  neutral: { bar: "bg-[var(--hub-blue)]",    value: "text-[var(--hub-text-primary)]" },
  yellow:  { bar: "bg-[var(--hub-yellow)]",  value: "text-amber-700" },
  green:   { bar: "bg-emerald-500",           value: "text-emerald-700" },
  red:     { bar: "bg-red-400",               value: "text-red-700" },
};

export function KpiCard({
  title,
  value,
  hint,
  accent = "neutral",
}: {
  title: string;
  value: string;
  hint?: string;
  accent?: keyof typeof accentColors;
}) {
  const { bar, value: valueClass } = accentColors[accent];

  return (
    <div className="flex flex-col rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white p-5 shadow-[var(--hub-shadow-sm)]">
      <div className={`mb-3 h-0.5 w-8 rounded-full ${bar}`} />
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hub-text-muted)]">
        {title}
      </p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums tracking-tight ${valueClass}`}>
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-[var(--hub-text-muted)]">{hint}</p>
      )}
    </div>
  );
}
