import { Card } from "@/components/ui/card";

export function KpiCard({
  title,
  value,
  hint,
  accent,
}: {
  title: string;
  value: string;
  hint?: string;
  accent?: "neutral" | "yellow" | "green" | "red";
}) {
  const accentClass =
    accent === "yellow"
      ? "border-l-4 border-l-[var(--hub-yellow)]"
      : accent === "green"
        ? "border-l-4 border-l-emerald-500"
        : accent === "red"
          ? "border-l-4 border-l-red-400"
          : "border-l-4 border-l-[var(--hub-blue)]";
  return (
    <Card className={accentClass} padding="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--hub-blue-dark)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </Card>
  );
}
