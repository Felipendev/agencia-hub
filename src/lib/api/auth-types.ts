export type AccountKind = "AGENCY_OWNER" | "SALES_AGENT";

export type ApiLoginRequest = {
  email: string;
  password: string;
};

export type ApiLoginResponse = {
  token: string;
  userId: string;
  name: string;
  email: string;
  accountKind: AccountKind;
  agencyId?: string;
  agencyName?: string;
  agencyStatus?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string | null;
  requiresTermsAcceptance?: boolean;
  mustChangePassword?: boolean;
  /** Presente após login na API; usado em links públicos do agente. */
  publicLinkCode?: string;
};

export type ApiUserResponse = {
  id: string;
  name: string;
  email: string;
  accountKind: AccountKind;
  active: boolean;
  commissionPct: number | null;
  commissionFixed: number | null;
  createdAt: string;
  termsAccepted?: boolean;
};

export type ApiCreateUserRequest = {
  name: string;
  email: string;
  password: string;
  accountKind: AccountKind;
  commissionPct?: number;
  commissionFixed?: number;
};

export type ApiUpdateUserRequest = {
  name?: string;
  password?: string;
  active?: boolean;
  commissionPct?: number | null;
  commissionFixed?: number | null;
};

export type ApiSalesAgentDashboardResponse = {
  salesAgent: ApiUserResponse;
  totalQuotations: number;
  openQuotations: number;
  approvedQuotations: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  recentQuotations: import("./quotation-types").ApiQuotationResponse[];
};
