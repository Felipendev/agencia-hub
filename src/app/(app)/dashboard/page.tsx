"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  computeFinanceiroResumo,
  cotacoesEmAndamento,
  useData,
} from "@/contexts/data-context";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { formatBRL, formatDateBR } from "@/lib/format";
import {
  CLIENTE_STATUS_LABELS,
  COTACAO_STATUS_LABELS,
  LANCAMENTO_CATEGORIA_LABELS,
} from "@/lib/constants";
import type { CotacaoStatus } from "@/types";

const COTACAO_COLORS: Record<CotacaoStatus, string> = {
  aguardando: "#94a3b8",
  em_cotacao: "#3b82f6",
  aguardando_cliente: "#f59e0b",
  aprovado: "#10b981",
  reprovado: "#ef4444",
  expirada: "#6b7280",
  cancelada: "#9ca3af",
};

export default function DashboardPage() {
  const { clientes, lancamentos, cotacoes, isReady } = useData();

  // --- Dados para gráficos ---

  // Faturamento por mês (últimos 6 meses)
  const faturamentoPorMes = useMemo(() => {
    if (!isReady) return [];
    const meses: Record<string, number> = {};
    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      meses[key] = 0;
    }
    for (const l of lancamentos) {
      if (l.tipo === "entrada" && l.status === "confirmado") {
        const key = l.data.slice(0, 7);
        if (key in meses) meses[key] += l.valor;
      }
    }
    return Object.entries(meses).map(([, value], i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        label: d.toLocaleDateString("pt-BR", { month: "short" }),
        value,
      };
    });
  }, [lancamentos, isReady]);

  // Cotações por status (donut)
  const cotacoesPorStatus = useMemo(() => {
    if (!isReady) return [];
    const counts: Partial<Record<CotacaoStatus, number>> = {};
    for (const c of cotacoes) {
      counts[c.status] = (counts[c.status] ?? 0) + 1;
    }
    return (Object.entries(counts) as [CotacaoStatus, number][])
      .filter(([, v]) => v > 0)
      .map(([status, value]) => ({
        label: COTACAO_STATUS_LABELS[status],
        value,
        color: COTACAO_COLORS[status],
      }));
  }, [cotacoes, isReady]);

  // Top destinos (bar)
  const topDestinos = useMemo(() => {
    if (!isReady) return [];
    const counts: Record<string, number> = {};
    for (const c of cotacoes) {
      const dest = c.destino.split(/[/,·]/)[0].trim();
      if (dest) counts[dest] = (counts[dest] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value, color: "#0369a1" }));
  }, [cotacoes, isReady]);

  // Despesas por categoria (bar)
  const despesasPorCategoria = useMemo(() => {
    if (!isReady) return [];
    const totals: Record<string, number> = {};
    for (const l of lancamentos) {
      if (l.tipo === "saida" && l.status === "confirmado") {
        totals[l.categoria] = (totals[l.categoria] ?? 0) + l.valor;
      }
    }
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, value]) => ({
        label: LANCAMENTO_CATEGORIA_LABELS[cat as keyof typeof LANCAMENTO_CATEGORIA_LABELS] ?? cat,
        value,
        color: "#ef4444",
      }));
  }, [lancamentos, isReady]);

  if (!isReady) {
    return <div className="text-sm text-slate-600">Carregando dados…</div>;
  }

  const resumo = computeFinanceiroResumo(lancamentos);
  const clientesAtivos = clientes.filter((c) => c.status === "ativo").length;
  const emFunil = cotacoesEmAndamento(cotacoes).length;
  const totalCotacoes = cotacoes.length;

  const ultimosLancamentos = [...lancamentos]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 5);

  const clientesRecentes = [...clientes]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  const cotacoesRecentes = [...cotacoes]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">
          Dashboard
        </h1>
        <p className="mt-1 text-slate-600">
          Visão geral da operação — período consolidado com base nos lançamentos
          cadastrados.
        </p>
      </div>

      {/* KPIs financeiros */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Faturamento (entradas)"
          value={formatBRL(resumo.faturamento)}
          hint="Soma das entradas não canceladas"
        />
        <KpiCard
          title="Total recebido"
          value={formatBRL(resumo.totalRecebido)}
          accent="green"
          hint="Entradas confirmadas"
        />
        <KpiCard
          title="A receber"
          value={formatBRL(resumo.aReceber)}
          accent="yellow"
          hint="Entradas previstas"
        />
        <KpiCard
          title="Despesas"
          value={formatBRL(resumo.totalDespesas)}
          accent="red"
        />
      </div>

      {/* KPIs operacionais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Saldo do período"
          value={formatBRL(resumo.saldo)}
          hint="Recebido − despesas confirmadas"
        />
        <KpiCard title="Clientes ativos" value={String(clientesAtivos)} />
        <KpiCard
          title="Cotações no funil"
          value={String(emFunil)}
          hint="Aguardando, em cotação ou aguardando cliente"
        />
        <KpiCard
          title="Total de cotações"
          value={String(totalCotacoes)}
          accent="yellow"
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Faturamento mensal (últimos 6 meses)</CardTitle>
          <div className="mt-4">
            <LineChart
              data={faturamentoPorMes}
              height={180}
              formatValue={formatBRL}
              emptyMessage="Nenhum lançamento confirmado ainda"
            />
          </div>
        </Card>

        <Card>
          <CardTitle>Cotações por status</CardTitle>
          <div className="mt-4">
            <DonutChart
              data={cotacoesPorStatus}
              size={130}
              emptyMessage="Nenhuma cotação cadastrada"
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Top destinos</CardTitle>
          <div className="mt-4">
            <BarChart
              data={topDestinos}
              height={160}
              emptyMessage="Nenhuma cotação cadastrada"
            />
          </div>
        </Card>

        <Card>
          <CardTitle>Despesas por categoria</CardTitle>
          <div className="mt-4">
            <BarChart
              data={despesasPorCategoria}
              height={160}
              formatValue={formatBRL}
              emptyMessage="Nenhuma despesa confirmada"
            />
          </div>
        </Card>
      </div>

      {/* Listas recentes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <CardTitle>Últimos lançamentos</CardTitle>
            <Link
              href="/financeiro"
              className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
            >
              Ver financeiro
            </Link>
          </div>
          <ul className="divide-y divide-[var(--hub-border)]">
            {ultimosLancamentos.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"
              >
                <div>
                  <p className="font-medium text-[var(--hub-blue-dark)]">
                    {l.descricao}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateBR(l.data)} ·{" "}
                    {LANCAMENTO_CATEGORIA_LABELS[l.categoria]}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    l.tipo === "entrada" ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {l.tipo === "entrada" ? "+" : "−"}
                  {formatBRL(l.valor)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <CardTitle>Clientes recentes</CardTitle>
            <Link
              href="/clientes"
              className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <ul className="divide-y divide-[var(--hub-border)]">
            {clientesRecentes.map((c) => (
              <li key={c.id} className="py-3 first:pt-0">
                <Link
                  href={`/clientes/${c.id}`}
                  className="font-medium text-[var(--hub-blue)] hover:underline"
                >
                  {c.nome}
                </Link>
                <p className="text-xs text-slate-500">
                  {c.destinoInteresse} ·{" "}
                  <Badge tone="muted">{CLIENTE_STATUS_LABELS[c.status]}</Badge>
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-2">
          <CardTitle>Cotações recentes</CardTitle>
          <Link
            href="/cotacoes"
            className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
          >
            Ver cotações
          </Link>
        </div>
        <ul className="divide-y divide-[var(--hub-border)]">
          {cotacoesRecentes.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"
            >
              <div>
                <Link
                  href={`/cotacoes/${c.id}`}
                  className="font-medium text-[var(--hub-blue)] hover:underline"
                >
                  {c.titulo}
                </Link>
                <p className="text-xs text-slate-500">
                  Validade {formatDateBR(c.validade)} ·{" "}
                  <Badge tone="muted">{COTACAO_STATUS_LABELS[c.status]}</Badge>
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-[var(--hub-blue-dark)]">
                {formatBRL(c.valorTotal)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
