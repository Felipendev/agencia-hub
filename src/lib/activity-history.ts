import { apiFetch } from "@/lib/api/authenticated-fetch";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
export type HistoryProduct = "TRAVEL" | "MILES";
export const historyModules = {
  WALLET: "Carteira de milhas",
  CONTRACTS: "Contratos",
  AGENDA: "Agenda e atas",
  TASKS: "Tarefas e checklists",
  SIMULATIONS: "Simulações",
  PLAN_TASKS: "Planos → tarefas",
  DIAGNOSTICS: "Diagnósticos",
  TRIP_STAGES: "Etapas de viagem",
  SAVINGS: "Economia do cliente",
  REFERRALS: "Indicações",
  FOLLOWUPS: "Acompanhamento comercial",
} as const;
export type HistoryModule = keyof typeof historyModules;
export type HistoryFilters = {
  product: HistoryProduct;
  customerId: string;
  from: string;
  to: string;
  modules: HistoryModule[];
};
export type HistoryEvent = {
  id: string;
  module: HistoryModule;
  resourceId: string;
  customerId: string | null;
  action: string;
  authorId: string | null;
  authorName: string;
  at: string;
};
export type HistoryResult = {
  events: HistoryEvent[];
  hasMore: boolean;
  page: number;
  timeZone: string;
};
export function modulesFor(product: HistoryProduct): HistoryModule[] {
  return (Object.keys(historyModules) as HistoryModule[]).filter((m) =>
    product === "MILES"
      ? !["TRIP_STAGES", "SAVINGS"].includes(m)
      : !["WALLET", "SIMULATIONS", "PLAN_TASKS", "DIAGNOSTICS"].includes(m),
  );
}
export function historyQuery(f: HistoryFilters, page = 0) {
  const q = new URLSearchParams({
    product: f.product,
    from: f.from,
    to: f.to,
    page: String(page),
  });
  if (f.customerId) q.set("customerId", f.customerId);
  f.modules.forEach((m) => q.append("modules", m));
  return q.toString();
}
export const historyApi = {
  list: (token: string, f: HistoryFilters, page = 0) =>
    apiFetch<HistoryResult>(
      `/activity-history?${historyQuery(f, page)}`,
      { cache: "no-store" },
      token,
    ),
  export: async (token: string, f: HistoryFilters) => {
    const base = getAgenciaHubApiBaseUrl();
    if (!base) throw new Error("API não configurada.");
    const res = await fetch(
      `${base}/activity-history/export.csv?${historyQuery(f)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      if (res.status === 401)
        window.dispatchEvent(
          new CustomEvent("auth:unauthorized", { detail: token }),
        );
      const error = await res.json().catch(() => null);
      throw new Error(
        error?.message || "Não foi possível gerar o arquivo. Tente novamente.",
      );
    }
    return res.blob();
  },
};
/** The source modules retain their own CRUD; links never contain snapshot text. */
export function historyOrigin(
  e: HistoryEvent,
  product: HistoryProduct,
): string {
  const domain = product === "MILES" ? "milhas" : "viagens";
  const id = encodeURIComponent(e.resourceId);
  const links: Record<HistoryModule, string> = {
    WALLET: e.customerId
      ? `/milhas/clientes/${encodeURIComponent(e.customerId)}`
      : "/milhas",
    CONTRACTS: `/contratos?product=${product}`,
    AGENDA: `/agenda/${id}`,
    TASKS: `/${domain}/tarefas`,
    SIMULATIONS: "/milhas/simulador",
    PLAN_TASKS: "/milhas/simulador/tarefas-geradas",
    DIAGNOSTICS: `/milhas/diagnosticos/${id}`,
    TRIP_STAGES: "/viagens",
    SAVINGS: "/economia",
    REFERRALS: `/indicacoes/${id}`,
    FOLLOWUPS: `/${domain}/follow-ups`,
  };
  return links[e.module];
}
