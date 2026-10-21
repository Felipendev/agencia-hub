import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import type { Detail, Filters, Member, Product, Referral, ReferralInput, Status, Summary } from "./types";

/** Erro da API com status, para a interface manter o formulário e explicar o motivo. */
export class ReferralsApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "ReferralsApiError";
  }
}

const FALLBACK: Record<number, string> = {
  403: "Seu perfil não tem acesso às indicações.",
  404: "Registro não encontrado. Ele pode ter sido excluído.",
  409: "A indicação foi alterada por outra pessoa. Recarregue antes de continuar.",
};

type Token = string | null | undefined;

async function call(token: Token, path: string, init: RequestInit = {}): Promise<Response> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base || !token) throw new ReferralsApiError("Conecte-se ao sistema para acessar as indicações.", 0);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...init, headers });
  } catch {
    throw new ReferralsApiError("Não foi possível confirmar a operação. Confira a indicação antes de tentar novamente.", 0);
  }
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth:unauthorized", { detail: token }));
    const data = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
    throw new ReferralsApiError(data?.message || FALLBACK[response.status] || "Não foi possível concluir a ação. Tente novamente.", response.status, data?.code);
  }
  return response;
}

const json = async <T,>(token: Token, path: string, init?: RequestInit) => (await call(token, path, init)).json() as Promise<T>;

const query = (filters: Record<string, string | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
  const text = params.toString();
  return text ? `?${text}` : "";
};

export type StatusChange = { status: Status; reason?: string; convertedOn?: string; saleId?: string };

export const referralsApi = {
  list: (token: Token, filters: Filters = {}) => json<Referral[]>(token, `/referrals${query(filters)}`),
  summary: (token: Token, filters: { product?: Product; from?: string; to?: string } = {}) => json<Summary>(token, `/referrals/summary${query(filters)}`),
  members: (token: Token) => json<Member[]>(token, "/referrals/members"),
  get: (token: Token, id: string) => json<Detail>(token, `/referrals/${id}`),
  /** A chave de idempotência evita indicações duplicadas quando o envio é repetido. */
  create: (token: Token, requestKey: string, input: ReferralInput) =>
    json<Detail>(token, "/referrals", { method: "POST", body: JSON.stringify(input), headers: { "Idempotency-Key": requestKey } }),
  update: (token: Token, id: string, input: ReferralInput) => json<Detail>(token, `/referrals/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: async (token: Token, id: string, expectedVersion: number) => {
    await call(token, `/referrals/${id}?expectedVersion=${expectedVersion}`, { method: "DELETE" });
  },
  status: (token: Token, id: string, change: StatusChange, expectedVersion: number) =>
    json<Detail>(token, `/referrals/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status: change.status, reason: change.reason?.trim() || null, convertedOn: change.convertedOn || null, saleId: change.saleId || null, expectedVersion }),
    }),
  linkReferred: (token: Token, id: string, customerId: string, expectedVersion: number) =>
    json<Detail>(token, `/referrals/${id}/referred-customer/${customerId}`, { method: "PUT", body: JSON.stringify({ expectedVersion }) }),
  /** Cadastro de pessoa pelo endpoint existente do CRM, como prospecto; o vínculo é uma operação separada. */
  createPerson: (token: Token, person: { name: string; phone: string | null; email: string | null }) =>
    json<{ id: string; name: string }>(token, "/customers", { method: "POST", body: JSON.stringify({ ...person, status: "PROSPECT", notes: "" }) }),
  salesOf: (token: Token, customerId: string) => json<{ id: string; saleDate: string | null; totalAmount: number | null; status: string }[]>(token, `/sales?customerId=${customerId}`),
};
