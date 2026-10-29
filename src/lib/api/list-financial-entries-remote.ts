import { apiFetch } from "@/lib/api/authenticated-fetch";
import { apiFinancialResponseToLancamento } from "@/lib/api/financial-mapper";
import type { ApiFinancialEntryResponse } from "@/lib/api/financial-types";
import type { LancamentoFinanceiro } from "@/types";

function validFinancialFields(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<ApiFinancialEntryResponse>;
  if (typeof row.id !== "string" || !row.id.trim() || typeof row.description !== "string"
    || typeof row.category !== "string" || !row.category
    || typeof row.amount !== "number" || !Number.isFinite(row.amount)
    || !["INCOME", "EXPENSE"].includes(row.type ?? "")
    || !["PENDING", "CONFIRMED", "CANCELLED"].includes(row.status ?? "")
    || typeof row.entryDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.entryDate)) return false;
  const date = new Date(`${row.entryDate}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === row.entryDate;
}

/** Lista os lançamentos financeiros pertencentes à agência da sessão. */
export async function listFinancialEntriesRemote(
  token: string,
  signal?: AbortSignal,
): Promise<LancamentoFinanceiro[]> {
  const rows = await apiFetch<ApiFinancialEntryResponse[]>(
    "/financial-entries",
    { cache: "no-store", ...(signal ? { signal } : {}) },
    token,
  );
  if (!Array.isArray(rows) || !rows.every(validFinancialFields)) {
    throw new Error("Resposta financeira inválida. Não foi possível confirmar os valores.");
  }
  return rows.map(apiFinancialResponseToLancamento);
}
