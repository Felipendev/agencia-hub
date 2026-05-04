import { formatBRL, formatDateBR } from "@/lib/format";
import type { Cotacao, Cliente } from "@/types";

/**
 * Gera mensagem de texto simples (sem emojis) para copiar e colar
 * no WhatsApp, SMS, e-mail ou qualquer outro canal.
 */
export function gerarMensagemTexto(
  cotacao: Cotacao,
  cliente: Cliente,
  nomeAgencia = "AgenciaHub",
): string {
  const L: string[] = [];

  L.push(`Ola, ${cliente.nome}!`);
  L.push("");
  L.push(
    "Segue o resumo da sua cotacao de viagem. O arquivo PDF com todos os detalhes foi enviado em anexo.",
  );
  L.push("");

  L.push(`Cotacao: ${cotacao.titulo}`);
  L.push(`Destino: ${cotacao.destino}`);

  if (cotacao.dataInicioViagem && cotacao.dataFimViagem) {
    L.push(
      `Periodo: ${formatDateBR(cotacao.dataInicioViagem)} a ${formatDateBR(cotacao.dataFimViagem)}`,
    );
  }

  // Passageiros
  const pax: string[] = [];
  if (cotacao.detalhes.adultos > 0)
    pax.push(
      `${cotacao.detalhes.adultos} adulto${cotacao.detalhes.adultos > 1 ? "s" : ""}`,
    );
  if (cotacao.detalhes.criancas > 0)
    pax.push(
      `${cotacao.detalhes.criancas} crianca${cotacao.detalhes.criancas > 1 ? "s" : ""}`,
    );
  if (cotacao.detalhes.bebes > 0)
    pax.push(
      `${cotacao.detalhes.bebes} bebe${cotacao.detalhes.bebes > 1 ? "s" : ""}`,
    );
  if (pax.length > 0) L.push(`Passageiros: ${pax.join(", ")}`);

  // Servicos
  const servicos = cotacao.detalhes.servicosDesejados ?? [];
  if (servicos.length > 0) {
    const labels: Record<string, string> = {
      passagem: "Passagens aereas",
      hospedagem: "Hospedagem",
      seguro: "Seguro viagem",
      transfer: "Transfer aeroporto",
      passeios: "Passeios e ingressos",
      aluguel_carro: "Aluguel de carro",
      chip: "Chip internacional",
    };
    L.push(`Servicos: ${servicos.map((s) => labels[s] ?? s).join(", ")}`);
  }

  L.push("");
  if (cotacao.valorTotal > 0) {
    L.push(`Valor total: ${formatBRL(cotacao.valorTotal)}`);
  }
  L.push(`Validade: ${formatDateBR(cotacao.validade)}`);

  if (cotacao.observacoes?.trim()) {
    L.push("");
    L.push(`Obs: ${cotacao.observacoes.trim()}`);
  }

  L.push("");
  L.push(
    "Para confirmar a reserva ou tirar duvidas, e so responder esta mensagem.",
  );
  L.push("");
  L.push(nomeAgencia);

  return L.join("\n");
}
