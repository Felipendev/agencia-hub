/**
 * Tabelas de referência da calculadora de milhas.
 * Persistidas em localStorage — editáveis pelo usuário.
 */

const STORAGE_KEY = "agencia-hub-tabelas-milhas";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FaixaMilheiro = {
  /** Milhas mínimas desta faixa (inclusive) */
  de: number;
  /** Milhas máximas desta faixa (inclusive) — 9999999 = sem limite */
  ate: number;
  /** R$ por 1000 milhas */
  valorPorMilheiro: number;
};

export type CiaMilheiro = {
  id: string;
  nome: string;
  faixas: FaixaMilheiro[];
};

export type FaixaBagagem = {
  /** R$ por mala — compra antecipada (antes do check-in) */
  antes: number;
  /** R$ por mala — no check-in */
  checkin: number;
  /** R$ por mala — no aeroporto */
  aeroporto: number;
  /** R$ por mala — depois de 48h */
  depois48h: number;
};

export type CiaBagagem = {
  id: string;
  nome: string;
  bagagem: FaixaBagagem;
};

export type TabelasMilhas = {
  cias: CiaMilheiro[];
  bagagens: CiaBagagem[];
};

// ─── Valores padrão (baseados na planilha) ────────────────────────────────────

export const TABELAS_PADRAO: TabelasMilhas = {
  cias: [
    {
      id: "latam",
      nome: "LATAM",
      faixas: [
        { de: 0,      ate: 39999,   valorPorMilheiro: 28 },
        { de: 40000,  ate: 199999,  valorPorMilheiro: 26 },
        { de: 200000, ate: 9999999, valorPorMilheiro: 24 },
      ],
    },
    {
      id: "azul",
      nome: "Azul",
      faixas: [
        { de: 0,     ate: 59999,   valorPorMilheiro: 18 },
        { de: 60000, ate: 9999999, valorPorMilheiro: 17 },
      ],
    },
    {
      id: "gol",
      nome: "GOL (Smiles)",
      faixas: [
        { de: 0,      ate: 49999,   valorPorMilheiro: 18 },
        { de: 50000,  ate: 89999,   valorPorMilheiro: 17 },
        { de: 90000,  ate: 99999,   valorPorMilheiro: 16 },
        { de: 100000, ate: 9999999, valorPorMilheiro: 15 },
      ],
    },
    {
      id: "tap",
      nome: "TAP",
      faixas: [
        { de: 0,      ate: 89999,   valorPorMilheiro: 45 },
        { de: 90000,  ate: 99999,   valorPorMilheiro: 44 },
        { de: 100000, ate: 9999999, valorPorMilheiro: 44 },
      ],
    },
    {
      id: "azul-viagens",
      nome: "Azul Viagens",
      faixas: [
        { de: 0,     ate: 89999,   valorPorMilheiro: 17 },
        { de: 90000, ate: 9999999, valorPorMilheiro: 16 },
      ],
    },
    {
      id: "american",
      nome: "American Airlines",
      faixas: [
        { de: 0, ate: 9999999, valorPorMilheiro: 90 },
      ],
    },
    {
      id: "iberia",
      nome: "Iberia",
      faixas: [
        { de: 0, ate: 9999999, valorPorMilheiro: 0 },
      ],
    },
    {
      id: "copa",
      nome: "Copa Airlines",
      faixas: [
        { de: 0, ate: 9999999, valorPorMilheiro: 0 },
      ],
    },
  ],
  bagagens: [
    {
      id: "latam",
      nome: "LATAM",
      bagagem: { antes: 135, checkin: 130, aeroporto: 160, depois48h: 160 },
    },
    {
      id: "azul",
      nome: "Azul",
      bagagem: { antes: 175, checkin: 195, aeroporto: 195, depois48h: 195 },
    },
    {
      id: "gol",
      nome: "GOL",
      bagagem: { antes: 130, checkin: 145, aeroporto: 160, depois48h: 165 },
    },
    {
      id: "tap",
      nome: "TAP",
      bagagem: { antes: 0, checkin: 0, aeroporto: 0, depois48h: 0 },
    },
  ],
};

// ─── Persistência ─────────────────────────────────────────────────────────────

export function carregarTabelas(): TabelasMilhas {
  if (typeof window === "undefined") return TABELAS_PADRAO;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(TABELAS_PADRAO);
    const parsed = JSON.parse(raw) as Partial<TabelasMilhas>;
    return {
      cias: parsed.cias?.length ? parsed.cias : structuredClone(TABELAS_PADRAO.cias),
      bagagens: parsed.bagagens?.length ? parsed.bagagens : structuredClone(TABELAS_PADRAO.bagagens),
    };
  } catch {
    return structuredClone(TABELAS_PADRAO);
  }
}

export function salvarTabelas(tabelas: TabelasMilhas): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tabelas));
}

export function resetarTabelas(): TabelasMilhas {
  const padrao = structuredClone(TABELAS_PADRAO);
  salvarTabelas(padrao);
  return padrao;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Retorna o valor do milheiro para uma CIA e quantidade de milhas.
 * Usa a faixa correta baseada na quantidade.
 */
export function getValorMilheiro(cia: CiaMilheiro, qtdMilhas: number): number {
  const faixa = cia.faixas.find((f) => qtdMilhas >= f.de && qtdMilhas <= f.ate);
  return faixa?.valorPorMilheiro ?? cia.faixas[0]?.valorPorMilheiro ?? 0;
}

export function formatarFaixa(faixa: FaixaMilheiro): string {
  const de = faixa.de === 0 ? "0" : `${(faixa.de / 1000).toFixed(0)}k`;
  const ate = faixa.ate >= 9999999 ? "sem limite" : `${(faixa.ate / 1000).toFixed(0)}k`;
  return `${de} – ${ate}`;
}
