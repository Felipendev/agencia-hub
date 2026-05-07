/** Tipos centrais do AgenciaHub — preparados para persistência futura */

export type ClienteStatus = "ativo" | "inativo" | "prospecto";

export type AtendimentoStatus =
  | "novo_lead"
  | "em_atendimento"
  | "proposta_enviada"
  | "fechado"
  | "cancelado";

export type LancamentoTipo = "entrada" | "saida";

export type LancamentoCategoria =
  | "pacote_vendido"
  | "comissao"
  | "hospedagem"
  | "passagem"
  | "milhas"
  | "marketing"
  | "operacional"
  | "reembolso"
  | "outros";

export type LancamentoStatus = "previsto" | "confirmado" | "cancelado";

export type ClienteSexo =
  | "nao_informado"
  | "feminino"
  | "masculino"
  | "outro";

/** Endereço opcional — cadastro tipo CRM */
export interface ClienteEndereco {
  pais?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  whatsapp?: string;
  destinoInteresse: string;
  status: ClienteStatus;
  observacoes: string;
  createdAt: string;
  /** Etapa no funil Hub (1–5; UI linha com nós; armazena como número) */
  avaliacao?: number;
  dataNascimento?: string;
  sexo?: ClienteSexo;
  /** Perfis da pessoa (vários ligados ao mesmo tempo) */
  tipoPassageiro?: boolean;
  tipoCliente?: boolean;
  tipoFornecedor?: boolean;
  tipoRepresentante?: boolean;
  redeSocial?: string;
  site?: string;
  chavePix?: string;
  aceitaComunicacao?: boolean;
  /** Texto livre complementar na aba Documentos */
  documentosObs?: string;
  documentoCpfCnpj?: string;
  documentoRg?: string;
  documentoOrgaoEmissorRg?: string;
  documentoInscricaoMunicipal?: string;
  documentoIdEstrangeiro?: string;
  documentoNacionalidade?: string;
  documentoEstadoCivil?: string;
  documentoPassaporte?: string;
  documentoPassaporteEmissao?: string;
  documentoPassaporteVencimento?: string;
  documentoPassaporteNacionalidade?: string;
  documentoVisto?: string;
  documentoVistoValidade?: string;
  profissao?: string;
  renda?: string;
  canalVenda?: string;
  emergenciaNome?: string;
  emergenciaTelefone?: string;
  informacoesExtras?: string;
  endereco?: ClienteEndereco;
}

export interface Atendimento {
  id: string;
  clienteId: string;
  titulo: string;
  destino: string;
  valorEstimado: number;
  status: AtendimentoStatus;
  dataPrevistaViagem: string;
  observacoes: string;
}

export interface LancamentoFinanceiro {
  id: string;
  descricao: string;
  tipo: LancamentoTipo;
  categoria: LancamentoCategoria;
  valor: number;
  data: string;
  status: LancamentoStatus;
  clienteId?: string;
  contaBancaria?: string;
}

/**
 * Colunas do funil Kanban (referência CRM de agências).
 * Estados finais: expirada, cancelada (podem ficar fora do quadro ou em coluna extra).
 */
export type CotacaoStatus =
  | "aguardando"
  | "em_cotacao"
  | "aguardando_cliente"
  | "aprovado"
  | "reprovado"
  | "expirada"
  | "cancelada";

/** Campos inspirados em formulário público de cotação (serviços, passageiros, hospedagem…). */
export interface CotacaoDetalhes {
  servicosDesejados: string[];
  origem: string;
  /** @deprecated Preferir `destinosTrechos`; mantido para compatibilidade */
  destinoForm: string;
  /** Trechos tipo "São Paulo — Madri", "Madri — Portugal" (vários) */
  destinosTrechos: string[];
  dataIda: string;
  dataVolta: string;
  flexibilidadeIda: string;
  flexibilidadeVolta: string;
  /** Preenchido quando flexibilidade ida/volta = "outro" */
  flexibilidadeIdaOutro: string;
  flexibilidadeVoltaOutro: string;
  horarioSaidaIda: string;
  horarioSaidaVolta: string;
  preferenciaVooIda: string;
  preferenciaVooVolta: string;
  adultos: number;
  criancas: number;
  idadesCriancas: string;
  bebes: number;
  malasDespachadas: boolean;
  qtdMalas: string;
  bagagemEspecial: boolean;
  categoriaHospedagem: string;
  comodidadesHospedagem: string[];
  qtdQuartos: number;
  /** Apenas dígitos (DDD + número), ex.: 11987654321 */
  celular: string;
  whatsapp: string;
  /** Se true, WhatsApp segue o número de celular acima */
  whatsappIgualCelular: boolean;
  preferenciaComunicacao: string;
  usaMilhas: boolean;
  formaPagamento: string;
  /** Texto livre quando forma = "outro" */
  formaPagamentoOutro: string;
  /** Cupom informado pelo cliente (validação de prazo no servidor) */
  cupomCodigo: string;
  /** ISO date: validade retornada na última validação bem-sucedida */
  cupomValidoAte?: string;
}

export interface Cotacao {
  id: string;
  clienteId: string;
  atendimentoId?: string;
  vendedorId?: string;
  vendedorNome?: string;
  /** Título curto ex.: “Orçamento Europa” */
  titulo: string;
  /** Destino/rota — em geral montado a partir dos trechos no formulário */
  destino: string;
  valorTotal: number;
  moeda: string;
  status: CotacaoStatus;
  validade: string;
  dataInicioViagem?: string;
  dataFimViagem?: string;
  observacoes: string;
  /** Dados completos estilo formulário (origem, serviços, passageiros…) */
  detalhes: CotacaoDetalhes;
  tags: string[];
  prioridade: boolean;
  /** Nome do agente (MVP: texto livre) */
  responsavel: string;
  createdAt: string;
  updatedAt: string;
  /** Opcoes de voo calculadas na calculadora de milhas (visivel no PDF) */
  opcoesVoo?: OpcaoVooCotacao[];
}

/** Opcao de voo salva na cotacao — dados que o cliente ve */
export interface OpcaoVooCotacao {
  nome: string;
  cia: string;
  corCia?: string;
  horarioSaida: string;
  horarioChegada: string;
  conexoes: string;
  precoPassagens: number;
  precoBagagens: number;
  precoTotal: number;
  qtdPessoas: number;
}

export interface UsuarioSessao {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  role: "OWNER" | "SELLER";
  agencyId?: string;
  agencyName?: string;
  agencyStatus?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string | null;
  requiresTermsAcceptance?: boolean;
  mustChangePassword?: boolean;
}
