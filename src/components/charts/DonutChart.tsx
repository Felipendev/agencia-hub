"use client";

type Slice = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  data: Slice[];
  size?: number;
  formatValue?: (v: number) => string;
  emptyMessage?: string;
};

export function DonutChart({
  data,
  size = 140,
  formatValue = (v) => String(v),
  emptyMessage = "Sem dados",
}: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--hub-text-muted)]"
        style={{ height: size }}
      >
        {emptyMessage}
      </div>
    );
  }

  const cx = 50;
  const cy = 50;
  const r = 38;
  const innerR = 22;
  const strokeW = r - innerR;
  const circumference = 2 * Math.PI * (r - strokeW / 2);

  let cumulative = 0;
  const slices = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const pct = d.value / total;
      const offset = circumference * (1 - cumulative);
      const dash = circumference * pct;
      cumulative += pct;
      return { ...d, pct, offset, dash };
    });

  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox="0 0 100 100"
        style={{ width: size, height: size, flexShrink: 0 }}
      >
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r - strokeW / 2}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeW}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={s.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-all duration-300"
          >
            <title>
              {s.label}: {formatValue(s.value)} ({(s.pct * 100).toFixed(1)}%)
            </title>
          </circle>
        ))}
        {/* Total no centro */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="text-[8px] font-bold"
          fill="#0f172a"
          fontSize="8"
          fontWeight="bold"
        >
          {data.length}
        </text>
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fill="#64748b"
          fontSize="5"
        >
          itens
        </text>
      </svg>

      {/* Legenda */}
      <ul className="flex-1 space-y-1.5">
        {slices.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="flex-1 truncate text-[var(--hub-text-primary)]">{s.label}</span>
            <span className="font-semibold tabular-nums text-[var(--hub-text-primary)]">
              {(s.pct * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
