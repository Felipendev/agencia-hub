/** Opções alinhadas ao fluxo tipo formulário público de cotação (serviços, flexibilidade, etc.) */

export const SERVICOS_DESEJADOS_OPTIONS = [
  { id: "passagem", label: "Passagem aérea" },
  { id: "hospedagem", label: "Hospedagem" },
  { id: "transfer", label: "Transfer (aeroporto ↔ hospedagem)" },
  { id: "carro", label: "Aluguel de carro" },
  { id: "passeios", label: "Passeios / ingressos" },
  { id: "seguro", label: "Seguro viagem" },
  { id: "visto", label: "Visto" },
  { id: "passaporte", label: "Passaporte" },
  { id: "cruzeiro", label: "Cruzeiro" },
  { id: "excursao", label: "Excursão / intercâmbio internacional" },
  { id: "onibus", label: "Ônibus" },
] as const;

export const FLEXIBILIDADE_OPTIONS = [
  { id: "", label: "—" },
  { id: "um_dia_antes", label: "Sim (pode ser 1 dia antes)" },
  { id: "um_dia_depois", label: "Sim (pode ser 1 dia depois)" },
  { id: "exato", label: "Não (data exata)" },
  { id: "outro", label: "Outro (especificar)" },
] as const;

export const HORARIO_SAIDA_OPTIONS = [
  { id: "", label: "—" },
  { id: "manha", label: "Manhã" },
  { id: "tarde", label: "Tarde" },
  { id: "noite", label: "Noite" },
  { id: "madrugada", label: "Madrugada" },
  { id: "mais_barato", label: "O horário mais barato" },
] as const;

export const PREFERENCIA_VOO_OPTIONS = [
  { id: "", label: "—" },
  { id: "direto", label: "Somente voo direto (mesmo que mais caro)" },
  { id: "escalas", label: "Pode ter escalas" },
  { id: "barato", label: "A opção mais barata" },
] as const;

export const COMUNICACAO_OPTIONS = [
  { id: "wa_texto", label: "WhatsApp (texto)" },
  { id: "wa_audio", label: "WhatsApp (áudio)" },
  { id: "wa_video", label: "WhatsApp (vídeo)" },
  { id: "wa_voz", label: "WhatsApp (ligação de voz)" },
  { id: "email", label: "E-mail" },
] as const;

export const PAGAMENTO_OPTIONS = [
  { id: "pix", label: "À vista / Pix" },
  { id: "cartao", label: "Cartão de crédito" },
  { id: "debito", label: "Cartão de débito" },
  { id: "boleto", label: "Boleto bancário" },
  { id: "outro", label: "Outro (especificar)" },
] as const;

export function labelFormaPagamento(id: string): string {
  const o = PAGAMENTO_OPTIONS.find((x) => x.id === id);
  return o?.label ?? id;
}

export const HOSPEDAGEM_CATEGORIA_OPTIONS = [
  { id: "", label: "—" },
  { id: "economico", label: "Econômico (hostel / compartilhado)" },
  { id: "basico", label: "Local só para dormir (Airbnb, etc.)" },
  { id: "4estrelas", label: "Hotel 4 estrelas + café" },
  { id: "5estrelas", label: "Hotel 5 estrelas" },
  { id: "resort", label: "Resort" },
] as const;

export const COMODIDADES_HOTEL_OPTIONS = [
  "Ar-condicionado",
  "Piscina",
  "Café da manhã apenas",
  "Meia pensão",
  "Pensão completa",
  "All inclusive",
  "Área kids",
  "Estacionamento",
] as const;
