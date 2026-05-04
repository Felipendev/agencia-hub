import { emptyCotacaoDetalhes } from "@/lib/cotacao-defaults";
import { brPhoneDigits } from "@/lib/br-phone";
import type { Cotacao, CotacaoDetalhes, CotacaoStatus } from "@/types";

const LEGACY_STATUS_MAP: Record<string, CotacaoStatus> = {
  rascunho: "aguardando",
  enviada: "em_cotacao",
  aguardando_cliente: "aguardando_cliente",
  aceita: "aprovado",
  recusada: "reprovado",
  expirada: "expirada",
  cancelada: "cancelada",
};

/** Mescla defaults + campos opcionais (arrays, trechos, telefones só dígitos). */
export function mergeCotacaoDetalhes(
  partial?: Partial<CotacaoDetalhes>,
): CotacaoDetalhes {
  const base = emptyCotacaoDetalhes();
  if (!partial) return base;
  const merged: CotacaoDetalhes = {
    ...base,
    ...partial,
    servicosDesejados: partial.servicosDesejados ?? base.servicosDesejados,
    comodidadesHospedagem:
      partial.comodidadesHospedagem ?? base.comodidadesHospedagem,
    celular: brPhoneDigits(partial.celular ?? base.celular),
    whatsapp: brPhoneDigits(partial.whatsapp ?? base.whatsapp),
  };

  if (partial.destinosTrechos !== undefined) {
    const t = partial.destinosTrechos;
    const temTexto = t.some((x) => x?.trim());
    merged.destinosTrechos =
      temTexto && t.length > 0 ? t : partial.destinoForm?.trim()
        ? [partial.destinoForm.trim()]
        : [""];
  } else if (partial.destinoForm?.trim()) {
    merged.destinosTrechos = [partial.destinoForm.trim()];
  } else {
    merged.destinosTrechos = [""];
  }

  return merged;
}

/** Normaliza registros antigos (status legados ou sem `detalhes`). */
export function migrateCotacao(raw: unknown): Cotacao {
  const c = raw as Partial<Cotacao> & {
    status?: string;
    detalhes?: Partial<CotacaoDetalhes>;
  };
  const rawStatus = c.status ?? "aguardando";
  const status: CotacaoStatus =
    LEGACY_STATUS_MAP[rawStatus] ?? (rawStatus as CotacaoStatus);

  const detalhes = mergeCotacaoDetalhes(c.detalhes);
  if (!detalhes.destinoForm && c.destino) {
    detalhes.destinoForm = c.destino;
  }
  if (
    detalhes.destinoForm?.trim() &&
    !detalhes.destinosTrechos.some((x) => x?.trim())
  ) {
    detalhes.destinosTrechos = [detalhes.destinoForm.trim()];
  }

  return {
    id: c.id!,
    clienteId: c.clienteId!,
    atendimentoId: c.atendimentoId,
    titulo: c.titulo ?? "",
    destino: c.destino ?? "",
    valorTotal: c.valorTotal ?? 0,
    moeda: c.moeda ?? "BRL",
    status,
    validade: c.validade ?? new Date().toISOString().slice(0, 10),
    dataInicioViagem: c.dataInicioViagem,
    dataFimViagem: c.dataFimViagem,
    observacoes: c.observacoes ?? "",
    detalhes,
    tags: Array.isArray(c.tags) ? c.tags.filter(Boolean) : [],
    prioridade: Boolean(c.prioridade),
    responsavel: c.responsavel ?? "Equipe",
    createdAt: c.createdAt ?? new Date().toISOString(),
    updatedAt: c.updatedAt ?? new Date().toISOString(),
  };
}
