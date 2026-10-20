import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import type { Itinerary, LibraryResource, StageDetail, StageInput, StageStatus, TripAttachment } from "./types";

/** Erro da API com status, para a interface manter o formulário e explicar o motivo. */
export class StagesApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "StagesApiError";
  }
}

const FALLBACK: Record<number, string> = {
  403: "Seu perfil não tem acesso às etapas da viagem.",
  404: "Registro não encontrado. Ele pode ter sido excluído.",
  409: "A etapa foi alterada por outra pessoa. Recarregue antes de continuar.",
};

type Token = string | null | undefined;

async function call(token: Token, path: string, init: RequestInit = {}): Promise<Response> {
  const base = getAgenciaHubApiBaseUrl();
  if (!base || !token) throw new StagesApiError("Conecte-se ao sistema para acessar as etapas.", 0);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...init, headers });
  } catch {
    throw new StagesApiError("Sem conexão com o serviço. Nada foi salvo; tente novamente.", 0);
  }
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth:unauthorized", { detail: token }));
    const data = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
    throw new StagesApiError(data?.message || FALLBACK[response.status] || "Não foi possível concluir a ação. Tente novamente.", response.status, data?.code);
  }
  return response;
}

const json = async <T,>(token: Token, path: string, init?: RequestInit) => (await call(token, path, init)).json() as Promise<T>;

export const stagesApi = {
  itinerary: (token: Token, tripId: string) => json<Itinerary>(token, `/trips/${tripId}/stages`),
  /** A chave de idempotência evita etapas duplicadas quando o envio é repetido. */
  create: (token: Token, tripId: string, requestKey: string, input: StageInput) =>
    json<StageDetail>(token, `/trips/${tripId}/stages`, { method: "POST", body: JSON.stringify(input), headers: { "Idempotency-Key": requestKey } }),
  update: (token: Token, tripId: string, id: string, input: StageInput) =>
    json<StageDetail>(token, `/trips/${tripId}/stages/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: async (token: Token, tripId: string, id: string, expectedVersion: number) => {
    await call(token, `/trips/${tripId}/stages/${id}?expectedVersion=${expectedVersion}`, { method: "DELETE" });
  },
  status: (token: Token, tripId: string, id: string, status: StageStatus, reason: string, expectedVersion: number) =>
    json<StageDetail>(token, `/trips/${tripId}/stages/${id}/status`, { method: "POST", body: JSON.stringify({ status, reason: reason.trim() || null, expectedVersion }) }),
  link: (token: Token, tripId: string, id: string, type: "attachments" | "library", targetId: string) =>
    json<StageDetail>(token, `/trips/${tripId}/stages/${id}/${type}/${targetId}`, { method: "PUT" }),
  unlink: (token: Token, tripId: string, id: string, type: "attachments" | "library", targetId: string) =>
    json<StageDetail>(token, `/trips/${tripId}/stages/${id}/${type}/${targetId}`, { method: "DELETE" }),
  attachments: (token: Token, tripId: string) => json<TripAttachment[]>(token, `/attachments/trips/${tripId}`),
  /** Envia pelo endpoint existente de anexos da viagem; o vínculo com a etapa é feito em seguida. */
  upload: (token: Token, tripId: string, file: File, description: string) => {
    const data = new FormData();
    data.append("file", file);
    data.append("description", description);
    return json<TripAttachment>(token, `/attachments/trips/${tripId}`, { method: "POST", body: data });
  },
  download: async (token: Token, attachmentId: string) => (await call(token, `/attachments/${attachmentId}/download`)).blob(),
  library: (token: Token) => json<LibraryResource[]>(token, "/library"),
};
