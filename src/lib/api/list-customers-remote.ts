import { apiFetch } from "@/lib/api/authenticated-fetch";
/** Lista clientes ativos da API (multi-tenant). */
export async function listCustomersRemote(token: string): Promise<Cliente[]> {
  const rows = await apiFetch<ApiCustomerResponse[]>("/customers", {}, token);
  const draft: Cliente = {
    id: "",
    nome: "",
    email: "",
    telefone: "",
    destinoInteresse: "—",
    status: "prospecto",
    observacoes: "",
    createdAt: "",
  };
  return rows.map((api) => mergeCustomerApiResponse(draft, api));
}
