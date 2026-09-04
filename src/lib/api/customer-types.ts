/** Contrato JSON do backend (inglês) — `CreateCustomerRequest` / `CustomerResponse` Java. */

export type ApiCustomerStatus = "ACTIVE" | "INACTIVE" | "PROSPECT";

export type ApiCreateCustomerRequest = {
  name: string;
  email: string | null;
  phone: string | null;
  interestDestination: string | null;
  status: ApiCustomerStatus;
  notes?: string;
};

export type ApiCustomerResponse = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  interestDestination: string | null;
  status: ApiCustomerStatus;
  notes: string;
  createdAt: string;
  deletedAt: string | null;
};
