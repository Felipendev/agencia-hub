import type { CotacaoDetalhes } from "@/types";

/** Ícone pré-definido na faixa de contato (cada um com URL clicável). */
export type LinkSocialTipo =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "email"
  | "site"
  | "formulario"
  | "outro";

export type LinkSocialItem = {
  id: string;
  tipo: LinkSocialTipo;
  /** URL absoluta (https://…) ou mailto: */
  url: string;
  /** Rótulo opcional para tooltip / acessibilidade */
  label?: string;
};

/** Personalização da página pública de solicitação. */
export type SolicitacaoPublicaConfig = {
  slug: string;
  tituloPagina: string;
  textoIntro: string;
  /** Imagem enviada pela agência (data URL) ou null para usar só o nome */
  logoDataUrl: string | null;
  nomeMarca: string;
  linksSociais: LinkSocialItem[];
};

/** Envio feito pelo cliente no formulário público (fila para importar no painel). */
export type SolicitacaoPublicSubmission = {
  id: string;
  slug: string;
  createdAt: string;
  nome: string;
  email: string;
  telefone: string;
  /** Vendedor/dono indicado no link (?vendedor=uuid) */
  referralSellerId?: string | null;
  referralSellerName?: string | null;
  detalhes: CotacaoDetalhes;
  observacoes: string;
  /** Código público do vendedor (query ?vendedor=), quando o envio veio de link pessoal. */
  sellerPublicCode?: string | null;
};
