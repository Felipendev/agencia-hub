import { emptyCotacaoDetalhes } from "@/lib/cotacao-defaults";
import type {
  ApiCreateQuotationRequest,
  ApiQuotationCreationSource,
  ApiQuotationResponse,
  ApiQuotationStatus,
} from "@/lib/api/quotation-types";
import type {
  Cotacao,
  CotacaoDetalhes,
  CotacaoStatus,
} from "@/types";

/** UUID textual (RFC 4122) — aceita qualquer versão/variante válida em hex. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/** Front status (PT slug) → API enum. */
export function cotacaoStatusToApi(status: CotacaoStatus): ApiQuotationStatus {
  const map: Record<CotacaoStatus, ApiQuotationStatus> = {
    aguardando: "DRAFT",
    em_cotacao: "SENT",
    aguardando_cliente: "AWAITING_CLIENT",
    aprovado: "ACCEPTED",
    reprovado: "REJECTED",
    expirada: "EXPIRED",
    cancelada: "CANCELLED",
  };
  return map[status] ?? "DRAFT";
}

export function apiQuotationStatusToFront(
  status: ApiQuotationStatus,
): CotacaoStatus {
  const map: Record<ApiQuotationStatus, CotacaoStatus> = {
    DRAFT: "aguardando",
    SENT: "em_cotacao",
    AWAITING_CLIENT: "aguardando_cliente",
    ACCEPTED: "aprovado",
    REJECTED: "reprovado",
    EXPIRED: "expirada",
    CANCELLED: "cancelada",
  };
  return map[status] ?? "aguardando";
}

function apiCreationSourceToOrigem(
  s: ApiQuotationCreationSource | null | undefined,
): "interna" | "formulario_publico" | undefined {
  if (!s) return undefined;
  return s === "PUBLIC_FORM" ? "formulario_publico" : "interna";
}

/** Formulário detalhado (campos PT do SPA) → payload JSON em inglês para o backend. */
export function cotacaoDetalhesToApiDetails(
  d: CotacaoDetalhes,
): Record<string, unknown> {
  return {
    desiredServices: d.servicosDesejados,
    origin: d.origem,
    destinationForm: d.destinoForm,
    itinerarySegments: d.destinosTrechos,
    outboundDate: d.dataIda,
    returnDate: d.dataVolta,
    outboundFlexibility: d.flexibilidadeIda,
    returnFlexibility: d.flexibilidadeVolta,
    outboundFlexibilityOther: d.flexibilidadeIdaOutro,
    returnFlexibilityOther: d.flexibilidadeVoltaOutro,
    outboundDepartureTimePreference: d.horarioSaidaIda,
    returnDepartureTimePreference: d.horarioSaidaVolta,
    outboundFlightPreference: d.preferenciaVooIda,
    returnFlightPreference: d.preferenciaVooVolta,
    adults: d.adultos,
    children: d.criancas,
    childrenAges: d.idadesCriancas,
    infants: d.bebes,
    checkedBaggageUsed: d.malasDespachadas,
    baggageCount: d.qtdMalas,
    specialBaggage: d.bagagemEspecial,
    lodgingCategory: d.categoriaHospedagem,
    lodgingAmenities: d.comodidadesHospedagem,
    rooms: d.qtdQuartos,
    mobilePhone: d.celular,
    whatsappPhone: d.whatsapp,
    whatsappSameAsMobile: d.whatsappIgualCelular,
    communicationPreference: d.preferenciaComunicacao,
    usesMiles: d.usaMilhas,
    paymentMethod: d.formaPagamento,
    paymentMethodOther: d.formaPagamentoOutro,
    couponCode: d.cupomCodigo,
    couponValidUntil: d.cupomValidoAte,
  };
}

export function cotacaoToCreateRequest(
  c: Omit<Cotacao, "id" | "createdAt" | "updatedAt">,
): ApiCreateQuotationRequest {
  const req: ApiCreateQuotationRequest = {
    customerId: c.clienteId.trim(),
    title: c.titulo.trim(),
    destination: c.destino.trim(),
    totalAmount: c.valorTotal,
    currency: (c.moeda || "BRL").trim().toUpperCase().slice(0, 3),
    status: cotacaoStatusToApi(c.status),
    validUntil: c.validade.trim().slice(0, 10),
    travelStartDate: c.dataInicioViagem?.trim().slice(0, 10),
    travelEndDate: c.dataFimViagem?.trim().slice(0, 10),
    details: cotacaoDetalhesToApiDetails(c.detalhes),
    tags: c.tags ?? [],
    priority: c.prioridade ?? false,
    assignee: c.responsavel?.trim() || undefined,
    internalNotes: c.observacoes?.trim() || undefined,
  };

  if (c.atendimentoId && isUuid(c.atendimentoId)) {
    req.opportunityId = c.atendimentoId.trim();
  }
  if (c.vendedorId && isUuid(c.vendedorId)) {
    req.sellerId = c.vendedorId.trim();
  }

  if (c.origemCriacao === "formulario_publico") {
    req.creationSource = "PUBLIC_FORM";
  } else if (c.origemCriacao === "interna") {
    req.creationSource = "INTERNAL";
  }
  if (c.publicSubmissionId && isUuid(c.publicSubmissionId)) {
    req.publicSubmissionId = c.publicSubmissionId.trim();
  }

  return req;
}

/** Une resposta HTTP com o rascunho local (mantém `detalhes` completos no formato PT). */
export function mergeQuotationApiResponse(
  draft: Cotacao,
  api: ApiQuotationResponse,
): Cotacao {
  const createdAt = normalizeInstantToIsoDate(api.createdAt);
  const updatedAt = normalizeInstantToIsoDate(api.updatedAt);

  return {
    ...draft,
    id: api.id,
    clienteId: api.customerId,
    atendimentoId: api.opportunityId ?? undefined,
    vendedorId: api.sellerId ?? undefined,
    vendedorNome: api.sellerName ?? undefined,
    titulo: api.title,
    destino: api.destination,
    valorTotal: Number(api.totalAmount),
    moeda: api.currency,
    status: apiQuotationStatusToFront(api.status),
    validade: api.validUntil.slice(0, 10),
    dataInicioViagem: api.travelStartDate ?? undefined,
    dataFimViagem: api.travelEndDate ?? undefined,
    observacoes: api.internalNotes || draft.observacoes,
    detalhes: draft.detalhes,
    tags: api.tags?.length ? api.tags : draft.tags,
    prioridade: api.priority,
    responsavel: api.assignee?.trim() || draft.responsavel,
    createdAt,
    updatedAt,
    origemCriacao:
      api.creationSource != null
        ? apiCreationSourceToOrigem(api.creationSource)
        : draft.origemCriacao,
    publicSubmissionId: api.publicSubmissionId ?? draft.publicSubmissionId,
    criadoPorUsuarioId: api.createdByUserId ?? draft.criadoPorUsuarioId,
    criadoPorNome: api.createdByUserName ?? draft.criadoPorNome,
  };
}

export function normalizeInstantToIsoDate(iso: string): string {
  if (!iso) return new Date().toISOString();
  if (iso.includes("T")) return iso;
  return `${iso.slice(0, 10)}T12:00:00.000Z`;
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string") ?
      (v as string[])
    : [];
}

function s(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function n(v: unknown, d: number): number {
  return typeof v === "number" && !Number.isNaN(v) ? v : d;
}

function b(v: unknown, d: boolean): boolean {
  return typeof v === "boolean" ? v : d;
}

function optStr(v: unknown): string | undefined {
  const t = s(v);
  return t || undefined;
}

/** Detalhes JSON da API (inglês) → formulário PT do SPA. */
export function apiDetailsToCotacaoDetalhes(raw: unknown): CotacaoDetalhes {
  if (raw == null || typeof raw !== "object") {
    return emptyCotacaoDetalhes();
  }
  const o = raw as Record<string, unknown>;
  const segments = strArr(o.itinerarySegments);
  return {
    servicosDesejados: strArr(o.desiredServices),
    origem: s(o.origin),
    destinoForm: s(o.destinationForm),
    destinosTrechos: segments.length > 0 ? segments : [""],
    dataIda: s(o.outboundDate),
    dataVolta: s(o.returnDate),
    flexibilidadeIda: s(o.outboundFlexibility),
    flexibilidadeVolta: s(o.returnFlexibility),
    flexibilidadeIdaOutro: s(o.outboundFlexibilityOther),
    flexibilidadeVoltaOutro: s(o.returnFlexibilityOther),
    horarioSaidaIda: s(o.outboundDepartureTimePreference),
    horarioSaidaVolta: s(o.returnDepartureTimePreference),
    preferenciaVooIda: s(o.outboundFlightPreference),
    preferenciaVooVolta: s(o.returnFlightPreference),
    adultos: n(o.adults, 1),
    criancas: n(o.children, 0),
    idadesCriancas: s(o.childrenAges),
    bebes: n(o.infants, 0),
    malasDespachadas: b(o.checkedBaggageUsed, false),
    qtdMalas: s(o.baggageCount),
    bagagemEspecial: b(o.specialBaggage, false),
    categoriaHospedagem: s(o.lodgingCategory),
    comodidadesHospedagem: strArr(o.lodgingAmenities),
    qtdQuartos: n(o.rooms, 1),
    celular: s(o.mobilePhone),
    whatsapp: s(o.whatsappPhone),
    whatsappIgualCelular: b(o.whatsappSameAsMobile, false),
    preferenciaComunicacao: s(o.communicationPreference),
    usaMilhas: b(o.usesMiles, false),
    formaPagamento: s(o.paymentMethod),
    formaPagamentoOutro: s(o.paymentMethodOther),
    cupomCodigo: s(o.couponCode),
    cupomValidoAte: optStr(o.couponValidUntil),
  };
}

/** Linha da API → objeto usado pelo Kanban e fichas. */
export function apiQuotationResponseToCotacao(api: ApiQuotationResponse): Cotacao {
  const createdAt = normalizeInstantToIsoDate(api.createdAt);
  const updatedAt = normalizeInstantToIsoDate(api.updatedAt);
  const detalhes =
    api.details != null ?
      apiDetailsToCotacaoDetalhes(api.details)
    : emptyCotacaoDetalhes();

  return {
    id: api.id,
    clienteId: api.customerId,
    atendimentoId: api.opportunityId ?? undefined,
    vendedorId: api.sellerId ?? undefined,
    vendedorNome: api.sellerName ?? undefined,
    titulo: api.title,
    destino: api.destination,
    valorTotal: Number(api.totalAmount),
    moeda: api.currency,
    status: apiQuotationStatusToFront(api.status),
    validade: api.validUntil.slice(0, 10),
    dataInicioViagem: api.travelStartDate ?? undefined,
    dataFimViagem: api.travelEndDate ?? undefined,
    observacoes: api.internalNotes ?? "",
    detalhes,
    tags: api.tags ?? [],
    prioridade: api.priority,
    responsavel: api.assignee?.trim() || "Equipe",
    createdAt,
    updatedAt,
    origemCriacao: apiCreationSourceToOrigem(api.creationSource),
    publicSubmissionId: api.publicSubmissionId ?? undefined,
    criadoPorUsuarioId: api.createdByUserId ?? undefined,
    criadoPorNome: api.createdByUserName ?? undefined,
  };
}
