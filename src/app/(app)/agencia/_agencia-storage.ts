const STORAGE_AGENCIA = "agencia-hub-agencia";

export type DadosAgencia = {
  nome: string; cnpj: string; telefone: string; email: string;
  site: string; descricao: string;
  cep: string; logradouro: string; numero: string; complemento: string;
  bairro: string; cidade: string; uf: string; pais: string;
};

export const defaultDados: DadosAgencia = {
  nome: "", cnpj: "", telefone: "", email: "", site: "", descricao: "",
  cep: "", logradouro: "", numero: "", complemento: "",
  bairro: "", cidade: "", uf: "", pais: "Brasil",
};

export function loadDados(): DadosAgencia {
  try {
    const raw = localStorage.getItem(STORAGE_AGENCIA);
    if (!raw) return { ...defaultDados };
    return { ...defaultDados, ...(JSON.parse(raw) as Partial<DadosAgencia>) };
  } catch { return { ...defaultDados }; }
}

export function saveDados(d: DadosAgencia) {
  localStorage.setItem(STORAGE_AGENCIA, JSON.stringify(d));
}
