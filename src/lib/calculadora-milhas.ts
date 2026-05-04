/**
 * Lógica de cálculo da Calculadora de Milhas
 * Baseada na planilha "Cotações - 2026.xlsx"
 */

export type CompanhiaId = "LATAM" | "AZUL" | "GOL" | "TAP" | "OUTRA";

export const COMPANHIAS: { id: CompanhiaId; label: string }[] = [
  { id: "LATAM", label: "LATAM" },
  { id: "AZUL", label: "Azul" },
  { id: "GOL", label: "GOL (Smiles)" },
  { id: "TAP", label: "TAP" },
  { id: "OUTRA", label: "Outra" },
];

/** Tabela de referência de custo do milheiro por CIA e faixa */
export const TABELA_MILHEIRO: Record<
  CompanhiaId,
  { label: string; valor: number }[]
> = {
  LATAM: [
    { label: "Até 7 dias / abaixo de 40k", valor: 28 },
    { label: "Acima de 40k", valor: 26 },
    { label: "Acima de 200k", valor: 24 },
  ],
  AZUL: [
    { label: "Até 7 dias / abaixo de 60k", valor: 18 },
    { label: "Acima de 60k", valor: 17 },
  ],
  GOL: [
    { label: "Até 7 dias / abaixo de 50k", valor: 18 },
    { label: "Abaixo de 90k", valor: 17 },
    { label: "Acima de 100k", valor: 15 },
  ],
  TAP: [
    { label: "Abaixo de 90k", valor: 45 },
    { label: "Acima de 100k", valor: 44 },
  ],
  OUTRA: [{ label: "Personalizado", valor: 20 }],
};

/** Tabela de bagagens nacionais por CIA (R$) */
export const TABELA_BAGAGEM_NACIONAL: Record<
  CompanhiaId,
  { antes: number; checkin: number; aeroporto: number; depois48h: number }
> = {
  LATAM:  { antes: 135, checkin: 130, aeroporto: 160, depois48h: 160 },
  AZUL:   { antes: 175, checkin: 195, aeroporto: 195, depois48h: 195 },
  GOL:    { antes: 130, checkin: 145, aeroporto: 160, depois48h: 165 },
  TAP:    { antes: 0,   checkin: 0,   aeroporto: 0,   depois48h: 0   },
  OUTRA:  { antes: 0,   checkin: 0,   aeroporto: 0,   depois48h: 0   },
};

// ─── Tipos de entrada ─────────────────────────────────────────────────────────

export type TipoTrecho = "ida_volta" | "so_ida" | "preco_unico";

export type TrechoInput = {
  /** Milhas para ida (ou total se preco_unico) */
  milhasIda: number;
  /** Milhas para volta (ignorado se preco_unico ou so_ida) */
  milhasVolta: number;
  /** Custo do milheiro em R$ */
  custoPorMilheiro: number;
  /** Taxas aeroportuárias em R$ (ida + volta somadas) */
  taxas: number;
  /** Tipo de trecho */
  tipo: TipoTrecho;
};

export type CiaInput = {
  cia: CompanhiaId;
  nomeCustom?: string; // quando cia === "OUTRA"
  trecho: TrechoInput;
  /** Lucro desejado pela agência em R$ (por pessoa) */
  lucro: number;
  /** Valor da mala despachada em R$ (por mala) */
  valorMala: number;
  /** Quantidade de malas */
  qtdMalas: number;
};

export type CalculadoraInput = {
  qtdPessoas: number;
  cias: CiaInput[];
};

// ─── Tipos de resultado ───────────────────────────────────────────────────────

export type ResultadoCia = {
  cia: CompanhiaId;
  label: string;
  /** Preço por pessoa sem mala */
  precoPorPessoaSemMala: number;
  /** Preço por pessoa com mala */
  precoPorPessoaComMala: number;
  /** Preço total do grupo sem mala */
  precoTotalSemMala: number;
  /** Preço total do grupo com mala */
  precoTotalComMala: number;
  /** Lucro total da agência */
  lucroTotal: number;
  /** Detalhes intermediários */
  detalhes: {
    precoSemTaxaPorPessoa: number;
    taxasPorPessoa: number;
    precoComTaxaPorPessoa: number;
    totalMalas: number;
  };
};

export type ResultadoCalculadora = {
  resultados: ResultadoCia[];
  /** CIA mais barata para o cliente (sem mala) */
  maisBarataSemMala: CompanhiaId | null;
  /** CIA mais barata para o cliente (com mala) */
  maisBarataComMala: CompanhiaId | null;
  /** CIA com maior lucro para a agência */
  maiorLucro: CompanhiaId | null;
};

// ─── Funções de cálculo ───────────────────────────────────────────────────────

/**
 * Calcula o preço sem taxa por pessoa para um trecho.
 * Fórmula: (milhas × R$/milheiro) ÷ 1000
 */
export function calcularPrecoSemTaxa(
  milhas: number,
  custoPorMilheiro: number,
): number {
  return (milhas * custoPorMilheiro) / 1000;
}

/**
 * Calcula o resultado completo para uma CIA.
 * Espelha as fórmulas da planilha:
 *   H = (E*G)/1000          → preço sem taxa
 *   I = H + F               → preço total do cliente (com taxa)
 *   M = (I_ida + I_volta) * qtd_pessoas + lucro
 *   N = valor_mala * qtd_malas + M
 */
export function calcularCia(
  input: CiaInput,
  qtdPessoas: number,
): ResultadoCia {
  const { trecho, lucro, valorMala, qtdMalas } = input;

  let precoSemTaxaIda = 0;
  let precoSemTaxaVolta = 0;
  let precoComTaxaIda = 0;
  let precoComTaxaVolta = 0;

  if (trecho.tipo === "preco_unico") {
    // I+V: milhasIda contém o total, taxas já somadas
    const precoSemTaxa = calcularPrecoSemTaxa(
      trecho.milhasIda,
      trecho.custoPorMilheiro,
    );
    precoComTaxaIda = precoSemTaxa + trecho.taxas;
    precoSemTaxaIda = precoSemTaxa;
    // volta zerada (já incluída no preço único)
    precoComTaxaVolta = 0;
    precoSemTaxaVolta = 0;
  } else if (trecho.tipo === "so_ida") {
    precoSemTaxaIda = calcularPrecoSemTaxa(
      trecho.milhasIda,
      trecho.custoPorMilheiro,
    );
    precoComTaxaIda = precoSemTaxaIda + trecho.taxas;
    precoComTaxaVolta = 0;
    precoSemTaxaVolta = 0;
  } else {
    // ida_volta: calcula separado
    precoSemTaxaIda = calcularPrecoSemTaxa(
      trecho.milhasIda,
      trecho.custoPorMilheiro,
    );
    precoSemTaxaVolta = calcularPrecoSemTaxa(
      trecho.milhasVolta,
      trecho.custoPorMilheiro,
    );
    // taxas são o total (ida + volta somadas)
    precoComTaxaIda = precoSemTaxaIda + trecho.taxas;
    precoComTaxaVolta = precoSemTaxaVolta; // taxa já contabilizada na ida
  }

  // Preço por pessoa sem mala = (precoComTaxaIda + precoComTaxaVolta) + lucro
  const precoPorPessoaSemMala =
    precoComTaxaIda + precoComTaxaVolta + lucro;

  // Preço total do grupo sem mala
  const precoTotalSemMala = precoPorPessoaSemMala * qtdPessoas;

  // Total de malas
  const totalMalas = valorMala * qtdMalas;

  // Preço por pessoa com mala (mala dividida por pessoas)
  const precoPorPessoaComMala =
    precoPorPessoaSemMala + (qtdPessoas > 0 ? totalMalas / qtdPessoas : 0);

  // Preço total com mala
  const precoTotalComMala = precoTotalSemMala + totalMalas;

  // Lucro total
  const lucroTotal = lucro * qtdPessoas;

  const label =
    input.cia === "OUTRA"
      ? (input.nomeCustom?.trim() || "Outra CIA")
      : COMPANHIAS.find((c) => c.id === input.cia)?.label ?? input.cia;

  return {
    cia: input.cia,
    label,
    precoPorPessoaSemMala,
    precoPorPessoaComMala,
    precoTotalSemMala,
    precoTotalComMala,
    lucroTotal,
    detalhes: {
      precoSemTaxaPorPessoa: precoSemTaxaIda + precoSemTaxaVolta,
      taxasPorPessoa: trecho.taxas,
      precoComTaxaPorPessoa: precoComTaxaIda + precoComTaxaVolta,
      totalMalas,
    },
  };
}

/** Calcula todas as CIAs e identifica os destaques */
export function calcular(input: CalculadoraInput): ResultadoCalculadora {
  if (input.cias.length === 0 || input.qtdPessoas <= 0) {
    return {
      resultados: [],
      maisBarataSemMala: null,
      maisBarataComMala: null,
      maiorLucro: null,
    };
  }

  const resultados = input.cias.map((cia) =>
    calcularCia(cia, input.qtdPessoas),
  );

  // Encontrar destaques (apenas CIAs com preço > 0)
  const validos = resultados.filter((r) => r.precoTotalSemMala > 0);

  const maisBarataSemMala =
    validos.length > 0
      ? validos.reduce((a, b) =>
          a.precoTotalSemMala <= b.precoTotalSemMala ? a : b,
        ).cia
      : null;

  const validosComMala = resultados.filter((r) => r.precoTotalComMala > 0);
  const maisBarataComMala =
    validosComMala.length > 0
      ? validosComMala.reduce((a, b) =>
          a.precoTotalComMala <= b.precoTotalComMala ? a : b,
        ).cia
      : null;

  const maiorLucro =
    validos.length > 0
      ? validos.reduce((a, b) => (a.lucroTotal >= b.lucroTotal ? a : b)).cia
      : null;

  return { resultados, maisBarataSemMala, maisBarataComMala, maiorLucro };
}

/** Formata número como moeda BRL */
export function fmtBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}
