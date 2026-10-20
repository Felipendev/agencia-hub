import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import type { AppointmentInput, Detail, Filters, Member, Minutes, Status, Appointment } from "./types";

/** Erro da API com status, para a interface manter o formulário e explicar o motivo. */
export class AgendaApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "AgendaApiError";
  }
}

const FALLBACK: Record<number, string> = {
  403: "Seu perfil não tem acesso à agenda.",
  404: "Registro não encontrado. Ele pode ter sido excluído.",
  409: "O compromisso foi alterado por outra pessoa. Recarregue antes de continuar.",
};

async function call(token: string | null | undefined, path: string, init: RequestInit = {}): Promise<Response> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base || !token) throw new AgendaApiError("Conecte-se ao sistema para acessar a agenda.", 0);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...init, headers });
  } catch {
    throw new AgendaApiError("Sem conexão com o serviço. Nada foi salvo; tente novamente.", 0);
  }
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth:unauthorized", { detail: token }));
    const data = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
    throw new AgendaApiError(data?.message || FALLBACK[response.status] || "Não foi possível concluir a ação. Tente novamente.", response.status, data?.code);
  }
  return response;
}

const json = async <T,>(token: string | null | undefined, path: string, init?: RequestInit) => (await call(token, path, init)).json() as Promise<T>;

export const agendaApi = {
  list: (token: string | null | undefined, filters: Filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, String(value)); });
    const text = params.toString();
    return json<Appointment[]>(token, `/appointments${text ? `?${text}` : ""}`);
  },
  members: (token: string | null | undefined) => json<Member[]>(token, "/appointments/members"),
  get: (token: string | null | undefined, id: string) => json<Detail>(token, `/appointments/${id}`),
  /** A chave de idempotência evita compromissos duplicados quando o envio é repetido. */
  create: (token: string | null | undefined, requestKey: string, input: AppointmentInput) =>
    json<Detail>(token, "/appointments", { method: "POST", body: JSON.stringify(input), headers: { "Idempotency-Key": requestKey } }),
  update: (token: string | null | undefined, id: string, input: AppointmentInput) =>
    json<Detail>(token, `/appointments/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: async (token: string | null | undefined, id: string, expectedVersion: number) => {
    await call(token, `/appointments/${id}?expectedVersion=${expectedVersion}`, { method: "DELETE" });
  },
  status: (token: string | null | undefined, id: string, status: Status, reason: string, expectedVersion: number) =>
    json<Detail>(token, `/appointments/${id}/status`, { method: "POST", body: JSON.stringify({ status, reason: reason.trim() || null, expectedVersion }) }),
  saveMinutes: (token: string | null | undefined, id: string, data: Minutes, expectedVersion: number) =>
    json<Detail>(token, `/appointments/${id}/minutes`, { method: "PUT", body: JSON.stringify({ data, expectedVersion }) }),
  minutesVersion: (token: string | null | undefined, id: string, version: number) =>
    json<{ version: number; data: Minutes; author: string; createdAt: string }>(token, `/appointments/${id}/minutes/versions/${version}`),
  ics: async (token: string | null | undefined, id: string) => (await call(token, `/appointments/${id}/ics`)).blob(),
  /** Consulta somente leitura das viagens existentes da pessoa (API de viagens). */
  tripsOf: (token: string | null | undefined, customerId: string) =>
    json<{ id: string; serviceType: string; bookingLocator: string | null; travelStartDate: string | null }[]>(token, `/trips?customerId=${encodeURIComponent(customerId)}`),
};

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
