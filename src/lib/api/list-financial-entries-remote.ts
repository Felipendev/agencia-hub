import { apiFetch } from "@/lib/api/authenticated-fetch";
import { apiFinancialResponseToLancamento } from "@/lib/api/financial-mapper";
import type { ApiFinancialEntryResponse } from "@/lib/api/financial-types";
import type { LancamentoFinanceiro } from "@/types";

/** Lista os lançamentos financeiros pertencentes à agência da sessão. */
export async function listFinancialEntriesRemote(
  token: string,
): Promise<LancamentoFinanceiro[]> {
  const rows = await apiFetch<ApiFinancialEntryResponse[]>(
    "/financial-entries",
    {},
    token,
  );
  return rows.map(apiFinancialResponseToLancamento);
}
