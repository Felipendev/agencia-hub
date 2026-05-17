"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DataPoint = {
  label: string;
  receita: number;
  despesa: number;
};

type Props = {
  data: DataPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  emptyMessage?: string;
};

const RECEITA_COLOR = "#0EA5E9";
const DESPESA_COLOR = "#F97316";

export function AreaChart({
  data,
  height = 220,
  formatValue = (v) => String(v),
  emptyMessage = "Sem dados",
}: Props) {
  const isEmpty =
    data.length === 0 ||
    data.every((d) => d.receita === 0 && d.despesa === 0);

  if (isEmpty) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--hub-text-muted)]"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={RECEITA_COLOR} stopOpacity={0.18} />
              <stop offset="95%" stopColor={RECEITA_COLOR} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={DESPESA_COLOR} stopOpacity={0.18} />
              <stop offset="95%" stopColor={DESPESA_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--hub-text-muted)" }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fontSize: 11, fill: "var(--hub-text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v: number) =>
              v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`
            }
          />

          <Tooltip
            contentStyle={{
              background: "var(--hub-card)",
              border: "1px solid var(--hub-border)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--hub-text)",
            }}
            formatter={(value, name) => [
              formatValue(value as number),
              name === "receita" ? "Receita" : "Despesas",
            ]}
            labelStyle={{ color: "var(--hub-text-muted)", marginBottom: "4px" }}
            cursor={{ stroke: "rgba(255,255,255,0.08)" }}
          />

          <Area
            type="monotone"
            dataKey="receita"
            stroke={RECEITA_COLOR}
            strokeWidth={2}
            fill="url(#gradReceita)"
            dot={false}
            activeDot={{ r: 4, fill: RECEITA_COLOR, stroke: "#fff", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="despesa"
            stroke={DESPESA_COLOR}
            strokeWidth={2}
            fill="url(#gradDespesa)"
            dot={false}
            activeDot={{ r: 4, fill: DESPESA_COLOR, stroke: "#fff", strokeWidth: 2 }}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
