import type { Cliente, ClienteStatus } from "@/types";
import type {
  ApiCreateCustomerRequest,
  ApiCustomerResponse,
  ApiCustomerStatus,
} from "@/lib/api/customer-types";

/** E-mail aceito pela validação `@Email` do backend. */
export function isProbablyValidEmail(value: string): boolean {
  const v = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function clienteStatusToApi(status: ClienteStatus): ApiCustomerStatus {
  const map: Record<ClienteStatus, ApiCustomerStatus> = {
    ativo: "ACTIVE",
    inativo: "INACTIVE",
    prospecto: "PROSPECT",
  };
  return map[status];
}

export function apiCustomerStatusToFront(
  status: ApiCustomerStatus,
): ClienteStatus {
  const map: Record<ApiCustomerStatus, ClienteStatus> = {
    ACTIVE: "ativo",
    INACTIVE: "inativo",
    PROSPECT: "prospecto",
  };
  return map[status] ?? "prospecto";
}

export function clienteToCreateRequest(
  c: Omit<Cliente, "id" | "createdAt">,
): ApiCreateCustomerRequest {
  const interest =
    c.destinoInteresse?.trim() || "—";
  return {
    name: c.nome.trim(),
    email: c.email.trim(),
    phone: c.telefone.trim(),
    interestDestination: interest,
    status: clienteStatusToApi(c.status),
    notes: c.observacoes?.trim() || undefined,
  };
}

/** Aplica resposta HTTP mantendo campos extras que só existem no SPA. */
export function mergeCustomerApiResponse(
  draft: Cliente,
  api: ApiCustomerResponse,
): Cliente {
  const createdAt =
    api.createdAt && api.createdAt.includes("T") ?
      api.createdAt.slice(0, 10)
    : (api.createdAt ?? draft.createdAt);

  return {
    ...draft,
    id: api.id,
    nome: api.name,
    email: api.email,
    telefone: api.phone,
    destinoInteresse: api.interestDestination,
    status: apiCustomerStatusToFront(api.status),
    observacoes: api.notes ?? draft.observacoes,
    createdAt,
  };
}
