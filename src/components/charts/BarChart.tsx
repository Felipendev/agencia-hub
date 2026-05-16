"use client";

type DataPoint = {
  label: string;
  value: number;
  color?: string;
};

type Props = {
  data: DataPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  emptyMessage?: string;
};

export function BarChart({
  data,
  height = 180,
  formatValue = (v) => String(v),
  emptyMessage = "Sem dados",
}: Props) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--hub-text-muted)]"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ height }} className="w-full">
      <div className="flex h-full items-end gap-1">
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full mb-1 hidden rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap z-10">
                {d.label}: {formatValue(d.value)}
              </div>
              {/* Barra */}
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  backgroundColor: d.color ?? "var(--hub-blue)",
                  opacity: 0.85,
                }}
              />
              {/* Label */}
              <span className="mt-1 w-full truncate text-center text-[10px] text-[var(--hub-text-muted)]">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
