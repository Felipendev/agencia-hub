import { calcularCia, LUCRO_CONFIG_PADRAO, type CiaInput, type LucroConfig } from "@/lib/calculadora-milhas";
import type { OpcaoVooCotacao } from "@/types";

export type FlightSegment = {
  origin: string | null; destination: string | null;
  departureDate: string | null; arrivalDate: string | null;
  departureTime: string | null; arrivalTime: string | null;
  durationMinutes: number | null; stops: number | null;
};
export type ExtractedOffer = {
  airline: string | null; segments: FlightSegment[]; miles: number | null;
  cashAmount: number | null; priceBasis: "PER_PERSON" | "GROUP" | "UNKNOWN";
  passengers: number | null; warnings: string[];
};
export type FlightImportResult = {
  id: string; cached: boolean; extraction: { offers: ExtractedOffer[]; warnings: string[] };
};

/** Apresentação humana; o contrato continua persistindo duração total em minutos. */
export function formatDurationMinutes(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 1) return "Duração não informada";
  const total = Math.trunc(minutes);
  return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, "0")} min`;
}
export type FlightCalculation = {
  tipo: CiaInput["trecho"]["tipo"]; milhasIda: number; milhasVolta: number;
  custoPorMilheiro: number; taxas: number; taxasAdicionais: number;
  valorMala: number; qtdMalas: number; lucroConfig: LucroConfig;
  revisado: boolean; importacaoId?: string;
  arquivoOrigem?: string; importadoEm?: string;
  custoMilhas?: number; basePorPessoa?: number; lucroPorPessoa?: number;
};
export type FlightOption = OpcaoVooCotacao & {
  id: string; segmentos: FlightSegment[]; calculo: FlightCalculation;
};
export type FlightPlan = {
  options: FlightOption[]; selectedOptionId: string; savedAt?: string; savedBy?: string; savedByName?: string;
};
export type FlightDraft = FlightOption & {
  incluir: boolean; avisos: string[]; baseFonte?: ExtractedOffer["priceBasis"];
  fonteMilhas?: number | null; fonteDinheiro?: number | null;
};
export function emptySegment(): FlightSegment {
  return { origin: null, destination: null, departureDate: null, arrivalDate: null,
    departureTime: null, arrivalTime: null, durationMinutes: null, stops: null };
}
export function newFlightDraft(): FlightDraft {
  return { id: crypto.randomUUID(), nome: "Opção de voo", cia: "", horarioSaida: "", horarioChegada: "", conexoes: "",
    precoPassagens: 0, precoBagagens: 0, precoTotal: 0, qtdPessoas: 1, segmentos: [emptySegment()], incluir: true, avisos: [],
    calculo: { tipo: "so_ida", milhasIda: 0, milhasVolta: 0, custoPorMilheiro: 0,
      taxas: 0, taxasAdicionais: 0, valorMala: 0, qtdMalas: 0, lucroConfig: { ...LUCRO_CONFIG_PADRAO }, revisado: false } };
}
export function importedDraft(offer: ExtractedOffer, importId: string): FlightDraft {
  const draft = newFlightDraft();
  return { ...draft, nome: `${offer.airline || "Companhia a confirmar"} — oferta importada`, cia: offer.airline ?? "",
    segmentos: offer.segments.map((s) => ({ ...s })), avisos: offer.warnings, baseFonte: offer.priceBasis,
    fonteMilhas: offer.miles, fonteDinheiro: offer.cashAmount, qtdPessoas: offer.passengers ?? 1,
    calculo: { ...draft.calculo, importacaoId: importId, tipo: offer.segments.length > 1 ? "preco_unico" : "so_ida",
      milhasIda: offer.priceBasis === "PER_PERSON" ? offer.miles ?? 0 : 0,
      taxas: offer.priceBasis === "PER_PERSON" ? offer.cashAmount ?? 0 : 0 } };
}

export function calculateFlight(option: FlightOption): FlightOption {
  const c = option.calculo;
  const r = calcularCia({ cia: "OUTRA", nomeCustom: option.nome,
    trecho: { tipo: c.tipo, milhasIda: c.milhasIda, milhasVolta: c.milhasVolta,
      custoPorMilheiro: c.custoPorMilheiro, taxas: c.taxas + c.taxasAdicionais },
    lucroConfig: c.lucroConfig, valorMala: c.valorMala, qtdMalas: c.qtdMalas }, option.qtdPessoas);
  return { ...option, horarioSaida: option.segmentos[0]?.departureTime ?? "",
    horarioChegada: option.segmentos.at(-1)?.arrivalTime ?? "", conexoes: "",
    precoPassagens: r.precoTotalSemMala, precoBagagens: r.totalMalas, precoTotal: r.precoTotalComMala,
    calculo: { ...c, custoMilhas: r.detalhes.precoSemTaxaPorPessoa, basePorPessoa: r.precoBasePorPessoa, lucroPorPessoa: r.lucroPorPessoa } };
}

/** Explicit client projection. Internal calculation and source metadata never enter the PDF model. */
export function commercialFlights(plan: FlightPlan): OpcaoVooCotacao[] {
  return plan.options.map((o) => ({ nome: o.nome, cia: o.cia, corCia: o.corCia,
    horarioSaida: o.horarioSaida, horarioChegada: o.horarioChegada, conexoes: o.conexoes,
    precoPassagens: o.precoPassagens, precoBagagens: o.precoBagagens, precoTotal: o.precoTotal, qtdPessoas: o.qtdPessoas,
    segmentos: o.segmentos.map((s) => ({ origin: s.origin, destination: s.destination,
      departureDate: s.departureDate, arrivalDate: s.arrivalDate, departureTime: s.departureTime,
      arrivalTime: s.arrivalTime, durationMinutes: s.durationMinutes, stops: s.stops })) }));
}
export function buildFlightPlan(drafts: FlightDraft[], selectedOptionId: string): FlightPlan {
  const included = drafts.filter((o) => o.incluir);
  if (!included.length || included.length > 20) throw new Error("Inclua de 1 a 20 opções.");
  if (new Set(included.map((o) => o.id)).size !== included.length) throw new Error("Há opções duplicadas. Recarregue as opções da cotação.");
  if (!included.some((o) => o.id === selectedOptionId)) throw new Error("Escolha a opção que define o total da cotação.");
  for (const o of included) {
    if (!o.calculo.revisado) throw new Error(`Confira e marque a revisão de ${o.nome}.`);
    if (!o.nome.trim() || o.nome.length > 150) throw new Error("Informe um nome para a opção, até 150 caracteres.");
    if (o.cia.length > 150) throw new Error("Companhia: use até 150 caracteres.");
    const c = o.calculo;
    const fields: [string, number, number, boolean][] = [
      ["Milhas de ida", c.milhasIda, 100000000, true], ["Milhas de volta", c.milhasVolta, 100000000, true],
      ["Custo do milheiro", c.custoPorMilheiro, 100000, false], ["Parcela em dinheiro", c.taxas, 10000000, false],
      ["Taxas adicionais", c.taxasAdicionais, 10000000, false], ["Preço da mala", c.valorMala, 100000, false],
      ["Quantidade de malas", c.qtdMalas, 100, true], ["Lucro percentual", c.lucroConfig.pct, 1000, false],
      ["Lucro fixo", c.lucroConfig.fixo, 10000000, false],
    ];
    for (const [label, value, max, whole] of fields) {
      if (!Number.isFinite(value) || value < 0 || value > max || (whole ? !Number.isInteger(value) : Math.abs(value * 100 - Math.round(value * 100)) > 0.00001))
        throw new Error(`${o.nome}: ${label} deve estar entre 0 e ${max.toLocaleString("pt-BR")}${whole ? ", sem casas decimais" : ", com até 2 casas decimais"}.`);
    }
    if ((c.milhasIda + (c.tipo === "ida_volta" ? c.milhasVolta : 0)) > 0 && c.custoPorMilheiro <= 0)
      throw new Error(`${o.nome}: informe o custo do milheiro para calcular as milhas preenchidas, ou deixe as milhas vazias.`);
    if (!Number.isInteger(o.qtdPessoas) || o.qtdPessoas < 1 || o.qtdPessoas > 20) throw new Error(`${o.nome}: passageiros deve estar entre 1 e 20.`);
    if (!o.segmentos.length || o.segmentos.length > 8) throw new Error("Informe de 1 a 8 trechos por opção.");
    for (const [index, s] of o.segmentos.entries()) {
      const prefix = `${o.nome}, trecho ${index + 1}`;
      for (const value of [s.origin, s.destination]) if (value && value.length > 100) throw new Error(`${prefix}: origem e destino aceitam até 100 caracteres.`);
      if ((s.departureDate && !validDate(s.departureDate)) || (s.arrivalDate && !validDate(s.arrivalDate))) throw new Error(`${prefix}: confira a data informada.`);
      if (s.departureDate && s.arrivalDate && s.arrivalDate < s.departureDate) throw new Error(`${prefix}: chegada anterior à data de saída.`);
      if ((s.departureTime && !validTime(s.departureTime)) || (s.arrivalTime && !validTime(s.arrivalTime))) throw new Error(`${prefix}: confira o horário informado.`);
      if (s.durationMinutes != null && (!Number.isInteger(s.durationMinutes) || s.durationMinutes < 1 || s.durationMinutes > 10080)) throw new Error(`${prefix}: duração deve estar entre 1 e 10080 minutos.`);
      if (s.stops != null && (!Number.isInteger(s.stops) || s.stops < 0 || s.stops > 20)) throw new Error(`${prefix}: paradas deve estar entre 0 e 20.`);
    }
  }
  return { selectedOptionId, options: included.map((o) => {
    const calculated = calculateFlight(o);
    return { ...commercialFlights({ selectedOptionId, options: [calculated] })[0], id: o.id,
      segmentos: calculated.segmentos, calculo: calculated.calculo };
  }) };
}
function validDate(value: string | null): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}
function validTime(value: string | null): boolean { return !!value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
