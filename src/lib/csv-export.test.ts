import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportarClientesCSV, exportarLancamentosCSV, exportarResumoFinanceiroCSV } from "./csv-export";
import type { Cliente, LancamentoFinanceiro } from "@/types";

// Parse the downloaded artifact, including escaped quotes and embedded CR/LF.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (c === "," || c === "\n")) {
      row.push(cell); cell = "";
      if (c === "\n") { rows.push(row); row = []; }
    } else cell += c;
  }
  row.push(cell); rows.push(row);
  return rows;
}

const entry = (overrides: Partial<LancamentoFinanceiro> = {}): LancamentoFinanceiro => ({
  id: "entry-1", descricao: "Recebimento", tipo: "entrada", categoria: "pacote_vendido",
  valor: 170, data: "2026-10-29", status: "confirmado", ...overrides,
});

describe("CSV baixado", () => {
  let blob: Blob;
  let anchor: { href: string; download: string; click: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    anchor = { href: "", download: "", click: vi.fn() };
    vi.stubGlobal("document", { createElement: vi.fn(() => anchor), body: { appendChild: vi.fn(), removeChild: vi.fn() } });
    vi.spyOn(URL, "createObjectURL").mockImplementation((value) => { blob = value as Blob; return "blob:csv-test"; });
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  async function records(): Promise<Array<Record<string, string>>> {
    const rows = parseCsv(await blob.text());
    return rows.slice(1).map((row) => Object.fromEntries(rows[0].map((header, i) => [header, row[i]])));
  }

  it("exports commercial values separately from cash, with references, notes and recurrence", async () => {
    exportarLancamentosCSV([entry({ clienteId: "person-1", fornecedorId: "supplier-1", contaBancaria: "Banco",
      observacoes: 'Taxas, bagagem e "assentos"\r\nConferidos', valorVenda: 1332.99, custoFornecedor: 1162.99,
      valorComissao: 20, recorrencia: "MONTHLY" })], [{ id: "person-1", nome: "Sara" } as Cliente]);
    expect(await records()).toEqual([{
      Data: "29/10/2026", "Descrição": "Recebimento", Tipo: "Entrada", Categoria: "pacote_vendido",
      "Valor do lançamento (R$)": "170,00", Status: "confirmado", Cliente: "Sara", "Conta Bancária": "Banco",
      "ID do lançamento": "entry-1", "ID do cliente": "person-1", "ID do fornecedor": "supplier-1",
      "Observações": 'Taxas, bagagem e "assentos"\r\nConferidos', "Venda informada no lançamento (R$)": "1332,99",
      "Custo do fornecedor (R$)": "1162,99", "Comissão (R$)": "20,00", "Lucro bruto do lançamento (R$)": "170,00",
      "Lucro líquido do lançamento (R$)": "150,00", "Recorrência configurada": "MONTHLY",
    }]);
    expect(anchor.download).toMatch(/^lancamentos-financeiros-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(anchor.click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:csv-test");
    expect(blob.type).toBe("text/csv;charset=utf-8;");
    expect(new Uint8Array(await blob.arrayBuffer()).slice(0, 3)).toEqual(new Uint8Array([239, 187, 191]));
  });

  it("does not invent unknown costs or margins; preserves actual zero costs and negative margins", async () => {
    exportarLancamentosCSV([
      entry({ id: "unknown", valorVenda: 1000 }),
      entry({ id: "zero", valorVenda: 1000, custoFornecedor: 0, valorComissao: 0 }),
      entry({ id: "loss", valorVenda: 100, custoFornecedor: 120 }),
      entry({ id: "expense", tipo: "saida", valorVenda: 1000, custoFornecedor: 100, valorComissao: 10 }),
    ], []);
    const rows = await records();
    expect(rows[0]["Custo do fornecedor (R$)"]).toBe("");
    expect(rows[0]["Lucro líquido do lançamento (R$)"]).toBe("");
    expect(rows[1]["Lucro líquido do lançamento (R$)"]).toBe("1000,00");
    expect(rows[1]["Comissão (R$)"]).toBe("0,00");
    expect(rows[2]["Lucro líquido do lançamento (R$)"]).toBe("-20,00");
    expect(rows[3]["Lucro bruto do lançamento (R$)"]).toBe("");
    expect(rows[3].Tipo).toBe("Saída");
  });

  it("exports exactly the supplied selection without extra people or inferred supplier names", async () => {
    exportarLancamentosCSV([entry({ clienteId: "missing", fornecedorId: "supplier-id" })],
      [{ id: "unrelated", nome: "Não deve aparecer" } as Cliente]);
    const rows = await records();
    expect(rows).toHaveLength(1);
    expect(rows[0].Cliente).toBe("—");
    expect(rows[0]["ID do fornecedor"]).toBe("supplier-id");
    expect(await blob.text()).not.toContain("Não deve aparecer");
  });

  it.each(["=1+1", "+SUM(1)", "-2+1", "@SUM(1)", "\t=1+1", "\r\n  +1", "\uFEFF=1+1"])(
    "neutralizes spreadsheet formula text %j without stripping its content", async (payload) => {
      exportarLancamentosCSV([entry({ descricao: payload, observacoes: payload, contaBancaria: payload })], []);
      const [row] = await records();
      expect(row["Descrição"]).toBe("'" + payload);
      expect(row["Observações"]).toBe("'" + payload);
      expect(row["Conta Bancária"]).toBe("'" + payload);
      expect(row["Valor do lançamento (R$)"]).toBe("170,00");
    },
  );

  it("keeps negative summary amounts numeric and handles an empty financial selection", async () => {
    exportarResumoFinanceiroCSV({ faturamento: 0, totalRecebido: 100, aReceber: 10, totalDespesas: 120, saldo: -20 });
    expect((await records())[4]).toEqual({ Indicador: "Saldo", "Valor (R$)": "-20,00" });
    exportarLancamentosCSV([], []);
    expect(await records()).toEqual([]);
    expect(await blob.text()).toContain("Lucro líquido do lançamento (R$)");
  });

  it("applies text protection and proper CSV escaping to the existing people export too", async () => {
    exportarClientesCSV([{ id: "p", nome: "=HYPERLINK(1)", telefone: "+351912345678", email: "",
      destinoInteresse: 'Porto, "Portugal"', status: "prospecto", createdAt: "2026-10-29", observacoes: "linha\rseguinte" }]);
    const [row] = await records();
    expect(row.Nome).toBe("'=HYPERLINK(1)");
    expect(row.Telefone).toBe("'+351912345678");
    expect(row["Destino de Interesse"]).toBe('Porto, "Portugal"');
    expect(row["Observações"]).toBe("linha\rseguinte");
  });

  it("keeps optional person fields empty and does not emit non-finite monetary values", async () => {
    exportarClientesCSV([{ id: "p", nome: "Pessoa", telefone: "", destinoInteresse: "", status: "ativo", createdAt: "2026-10-29" } as Cliente]);
    expect((await records())[0]["E-mail"]).toBe("");
    expect((await records())[0]["Observações"]).toBe("");
    exportarLancamentosCSV([entry({ valor: Number.NaN, valorVenda: Number.POSITIVE_INFINITY, custoFornecedor: 10 })], []);
    const [row] = await records();
    expect(row["Valor do lançamento (R$)"]).toBe("");
    expect(row["Venda informada no lançamento (R$)"]).toBe("");
    expect(row["Lucro líquido do lançamento (R$)"]).toBe("");
  });
});
