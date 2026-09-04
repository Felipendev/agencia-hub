import type {
  LancamentoCategoria,
  LancamentoFinanceiro,
  LancamentoStatus,
  LancamentoTipo,
} from "@/types";
import type {
  ApiCreateFinancialEntryRequest,
  ApiFinancialEntryCategory,
  ApiFinancialEntryResponse,
  ApiFinancialEntryStatus,
  ApiFinancialEntryType,
} from "@/lib/api/financial-types";
import { isUuid } from "@/lib/api/quotation-mapper";

// ─── Tipo ────────────────────────────────────────────────────────────────────

export function lancamentoTipoToApi(tipo: LancamentoTipo): ApiFinancialEntryType {
  return tipo === "entrada" ? "INCOME" : "EXPENSE";
}

export function apiFinancialTypeToFront(type: ApiFinancialEntryType): LancamentoTipo {
  return type === "INCOME" ? "entrada" : "saida";
}

// ─── Categoria ───────────────────────────────────────────────────────────────

export function lancamentoCategoriaToApi(
  cat: LancamentoCategoria,
): ApiFinancialEntryCategory {
  const map: Record<LancamentoCategoria, ApiFinancialEntryCategory> = {
    pacote_vendido: "PACKAGE_SOLD",
    comissao: "COMMISSION",
    hospedagem: "ACCOMMODATION",
    passagem: "FLIGHT",
    milhas: "MILES",
    marketing: "MARKETING",
    operacional: "OPERATIONAL",
    reembolso: "REFUND",
    outros: "OTHER",
  };
  return map[cat] ?? "OTHER";
}

export function apiFinancialCategoryToFront(
  cat: ApiFinancialEntryCategory,
): LancamentoCategoria {
  const map: Record<ApiFinancialEntryCategory, LancamentoCategoria> = {
    PACKAGE_SOLD: "pacote_vendido",
    COMMISSION: "comissao",
    ACCOMMODATION: "hospedagem",
    FLIGHT: "passagem",
    MILES: "milhas",
    MARKETING: "marketing",
    OPERATIONAL: "operacional",
    REFUND: "reembolso",
    OTHER: "outros",
  };
  return map[cat] ?? "outros";
}

// ─── Status ──────────────────────────────────────────────────────────────────

export function lancamentoStatusToApi(
  status: LancamentoStatus,
): ApiFinancialEntryStatus {
  const map: Record<LancamentoStatus, ApiFinancialEntryStatus> = {
    previsto: "PENDING",
    confirmado: "CONFIRMED",
    cancelado: "CANCELLED",
  };
  return map[status] ?? "PENDING";
}

export function apiFinancialStatusToFront(
  status: ApiFinancialEntryStatus,
): LancamentoStatus {
  const map: Record<ApiFinancialEntryStatus, LancamentoStatus> = {
    PENDING: "previsto",
    CONFIRMED: "confirmado",
    CANCELLED: "cancelado",
  };
  return map[status] ?? "previsto";
}

// ─── Request / Response ──────────────────────────────────────────────────────

export function lancamentoToCreateRequest(
  l: Omit<LancamentoFinanceiro, "id">,
): ApiCreateFinancialEntryRequest {
  const req: ApiCreateFinancialEntryRequest = {
    description: l.descricao.trim(),
    type: lancamentoTipoToApi(l.tipo),
    category: lancamentoCategoriaToApi(l.categoria),
    amount: l.valor,
    entryDate: l.data.trim().slice(0, 10),
    status: lancamentoStatusToApi(l.status),
  };

  if (l.clienteId && isUuid(l.clienteId)) {
    req.customerId = l.clienteId.trim();
  }
  if (l.fornecedorId && isUuid(l.fornecedorId)) req.supplierId = l.fornecedorId.trim();
  if (l.contaBancaria?.trim()) {
    req.bankAccount = l.contaBancaria.trim();
  }
  if (l.recorrencia) req.recurrenceFrequency = l.recorrencia;
  if (l.observacoes?.trim()) req.notes = l.observacoes.trim();
  if (l.valorVenda != null) req.saleAmount = l.valorVenda;
  if (l.custoFornecedor != null) req.supplierCost = l.custoFornecedor;
  if (l.valorComissao != null) req.commissionAmount = l.valorComissao;

  return req;
}

export function apiFinancialResponseToLancamento(
  api: ApiFinancialEntryResponse,
): LancamentoFinanceiro {
  return {
    id: api.id,
    descricao: api.description,
    tipo: apiFinancialTypeToFront(api.type),
    categoria: apiFinancialCategoryToFront(api.category),
    valor: Number(api.amount),
    data: api.entryDate.slice(0, 10),
    status: apiFinancialStatusToFront(api.status),
    clienteId: api.customerId ?? undefined,
    fornecedorId: api.supplierId ?? undefined,
    contaBancaria: api.bankAccount ?? undefined,
    recorrencia: api.recurrenceFrequency ?? undefined,
    observacoes: api.notes ?? undefined,
    valorVenda: api.saleAmount == null ? undefined : Number(api.saleAmount),
    custoFornecedor: api.supplierCost == null ? undefined : Number(api.supplierCost),
    valorComissao: api.commissionAmount == null ? undefined : Number(api.commissionAmount),
  };
}

export function mergeFinancialApiResponse(
  draft: LancamentoFinanceiro,
  api: ApiFinancialEntryResponse,
): LancamentoFinanceiro {
  return {
    ...draft,
    id: api.id,
    descricao: api.description,
    tipo: apiFinancialTypeToFront(api.type),
    categoria: apiFinancialCategoryToFront(api.category),
    valor: Number(api.amount),
    data: api.entryDate.slice(0, 10),
    status: apiFinancialStatusToFront(api.status),
    clienteId: api.customerId ?? draft.clienteId,
    fornecedorId: api.supplierId ?? draft.fornecedorId,
    contaBancaria: api.bankAccount ?? draft.contaBancaria,
    recorrencia: api.recurrenceFrequency ?? draft.recorrencia,
    observacoes: api.notes ?? draft.observacoes,
    valorVenda: api.saleAmount == null ? draft.valorVenda : Number(api.saleAmount),
    custoFornecedor: api.supplierCost == null ? draft.custoFornecedor : Number(api.supplierCost),
    valorComissao: api.commissionAmount == null ? draft.valorComissao : Number(api.commissionAmount),
  };
}
