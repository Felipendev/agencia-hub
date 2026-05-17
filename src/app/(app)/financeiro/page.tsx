"use client";

import { useMemo, useState } from "react";
import {
  computeFinanceiroResumo,
  useData,
} from "@/contexts/data-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
import { KpiCard } from "@/components/kpi-card";
import { formatBRL, formatDateBR } from "@/lib/format";
import { exportarLancamentosCSV, exportarResumoFinanceiroCSV } from "@/lib/csv-export";
import { DownloadIcon } from "@/components/icons";
import {
  LANCAMENTO_CATEGORIA_LABELS,
  LANCAMENTO_STATUS_LABELS,
} from "@/lib/constants";
import type {
  LancamentoCategoria,
  LancamentoFinanceiro,
  LancamentoStatus,
  LancamentoTipo,
} from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inRange(isoDate: string, inicio: string, fim: string) {
  if (!inicio && !fim) return true;
  const d = isoDate.slice(0, 10);
  if (inicio && d < inicio) return false;
  if (fim && d > fim) return false;
  return true;
}

/** Agrupa lançamentos por mês (YYYY-MM) e calcula entradas, saídas e saldo acumulado. */
function buildFluxoCaixa(lancamentos: LancamentoFinanceiro[]) {
  // Apenas lançamentos não cancelados
  const validos = lancamentos.filter((l) => l.status !== "cancelado");

  // Coletar todos os meses presentes
  const mesesSet = new Set<string>();
  for (const l of validos) {
    mesesSet.add(l.data.slice(0, 7));
  }

  // Ordenar meses
  const meses = Array.from(mesesSet).sort();

  let saldoAcumulado = 0;
  return meses.map((mes) => {
    const doMes = validos.filter((l) => l.data.slice(0, 7) === mes);
    const entradas = doMes
      .filter((l) => l.tipo === "entrada")
      .reduce((s, l) => s + l.valor, 0);
    const saidas = doMes
      .filter((l) => l.tipo === "saida")
      .reduce((s, l) => s + l.valor, 0);
    saldoAcumulado += entradas - saidas;

    // Label legível: "Jan/2026"
    const [ano, m] = mes.split("-");
    const label = new Date(Number(ano), Number(m) - 1, 1).toLocaleDateString(
      "pt-BR",
      { month: "short", year: "numeric" },
    );

    return { mes, label, entradas, saidas, saldo: entradas - saidas, saldoAcumulado };
  });
}

/** Extrai contas bancárias únicas dos lançamentos. */
function contasUnicas(lancamentos: LancamentoFinanceiro[]): string[] {
  const set = new Set<string>();
  for (const l of lancamentos) {
    if (l.contaBancaria?.trim()) set.add(l.contaBancaria.trim());
  }
  return Array.from(set).sort();
}

// ─── Componente principal ────────────────────────────────────────────────────

type Aba = "lancamentos" | "fluxo";

export default function FinanceiroPage() {
  const { clientes, lancamentos, addLancamento, updateLancamento, deleteLancamento, isReady } = useData();
  const toast = useToast();

  const [aba, setAba] = useState<Aba>("lancamentos");

  // Edit modal state
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

  function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    const v = Math.abs(parseFloat(editValor.replace(",", ".")) || 0);
    if (!editDescricao.trim() || v === 0) return;
    updateLancamento(editando.id, {
      descricao: editDescricao.trim(),
      tipo: editTipo,
      categoria: editCategoria,
      valor: v,
      data: editData,
      status: editStatus,
      clienteId: editClienteId || undefined,
      contaBancaria: editConta.trim() || undefined,
    });
    toast.success("Lançamento atualizado!");
    fecharEditar();
  }

  async function handleExcluir(l: LancamentoFinanceiro) {
    if (!confirm(`Excluir "${l.descricao}"? Esta ação não pode ser desfeita.`)) return;
    await deleteLancamento(l.id);
    toast.success("Lançamento excluído.");
  }

  // Filtros
  const [tipoF, setTipoF] = useState<LancamentoTipo | "todos">("todos");
  const [catF, setCatF] = useState<LancamentoCategoria | "todos">("todos");
  const [statusF, setStatusF] = useState<LancamentoStatus | "todos">("todos");
  const [contaF, setContaF] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  // Formulário novo lançamento
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<LancamentoTipo>("entrada");
  const [categoria, setCategoria] = useState<LancamentoCategoria>("pacote_vendido");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<LancamentoStatus>("confirmado");
  const [clienteId, setClienteId] = useState("");
  const [contaBancaria, setContaBancaria] = useState("");

  const nomeCliente = useMemo(() => {
    const m = new Map<string, string>();
    clientes.forEach((c) => m.set(c.id, c.nome));
    return m;
  }, [clientes]);

  const contas = useMemo(() => contasUnicas(lancamentos), [lancamentos]);

  const filtrados = useMemo(() => {
    return lancamentos.filter((l) => {
      if (tipoF !== "todos" && l.tipo !== tipoF) return false;
      if (catF !== "todos" && l.categoria !== catF) return false;
      if (statusF !== "todos" && l.status !== statusF) return false;
      if (contaF && l.contaBancaria !== contaF) return false;
      if (!inRange(l.data, inicio, fim)) return false;
      return true;
    });
  }, [lancamentos, tipoF, catF, statusF, contaF, inicio, fim]);

  const resumoFiltrado = useMemo(
    () => computeFinanceiroResumo(filtrados),
    [filtrados],
  );

  const fluxo = useMemo(() => buildFluxoCaixa(filtrados), [filtrados]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim()) return;
    const v = Math.abs(parseFloat(valor.replace(",", ".")) || 0);
    if (v === 0) return;
    void addLancamento({
      descricao: descricao.trim(),
      tipo,
      categoria,
      valor: v,
      data: data.slice(0, 10),
      status,
      clienteId: clienteId || undefined,
      contaBancaria: contaBancaria.trim() || undefined,
    });
    setDescricao("");
    setValor("");
    setClienteId("");
    setContaBancaria("");
    toast.success("Lançamento registrado com sucesso!");
  }

  function handleExportarLancamentos() {
    exportarLancamentosCSV(filtrados, clientes);
    toast.success("Arquivo CSV baixado com sucesso!");
  }

  function handleExportarResumo() {
    exportarResumoFinanceiroCSV(resumoFiltrado);
    toast.success("Resumo financeiro exportado!");
  }

  if (!isReady) {
    return <p className="text-sm text-[var(--hub-text-secondary)]">Carregando…</p>;
  }

  return (
    <div className="space-y-8">

      {/* ── Modal de edição ─────────────────────────────── */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[var(--hub-radius-xl)] border border-[var(--hub-border)] bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-[var(--hub-blue-dark)]">Editar lançamento</h2>
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
                <Label htmlFor="ed-cli">Cliente (opcional)</Label>
                <ClientePicker id="ed-cli" label="" clientes={clientes} value={editClienteId} onChange={(id) => setEditClienteId(id)} />
              </div>
              <div>
                <Label htmlFor="ed-conta">Conta bancária (opcional)</Label>
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

      <PageHeader
        title="Financeiro"
        description="Lançamentos manuais com categorias, contas bancárias e fluxo de caixa."
      >
        <Button
          type="button"
          variant="secondary"
          className="text-xs"
          onClick={handleExportarResumo}
        >
          <DownloadIcon className="mr-1.5 h-4 w-4" />
          Exportar Resumo
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="text-xs"
          onClick={handleExportarLancamentos}
        >
          <DownloadIcon className="mr-1.5 h-4 w-4" />
          Exportar Lançamentos
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Faturamento (filtro)"
          value={formatBRL(resumoFiltrado.faturamento)}
        />
        <KpiCard
          title="Recebido"
          value={formatBRL(resumoFiltrado.totalRecebido)}
          accent="green"
        />
        <KpiCard
          title="A receber"
          value={formatBRL(resumoFiltrado.aReceber)}
          accent="yellow"
        />
        <KpiCard
          title="Despesas"
          value={formatBRL(resumoFiltrado.totalDespesas)}
          accent="red"
        />
        <KpiCard title="Saldo" value={formatBRL(resumoFiltrado.saldo)} />
      </div>

      {/* Filtros */}
      <Card>
        <CardTitle>Filtros</CardTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
          <div>
            <Label htmlFor="d0">De</Label>
            <Input
              id="d0"
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="d1">Até</Label>
            <Input
              id="d1"
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="tf">Tipo</Label>
            <Select
              id="tf"
              value={tipoF}
              onChange={(e) => setTipoF(e.target.value as LancamentoTipo | "todos")}
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="cf">Categoria</Label>
            <Select
              id="cf"
              value={catF}
              onChange={(e) => setCatF(e.target.value as LancamentoCategoria | "todos")}
            >
              <option value="todos">Todas</option>
              {(Object.keys(LANCAMENTO_CATEGORIA_LABELS) as LancamentoCategoria[]).map(
                (k) => (
                  <option key={k} value={k}>
                    {LANCAMENTO_CATEGORIA_LABELS[k]}
                  </option>
                ),
              )}
            </Select>
          </div>
          <div>
            <Label htmlFor="sf">Status</Label>
            <Select
              id="sf"
              value={statusF}
              onChange={(e) => setStatusF(e.target.value as LancamentoStatus | "todos")}
            >
              <option value="todos">Todos</option>
              <option value="previsto">Previsto</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <Label htmlFor="contaF">Conta bancária</Label>
            <Select
              id="contaF"
              value={contaF}
              onChange={(e) => setContaF(e.target.value)}
            >
              <option value="">Todas as contas</option>
              {contas.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Abas */}
      <div className="flex gap-1 border-b border-[var(--hub-border)]">
        <button
          type="button"
          onClick={() => setAba("lancamentos")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            aba === "lancamentos"
              ? "border-b-2 border-[var(--hub-blue)] text-[var(--hub-blue)]"
              : "text-[var(--hub-text-muted)] hover:text-[var(--hub-text-primary)]"
          }`}
        >
          Lançamentos
        </button>
        <button
          type="button"
          onClick={() => setAba("fluxo")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            aba === "fluxo"
              ? "border-b-2 border-[var(--hub-blue)] text-[var(--hub-blue)]"
              : "text-[var(--hub-text-muted)] hover:text-[var(--hub-text-primary)]"
          }`}
        >
          Fluxo de caixa
        </button>
      </div>

      {/* Aba: Lançamentos */}
      {aba === "lancamentos" && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardTitle>Lançamentos</CardTitle>
            <div className="mt-4">
              <Table>
                <thead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Descrição</Th>
                    <Th>Tipo</Th>
                    <Th>Categoria</Th>
                    <Th>Status</Th>
                    <Th>Cliente</Th>
                    <Th>Conta</Th>
                    <Th className="text-right">Valor</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {filtrados
                    .slice()
                    .sort((a, b) => b.data.localeCompare(a.data))
                    .map((l) => (
                      <tr key={l.id}>
                        <Td className="whitespace-nowrap">
                          {formatDateBR(l.data)}
                        </Td>
                        <Td>
                          <span className="font-medium text-[var(--hub-blue-dark)]">
                            {l.descricao}
                          </span>
                        </Td>
                        <Td>
                          <Badge tone={l.tipo === "entrada" ? "success" : "danger"}>
                            {l.tipo === "entrada" ? "Entrada" : "Saída"}
                          </Badge>
                        </Td>
                        <Td>{LANCAMENTO_CATEGORIA_LABELS[l.categoria]}</Td>
                        <Td>
                          <Badge tone="muted">
                            {LANCAMENTO_STATUS_LABELS[l.status]}
                          </Badge>
                        </Td>
                        <Td className="text-[var(--hub-text-secondary)]">
                          {l.clienteId ? nomeCliente.get(l.clienteId) ?? "—" : "—"}
                        </Td>
                        <Td className="text-[var(--hub-text-muted)] text-xs">
                          {l.contaBancaria ?? "—"}
                        </Td>
                        <Td
                          className={`text-right font-semibold tabular-nums ${
                            l.tipo === "entrada" ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {l.tipo === "entrada" ? "+" : "−"}
                          {formatBRL(l.valor)}
                        </Td>
                        <Td className="whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => abrirEditar(l)}
                            className="mr-2 text-xs text-[var(--hub-blue)] hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExcluir(l)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Excluir
                          </button>
                        </Td>
                      </tr>
                    ))}
                </tbody>
              </Table>
              {filtrados.length === 0 && (
                <p className="mt-4 text-center text-sm text-[var(--hub-text-muted)]">
                  Nenhum lançamento com os filtros atuais.
                </p>
              )}
            </div>
          </Card>

          {/* Formulário */}
          <Card className="h-fit">
            <CardTitle>Novo lançamento</CardTitle>
            <form onSubmit={handleAdd} className="mt-4 space-y-3">
              <div>
                <Label htmlFor="desc">Descrição</Label>
                <Input
                  id="desc"
                  required
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    id="tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as LancamentoTipo)}
                  >
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cat">Categoria</Label>
                  <Select
                    id="cat"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as LancamentoCategoria)}
                  >
                    {(Object.keys(LANCAMENTO_CATEGORIA_LABELS) as LancamentoCategoria[]).map(
                      (k) => (
                        <option key={k} value={k}>
                          {LANCAMENTO_CATEGORIA_LABELS[k]}
                        </option>
                      ),
                    )}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  inputMode="decimal"
                  required
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    required
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="st">Status</Label>
                  <Select
                    id="st"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LancamentoStatus)}
                  >
                    <option value="previsto">Previsto</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="conta">Conta bancária (opcional)</Label>
                <Input
                  id="conta"
                  placeholder="Ex: Nubank, Itaú PJ, Caixa…"
                  value={contaBancaria}
                  onChange={(e) => setContaBancaria(e.target.value)}
                  list="contas-list"
                />
                {/* Sugestões das contas já cadastradas */}
                <datalist id="contas-list">
                  {contas.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <ClientePicker
                  id="cli-fin"
                  label="Cliente (opcional)"
                  clientes={clientes}
                  value={clienteId}
                  onChange={setClienteId}
                />
              </div>
              <Button type="submit" className="w-full">
                Registrar lançamento
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Aba: Fluxo de caixa */}
      {aba === "fluxo" && (
        <div className="space-y-6">
          <Card>
            <CardTitle>Fluxo de caixa mensal</CardTitle>
            <p className="mt-1 text-sm text-[var(--hub-text-muted)]">
              Entradas e saídas agrupadas por mês, com saldo acumulado. Lançamentos
              cancelados são excluídos.
            </p>

            {fluxo.length === 0 ? (
              <p className="mt-6 text-center text-sm text-[var(--hub-text-muted)]">
                Nenhum lançamento no período selecionado.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>Mês</Th>
                      <Th className="text-right">Entradas</Th>
                      <Th className="text-right">Saídas</Th>
                      <Th className="text-right">Saldo do mês</Th>
                      <Th className="text-right">Saldo acumulado</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {fluxo.map((row) => (
                      <tr key={row.mes}>
                        <Td className="font-medium capitalize">{row.label}</Td>
                        <Td className="text-right tabular-nums text-emerald-700 font-medium">
                          +{formatBRL(row.entradas)}
                        </Td>
                        <Td className="text-right tabular-nums text-red-700 font-medium">
                          −{formatBRL(row.saidas)}
                        </Td>
                        <Td
                          className={`text-right tabular-nums font-semibold ${
                            row.saldo >= 0 ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {row.saldo >= 0 ? "+" : ""}
                          {formatBRL(row.saldo)}
                        </Td>
                        <Td
                          className={`text-right tabular-nums font-bold ${
                            row.saldoAcumulado >= 0
                              ? "text-[var(--hub-blue-dark)]"
                              : "text-red-700"
                          }`}
                        >
                          {formatBRL(row.saldoAcumulado)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totais */}
                  <tfoot>
                    <tr className="border-t-2 border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]">
                      <Td className="font-bold text-[var(--hub-blue-dark)]">
                        Total
                      </Td>
                      <Td className="text-right tabular-nums font-bold text-emerald-700">
                        +{formatBRL(fluxo.reduce((s, r) => s + r.entradas, 0))}
                      </Td>
                      <Td className="text-right tabular-nums font-bold text-red-700">
                        −{formatBRL(fluxo.reduce((s, r) => s + r.saidas, 0))}
                      </Td>
                      <Td
                        className={`text-right tabular-nums font-bold ${
                          resumoFiltrado.saldo >= 0
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {resumoFiltrado.saldo >= 0 ? "+" : ""}
                        {formatBRL(resumoFiltrado.saldo)}
                      </Td>
                      <Td className="text-right text-[var(--hub-text-muted)] text-xs">
                        —
                      </Td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            )}
          </Card>

          {/* Resumo por conta bancária */}
          {contas.length > 0 && (
            <Card>
              <CardTitle>Saldo por conta bancária</CardTitle>
              <p className="mt-1 text-sm text-[var(--hub-text-muted)]">
                Lançamentos confirmados agrupados por conta.
              </p>
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>Conta</Th>
                      <Th className="text-right">Entradas</Th>
                      <Th className="text-right">Saídas</Th>
                      <Th className="text-right">Saldo</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {contas.map((conta) => {
                      const daConta = lancamentos.filter(
                        (l) => l.contaBancaria === conta && l.status === "confirmado",
                      );
                      const entradas = daConta
                        .filter((l) => l.tipo === "entrada")
                        .reduce((s, l) => s + l.valor, 0);
                      const saidas = daConta
                        .filter((l) => l.tipo === "saida")
                        .reduce((s, l) => s + l.valor, 0);
                      const saldo = entradas - saidas;
                      return (
                        <tr key={conta}>
                          <Td className="font-medium text-[var(--hub-blue-dark)]">
                            {conta}
                          </Td>
                          <Td className="text-right tabular-nums text-emerald-700">
                            +{formatBRL(entradas)}
                          </Td>
                          <Td className="text-right tabular-nums text-red-700">
                            −{formatBRL(saidas)}
                          </Td>
                          <Td
                            className={`text-right tabular-nums font-semibold ${
                              saldo >= 0 ? "text-emerald-700" : "text-red-700"
                            }`}
                          >
                            {saldo >= 0 ? "+" : ""}
                            {formatBRL(saldo)}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
