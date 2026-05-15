export type TimelineEventType =
  | "cliente_criado"
  | "cliente_atualizado"
  | "cotacao_criada"
  | "cotacao_status_mudou"
  | "cotacao_atualizada"
  | "lancamento_criado"
  | "nota_adicionada";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  entityType: "cliente" | "cotacao" | "lancamento";
  entityId: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
};
