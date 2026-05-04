import { formatDateBR } from "@/lib/format";
import type { LancamentoFinanceiro, Cliente } from "@/types";

/**
 * Converte array de objetos para CSV
 */
function arrayToCSV(data: string[][]): string {
  return data
    .map((row) =>
      row
        .map((cell) => {
          // Escapa aspas duplas e envolve em aspas se necessário
          const escaped = String(cell).replace(/"/g, '""');
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(",")
    )
    .join("\n");
}

/**
 * Baixa string como arquivo CSV
 */
function downloadCSV(content: string, filename: string): void {
  // Adiciona BOM para UTF-8 (Excel reconhece acentos)
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta lançamentos financeiros para CSV
 */
export function exportarLancamentosCSV(
  lancamentos: LancamentoFinanceiro[],
  clientes: Cliente[]
): void {
  const clienteMap = new Map(clientes.map((c) => [c.id, c.nome]));

  const headers = [
    "Data",
    "Descrição",
    "Tipo",
    "Categoria",
    "Valor (R$)",
    "Status",
    "Cliente",
    "Conta Bancária",
  ];

  const rows = lancamentos.map((l) => [
    formatDateBR(l.data),
    l.descricao,
    l.tipo === "entrada" ? "Entrada" : "Saída",
    l.categoria,
    l.valor.toFixed(2).replace(".", ","),
    l.status,
    l.clienteId ? clienteMap.get(l.clienteId) || "—" : "—",
    l.contaBancaria ?? "—",
  ]);

  const csv = arrayToCSV([headers, ...rows]);
  const hoje = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `lancamentos-financeiros-${hoje}.csv`);
}

/**
 * Exporta resumo financeiro para CSV
 */
export function exportarResumoFinanceiroCSV(resumo: {
  faturamento: number;
  totalRecebido: number;
  aReceber: number;
  totalDespesas: number;
  saldo: number;
}): void {
  const headers = ["Indicador", "Valor (R$)"];
  const rows = [
    ["Faturamento (Entradas)", resumo.faturamento.toFixed(2).replace(".", ",")],
    ["Total Recebido", resumo.totalRecebido.toFixed(2).replace(".", ",")],
    ["A Receber", resumo.aReceber.toFixed(2).replace(".", ",")],
    ["Total Despesas", resumo.totalDespesas.toFixed(2).replace(".", ",")],
    ["Saldo", resumo.saldo.toFixed(2).replace(".", ",")],
  ];

  const csv = arrayToCSV([headers, ...rows]);
  const hoje = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `resumo-financeiro-${hoje}.csv`);
}

/**
 * Exporta clientes para CSV
 */
export function exportarClientesCSV(clientes: Cliente[]): void {
  const headers = [
    "Nome",
    "E-mail",
    "Telefone",
    "Destino de Interesse",
    "Status",
    "Data de Cadastro",
    "Observações",
  ];

  const rows = clientes.map((c) => [
    c.nome,
    c.email || "",
    c.telefone,
    c.destinoInteresse,
    c.status,
    formatDateBR(c.createdAt),
    c.observacoes || "",
  ]);

  const csv = arrayToCSV([headers, ...rows]);
  const hoje = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `clientes-${hoje}.csv`);
}
