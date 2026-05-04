/**
 * Contratos e namespaces reservados para integrações futuras (sem implementação no MVP).
 * Ex.: WhatsApp Business API, webhooks, relatórios exportados.
 */

export type IntegrationId = "whatsapp" | "reports" | "email";

export interface WhatsAppIntegrationPlaceholder {
  readonly provider: "whatsapp-business-api";
  /** Número ou WABA ID — preencher quando houver backend */
  readonly businessAccountId?: string;
}

export interface ReportsIntegrationPlaceholder {
  readonly exportFormats: readonly ("pdf" | "csv" | "xlsx")[];
}
