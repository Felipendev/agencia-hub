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
    { label: "Ate 7 dias / abaixo de 40k", valor: 28 },
    { label: "Acima de 40k", valor: 26 },
    { label: "Acima de 200k", valor: 24 },
  ],
  AZUL: [
    { label: "Ate 7 dias / abaixo de 60k", valor: 18 },
    { label: "Acima de 60k", valor: 17 },
  ],
  GOL: [
    { label: "Ate 7 dias / abaixo de 50k", valor: 18 },
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
  milhasIda: number;
  milhasVolta: number;
  custoPorMilheiro: number;
  taxas: number;
  tipo: TipoTrecho;
};

/**
 * Configuracao de lucro flexivel:
 * - pct: percentual sobre o preco base (ex: 10 = 10%)
 * - fixo: valor fixo em R$ por pessoa
 * Podem ser usados juntos: lucro = base * pct/100 + fixo
 */
export type LucroConfig = {
  usarPct: boolean;
  pct: number;       // percentual (default 10)
  usarFixo: boolean;
  fixo: number;      // valor fixo em R$ por pessoa
};

export const LUCRO_CONFIG_PADRAO: LucroConfig = {
  usarPct: true,
  pct: 10,
  usarFixo: false,
  fixo: 0,
};

export type CiaInput = {
  cia: CompanhiaId;
  nomeCustom?: string;
  trecho: TrechoInput;
  lucroConfig: LucroConfig;
  valorMala: number;
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
  /** Preco base por pessoa (milhas + taxas, sem lucro e sem mala) */
  precoBasePorPessoa: number;
  /** Lucro calculado por pessoa */
  lucroPorPessoa: number;
  /** Preco por pessoa para o cliente (base + lucro, sem mala) */
  precoPorPessoaSemMala: number;
  /** Preco por pessoa para o cliente (base + lucro + mala) */
  precoPorPessoaComMala: number;
  /** Preco total do grupo sem mala */
  precoTotalSemMala: number;
  /** Preco total do grupo com mala */
  precoTotalComMala: number;
  /** Lucro total da agencia */
  lucroTotal: number;
  /** Total de malas (valor separado para o cliente) */
  totalMalas: number;
  detalhes: {
    precoSemTaxaPorPessoa: number;
    taxasPorPessoa: number;
    precoComTaxaPorPessoa: number;
  };
};

export type ResultadoCalculadora = {
  resultados: ResultadoCia[];
  maisBarataSemMala: CompanhiaId | null;
  maisBarataComMala: CompanhiaId | null;
  maiorLucro: CompanhiaId | null;
};

// ─── Funcoes de calculo ───────────────────────────────────────────────────────

export function calcularPrecoSemTaxa(milhas: number, custoPorMilheiro: number): number {
  return (milhas * custoPorMilheiro) / 1000;
}

/**
 * Calcula o lucro por pessoa com base na configuracao flexivel.
 * lucro = precoBase * pct/100 + fixo
 */
export function calcularLucro(precoBase: number, config: LucroConfig): number {
  let lucro = 0;
  if (config.usarPct && config.pct > 0) {
    lucro += precoBase * (config.pct / 100);
  }
  if (config.usarFixo && config.fixo > 0) {
    lucro += config.fixo;
  }
  return lucro;
}

export function calcularCia(input: CiaInput, qtdPessoas: number): ResultadoCia {
  const { trecho, lucroConfig, valorMala, qtdMalas } = input;

  let precoSemTaxaIda = 0;
  let precoSemTaxaVolta = 0;
  let precoComTaxaIda = 0;
  let precoComTaxaVolta = 0;

  if (trecho.tipo === "preco_unico") {
    const precoSemTaxa = calcularPrecoSemTaxa(trecho.milhasIda, trecho.custoPorMilheiro);
    precoSemTaxaIda = precoSemTaxa;
    precoComTaxaIda = precoSemTaxa + trecho.taxas;
    precoSemTaxaVolta = 0;
    precoComTaxaVolta = 0;
  } else if (trecho.tipo === "so_ida") {
    precoSemTaxaIda = calcularPrecoSemTaxa(trecho.milhasIda, trecho.custoPorMilheiro);
    precoComTaxaIda = precoSemTaxaIda + trecho.taxas;
    precoSemTaxaVolta = 0;
    precoComTaxaVolta = 0;
  } else {
    precoSemTaxaIda = calcularPrecoSemTaxa(trecho.milhasIda, trecho.custoPorMilheiro);
    precoSemTaxaVolta = calcularPrecoSemTaxa(trecho.milhasVolta, trecho.custoPorMilheiro);
    precoComTaxaIda = precoSemTaxaIda + trecho.taxas;
    precoComTaxaVolta = precoSemTaxaVolta;
  }

  // Preco base = milhas + taxas (sem lucro)
  const precoBasePorPessoa = precoComTaxaIda + precoComTaxaVolta;

  // Lucro calculado sobre o preco base
  const lucroPorPessoa = calcularLucro(precoBasePorPessoa, lucroConfig);

  // Preco por pessoa sem mala = base + lucro
  const precoPorPessoaSemMala = precoBasePorPessoa + lucroPorPessoa;

  // Total de malas (separado — cliente ve esse valor separado)
  const totalMalas = valorMala * qtdMalas;

  // Preco por pessoa com mala
  const precoPorPessoaComMala =
    precoPorPessoaSemMala + (qtdPessoas > 0 ? totalMalas / qtdPessoas : 0);

  const precoTotalSemMala = precoPorPessoaSemMala * qtdPessoas;
  const precoTotalComMala = precoTotalSemMala + totalMalas;
  const lucroTotal = lucroPorPessoa * qtdPessoas;

  const label =
    input.cia === "OUTRA"
      ? (input.nomeCustom?.trim() || "Outra CIA")
      : COMPANHIAS.find((c) => c.id === input.cia)?.label ?? input.cia;

  return {
    cia: input.cia,
    label,
    precoBasePorPessoa,
    lucroPorPessoa,
    precoPorPessoaSemMala,
    precoPorPessoaComMala,
    precoTotalSemMala,
    precoTotalComMala,
    lucroTotal,
    totalMalas,
    detalhes: {
      precoSemTaxaPorPessoa: precoSemTaxaIda + precoSemTaxaVolta,
      taxasPorPessoa: trecho.taxas,
      precoComTaxaPorPessoa: precoBasePorPessoa,
    },
  };
}

export function calcular(input: CalculadoraInput): ResultadoCalculadora {
  if (input.cias.length === 0 || input.qtdPessoas <= 0) {
    return { resultados: [], maisBarataSemMala: null, maisBarataComMala: null, maiorLucro: null };
  }

  const resultados = input.cias.map((cia) => calcularCia(cia, input.qtdPessoas));
  const validos = resultados.filter((r) => r.precoTotalSemMala > 0);

  const maisBarataSemMala = validos.length > 0
    ? validos.reduce((a, b) => a.precoTotalSemMala <= b.precoTotalSemMala ? a : b).cia
    : null;

  const validosComMala = resultados.filter((r) => r.precoTotalComMala > 0);
  const maisBarataComMala = validosComMala.length > 0
    ? validosComMala.reduce((a, b) => a.precoTotalComMala <= b.precoTotalComMala ? a : b).cia
    : null;

  const maiorLucro = validos.length > 0
    ? validos.reduce((a, b) => a.lucroTotal >= b.lucroTotal ? a : b).cia
    : null;

  return { resultados, maisBarataSemMala, maisBarataComMala, maiorLucro };
}

export function fmtBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

// ─── Helpers para cotacao ─────────────────────────────────────────────────────

/**
 * Gera o texto de observacoes para a cotacao com o comparativo de CIAs.
 * O cliente ve: CIA | Passagens | Malas | Total
 * O lucro NAO aparece para o cliente.
 */
export function gerarObservacoesCotacao(
  resultados: ResultadoCia[],
  qtdPessoas: number,
  origem: string,
  destino: string,
): string {
  const linhas: string[] = [];

  linhas.push(`Comparativo de passagens: ${origem} -> ${destino}`);
  linhas.push(`Passageiros: ${qtdPessoas}`);
  linhas.push("");

  for (const r of resultados) {
    linhas.push(`${r.label}`);
    linhas.push(`  Passagens: ${fmtBRL(r.precoTotalSemMala)}`);
    if (r.totalMalas > 0) {
      linhas.push(`  Bagagens: ${fmtBRL(r.totalMalas)}`);
      linhas.push(`  Total: ${fmtBRL(r.precoTotalComMala)}`);
    }
    linhas.push("");
  }

  return linhas.join("\n").trim();
}
