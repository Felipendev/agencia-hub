import type { Atendimento, AtendimentoStatus } from "@/types";
import type {
  ApiCreateOpportunityRequest,
  ApiOpportunityResponse,
  ApiOpportunityStatus,
} from "@/lib/api/opportunity-types";

export function atendimentoStatusToApi(
  status: AtendimentoStatus,
): ApiOpportunityStatus {
  const map: Record<AtendimentoStatus, ApiOpportunityStatus> = {
    novo_lead: "NEW_LEAD",
    em_atendimento: "IN_PROGRESS",
    proposta_enviada: "PROPOSAL_SENT",
    fechado: "CLOSED",
    cancelado: "CANCELLED",
  };
  return map[status] ?? "NEW_LEAD";
}

export function apiOpportunityStatusToFront(
  status: ApiOpportunityStatus,
): AtendimentoStatus {
  const map: Record<ApiOpportunityStatus, AtendimentoStatus> = {
    NEW_LEAD: "novo_lead",
    IN_PROGRESS: "em_atendimento",
    PROPOSAL_SENT: "proposta_enviada",
    CLOSED: "fechado",
    CANCELLED: "cancelado",
  };
  return map[status] ?? "novo_lead";
}

export function atendimentoToCreateRequest(
  a: Omit<Atendimento, "id">,
): ApiCreateOpportunityRequest {
  return {
    customerId: a.clienteId.trim(),
    title: a.titulo.trim(),
    destination: a.destino.trim(),
    estimatedAmount: a.valorEstimado,
    status: atendimentoStatusToApi(a.status),
    expectedTravelDate: a.dataPrevistaViagem.trim().slice(0, 10),
    notes: a.observacoes?.trim() || undefined,
  };
}

export function apiOpportunityResponseToAtendimento(
  api: ApiOpportunityResponse,
): Atendimento {
  return {
    id: api.id,
    clienteId: api.customerId,
    titulo: api.title,
    destino: api.destination,
    valorEstimado: Number(api.estimatedAmount),
    status: apiOpportunityStatusToFront(api.status),
    dataPrevistaViagem: api.expectedTravelDate.slice(0, 10),
    observacoes: api.notes ?? "",
  };
}

export function mergeOpportunityApiResponse(
  draft: Atendimento,
  api: ApiOpportunityResponse,
): Atendimento {
  return {
    ...draft,
    id: api.id,
    clienteId: api.customerId,
    titulo: api.title,
    destino: api.destination,
    valorEstimado: Number(api.estimatedAmount),
    status: apiOpportunityStatusToFront(api.status),
    dataPrevistaViagem: api.expectedTravelDate.slice(0, 10),
    observacoes: api.notes ?? draft.observacoes,
  };
}
