import type { Cliente } from "@/types";

export const CUSTOMER_PROFILE_KEYS = ["whatsapp", "avaliacao", "dataNascimento", "sexo", "tipoPassageiro", "tipoCliente", "tipoFornecedor", "tipoRepresentante", "redeSocial", "site", "chavePix", "aceitaComunicacao", "documentosObs", "documentoCpfCnpj", "documentoRg", "documentoOrgaoEmissorRg", "documentoInscricaoMunicipal", "documentoIdEstrangeiro", "documentoNacionalidade", "documentoEstadoCivil", "documentoPassaporte", "documentoPassaporteEmissao", "documentoPassaporteVencimento", "documentoPassaporteNacionalidade", "documentoVisto", "documentoVistoValidade", "profissao", "renda", "canalVenda", "emergenciaNome", "emergenciaTelefone", "informacoesExtras", "endereco"] as const satisfies readonly (keyof Cliente)[];

export type CustomerProfileData = { [K in typeof CUSTOMER_PROFILE_KEYS[number]]?: Cliente[K] | null };

/** Contrato JSON do backend (inglês) — `CreateCustomerRequest` / `CustomerResponse` Java. */

export type ApiCustomerStatus = "ACTIVE" | "INACTIVE" | "PROSPECT";

export type ApiCreateCustomerRequest = {
  profileData?: CustomerProfileData | null;
  name: string;
  email: string | null;
  phone: string | null;
  interestDestination: string | null;
  status: ApiCustomerStatus;
  notes?: string;
};

export type ApiCustomerResponse = {
  id: string;
  profileData?: CustomerProfileData | null;
  name: string;
  email: string | null;
  phone: string | null;
  interestDestination: string | null;
  status: ApiCustomerStatus;
  notes: string;
  createdAt: string;
  deletedAt: string | null;
};
