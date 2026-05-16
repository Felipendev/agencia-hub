"use client";

type DataPoint = {
  label: string;
  value: number;
};

type Props = {
  data: DataPoint[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
  emptyMessage?: string;
};

export function LineChart({
  data,
  height = 180,
  color = "var(--hub-blue)",
  formatValue = (v) => String(v),
  emptyMessage = "Sem dados",
}: Props) {
  if (data.length < 2 || data.every((d) => d.value === 0)) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--hub-text-muted)]"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  const W = 600;
  const H = height;
  const padX = 8;
  const padY = 16;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const max = Math.max(...data.map((d) => d.value), 1);
  const min = 0;

  function xOf(i: number) {
    return padX + (i / (data.length - 1)) * innerW;
  }

  function yOf(v: number) {
    return padY + innerH - ((v - min) / (max - min)) * innerH;
  }

  const points = data.map((d, i) => `${xOf(i)},${yOf(d.value)}`).join(" ");
  const areaPoints = [
    `${xOf(0)},${H}`,
    ...data.map((d, i) => `${xOf(i)},${yOf(d.value)}`),
    `${xOf(data.length - 1)},${H}`,
  ].join(" ");

  return (
    <div style={{ height }} className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Área preenchida */}
        <polygon points={areaPoints} fill="url(#lineGrad)" />

        {/* Linha */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Pontos */}
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={xOf(i)}
              cy={yOf(d.value)}
              r="4"
              fill="white"
              stroke={color}
              strokeWidth="2"
            />
            <title>
              {d.label}: {formatValue(d.value)}
            </title>
          </g>
        ))}
      </svg>

      {/* Labels do eixo X */}
      <div className="flex justify-between px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-[var(--hub-text-muted)]">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
