import type { Cliente, ClienteStatus } from "@/types";
import type {
  ApiCreateCustomerRequest,
  ApiCustomerResponse,
  ApiCustomerStatus,
} from "@/lib/api/customer-types";

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
  return {
    name: c.nome.trim(),
    email: c.email.trim() || null,
    phone: c.telefone.trim() || null,
    interestDestination: c.destinoInteresse?.trim() || null,
    status: clienteStatusToApi(c.status),
    notes: c.observacoes?.trim() || undefined,
  };
}

/** Converte somente campos que o contrato atual de PATCH de clientes aceita. */
export function clientePatchToApi(
  patch: Partial<Cliente>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (patch.nome !== undefined) body.name = patch.nome.trim();
  // Campos opcionais: string vazia limpa o valor no backend; `null`/ausente significa "não alterar".
  if (patch.email !== undefined) body.email = patch.email.trim();
  if (patch.telefone !== undefined) body.phone = patch.telefone.trim();
  if (patch.destinoInteresse !== undefined) {
    body.interestDestination = patch.destinoInteresse.trim();
  }
  if (patch.status !== undefined) body.status = clienteStatusToApi(patch.status);
  if (patch.observacoes !== undefined) body.notes = patch.observacoes.trim();
  return body;
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
    email: api.email ?? "",
    telefone: api.phone ?? "",
    destinoInteresse: api.interestDestination ?? "—",
    status: apiCustomerStatusToFront(api.status),
    observacoes: api.notes ?? draft.observacoes,
    createdAt,
  };
}
