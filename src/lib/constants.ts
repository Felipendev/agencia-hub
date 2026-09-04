import type {
  ClienteStatus,
  CotacaoStatus,
  LancamentoCategoria,
  LancamentoStatus,
} from "@/types";

/** Colunas principais do quadro (estilo CRM / Kanban). */
export const COTACAO_KANBAN_COLUMNS: {
  id: CotacaoStatus;
  label: string;
  headerClass: string;
}[] = [
  {
    id: "aguardando",
    label: "Aguardando",
    headerClass: "border-slate-300 bg-slate-100 text-slate-800",
  },
  {
    id: "em_cotacao",
    label: "Em cotação",
    headerClass: "border-amber-300 bg-amber-50 text-amber-950",
  },
  {
    id: "aguardando_cliente",
    label: "Aguardando cliente",
    headerClass: "border-sky-400 bg-sky-50 text-sky-950",
  },
  {
    id: "aprovado",
    label: "Aprovado",
    headerClass: "border-emerald-400 bg-emerald-50 text-emerald-950",
  },
  {
    id: "reprovado",
    label: "Reprovado",
    headerClass: "border-red-300 bg-red-50 text-red-950",
  },
];

export const COTACAO_ARQUIVO_COLUMNS: {
  id: CotacaoStatus;
  label: string;
  headerClass: string;
}[] = [
  {
    id: "expirada",
    label: "Expirada",
    headerClass: "border-slate-200 bg-slate-50 text-slate-600",
  },
  {
    id: "cancelada",
    label: "Cancelada",
    headerClass: "border-slate-200 bg-slate-50 text-slate-600",
  },
];

export const CLIENTE_STATUS_LABELS: Record<ClienteStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  prospecto: "Prospecto",
};

export const LANCAMENTO_CATEGORIA_LABELS: Record<LancamentoCategoria, string> =
  {
    pacote_vendido: "Pacote vendido",
    comissao: "Comissão",
    hospedagem: "Hospedagem",
    passagem: "Passagem",
    milhas: "Milhas",
    marketing: "Marketing",
    operacional: "Operacional",
    reembolso: "Reembolso",
    outros: "Outros",
  };

export const LANCAMENTO_STATUS_LABELS: Record<LancamentoStatus, string> = {
  previsto: "Previsto",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
};

export const COTACAO_STATUS_LABELS: Record<CotacaoStatus, string> = {
  aguardando: "Aguardando",
  em_cotacao: "Em cotação",
  aguardando_cliente: "Aguardando cliente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  expirada: "Expirada",
  cancelada: "Cancelada",
};

export const TRIP_STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Futura",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "layout" as const },
  { href: "/clientes", label: "Clientes", icon: "users" as const },
  { href: "/cotacoes", label: "Cotações", icon: "document" as const },
  { href: "/financeiro", label: "Financeiro", icon: "wallet" as const },
];

/** Prefixo para integrações futuras (WhatsApp, relatórios, etc.) */
export const INTEGRATION_HOOKS = {
  whatsapp: "integrations/whatsapp",
  reports: "integrations/reports",
} as const;
