/** Contrato JSON do módulo F03 (`/savings`, `/trips/{id}/savings`, `/savings/shared-reports`). Produto: Viagens. */

export type SourceType = "AIRLINE_SITE" | "ONLINE_TRAVEL_AGENCY" | "METASEARCH" | "SUPPLIER_QUOTE" | "OTHER";
export type CostKind = "AGENCY_PAYMENT" | "DIRECT_SUPPLIER_PAYMENT" | "TAXES" | "SERVICE_FEE" | "MILES_ACQUISITION" | "OTHER";
export type AdjustmentKind = "REFUND" | "OTHER_CREDIT" | "CANCELLATION_FEE" | "CHANGE_FEE" | "OTHER_CHARGE";
export type MilesUsage = "NOT_USED" | "KNOWN" | "UNKNOWN";

export type Comparison = {
  price: number | null;
  sourceType: SourceType | null;
  sourceDescription: string | null;
  sourceUrl: string | null;
  researchedOn: string | null;
  route: string | null;
  outboundDate: string | null;
  returnDate: string | null;
  passengers: number | null;
  fareConditions: string | null;
  baggage: string | null;
  sameRoute: boolean | null;
  sameDates: boolean | null;
  samePassengers: boolean | null;
  equivalentConditions: boolean | null;
  differences: string | null;
};

export type CostLine = { kind: CostKind; amount: number; description: string; origin: string | null; miles: number | null };
export type Adjustment = { kind: AdjustmentKind; amount: number; date: string; description: string };

export type SavingsData = {
  comparison: Comparison | null;
  costs: CostLine[];
  milesUsage: MilesUsage | null;
  adjustments: Adjustment[];
  methodology: string | null;
  notes: string | null;
};

export type Reason = { code: string; label: string };

export type SavingsResult = {
  available: boolean;
  reasons: Reason[];
  comparablePrice: number | null;
  baseCost: number | null;
  adjustments: number | null;
  effectiveCost: number | null;
  savings: number | null;
  savingsPercent: number | null;
};

export type TripRef = {
  tripId: string;
  customerId: string;
  customerName: string;
  serviceType: string;
  bookingLocator: string | null;
  airline: string | null;
  status: string;
  travelStartDate: string | null;
  travelEndDate: string | null;
};

export type SavingsRow = { trip: TripRef; savingsId: string | null; version: number; data: SavingsData | null; result: SavingsResult; updatedAt: string | null };

export type AuditEntry = { id: string; action: string; detail: Record<string, unknown> | null; author: string; createdAt: string };
export type VersionMeta = { version: number; author: string; createdAt: string };
export type VersionView = { version: number; data: SavingsData; result: SavingsResult; author: string; createdAt: string };
export type EvidenceMeta = { id: string; description: string | null; filename: string; contentType: string; byteSize: number; author: string; createdAt: string };

export type SavingsView = {
  trip: TripRef;
  savingsId: string | null;
  version: number;
  data: SavingsData | null;
  result: SavingsResult;
  versions: VersionMeta[];
  evidence: EvidenceMeta[];
  history: AuditEntry[];
};

export type Totals = {
  trips: number;
  available: number;
  unavailable: number;
  cancelled: number;
  comparablePrice: number | null;
  effectiveCost: number | null;
  savings: number | null;
  savingsPercent: number | null;
};

export type Report = { customerId: string | null; from: string | null; to: string | null; rows: SavingsRow[]; totals: Totals };

export type ReportOptions = { hideCustomerName: boolean; hideLocators: boolean; hideSources: boolean; hideNotes: boolean; title: string; message: string };
export type ReportInput = { customerId: string; from: string | null; to: string | null; options: ReportOptions; expectedPreviewHash?: string };

export type ReportLine = {
  sourceType: SourceType | null;
  researchedOn: string | null;
  passengers: number | null;
  fareConditions: string | null;
  baggage: string | null;
  differences: string | null;
  milesUsage: MilesUsage | null;
  costs: Omit<CostLine, "miles">[];
  adjustments: Adjustment[];
  comparisonOutboundDate: string | null;
  comparisonReturnDate: string | null;
  service: string;
  airline: string | null;
  locator: string | null;
  status: string;
  travelStartDate: string | null;
  travelEndDate: string | null;
  available: boolean;
  unavailableReasons: string[];
  comparablePrice: number | null;
  source: string | null;
  route: string | null;
  effectiveCost: number | null;
  savings: number | null;
  savingsPercent: number | null;
  methodology: string | null;
  notes: string | null;
};

export type ReportContent = {
  previewHash: string;
  title: string;
  customerLabel: string;
  from: string | null;
  to: string | null;
  message: string | null;
  lines: ReportLine[];
  totals: Totals;
  generatedOn: string;
};

export type SharedReport = { id: string; customerId: string; from: string | null; to: string | null; options: ReportOptions; content: ReportContent; author: string; createdAt: string };
export type SharedReportSummary = { id: string; customerId: string; title: string; from: string | null; to: string | null; trips: number; savings: number | null; author: string; createdAt: string };
