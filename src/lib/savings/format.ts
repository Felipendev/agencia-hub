import type { AdjustmentKind, CostKind, MilesUsage, SavingsData, SourceType } from "./types";

export const SOURCE_LABEL: Record<SourceType, string> = {
  AIRLINE_SITE: "Site da companhia",
  ONLINE_TRAVEL_AGENCY: "Agência on-line",
  METASEARCH: "Buscador de passagens",
  SUPPLIER_QUOTE: "Cotação de fornecedor",
  OTHER: "Outra fonte",
};

export const COST_LABEL: Record<CostKind, string> = {
  AGENCY_PAYMENT: "Pago à agência",
  DIRECT_SUPPLIER_PAYMENT: "Pago direto ao fornecedor",
  TAXES: "Taxas de embarque/impostos",
  SERVICE_FEE: "Honorários/taxa de serviço",
  MILES_ACQUISITION: "Aquisição das milhas",
  OTHER: "Outro custo",
};

export const ADJUSTMENT_LABEL: Record<AdjustmentKind, string> = {
  REFUND: "Reembolso recebido (reduz o custo)",
  OTHER_CREDIT: "Outro crédito (reduz o custo)",
  CANCELLATION_FEE: "Multa de cancelamento (aumenta o custo)",
  CHANGE_FEE: "Taxa de remarcação (aumenta o custo)",
  OTHER_CHARGE: "Outra cobrança (aumenta o custo)",
};

export const MILES_LABEL: Record<MilesUsage, string> = {
  NOT_USED: "Não usou milhas",
  KNOWN: "Usou milhas com custo de aquisição conhecido",
  UNKNOWN: "Usou milhas, custo de aquisição desconhecido",
};

export const TRIP_STATUS: Record<string, string> = { UPCOMING: "Futura", IN_PROGRESS: "Em andamento", COMPLETED: "Concluída", CANCELLED: "Cancelada" };

const ACTION_LABEL: Record<string, string> = {
  SAVINGS_CREATED: "Análise criada",
  SAVINGS_UPDATED: "Análise editada (nova versão)",
  SAVINGS_DELETED: "Análise excluída",
  EVIDENCE_ADDED: "Evidência anexada",
  EVIDENCE_DELETED: "Evidência excluída",
};
export const actionLabel = (action: string) => ACTION_LABEL[action] ?? action;

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatMoney = (value: number | null | undefined) => (value == null ? "—" : money.format(value));

export function formatDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function formatMoment(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "short", timeStyle: "short" });
}

export function todayInAgencyZone(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** "1.234,56" ou "1234.56" → número; vazio → null. */
export function parseMoney(raw: string, field: string): number | null {
  const text = raw.trim().replace(/^R\$\s*/i, "");
  if (!text) return null;
  // "1.234,56", "3.000" (milhar brasileiro) ou "1234.56".
  const normalized = text.includes(",") || /^\d{1,3}(\.\d{3})+$/.test(text) ? text.replace(/\./g, "").replace(",", ".") : text;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error(`${field}: informe um valor com até 2 casas decimais, por exemplo 1.200,00.`);
  return Number(normalized);
}

const moneyText = (value: number | null | undefined) => (value == null ? "" : value.toFixed(2).replace(".", ","));

export type CostForm = { kind: CostKind; amount: string; description: string; origin: string; miles: string };
export type AdjustmentForm = { kind: AdjustmentKind; amount: string; date: string; description: string };

export type SavingsForm = {
  price: string;
  sourceType: "" | SourceType;
  sourceDescription: string;
  sourceUrl: string;
  researchedOn: string;
  route: string;
  outboundDate: string;
  returnDate: string;
  passengers: string;
  fareConditions: string;
  baggage: string;
  sameRoute: boolean;
  sameDates: boolean;
  samePassengers: boolean;
  equivalentConditions: boolean;
  differences: string;
  costs: CostForm[];
  milesUsage: "" | MilesUsage;
  adjustments: AdjustmentForm[];
  methodology: string;
  notes: string;
};

export const emptyForm = (): SavingsForm => ({
  price: "", sourceType: "", sourceDescription: "", sourceUrl: "", researchedOn: "", route: "", outboundDate: "", returnDate: "",
  passengers: "", fareConditions: "", baggage: "", sameRoute: false, sameDates: false, samePassengers: false, equivalentConditions: false,
  differences: "", costs: [], milesUsage: "", adjustments: [], methodology: "", notes: "",
});

export function formFromData(data: SavingsData | null): SavingsForm {
  if (!data) return emptyForm();
  const c = data.comparison;
  return {
    price: moneyText(c?.price), sourceType: c?.sourceType ?? "", sourceDescription: c?.sourceDescription ?? "", sourceUrl: c?.sourceUrl ?? "",
    researchedOn: c?.researchedOn ?? "", route: c?.route ?? "", outboundDate: c?.outboundDate ?? "", returnDate: c?.returnDate ?? "",
    passengers: c?.passengers == null ? "" : String(c.passengers), fareConditions: c?.fareConditions ?? "", baggage: c?.baggage ?? "",
    sameRoute: c?.sameRoute === true, sameDates: c?.sameDates === true, samePassengers: c?.samePassengers === true,
    equivalentConditions: c?.equivalentConditions === true, differences: c?.differences ?? "",
    costs: data.costs.map((l) => ({ kind: l.kind, amount: moneyText(l.amount), description: l.description, origin: l.origin ?? "", miles: l.miles == null ? "" : String(l.miles) })),
    milesUsage: data.milesUsage ?? "",
    adjustments: data.adjustments.map((a) => ({ kind: a.kind, amount: moneyText(a.amount), date: a.date, description: a.description })),
    methodology: data.methodology ?? "", notes: data.notes ?? "",
  };
}

const text = (value: string) => (value.trim() ? value.trim() : null);

/** Converte o formulário no contrato da API; campos vazios tornam o resultado indisponível, não um erro. */
export function dataFromForm(form: SavingsForm): SavingsData {
  const passengers = form.passengers.trim() ? Number(form.passengers) : null;
  if (passengers !== null && (!Number.isInteger(passengers) || passengers < 1 || passengers > 99)) throw new Error("Informe de 1 a 99 passageiros.");
  return {
    comparison: {
      price: parseMoney(form.price, "Preço comparável"), sourceType: form.sourceType || null, sourceDescription: text(form.sourceDescription),
      sourceUrl: text(form.sourceUrl), researchedOn: form.researchedOn || null, route: text(form.route), outboundDate: form.outboundDate || null,
      returnDate: form.returnDate || null, passengers, fareConditions: text(form.fareConditions), baggage: text(form.baggage),
      sameRoute: form.sameRoute, sameDates: form.sameDates, samePassengers: form.samePassengers, equivalentConditions: form.equivalentConditions,
      differences: text(form.differences),
    },
    costs: form.costs.map((l, i) => {
      const amount = parseMoney(l.amount, `Custo ${i + 1}`);
      if (amount === null) throw new Error(`Custo ${i + 1}: informe o valor.`);
      const miles = l.miles.trim() ? Number(l.miles) : null;
      if (miles !== null && (!Number.isInteger(miles) || miles < 1)) throw new Error(`Custo ${i + 1}: quantidade de milhas inválida.`);
      return { kind: l.kind, amount, description: l.description.trim(), origin: text(l.origin), miles };
    }),
    milesUsage: form.milesUsage || null,
    adjustments: form.adjustments.map((a, i) => {
      const amount = parseMoney(a.amount, `Ajuste ${i + 1}`);
      if (amount === null) throw new Error(`Ajuste ${i + 1}: informe o valor.`);
      return { kind: a.kind, amount, date: a.date, description: a.description.trim() };
    }),
    methodology: text(form.methodology),
    notes: text(form.notes),
  };
}
