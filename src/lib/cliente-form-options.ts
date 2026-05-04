/** Opções para selects do cadastro de cliente / pessoa */

export const PAISES_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "Brasil", label: "Brasil" },
  { value: "Argentina", label: "Argentina" },
  { value: "Chile", label: "Chile" },
  { value: "Estados Unidos", label: "Estados Unidos" },
  { value: "Portugal", label: "Portugal" },
  { value: "Outro", label: "Outro" },
] as const;

export const NACIONALIDADES_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "Brasileira", label: "Brasileira" },
  { value: "Brasileiro", label: "Brasileiro" },
  { value: "Argentina", label: "Argentina" },
  { value: "Chilena", label: "Chilena" },
  { value: "Norte-americana", label: "Norte-americana" },
  { value: "Portuguesa", label: "Portuguesa" },
  { value: "Outra", label: "Outra" },
] as const;

export const NACIONALIDADES_PASSAPORTE_OPTIONS = [
  { value: "", label: "Selecione" },
  ...NACIONALIDADES_OPTIONS.slice(1),
] as const;

export const ESTADO_CIVIL_OPTIONS = [
  { value: "", label: "Selecione o estado civil" },
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "uniao_estavel", label: "União estável" },
  { value: "outro", label: "Outro" },
] as const;

export const PROFISSAO_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "administrador", label: "Administrador(a)" },
  { value: "autonomo", label: "Autônomo(a)" },
  { value: "comerciante", label: "Comerciante" },
  { value: "engenheiro", label: "Engenheiro(a)" },
  { value: "medico", label: "Médico(a)" },
  { value: "aposentado", label: "Aposentado(a)" },
  { value: "estudante", label: "Estudante" },
  { value: "do_lar", label: "Do lar" },
  { value: "outro", label: "Outro" },
] as const;

export const CANAL_VENDA_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "indicacao", label: "Indicação" },
  { value: "site", label: "Site" },
  { value: "telefone", label: "Telefone" },
  { value: "feira_evento", label: "Feira / evento" },
  { value: "outro", label: "Outro" },
] as const;

/** Capitais brasileiras para o select de cidade */
export const CIDADES_BR_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "Aracaju", label: "Aracaju" },
  { value: "Belém", label: "Belém" },
  { value: "Belo Horizonte", label: "Belo Horizonte" },
  { value: "Boa Vista", label: "Boa Vista" },
  { value: "Brasília", label: "Brasília" },
  { value: "Campo Grande", label: "Campo Grande" },
  { value: "Cuiabá", label: "Cuiabá" },
  { value: "Curitiba", label: "Curitiba" },
  { value: "Florianópolis", label: "Florianópolis" },
  { value: "Fortaleza", label: "Fortaleza" },
  { value: "Goiânia", label: "Goiânia" },
  { value: "João Pessoa", label: "João Pessoa" },
  { value: "Macapá", label: "Macapá" },
  { value: "Maceió", label: "Maceió" },
  { value: "Manaus", label: "Manaus" },
  { value: "Natal", label: "Natal" },
  { value: "Palmas", label: "Palmas" },
  { value: "Porto Alegre", label: "Porto Alegre" },
  { value: "Porto Velho", label: "Porto Velho" },
  { value: "Recife", label: "Recife" },
  { value: "Rio Branco", label: "Rio Branco" },
  { value: "Rio de Janeiro", label: "Rio de Janeiro" },
  { value: "Salvador", label: "Salvador" },
  { value: "São Luís", label: "São Luís" },
  { value: "São Paulo", label: "São Paulo" },
  { value: "Teresina", label: "Teresina" },
  { value: "Vitória", label: "Vitória" },
] as const;
