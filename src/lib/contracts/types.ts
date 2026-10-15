/** Contrato JSON do módulo F02 (`/contracts`, `/contract-templates`). */

/** Viagens e Milhas são produtos distintos; o produto é escolhido explicitamente. */
export type Product = "TRAVEL" | "MILES";
export type ContractStatus = "DRAFT" | "SENT" | "SIGNED" | "CANCELLED";
export type PaymentMode = "CASH" | "INSTALLMENTS";
export type AttachmentKind = "SIGNED_EVIDENCE" | "SUPPORTING";
export type FieldSource = "CUSTOMER" | "AGENCY" | "CONTRACT";

export type ContractFieldView = { key: string; label: string; source: FieldSource };

export type AuditEntry = { id: string; action: string; detail: Record<string, unknown> | null; author: string; createdAt: string };

export type TemplateSummary = {
  id: string;
  product: Product;
  name: string;
  description: string | null;
  currentVersion: number;
  archived: boolean;
  rowVersion: number;
  contractCount: number;
  updatedAt: string;
};

export type TemplateVersion = { version: number; body: string; usedFields: string[]; author: string; createdAt: string };

export type TemplateDetail = {
  template: TemplateSummary;
  body: string;
  usedFields: string[];
  versions: TemplateVersion[];
  history: AuditEntry[];
};

export type TemplateInput = { product?: Product; name: string; description: string; body: string; expectedVersion?: number };

export type DeleteOutcome = { outcome: "DELETED" | "ARCHIVED"; message: string };

export type ContractSummary = {
  id: string;
  product: Product;
  customerId: string;
  customerName: string;
  templateId: string;
  templateName: string;
  templateVersion: number;
  title: string;
  status: ContractStatus;
  planName: string | null;
  price: number | null;
  startDate: string | null;
  endDate: string | null;
  latestDocumentVersion: number | null;
  documentCurrent: boolean;
  rowVersion: number;
  updatedAt: string;
};

export type DocumentMeta = {
  version: number;
  product: Product;
  dataRevision: number;
  templateId: string;
  templateVersion: number;
  contentSha256: string;
  author: string;
  createdAt: string;
};

export type DocumentView = { document: DocumentMeta; renderedContent: string; dataSnapshot: Record<string, unknown> };

export type AttachmentMeta = {
  id: string;
  kind: AttachmentKind;
  documentVersion: number | null;
  description: string | null;
  filename: string;
  contentType: string;
  byteSize: number;
  author: string;
  createdAt: string;
};

export type ReceivableLink = {
  receivableId: string;
  saleId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: string;
  author: string;
  linkedAt: string;
};

export type ContractDetail = {
  contract: ContractSummary;
  paymentMode: PaymentMode | null;
  installments: number | null;
  paymentTerms: string | null;
  notes: string | null;
  dataRevision: number;
  latestTemplateVersion: number;
  sentOn: string | null;
  signedOn: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  missingFields: ContractFieldView[];
  documents: DocumentMeta[];
  attachments: AttachmentMeta[];
  /** `null` quando o perfil não acessa o financeiro. */
  receivables: ReceivableLink[] | null;
  history: AuditEntry[];
};

export type DraftInput = {
  customerId: string;
  product: Product;
  templateId: string;
  templateVersion?: number | null;
  title: string;
  planName: string | null;
  price: number | null;
  startDate: string | null;
  endDate: string | null;
  paymentMode: PaymentMode | null;
  installments: number | null;
  paymentTerms: string | null;
  notes: string | null;
  expectedVersion?: number;
};

export type Preview = { content: string; missingFields: ContractFieldView[]; templateVersion: number; dataRevision: number };

/** Linha de `GET /sales/receivables` (API financeira existente, somente dono). */
export type ExistingReceivable = {
  id: string;
  saleId: string;
  customerId: string;
  dueDate: string;
  amount: number;
  status: string;
  installmentNumber: number;
  installmentsTotal: number;
  itemTag: string | null;
};
