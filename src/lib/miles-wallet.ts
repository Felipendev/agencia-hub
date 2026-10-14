export type WalletKind = "ACCOUNT" | "CARD" | "CLUB" | "EXPIRY";
export type WalletData = {
  program?: string | null;
  holder?: string | null;
  source?: string | null;
  declaredOn?: string | null;
  openingBalance?: number | null;
  issuer?: string | null;
  category?: string | null;
  pointsPerDollar?: number | null;
  monthlySpend?: number | null;
  creditDay?: number | null;
  monthlyCost?: number | null;
  monthlyPoints?: number | null;
  accountId?: string | null;
  quantity?: number | null;
  expiresOn?: string | null;
};
export type WalletProfile = {
  goals: string;
  travelFrequency: string;
  destinations: string;
  actionPlan: string;
};
export type WalletItem = {
  id: string;
  kind: WalletKind;
  data: WalletData;
  version: number;
  archived: boolean;
  balance: number;
};
export type WalletMovement = {
  id: string;
  accountId: string;
  quantity: number;
  reason: string;
  occurredOn: string;
  reversesId: string | null;
  reversed: boolean;
  author: string;
  createdAt: string;
};
export type WalletAudit = {
  id: string;
  resourceId: string;
  action: string;
  snapshot: {
    data?: WalletData | WalletProfile;
    kind?: WalletKind;
    version?: number;
    quantity?: number;
    reason?: string;
  };
  author: string;
  createdAt: string;
};
export type WalletView = {
  profile: { data: WalletProfile; version: number; archived: boolean } | null;
  items: WalletItem[];
  movements: WalletMovement[];
  history: WalletAudit[];
};
export const walletLabels: Record<WalletKind, string> = {
  ACCOUNT: "Contas de programas",
  CARD: "Cartões",
  CLUB: "Clubes",
  EXPIRY: "Pontos a vencer",
};
export const walletFields: Record<
  WalletKind,
  Array<{
    key: keyof WalletData;
    label: string;
    type?: string;
    required?: boolean;
    min?: number;
    max?: number;
    step?: string;
    maxLength?: number;
  }>
> = {
  ACCOUNT: [
    { key: "program", label: "Programa", required: true, maxLength: 120 },
    {
      key: "holder",
      label: "Titular da conta",
      required: true,
      maxLength: 200,
    },
    {
      key: "openingBalance",
      label: "Saldo inicial declarado",
      type: "number",
      required: true,
      min: 0,
      max: 1000000000,
    },
    {
      key: "source",
      label: "Fonte do saldo declarado",
      required: true,
      maxLength: 500,
    },
    {
      key: "declaredOn",
      label: "Data do saldo declarado",
      type: "date",
      required: true,
    },
  ],
  CARD: [
    { key: "issuer", label: "Emissor", required: true, maxLength: 120 },
    {
      key: "category",
      label: "Nome ou categoria do cartão",
      required: true,
      maxLength: 120,
    },
    {
      key: "pointsPerDollar",
      label: "Pontos por dólar",
      type: "number",
      min: 0,
      max: 100,
      step: "0.0001",
    },
    {
      key: "monthlySpend",
      label: "Gasto mensal previsto (R$)",
      type: "number",
      min: 0,
      max: 10000000,
      step: "0.01",
    },
    {
      key: "creditDay",
      label: "Dia previsto de crédito dos pontos",
      type: "number",
      min: 1,
      max: 31,
    },
  ],
  CLUB: [
    {
      key: "program",
      label: "Programa do clube",
      required: true,
      maxLength: 120,
    },
    {
      key: "monthlyCost",
      label: "Custo mensal (R$)",
      type: "number",
      required: true,
      min: 0,
      max: 10000000,
      step: "0.01",
    },
    {
      key: "monthlyPoints",
      label: "Pontos mensais previstos",
      type: "number",
      required: true,
      min: 0,
      max: 1000000000,
    },
    {
      key: "creditDay",
      label: "Dia previsto de crédito dos pontos",
      type: "number",
      min: 1,
      max: 31,
    },
  ],
  EXPIRY: [
    {
      key: "quantity",
      label: "Quantidade a vencer",
      type: "number",
      required: true,
      min: 1,
      max: 1000000000,
    },
    {
      key: "expiresOn",
      label: "Data de vencimento",
      type: "date",
      required: true,
    },
    { key: "source", label: "Fonte da informação", maxLength: 500 },
  ],
};
export function walletPayload(
  kind: WalletKind,
  values: Record<string, string>,
  previous?: WalletData,
): WalletData {
  const result: WalletData = previous ? { ...previous } : {};
  for (const field of walletFields[kind]) {
    const value = values[field.key] ?? "";
    Object.assign(result, {
      [field.key]:
        value === "" ? null : field.type === "number" ? Number(value) : value,
    });
  }
  if (kind === "EXPIRY") result.accountId = values.accountId || null;
  return result;
}
export function expiryState(
  date: string,
  today: string,
): "expired" | "upcoming" | "later" {
  if (date < today) return "expired";
  const end = new Date(`${today}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 90);
  return date <= end.toISOString().slice(0, 10) ? "upcoming" : "later";
}
