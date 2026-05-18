const FUNIL_LABELS: Record<number, { label: string; resumo: string; color: string }> = {
  1: { label: "Primeiro contato", resumo: "P1", color: "bg-slate-100 text-slate-600 ring-slate-200" },
  2: { label: "Diagnóstico", resumo: "P2", color: "bg-sky-50 text-sky-700 ring-sky-200" },
  3: { label: "Proposta", resumo: "P3", color: "bg-violet-50 text-violet-700 ring-violet-200" },
  4: { label: "Negociação", resumo: "P4", color: "bg-amber-50 text-amber-700 ring-amber-200" },
  5: { label: "Hub+", resumo: "P5", color: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
};

export function FunilBadge({ value, showLabel = false }: { value?: number; showLabel?: boolean }) {
  if (!value || !FUNIL_LABELS[value]) return null;
  const { label, resumo, color } = FUNIL_LABELS[value];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${color}`}
      title={label}
    >
      {showLabel ? label : resumo}
    </span>
  );
}
