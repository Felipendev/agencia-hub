import { apiFetch } from "@/lib/api/authenticated-fetch";
import type { ApiQuotationResponse } from "@/lib/api/quotation-types";
import type { ApiCustomerResponse } from "@/lib/api/customer-types";

// ── Soft-delete ──────────────────────────────────────────────────────────────

export async function softDeleteQuotation(
  id: string,
  token: string,
): Promise<void> {
  await apiFetch<null>(`/quotations/${id}`, { method: "DELETE" }, token);
}

export async function softDeleteCustomer(
  id: string,
  token: string,
): Promise<void> {
  await apiFetch<null>(`/customers/${id}`, { method: "DELETE" }, token);
}

// ── Lixeira (trash) ──────────────────────────────────────────────────────────

export async function listDeletedQuotations(
  token: string,
): Promise<ApiQuotationResponse[]> {
  return apiFetch<ApiQuotationResponse[]>("/trash/quotations", {}, token);
}

export async function listDeletedCustomers(
  token: string,
): Promise<ApiCustomerResponse[]> {
  return apiFetch<ApiCustomerResponse[]>("/trash/customers", {}, token);
}

// ── Restauração ──────────────────────────────────────────────────────────────

export async function restoreQuotation(
  id: string,
  token: string,
): Promise<ApiQuotationResponse> {
  return apiFetch<ApiQuotationResponse>(
    `/trash/quotations/${id}/restore`,
    { method: "POST" },
    token,
  );
}

export async function restoreCustomer(
  id: string,
  token: string,
): Promise<ApiCustomerResponse> {
  return apiFetch<ApiCustomerResponse>(
    `/trash/customers/${id}/restore`,
    { method: "POST" },
    token,
  );
}
