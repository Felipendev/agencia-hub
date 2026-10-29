import { formatDateBR } from "@/lib/format";
import type { LancamentoFinanceiro, Cliente } from "@/types";

/**
 * Converte array de objetos para CSV
 */
function arrayToCSV(data: Array<Array<string | number>>): string {
  return data
    .map((row) =>
      row
        .map((cell) => {
          // Números vêm dos campos monetários; textos nunca devem executar fórmulas.
          const value = typeof cell === "number"
            ? (Number.isFinite(cell) ? cell.toFixed(2).replace(".", ",") : "")
            : (/^[\s\p{Cc}]*[=+@-]/u.test(cell) ? `'${cell}` : cell);
          return `"${value.replace(/"/g, '""')}"`;
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
    "Valor do lançamento (R$)",
    "Status",
    "Cliente",
    "Conta Bancária",
    "ID do lançamento",
    "ID do cliente",
    "ID do fornecedor",
    "Observações",
    "Venda informada no lançamento (R$)",
    "Custo do fornecedor (R$)",
    "Comissão (R$)",
    "Lucro bruto do lançamento (R$)",
    "Lucro líquido do lançamento (R$)",
    "Recorrência configurada",
  ];

  const rows = lancamentos.map((l) => [
    formatDateBR(l.data),
    l.descricao,
    l.tipo === "entrada" ? "Entrada" : "Saída",
    l.categoria,
    l.valor,
    l.status,
    l.clienteId ? clienteMap.get(l.clienteId) || "—" : "—",
    l.contaBancaria ?? "—",
    l.id,
    l.clienteId ?? "",
    l.fornecedorId ?? "",
    l.observacoes ?? "",
    l.valorVenda ?? "",
    l.custoFornecedor ?? "",
    l.valorComissao ?? "",
    l.tipo === "entrada" && l.valorVenda != null && l.custoFornecedor != null
      ? l.valorVenda - l.custoFornecedor : "",
    l.tipo === "entrada" && l.valorVenda != null && l.custoFornecedor != null
      ? l.valorVenda - l.custoFornecedor - (l.valorComissao ?? 0) : "",
    l.recorrencia ?? "",
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
    ["Faturamento (Entradas)", resumo.faturamento],
    ["Total Recebido", resumo.totalRecebido],
    ["A Receber", resumo.aReceber],
    ["Total Despesas", resumo.totalDespesas],
    ["Saldo", resumo.saldo],
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
