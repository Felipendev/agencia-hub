/** Contrato JSON do backend (inglês) — espelha `FinancialEntryResponse` / `CreateFinancialEntryRequest` Java. */

export type ApiFinancialEntryType = "INCOME" | "EXPENSE";

export type ApiFinancialEntryCategory =
  | "PACKAGE_SOLD"
  | "COMMISSION"
  | "ACCOMMODATION"
  | "FLIGHT"
  | "MILES"
  | "MARKETING"
  | "OPERATIONAL"
  | "REFUND"
  | "OTHER";

export type ApiFinancialEntryStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type ApiCreateFinancialEntryRequest = {
  description: string;
  type: ApiFinancialEntryType;
  category: ApiFinancialEntryCategory;
  amount: number;
  entryDate: string; // YYYY-MM-DD
  status: ApiFinancialEntryStatus;
  customerId?: string;
  supplierId?: string;
  bankAccount?: string;
  recurrenceFrequency?: "MONTHLY" | "WEEKLY" | "YEARLY";
  notes?: string;
  saleAmount?: number;
  supplierCost?: number;
  commissionAmount?: number;
};

export type ApiUpdateFinancialEntryRequest = {
  description?: string;
  type?: ApiFinancialEntryType;
  category?: ApiFinancialEntryCategory;
  amount?: number;
  entryDate?: string;
  status?: ApiFinancialEntryStatus;
  customerId?: string;
  supplierId?: string;
  bankAccount?: string;
  recurrenceFrequency?: "MONTHLY" | "WEEKLY" | "YEARLY";
  notes?: string;
  saleAmount?: number;
  supplierCost?: number;
  commissionAmount?: number;
};

export type ApiFinancialEntryResponse = {
  id: string;
  description: string;
  type: ApiFinancialEntryType;
  category: ApiFinancialEntryCategory;
  amount: number;
  entryDate: string;
  status: ApiFinancialEntryStatus;
  customerId: string | null;
  customerName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  bankAccount: string | null;
  recurrenceFrequency: "MONTHLY" | "WEEKLY" | "YEARLY" | null;
  notes: string | null;
  saleAmount: number | null;
  supplierCost: number | null;
  commissionAmount: number | null;
  profitAmount: number | null;
};
