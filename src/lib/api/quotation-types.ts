/** Contrato JSON do backend (inglês) — espelha `QuotationResponse` / `CreateQuotationRequest` Java. */

export type ApiQuotationStatus =
  | "DRAFT"
  | "SENT"
  | "AWAITING_CLIENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type ApiCreateQuotationRequest = {
  customerId: string;
  opportunityId?: string;
  sellerId?: string;
  title: string;
  destination: string;
  description?: string;
  totalAmount: number;
  currency?: string;
  status?: ApiQuotationStatus;
  validUntil: string;
  travelStartDate?: string;
  travelEndDate?: string;
  details?: Record<string, unknown>;
  tags?: string[];
  priority?: boolean;
  assignee?: string;
  internalNotes?: string;
};

export type ApiQuotationResponse = {
  id: string;
  customerId: string;
  customerName: string;
  opportunityId: string | null;
  opportunityTitle: string | null;
  sellerId: string | null;
  sellerName: string | null;
  title: string;
  destination: string;
  description: string;
  totalAmount: number;
  currency: string;
  status: ApiQuotationStatus;
  validUntil: string;
  travelStartDate: string | null;
  travelEndDate: string | null;
  details: Record<string, unknown> | null;
  tags: string[];
  priority: boolean;
  assignee: string | null;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
