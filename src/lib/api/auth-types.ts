export type UserRole = "OWNER" | "SELLER";

export type ApiLoginRequest = {
  email: string;
  password: string;
};

export type ApiLoginResponse = {
  token: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  agencyId?: string;
  agencyName?: string;
  agencyStatus?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string | null;
  requiresTermsAcceptance?: boolean;
  mustChangePassword?: boolean;
};

export type ApiUserResponse = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  commissionPct: number | null;
  commissionFixed: number | null;
  createdAt: string;
};

export type ApiCreateUserRequest = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
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

export type ApiSellerDashboardResponse = {
  seller: ApiUserResponse;
  totalQuotations: number;
  openQuotations: number;
  approvedQuotations: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  recentQuotations: import("./quotation-types").ApiQuotationResponse[];
};
