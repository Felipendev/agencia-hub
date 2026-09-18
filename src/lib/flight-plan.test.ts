import { describe, expect, it } from "vitest";
import { buildFlightPlan, commercialFlights, formatDurationMinutes, importedDraft, type FlightDraft, type ExtractedOffer } from "./flight-plan";
import { emptyCotacaoDetalhes } from "./cotacao-defaults";
import { gerarHtmlCotacao } from "./pdf-generator";
import { gerarMensagemTexto } from "./whatsapp-message";
import { apiQuotationResponseToCotacao, cotacaoToCreateRequest } from "./api/quotation-mapper";
import type { ApiQuotationResponse } from "./api/quotation-types";
import type { Cliente, Cotacao } from "@/types";

const offer: ExtractedOffer = {
  airline: "LATAM", miles: 87141, cashAmount: 38.84, priceBasis: "PER_PERSON", passengers: null, warnings: [],
  segments: [{ origin: "BPS", destination: "REC", departureTime: "17:25", arrivalTime: "23:20",
    departureDate: null, arrivalDate: null, durationMinutes: 355, stops: 1 }],
};
function reviewed(): FlightDraft {
  const d = importedDraft(offer, "PRIVATE-SOURCE-ID");
  d.segmentos[0].departureDate = "2026-09-20";
  d.segmentos[0].arrivalDate = "2026-09-20";
  d.calculo.custoPorMilheiro = 25;
  d.calculo.revisado = true;
  return d;
}
describe("importação e cálculo dos voos", () => {
  it("formata duração em horas e minutos sem mudar a unidade persistida", () => {
    expect(formatDurationMinutes(1000)).toBe("16 h 40 min");
    expect(formatDurationMinutes(355)).toBe("5 h 55 min");
    expect(formatDurationMinutes(60)).toBe("1 h 00 min");
    expect(formatDurationMinutes(null)).toBe("Duração não informada");
  });
  it("preserva data ausente e impede salvar sem revisão/completar campos", () => {
    const d = importedDraft(offer, "source");
    expect(d.segmentos[0].departureDate).toBeNull();
    expect(() => buildFlightPlan([d], d.id)).toThrow(/revisão/);
    d.calculo.revisado = true; d.calculo.custoPorMilheiro = 25;
    expect(buildFlightPlan([d], d.id).options[0].segmentos[0].departureDate).toBeNull();
  });
  it("calcula oferta em dinheiro sem milhas ou companhia", () => {
    const d = reviewed(); d.cia = ""; d.calculo.milhasIda = 0; d.calculo.custoPorMilheiro = 0; d.calculo.taxas = 500;
    d.segmentos[0].departureDate = null; d.segmentos[0].arrivalDate = null;
    expect(buildFlightPlan([d], d.id).options[0].precoTotal).toBe(550);
  });
  it("explica quando milhas precisam de milheiro", () => {
    const d = reviewed(); d.calculo.custoPorMilheiro = 0;
    expect(() => buildFlightPlan([d], d.id)).toThrow(/custo do milheiro/);
  });
  it("não trata preço do grupo como preço por pessoa", () => {
    const d = importedDraft({ ...offer, priceBasis: "GROUP", passengers: 2 }, "source");
    expect(d.calculo.milhasIda).toBe(0);
    expect(d.calculo.taxas).toBe(0);
    expect(d.fonteMilhas).toBe(87141);
  });
  it("arredonda custo e lucro em centavos e não soma alternativas", () => {
    const d = reviewed(), other = reviewed(); other.id = "other"; other.calculo.taxasAdicionais = 100;
    const plan = buildFlightPlan([d, other], d.id);
    expect(plan.options[0].calculo.custoMilhas).toBe(2178.53);
    expect(plan.options[0].calculo.basePorPessoa).toBe(2217.37);
    expect(plan.options[0].calculo.lucroPorPessoa).toBe(221.74);
    expect(plan.options[0].precoTotal).toBe(2439.11);
    expect(plan.selectedOptionId).toBe(d.id);
  });
  it("calcula dois passageiros com taxa e lucro misto", () => {
    const d = reviewed(); d.qtdPessoas = 2; d.calculo.milhasIda = 20000; d.calculo.taxas = 50;
    d.calculo.lucroConfig = { usarPct: true, pct: 10, usarFixo: true, fixo: 20 };
    expect(buildFlightPlan([d], d.id).options[0].precoTotal).toBe(1250);
  });
  it("arredonda meio centavo para cima antes de aplicar lucro", () => {
    const d = reviewed(); d.calculo.milhasIda = 1005; d.calculo.custoPorMilheiro = 1;
    d.calculo.taxas = 0; d.calculo.lucroConfig.usarPct = false;
    const result = buildFlightPlan([d], d.id).options[0];
    expect(result.calculo.custoMilhas).toBe(1.01);
    expect(result.precoTotal).toBe(1.01);
  });
  it("impede opções duplicadas e valores com frações de centavo", () => {
    const d = reviewed();
    expect(() => buildFlightPlan([d, d], d.id)).toThrow(/duplicadas/);
    d.calculo.taxas = 38.841;
    expect(() => buildFlightPlan([d], d.id)).toThrow();
  });
  it("rejeita datas inexistentes e chegada anterior à saída", () => {
    const d = reviewed(); d.segmentos[0].arrivalDate = "2026-02-30";
    expect(() => buildFlightPlan([d], d.id)).toThrow();
    d.segmentos[0].arrivalDate = "2026-09-19";
    expect(() => buildFlightPlan([d], d.id)).toThrow();
  });
  it("preserva cálculo pela API e exclui dados internos do PDF/WhatsApp", () => {
    const d = reviewed(); d.nome = "<script>alert(1)</script>";
    const plan = buildFlightPlan([d], d.id);
    const c: Cotacao = { id: "quote", clienteId: "customer", titulo: "Viagem", destino: "Recife", valorTotal: 2439.11,
      moeda: "BRL", status: "em_cotacao", validade: "2026-09-19", observacoes: "", detalhes: emptyCotacaoDetalhes(),
      tags: [], prioridade: false, responsavel: "", createdAt: "2026-09-13", updatedAt: "2026-09-13", flightPlan: plan };
    const request = cotacaoToCreateRequest(c);
    expect(request.flightPlan).toEqual(plan);
    const api = { ...request, id: "quote", customerName: "Cliente", createdAt: "2026-09-13", updatedAt: "2026-09-13", internalNotes: "" } as ApiQuotationResponse;
    const restored = apiQuotationResponseToCotacao(api);
    expect(restored.flightPlan).toEqual(plan);
    expect(restored.opcoesVoo).toEqual(commercialFlights(plan));
    expect(JSON.stringify(restored.opcoesVoo)).not.toMatch(/calculo|importacaoId|87141/);
    const client = { id: "customer", nome: "Cliente", telefone: "", email: "" } as Cliente;
    const html = gerarHtmlCotacao(restored, client);
    const message = gerarMensagemTexto(restored, client);
    for (const output of [html, message]) {
      expect(output).not.toMatch(/PRIVATE-SOURCE-ID|87141|87\.141|custoPorMilheiro|lucroConfig/);
      expect(output).toContain("17:25"); expect(output).toContain("20/09/2026");
    }
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
