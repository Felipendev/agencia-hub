/** Contrato JSON do backend (inglês) — espelha `OpportunityResponse` / `CreateOpportunityRequest` Java. */

export type ApiOpportunityStatus =
  | "NEW_LEAD"
  | "IN_PROGRESS"
  | "PROPOSAL_SENT"
  | "CLOSED"
  | "CANCELLED";

export type ApiCreateOpportunityRequest = {
  customerId: string;
  title: string;
  destination: string;
  estimatedAmount: number;
  status: ApiOpportunityStatus;
  expectedTravelDate: string; // YYYY-MM-DD
  notes?: string;
};

export type ApiUpdateOpportunityRequest = {
  title?: string;
  destination?: string;
  estimatedAmount?: number;
  status?: ApiOpportunityStatus;
  expectedTravelDate?: string;
  notes?: string;
};

export type ApiOpportunityResponse = {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  destination: string;
  estimatedAmount: number;
  status: ApiOpportunityStatus;
  expectedTravelDate: string;
  notes: string;
};
