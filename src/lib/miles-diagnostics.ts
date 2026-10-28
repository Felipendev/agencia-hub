import { apiFetch } from "@/lib/api/authenticated-fetch";
import type {
  WalletData,
  WalletKind,
  WalletProfile,
  WalletView,
} from "./miles-wallet";
export type DiagnosticData = {
  name: string;
  email: string;
  phone: string;
  profile: WalletProfile;
  items: { kind: Exclude<WalletKind, "EXPIRY">; data: WalletData }[];
};
export type DiagnosticConfig = {
  token: string;
  title: string;
  introduction: string;
  enabled: boolean;
  version: number;
};
export type DiagnosticReceipt = {
  customerId: string;
  authorId: string;
  at: string;
  importedProfile: boolean;
  itemIds: string[];
  itemIndexes: number[];
};
export type DiagnosticEntry = {
  id: string;
  original: DiagnosticData;
  data: DiagnosticData;
  source: "PUBLIC" | "STAFF";
  consentVersion: string | null;
  version: number;
  archived: boolean;
  customerId: string | null;
  receipt: DiagnosticReceipt | null;
  createdAt: string;
};
export type DiagnosticSummary = {
  id: string;
  name: string;
  email: string;
  version: number;
  archived: boolean;
  incorporated: boolean;
  createdAt: string;
};
export type DiagnosticEvent = {
  action: string;
  authorId: string | null;
  reason: string;
  snapshot: DiagnosticEntry;
  createdAt: string;
};
export type PublicDiagnosticConfig = {
  agencyName: string;
  title: string;
  introduction: string;
  consentVersion: string;
};
const root = "/miles-diagnostics";
const send = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
export const diagnosticsApi = {
  config: (token: string) =>
    apiFetch<DiagnosticConfig | null>(`${root}/config`, {}, token),
  configure: (
    token: string,
    body: Omit<DiagnosticConfig, "token" | "version"> & {
      expectedVersion: number;
    },
  ) => apiFetch<DiagnosticConfig>(`${root}/config`, send("PUT", body), token),
  revoke: (token: string, version: number) =>
    apiFetch<DiagnosticConfig>(
      `${root}/config?expectedVersion=${version}`,
      { method: "DELETE" },
      token,
    ),
  list: (token: string) => apiFetch<DiagnosticSummary[]>(root, {}, token),
  get: (token: string, id: string) =>
    apiFetch<DiagnosticEntry>(`${root}/${id}`, {}, token),
  events: (token: string, id: string) =>
    apiFetch<DiagnosticEvent[]>(`${root}/${id}/events`, {}, token),
  create: (token: string, key: string, data: DiagnosticData) =>
    apiFetch<DiagnosticEntry>(
      root,
      { ...send("POST", data), headers: { "Idempotency-Key": key } },
      token,
    ),
  edit: (
    token: string,
    id: string,
    data: DiagnosticData,
    expectedVersion: number,
  ) =>
    apiFetch<DiagnosticEntry>(
      `${root}/${id}`,
      send("PATCH", { data, expectedVersion }),
      token,
    ),
  state: (token: string, entry: DiagnosticEntry, reason: string) =>
    apiFetch<DiagnosticEntry>(
      `${root}/${entry.id}${entry.archived ? "/restore" : ""}`,
      send(entry.archived ? "POST" : "DELETE", {
        expectedVersion: entry.version,
        reason,
      }),
      token,
    ),
  incorporate: (
    token: string,
    id: string,
    input: {
      customerId: string;
      expectedVersion: number;
      profileVersion: number;
      importProfile: boolean;
      items: number[];
    },
  ) =>
    apiFetch<DiagnosticReceipt>(
      `${root}/${id}/incorporate`,
      send("POST", input),
      token,
    ),
  wallet: (token: string, id: string, signal?: AbortSignal) =>
    apiFetch<WalletView>(`/customers/${id}/miles-wallet`, { signal }, token),
  publicConfig: (id: string) =>
    apiFetch<PublicDiagnosticConfig>(`/public/miles-diagnostics/${id}`),
  submit: (
    id: string,
    key: string,
    data: DiagnosticData,
    consent: boolean,
    consentVersion: string,
  ) =>
    apiFetch<void>(`/public/miles-diagnostics/${id}`, {
      ...send("POST", { data, consent, consentVersion }),
      headers: { "Idempotency-Key": key },
    }),
};
export const emptyDiagnostic = (): DiagnosticData => ({
  name: "",
  email: "",
  phone: "",
  profile: { goals: "", travelFrequency: "", destinations: "", actionPlan: "" },
  items: [],
});
