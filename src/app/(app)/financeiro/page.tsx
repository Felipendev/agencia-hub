"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, Clock,
  ArrowUpRight, ArrowDownRight, Plus, Download,
  Filter, Edit2, Trash2, X,
} from "lucide-react";
import { computeFinanceiroResumo, useData } from "@/contexts/data-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { formatBRL, formatDateBR } from "@/lib/format";
import { exportarLancamentosCSV } from "@/lib/csv-export";
import { LANCAMENTO_CATEGORIA_LABELS, LANCAMENTO_STATUS_LABELS } from "@/lib/constants";
import type {
  LancamentoCategoria, LancamentoFinanceiro, LancamentoStatus, LancamentoTipo,
} from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inRange(isoDate: string, inicio: string, fim: string) {
  if (!inicio && !fim) return true;
  const d = isoDate.slice(0, 10);
  if (inicio && d < inicio) return false;
  if (fim && d > fim) return false;
  return true;
}

function buildFluxoCaixa(lancamentos: LancamentoFinanceiro[]) {
  const validos = lancamentos.filter((l) => l.status !== "cancelado");
  const mesesSet = new Set<string>();
  for (const l of validos) mesesSet.add(l.data.slice(0, 7));
  const meses = Array.from(mesesSet).sort();
  let saldoAcumulado = 0;
  return meses.map((mes) => {
    const doMes = validos.filter((l) => l.data.slice(0, 7) === mes);
    const entradas = doMes.filter((l) => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0);
    const saidas = doMes.filter((l) => l.tipo === "saida").reduce((s, l) => s + l.valor, 0);
    saldoAcumulado += entradas - saidas;
    const [ano, m] = mes.split("-");
    const label = new Date(Number(ano), Number(m) - 1, 1)
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", "");
    return { mes, label, entradas, saidas, saldo: entradas - saidas, saldoAcumulado };
  });
}

function contasUnicas(lancamentos: LancamentoFinanceiro[]): string[] {
  const set = new Set<string>();
  for (const l of lancamentos) if (l.contaBancaria?.trim()) set.add(l.contaBancaria.trim());
  return Array.from(set).sort();
}

function buildPieData(lancamentos: LancamentoFinanceiro[]) {
  const map = new Map<string, number>();
  for (const l of lancamentos.filter((l) => l.tipo === "entrada" && l.status !== "cancelado")) {
    const cat = LANCAMENTO_CATEGORIA_LABELS[l.categoria] ?? l.categoria;
    map.set(cat, (map.get(cat) ?? 0) + l.valor);
  }
  const PIE_COLORS = ["#0EA5E9","#10B981","#8B5CF6","#F59E0B","#F97316","#EF4444","#06B6D4","#94A3B8"];
  return Array.from(map.entries()).map(([name, value], i) => ({ name, value, cor: PIE_COLORS[i % PIE_COLORS.length] }));
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<LancamentoStatus, string> = {
  confirmado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  previsto:   "bg-amber-50  text-amber-700  border border-amber-200",
  cancelado:  "bg-red-50    text-red-700    border border-red-200",
};

const CAT_COLORS: Record<string, string> = {
  pacote_vendido:   "#0EA5E9",
  passagem_aerea:   "#8B5CF6",
  hotel:            "#10B981",
  seguro:           "#F59E0B",
  transfer:         "#F97316",
  taxa:             "#EF4444",
  comissao:         "#06B6D4",
  outro:            "#94A3B8",
};

// ─── Custom tooltip for charts ────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--hub-border)] bg-white p-3 shadow-md text-xs">
      <p className="mb-2 font-semibold text-[var(--hub-text-primary)]">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--hub-text-secondary)]">{p.name}:</span>
          <span className="font-semibold text-[var(--hub-text-primary)]">{formatBRL(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiFinCard({
  icon, label, value, trend, trendLabel, iconBg, iconColor, delay = 0,
}: {
  icon: React.ElementType; label: string; value: string;
  trend?: "up" | "down"; trendLabel?: string;
  iconBg: string; iconColor: string; delay?: number;
}) {
  const Icon = icon;
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;
  const trendColor = trend === "up" ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50";
  return (
    <div
      className="animate-fade-in-up rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white p-5 shadow-[var(--hub-shadow-xs)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {trend && trendLabel && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            {trendLabel}
          </span>
        )}
      </div>
      <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-[var(--hub-text-primary)]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[var(--hub-text-secondary)]">{label}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Aba = "lancamentos" | "graficos";

export default function FinanceiroPage() {
  const {
    clientes, lancamentos, addLancamento, updateLancamento, deleteLancamento,
    syncLancamentosFromApi, hasRemoteApi, isReady,
  } = useData();
  const toast = useToast();

  const [aba, setAba] = useState<Aba>("lancamentos");
  const [showForm, setShowForm] = useState(false);

  // Edit modal
  const [editando, setEditando] = useState<LancamentoFinanceiro | null>(null);
  const [editDescricao, setEditDescricao] = useState("");
  const [editTipo, setEditTipo] = useState<LancamentoTipo>("entrada");
  const [editCategoria, setEditCategoria] = useState<LancamentoCategoria>("pacote_vendido");
  const [editValor, setEditValor] = useState("");
  const [editData, setEditData] = useState("");
  const [editStatus, setEditStatus] = useState<LancamentoStatus>("confirmado");
  const [editClienteId, setEditClienteId] = useState("");
  const [editConta, setEditConta] = useState("");

  function abrirEditar(l: LancamentoFinanceiro) {
    setEditando(l);
    setEditDescricao(l.descricao);
    setEditTipo(l.tipo);
    setEditCategoria(l.categoria);
    setEditValor(String(l.valor));
    setEditData(l.data.slice(0, 10));
    setEditStatus(l.status);
    setEditClienteId(l.clienteId ?? "");
    setEditConta(l.contaBancaria ?? "");
  }
  function fecharEditar() { setEditando(null); }
  async function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    const v = Math.abs(parseFloat(editValor.replace(",", ".")) || 0);
    if (!editDescricao.trim() || v === 0) return;
    try {
      await updateLancamento(editando.id, {
        descricao: editDescricao.trim(), tipo: editTipo, categoria: editCategoria,
        valor: v, data: editData, status: editStatus,
        clienteId: editClienteId || undefined,
        contaBancaria: editConta.trim() || undefined,
      });
      toast.success("Lançamento atualizado!");
      fecharEditar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o lançamento.");
    }
  }
  async function handleExcluir(l: LancamentoFinanceiro) {
    if (!confirm(`Excluir "${l.descricao}"?`)) return;
    try {
      await deleteLancamento(l.id);
      toast.success("Lançamento excluído.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir o lançamento.");
    }
  }

  // Filters
  const [tipoF, setTipoF] = useState<LancamentoTipo | "todos">("todos");
  const [catF, setCatF] = useState<LancamentoCategoria | "todos">("todos");
  const [statusF, setStatusF] = useState<LancamentoStatus | "todos">("todos");
  const [contaF, setContaF] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // New entry form
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<LancamentoTipo>("entrada");
  const [categoria, setCategoria] = useState<LancamentoCategoria>("pacote_vendido");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<LancamentoStatus>("confirmado");
  const [clienteId, setClienteId] = useState("");
  const [contaBancaria, setContaBancaria] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (!isReady || !hasRemoteApi) return;
    void syncLancamentosFromApi().catch((error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar o financeiro.");
    });
  }, [hasRemoteApi, isReady, syncLancamentosFromApi, toast]);

  const nomeCliente = useMemo(() => {
    const m = new Map<string, string>();
    clientes.forEach((c) => m.set(c.id, c.nome));
    return m;
  }, [clientes]);

  const contas = useMemo(() => contasUnicas(lancamentos), [lancamentos]);

  const filtrados = useMemo(() => lancamentos.filter((l) => {
    if (tipoF !== "todos" && l.tipo !== tipoF) return false;
    if (catF !== "todos" && l.categoria !== catF) return false;
    if (statusF !== "todos" && l.status !== statusF) return false;
    if (contaF && l.contaBancaria !== contaF) return false;
    if (!inRange(l.data, inicio, fim)) return false;
    return true;
  }), [lancamentos, tipoF, catF, statusF, contaF, inicio, fim]);

  const resumo = useMemo(() => computeFinanceiroResumo(filtrados), [filtrados]);
  const fluxo  = useMemo(() => buildFluxoCaixa(filtrados), [filtrados]);
  const pieData = useMemo(() => buildPieData(filtrados), [filtrados]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim()) return;
    const v = Math.abs(parseFloat(valor.replace(",", ".")) || 0);
    if (v === 0) return;
    try {
      await addLancamento({
        descricao: descricao.trim(), tipo, categoria, valor: v,
        data: data.slice(0, 10), status,
        clienteId: clienteId || undefined,
        contaBancaria: contaBancaria.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      });
      setDescricao(""); setValor(""); setClienteId(""); setContaBancaria("");
      setObservacoes("");
      setShowForm(false);
      toast.success("Lançamento registrado!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar o lançamento.");
    }
  }

  if (!isReady) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--hub-border)] border-t-[var(--hub-primary)]" />
      </div>
    );
  }

  const sorted = filtrados.slice().sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="space-y-6">

      {/* ── Edit modal ──────────────────────────────────────────────────────── */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
          <div className="animate-scale-in w-full max-w-md rounded-[var(--hub-radius-xl)] bg-white p-6 shadow-xl border border-[var(--hub-border)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--hub-text-primary)]">Editar lançamento</h2>
              <button type="button" onClick={fecharEditar} className="rounded-lg p-1.5 text-[var(--hub-text-muted)] hover:bg-[var(--hub-bg-subtle)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSalvarEdicao} className="space-y-3">
              <div>
                <Label htmlFor="ed-desc">Descrição</Label>
                <Input id="ed-desc" required value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ed-tipo">Tipo</Label>
                  <Select id="ed-tipo" value={editTipo} onChange={(e) => setEditTipo(e.target.value as LancamentoTipo)}>
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ed-valor">Valor (R$)</Label>
                  <Input id="ed-valor" required value={editValor} onChange={(e) => setEditValor(e.target.value)} placeholder="0,00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ed-data">Data</Label>
                  <Input id="ed-data" type="date" required value={editData} onChange={(e) => setEditData(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="ed-status">Status</Label>
                  <Select id="ed-status" value={editStatus} onChange={(e) => setEditStatus(e.target.value as LancamentoStatus)}>
                    {(Object.keys(LANCAMENTO_STATUS_LABELS) as LancamentoStatus[]).map((s) => (
                      <option key={s} value={s}>{LANCAMENTO_STATUS_LABELS[s]}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="ed-cat">Categoria</Label>
                <Select id="ed-cat" value={editCategoria} onChange={(e) => setEditCategoria(e.target.value as LancamentoCategoria)}>
                  {(Object.keys(LANCAMENTO_CATEGORIA_LABELS) as LancamentoCategoria[]).map((c) => (
                    <option key={c} value={c}>{LANCAMENTO_CATEGORIA_LABELS[c]}</option>
                  ))}
                </Select>
              </div>
              <div>
                <ClientePicker id="ed-cli" label="Cliente (opcional)" clientes={clientes} value={editClienteId} onChange={(id) => setEditClienteId(id)} />
              </div>
              <div>
                <Label htmlFor="ed-conta">Conta bancária</Label>
                <Input id="ed-conta" value={editConta} onChange={(e) => setEditConta(e.target.value)} placeholder="Ex.: Nubank" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={fecharEditar}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--hub-text-primary)]">Financeiro</h1>
          <p className="mt-0.5 text-sm text-[var(--hub-text-secondary)]">
            Controle de receitas, despesas e fluxo de caixa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportarLancamentosCSV(filtrados, clientes)}
            className="flex items-center gap-1.5 rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--hub-text-secondary)] shadow-[var(--hub-shadow-xs)] transition-all hover:bg-[var(--hub-bg-subtle)]"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar
          </button>
          <a href="/financeiro/receita" className="flex items-center gap-1.5 rounded-[var(--hub-radius)] bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-[var(--hub-shadow-xs)] transition-all hover:bg-emerald-700">
            <Plus className="h-3.5 w-3.5" />
            Cadastrar receita
          </a>
          <a href="/financeiro/despesa" className="flex items-center gap-1.5 rounded-[var(--hub-radius)] bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-[var(--hub-shadow-xs)] transition-all hover:bg-red-700">
            <Plus className="h-3.5 w-3.5" />
            Cadastrar despesa
          </a>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiFinCard icon={TrendingUp}   label="Receita total"  value={formatBRL(resumo.faturamento)}   iconBg="bg-sky-100"     iconColor="text-sky-600"     trend="up"   trendLabel="+receitas" delay={0}   />
        <KpiFinCard icon={TrendingDown} label="Despesas"       value={formatBRL(resumo.totalDespesas)} iconBg="bg-orange-100"  iconColor="text-orange-600"  delay={40}  />
        <KpiFinCard icon={Wallet}       label="Saldo líquido"  value={formatBRL(resumo.saldo)}         iconBg="bg-emerald-100" iconColor="text-emerald-600" delay={80}  />
        <KpiFinCard icon={Clock}        label="A confirmar"    value={formatBRL(resumo.aReceber)}      iconBg="bg-amber-100"   iconColor="text-amber-600"   delay={120} />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="inline-flex items-center rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white p-1 shadow-[var(--hub-shadow-xs)]">
        {(["lancamentos", "graficos"] as Aba[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setAba(tab)}
            className={`rounded-[var(--hub-radius-sm)] px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              aba === tab
                ? "bg-[var(--hub-bg-subtle)] text-[var(--hub-text-primary)] shadow-[var(--hub-shadow-xs)]"
                : "text-[var(--hub-text-secondary)] hover:text-[var(--hub-text-primary)]"
            }`}
          >
            {tab === "lancamentos" ? "Lançamentos" : "Gráficos"}
          </button>
        ))}
      </div>

      {/* ── Tab: Lançamentos ───────────────────────────────────────────────── */}
      {aba === "lancamentos" && (
        <div className="animate-fade-in space-y-4">
          {/* Filter bar */}
          <div className="flex flex-col gap-3 rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white p-4 shadow-[var(--hub-shadow-xs)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--hub-text-primary)]">
                {filtrados.length} lançamento{filtrados.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  showFilters ? "bg-[var(--hub-primary)] text-white" : "border border-[var(--hub-border)] text-[var(--hub-text-secondary)] hover:bg-[var(--hub-bg-subtle)]"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filtros
              </button>
            </div>

            {showFilters && (
              <div className="animate-fade-in-up grid gap-3 border-t border-[var(--hub-border)] pt-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                <div>
                  <Label htmlFor="d0" className="text-xs">De</Label>
                  <Input id="d0" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="text-xs" />
                </div>
                <div>
                  <Label htmlFor="d1" className="text-xs">Até</Label>
                  <Input id="d1" type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="text-xs" />
                </div>
                <div>
                  <Label htmlFor="tf" className="text-xs">Tipo</Label>
                  <Select id="tf" value={tipoF} onChange={(e) => setTipoF(e.target.value as LancamentoTipo | "todos")} className="text-xs">
                    <option value="todos">Todos</option>
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sf" className="text-xs">Status</Label>
                  <Select id="sf" value={statusF} onChange={(e) => setStatusF(e.target.value as LancamentoStatus | "todos")} className="text-xs">
                    <option value="todos">Todos</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="previsto">Previsto</option>
                    <option value="cancelado">Cancelado</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cf" className="text-xs">Categoria</Label>
                  <Select id="cf" value={catF} onChange={(e) => setCatF(e.target.value as LancamentoCategoria | "todos")} className="text-xs">
                    <option value="todos">Todas</option>
                    {(Object.keys(LANCAMENTO_CATEGORIA_LABELS) as LancamentoCategoria[]).map((k) => (
                      <option key={k} value={k}>{LANCAMENTO_CATEGORIA_LABELS[k]}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contaF" className="text-xs">Conta</Label>
                  <Select id="contaF" value={contaF} onChange={(e) => setContaF(e.target.value)} className="text-xs">
                    <option value="">Todas</option>
                    {contas.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Transaction table */}
          <div className="overflow-hidden rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white shadow-[var(--hub-shadow-xs)]">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--hub-bg-subtle)]">
                  <Wallet className="h-6 w-6 text-[var(--hub-text-muted)]" />
                </div>
                <p className="text-sm font-medium text-[var(--hub-text-secondary)]">Nenhum lançamento encontrado</p>
                <p className="text-xs text-[var(--hub-text-muted)]">Adicione um lançamento ou ajuste os filtros</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]/60">
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-text-muted)]">Data</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-text-muted)]">Descrição</th>
                      <th className="hidden px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-text-muted)] md:table-cell">Categoria</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-text-muted)]">Status</th>
                      <th className="hidden px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-text-muted)] lg:table-cell">Cliente</th>
                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-text-muted)]">Valor</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hub-border)]">
                    {sorted.map((l, i) => (
                      <tr
                        key={l.id}
                        className="animate-fade-in-up group transition-colors hover:bg-[var(--hub-bg-subtle)]/40"
                        style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                              l.tipo === "entrada" ? "bg-emerald-50" : "bg-red-50"
                            }`}>
                              {l.tipo === "entrada"
                                ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                                : <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />}
                            </div>
                            <span className="text-xs text-[var(--hub-text-muted)]">{formatDateBR(l.data)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-[var(--hub-text-primary)]">{l.descricao}</span>
                          {l.contaBancaria && (
                            <span className="ml-2 hidden text-[10px] text-[var(--hub-text-muted)] sm:inline">· {l.contaBancaria}</span>
                          )}
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              background: `${CAT_COLORS[l.categoria] ?? "#94A3B8"}18`,
                              color: CAT_COLORS[l.categoria] ?? "#94A3B8",
                            }}>
                            {LANCAMENTO_CATEGORIA_LABELS[l.categoria]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[l.status]}`}>
                            {LANCAMENTO_STATUS_LABELS[l.status]}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-[var(--hub-text-secondary)] lg:table-cell">
                          {l.clienteId ? nomeCliente.get(l.clienteId) ?? "—" : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono text-sm font-semibold ${l.tipo === "entrada" ? "text-emerald-600" : "text-red-600"}`}>
                            {l.tipo === "entrada" ? "+" : "−"}{formatBRL(l.valor)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button type="button" onClick={() => abrirEditar(l)}
                              className="rounded-lg p-1.5 text-[var(--hub-text-secondary)] transition-colors hover:bg-sky-50 hover:text-sky-600">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => void handleExcluir(l)}
                              className="rounded-lg p-1.5 text-[var(--hub-text-secondary)] transition-colors hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Gráficos ─────────────────────────────────────────────────── */}
      {aba === "graficos" && (
        <div className="animate-fade-in grid gap-6 lg:grid-cols-2">
          {/* Area chart — fluxo */}
          <div className="rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white p-5 shadow-[var(--hub-shadow-xs)]">
            <h3 className="text-sm font-semibold text-[var(--hub-text-primary)]">Receitas vs Despesas</h3>
            <p className="mt-0.5 text-xs text-[var(--hub-text-muted)]">Fluxo mensal de caixa</p>
            <div className="mt-4 h-[220px]">
              {fluxo.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-[var(--hub-text-muted)]">Sem dados para exibir</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fluxo} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="entradas" name="Receitas" stroke="#0EA5E9" strokeWidth={2} fill="url(#gradEntradas)" dot={false} />
                    <Area type="monotone" dataKey="saidas"   name="Despesas" stroke="#F97316" strokeWidth={2} fill="url(#gradSaidas)"  dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pie chart — por categoria */}
          <div className="rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white p-5 shadow-[var(--hub-shadow-xs)]">
            <h3 className="text-sm font-semibold text-[var(--hub-text-primary)]">Receita por categoria</h3>
            <p className="mt-0.5 text-xs text-[var(--hub-text-muted)]">Distribuição das entradas</p>
            <div className="mt-4 h-[220px]">
              {pieData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-[var(--hub-text-muted)]">Sem receitas para exibir</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => typeof v === "number" ? formatBRL(v) : v} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bar chart — saldo */}
          <div className="lg:col-span-2 rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white p-5 shadow-[var(--hub-shadow-xs)]">
            <h3 className="text-sm font-semibold text-[var(--hub-text-primary)]">Saldo por período</h3>
            <p className="mt-0.5 text-xs text-[var(--hub-text-muted)]">Resultado mensal acumulado</p>
            <div className="mt-4 h-[200px]">
              {fluxo.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-[var(--hub-text-muted)]">Sem dados para exibir</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fluxo} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="saldo" name="Saldo" radius={[4, 4, 0, 0]}>
                      {fluxo.map((entry, i) => (
                        <Cell key={i} fill={entry.saldo >= 0 ? "#10B981" : "#EF4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── New entry slide-in form ────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center animate-fade-in">
          <div className="animate-scale-in w-full max-w-lg rounded-[var(--hub-radius-xl)] bg-white shadow-xl border border-[var(--hub-border)]">
            <div className="flex items-center justify-between border-b border-[var(--hub-border)] px-6 py-4">
              <h2 className="text-base font-semibold text-[var(--hub-text-primary)]">Novo lançamento</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-[var(--hub-text-muted)] hover:bg-[var(--hub-bg-subtle)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="desc">Descrição</Label>
                <Input id="desc" required value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Pacote Europa — João Silva" />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as LancamentoTipo)}>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="cat">Categoria</Label>
                <Select id="cat" value={categoria} onChange={(e) => setCategoria(e.target.value as LancamentoCategoria)}>
                  {(Object.keys(LANCAMENTO_CATEGORIA_LABELS) as LancamentoCategoria[]).map((k) => (
                    <option key={k} value={k}>{LANCAMENTO_CATEGORIA_LABELS[k]}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input id="valor" inputMode="decimal" required placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="data">Data</Label>
                <Input id="data" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="st">Status</Label>
                <Select id="st" value={status} onChange={(e) => setStatus(e.target.value as LancamentoStatus)}>
                  <option value="confirmado">Confirmado</option>
                  <option value="previsto">Previsto</option>
                  <option value="cancelado">Cancelado</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="conta">Conta bancária</Label>
                <Input id="conta" placeholder="Ex: Nubank" value={contaBancaria} onChange={(e) => setContaBancaria(e.target.value)} list="contas-list" />
                <datalist id="contas-list">{contas.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="sm:col-span-2">
                <ClientePicker id="cli-fin" label="Cliente (opcional)" clientes={clientes} value={clienteId} onChange={setClienteId} />
              </div>
              <div className="sm:col-span-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] p-3 text-sm text-[var(--hub-text-secondary)]">
                Este formulário registra apenas dinheiro que entrou ou saiu da conta. Para cadastrar venda, fornecedor, parcelas ou comissão, use a aba <a href="/vendas" className="font-medium text-[var(--hub-blue)] underline">Vendas</a>.
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="obs-fin">Observações</Label>
                <textarea id="obs-fin" rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] px-3 py-2 text-sm" placeholder="Detalhes extras sobre a reserva ou lançamento" />
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit">Registrar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
