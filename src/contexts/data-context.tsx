"use client";

import { commercialFlights, type FlightPlan } from "@/lib/flight-plan";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  seedClientes,
  seedCotacoes,
  seedLancamentos,
} from "@/data/seed";
import { createCustomerRemote } from "@/lib/api/create-customer-remote";
import { softDeleteCustomer } from "@/lib/api/soft-delete-remote";
import { createQuotationRemote } from "@/lib/api/create-quotation-remote";
import { updateQuotationRemote } from "@/lib/api/update-quotation-remote";
import { createFinancialEntryRemote } from "@/lib/api/create-financial-entry-remote";
import { updateFinancialEntryRemote } from "@/lib/api/update-financial-entry-remote";
import { deleteFinancialEntryRemote } from "@/lib/api/delete-financial-entry-remote";
import { useAuth } from "@/contexts/auth-context";
import { getHasRemoteApi } from "@/lib/api/agencia-hub-env";
import { listQuotationsRemote } from "@/lib/api/list-quotations-remote";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import { listFinancialEntriesRemote } from "@/lib/api/list-financial-entries-remote";
import { updateCustomerRemote } from "@/lib/api/update-customer-remote";
import { cotacaoStatusToApi, isUuid } from "@/lib/api/quotation-mapper";
import { mergeCotacaoDetalhes, migrateCotacao } from "@/lib/cotacao-migrate";
import { generateId } from "@/lib/format";
import type {
  Cliente,
  ClienteStatus,
  Cotacao,
  CotacaoStatus,
  LancamentoFinanceiro,
} from "@/types";

export type SyncCotacoesFromApiParams = {
  customerId?: string;
  status?: CotacaoStatus;
  search?: string;
  token?: string | null;
};

/** Resultado de uma verificação de duplicidade de cliente */
export type ClienteDuplicateCheck = {
  hasDuplicate: boolean;
  matches: Cliente[];
};

/** Normaliza telefone para comparação: só dígitos */
export function normalizeTelefone(tel: string): string {
  return tel.replace(/\D/g, "");
}

/** Normaliza email para comparação */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Verifica se já existe cliente com mesmo email ou telefone.
 * `excludeId` ignora o próprio cliente ao editar.
 */
export function checkClienteDuplicate(
  clientes: Cliente[],
  email: string,
  telefone: string,
  excludeId?: string,
): ClienteDuplicateCheck {
  const emailNorm = normalizeEmail(email);
  const telNorm   = normalizeTelefone(telefone);

  const matches = clientes.filter((c) => {
    if (excludeId && c.id === excludeId) return false;
    const emailMatch = emailNorm && normalizeEmail(c.email) === emailNorm;
    const telMatch   = telNorm.length >= 8 &&
      normalizeTelefone(c.telefone) === telNorm;
    return emailMatch || telMatch;
  });

  return { hasDuplicate: matches.length > 0, matches };
}

const STORAGE_KEY = "agencia-hub-data";

type Stored = {
  clientes: Cliente[];
  lancamentos: LancamentoFinanceiro[];
  cotacoes: Cotacao[];
};

function stripSeedDataWhenRemote(data: Stored, hasApi: boolean): Stored {
  if (!hasApi) return data;

  const seedClienteIds = new Set(["c1", "c2", "c3", "c4", "c5"]);
  const seedLancamentoIds = new Set(["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8"]);
  const seedCotacaoIds = new Set(["q1", "q2", "q3", "q4", "q5"]);

  return {
    clientes: data.clientes.filter((c) => !seedClienteIds.has(c.id)),
    lancamentos: data.lancamentos.filter((l) => !seedLancamentoIds.has(l.id)),
    cotacoes: data.cotacoes.filter((c) => !seedCotacaoIds.has(c.id)),
  };
}

function localDemoAllowed(): boolean {
  return process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ALLOW_LOCAL_DATA === "true";
}

function requireDataService() {
  if (!getHasRemoteApi() && !localDemoAllowed()) {
    throw new Error("O serviço de dados está indisponível. Nenhuma alteração foi salva.");
  }
}

function loadStored(scope?: string): Stored {
  const hasApi = getHasRemoteApi();
  const empty: Stored = { clientes: [], lancamentos: [], cotacoes: [] };
  const fallback: Stored = hasApi || !localDemoAllowed() ? empty : {
    clientes: seedClientes,
    lancamentos: seedLancamentos,
    cotacoes: seedCotacoes,
  };

  if (typeof window === "undefined" || (!hasApi && !localDemoAllowed()) || (hasApi && !scope)) return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Stored> & { scope?: string };
    // Never assign an unscoped legacy cache or another account's data to the current tenant.
    if (hasApi && parsed.scope !== scope) return empty;
    if (!hasApi && parsed.scope) return fallback;
    const normalized = normalizeStored(parsed);
    return stripSeedDataWhenRemote(normalized, hasApi);
  } catch {
    return fallback;
  }
}

function saveStored(data: Stored, scope?: string) {
  const remote = getHasRemoteApi();
  if ((remote && !scope) || (!remote && !localDemoAllowed())) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, scope: remote ? scope : undefined }));
  } catch {
    // Optional cache must not turn an API-confirmed write into a failed operation.
  }
}

function normalizeStored(partial: Partial<Stored>): Stored {
  const demo = !getHasRemoteApi() && localDemoAllowed();
  const rawCot = partial.cotacoes ?? (demo ? seedCotacoes : []);
  return {
    clientes: partial.clientes ?? (demo ? seedClientes : []),
    lancamentos: partial.lancamentos ?? (demo ? seedLancamentos : []),
    cotacoes: rawCot.map((c) => migrateCotacao(c)),
  };
}

export type DataContextValue = {
  clientes: Cliente[];
  lancamentos: LancamentoFinanceiro[];
  cotacoes: Cotacao[];
  addCliente: (c: Omit<Cliente, "id" | "createdAt">) => Promise<Cliente>;
  updateCliente: (id: string, patch: Partial<Cliente>) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;
  /** Verifica duplicidade antes de criar/editar. `excludeId` = próprio id ao editar. */
  checkDuplicate: (email: string, telefone: string, excludeId?: string) => ClienteDuplicateCheck;
  addLancamento: (
    l: Omit<LancamentoFinanceiro, "id">,
  ) => Promise<LancamentoFinanceiro>;
  updateLancamento: (id: string, patch: Partial<LancamentoFinanceiro>) => Promise<void>;
  deleteLancamento: (id: string) => Promise<void>;
  addCotacao: (
    c: Omit<Cotacao, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Cotacao>;
  updateCotacao: (id: string, patch: Partial<Cotacao>) => Promise<void>;
  saveCotacaoFlightPlan: (id: string, plan: FlightPlan) => Promise<Cotacao>;
  resetDemoData: () => void;
  isReady: boolean;
  /** Base URL da API configurada em build (`NEXT_PUBLIC_AGENCIA_HUB_API_URL`). */
  hasRemoteApi: boolean;
  /** Carrega cotações do backend e substitui a lista em memória (e localStorage). */
  syncCotacoesFromApi: (params?: SyncCotacoesFromApiParams) => Promise<void>;
  syncClientesFromApi: () => Promise<void>;
  /** Carrega os lançamentos da agência atual pela API. */
  syncLancamentosFromApi: () => Promise<void>;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const scope = token && user ? user.id + ":" + (user.agencyId ?? "") : undefined;
  const key = getHasRemoteApi() ? scope ?? "signed-out" : "local";
  // Identity changes reset descendants before any stale records or forms can render.
  // Token renewal for the same identity keeps the provider and unsaved forms mounted.
  return <DataSessionProvider key={key} scope={scope}>{children}</DataSessionProvider>;
}

function DataSessionProvider({ children, scope }: { children: React.ReactNode; scope?: string }) {
  const { token } = useAuth();
  const [data, setData] = useState<Stored>(() => ({
    clientes: !getHasRemoteApi() && localDemoAllowed() ? seedClientes : [],
    lancamentos: !getHasRemoteApi() && localDemoAllowed() ? seedLancamentos : [],
    cotacoes: !getHasRemoteApi() && localDemoAllowed() ? seedCotacoes : [],
  }));
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  const dataMode = useCallback(() => {
    if (!active.current) throw new Error("A sessão mudou. Reabra a operação na conta atual.");
    requireDataService();
  }, []);
  const confirmed = useCallback(async <T,>(request: Promise<T>): Promise<T> => {
    const response = await request;
    if (!active.current) throw new Error("A sessão mudou. Reabra a operação na conta atual.");
    return response;
  }, []);
  const [isReady, setIsReady] = useState(false);
  const hasRemoteApi = getHasRemoteApi();

  // Initial load
  useEffect(() => {
    setData(loadStored(scope));
    setIsReady(true);
  }, [scope]);

  useEffect(() => {
    if (!isReady) return;
    saveStored(data, scope);
  }, [data, isReady, scope]);

  const addCliente = useCallback(async (c: Omit<Cliente, "id" | "createdAt">) => {
    dataMode();
    const draft: Cliente = {
      ...c,
      id: generateId(),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    let novo = draft;
    if (getHasRemoteApi()) {
      if (!token) {
        throw new Error("Sua sessão expirou. Entre novamente para cadastrar o cliente.");
      }
      const remote = await confirmed(createCustomerRemote(draft, token));
      if (!remote) {
        throw new Error("A API de clientes não está configurada.");
      }
      novo = remote;
    }

    setData((d) => ({ ...d, clientes: [novo, ...d.clientes] }));
    return novo;
  }, [token, confirmed, dataMode]);

  const updateCliente = useCallback(async (id: string, patch: Partial<Cliente>) => {
    dataMode();
    const current = data.clientes.find((cliente) => cliente.id === id);
    if (!current) throw new Error("Cliente não encontrado.");

    let updated: Cliente = { ...current, ...patch };
    if (getHasRemoteApi()) {
      if (!token) throw new Error("Sua sessão expirou. Entre novamente para atualizar o cliente.");
      updated = await confirmed(updateCustomerRemote(current, patch, token));
    }

    setData((d) => ({
      ...d,
      clientes: d.clientes.map((cliente) =>
        cliente.id === id ? updated : cliente,
      ),
    }));
  }, [data.clientes, token, confirmed, dataMode]);

  const deleteCliente = useCallback(async (id: string) => {
    dataMode();
    if (hasRemoteApi) {
      if (!token) throw new Error("Sua sessão expirou. Entre novamente para excluir o cliente.");
      if (!isUuid(id)) throw new Error("Este cliente ainda não foi sincronizado com o serviço.");
      await confirmed(softDeleteCustomer(id, token));
    }
    setData((d) => ({
      ...d,
      clientes: d.clientes.filter((c) => c.id !== id),
      cotacoes: d.cotacoes.filter((c) => c.clienteId !== id),
    }));
  }, [token, hasRemoteApi, confirmed, dataMode]);

  const checkDuplicate = useCallback(
    (email: string, telefone: string, excludeId?: string): ClienteDuplicateCheck =>
      checkClienteDuplicate(data.clientes, email, telefone, excludeId),
    [data.clientes],
  );

  const addLancamento = useCallback(
    async (l: Omit<LancamentoFinanceiro, "id">) => {
      dataMode();
      const draft: LancamentoFinanceiro = { ...l, id: generateId() };
      let novo = draft;

      if (getHasRemoteApi()) {
        if (!token) {
          throw new Error("Sua sessão expirou. Entre novamente para registrar o lançamento.");
        }
        const remote = await confirmed(createFinancialEntryRemote(draft, token));
        if (!remote) {
          throw new Error("A API financeira não está configurada.");
        }
        novo = remote;
      }

      setData((d) => ({
        ...d,
        lancamentos: [novo, ...d.lancamentos],
      }));
      return novo;
    },
    [token, confirmed, dataMode],
  );

  const updateLancamento = useCallback(
    async (id: string, patch: Partial<LancamentoFinanceiro>) => {
      dataMode();
      const current = data.lancamentos.find((entry) => entry.id === id);
      if (!current) throw new Error("Lançamento não encontrado.");

      let updated: LancamentoFinanceiro = { ...current, ...patch };
      if (getHasRemoteApi()) {
        if (!token) throw new Error("Sua sessão expirou. Entre novamente para atualizar o lançamento.");
        const remote = await confirmed(updateFinancialEntryRemote(current, patch, token));
        if (!remote) throw new Error("Este lançamento ainda não foi sincronizado com a API.");
        updated = remote;
      }

      setData((d) => ({
        ...d,
        lancamentos: d.lancamentos.map((entry) => entry.id === id ? updated : entry),
      }));
    },
    [data.lancamentos, token, confirmed, dataMode],
  );

  const deleteLancamento = useCallback(
    async (id: string) => {
      dataMode();
      if (getHasRemoteApi()) {
        if (!token) throw new Error("Sua sessão expirou. Entre novamente para excluir o lançamento.");
        if (!isUuid(id)) throw new Error("Este lançamento ainda não foi sincronizado com a API.");
        const deleted = await confirmed(deleteFinancialEntryRemote(id, token));
        if (!deleted) throw new Error("Não foi possível excluir o lançamento na API.");
      }
      setData((d) => ({ ...d, lancamentos: d.lancamentos.filter((x) => x.id !== id) }));
    },
    [token, confirmed, dataMode],
  );

  const addCotacao = useCallback(
    async (c: Omit<Cotacao, "id" | "createdAt" | "updatedAt">) => {
      dataMode();
      const now = new Date().toISOString();
      const detalhes = mergeCotacaoDetalhes(c.detalhes);
      const draft: Cotacao = {
        ...c,
        detalhes,
        tags: c.tags ?? [],
        prioridade: c.prioridade ?? false,
        responsavel: c.responsavel?.trim() || "Equipe",
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      let novo = draft;
      if (getHasRemoteApi()) {
        if (!token) {
          throw new Error("Sua sessão expirou. Entre novamente para criar a cotação.");
        }
        const remote = await confirmed(createQuotationRemote(draft, token));
        if (!remote) {
          throw new Error("A API de cotações não está configurada.");
        }
        novo = remote;
      }

      setData((d) => ({
        ...d,
        cotacoes: [novo, ...d.cotacoes],
      }));
      return novo;
    },
    [token, confirmed, dataMode],
  );

  const saveCotacaoFlightPlan = useCallback(async (id: string, plan: FlightPlan): Promise<Cotacao> => {
    dataMode();
    const current = data.cotacoes.find((c) => c.id === id);
    if (!current) throw new Error("Cotação não encontrada.");
    const selected = plan.options.find((o) => o.id === plan.selectedOptionId);
    if (!selected) throw new Error("Selecione a opção principal.");
    const patch: Partial<Cotacao> = { flightPlan: plan, opcoesVoo: commercialFlights(plan), valorTotal: selected.precoTotal };
    let saved: Cotacao = { ...current, ...patch, updatedAt: new Date().toISOString() };
    if (getHasRemoteApi()) {
      if (!token) throw new Error("Sua sessão expirou.");
      const remote = await confirmed(updateQuotationRemote(current, patch, token));
      if (!remote) throw new Error("A API de cotações não está configurada.");
      saved = remote;
    }
    setData((d) => ({ ...d, cotacoes: d.cotacoes.map((c) => c.id === id ? saved : c) }));
    return saved;
  }, [data.cotacoes, token, confirmed, dataMode]);

  const updateCotacao = useCallback(async (id: string, patch: Partial<Cotacao>) => {
    dataMode();
    const current = data.cotacoes.find((cotacao) => cotacao.id === id);
    if (!current) throw new Error("Cotação não encontrada.");
    let saved: Cotacao = { ...current, ...patch, updatedAt: new Date().toISOString() };
    if (patch.detalhes) saved.detalhes = mergeCotacaoDetalhes({ ...current.detalhes, ...patch.detalhes });
    if (getHasRemoteApi()) {
      if (!token) throw new Error("Sua sessão expirou. Entre novamente para atualizar a cotação.");
      if (!isUuid(id)) throw new Error("Esta cotação ainda não foi sincronizada com o serviço.");
      const remote = await confirmed(updateQuotationRemote(current, patch, token));
      if (!remote) throw new Error("Não foi possível confirmar a alteração da cotação no serviço.");
      saved = remote;
    }
    setData((d) => ({ ...d, cotacoes: d.cotacoes.map((x) => x.id === id ? saved : x) }));
  }, [data.cotacoes, token, confirmed, dataMode]);

  const resetDemoData = useCallback(() => {
    const hasApi = getHasRemoteApi();
    const fresh: Stored = {
      clientes: hasApi || !localDemoAllowed() ? [] : seedClientes,
      lancamentos: hasApi || !localDemoAllowed() ? [] : seedLancamentos,
      cotacoes: hasApi || !localDemoAllowed() ? [] : seedCotacoes,
    };
    setData(fresh);
    saveStored(fresh, scope);
  }, [scope]);

  const syncCotacoesFromApi = useCallback(
    async (params?: SyncCotacoesFromApiParams) => {
      dataMode();
      if (!getHasRemoteApi()) return;
      if (!token || (params?.token && params.token !== token)) throw new Error("Sua sessão expirou. Entre novamente para consultar as cotações.");
      if (params?.customerId && !isUuid(params.customerId)) throw new Error("Selecione uma pessoa sincronizada para consultar suas cotações.");
      const list = await confirmed(listQuotationsRemote({
        customerId: params?.customerId || undefined,
        status: params?.status != null ? cotacaoStatusToApi(params.status) : undefined,
        search: params?.search?.trim() || undefined,
        token,
      }));
      setData((d) => ({ ...d, cotacoes: list }));
    }, [token, confirmed, dataMode],
  );

  const syncClientesFromApi = useCallback(async () => {
    dataMode();
    if (!getHasRemoteApi()) return;
    if (!token) throw new Error("Sua sessão expirou. Entre novamente para consultar as pessoas.");
    const list = await confirmed(listCustomersRemote(token));
    setData((d) => ({ ...d, clientes: list }));
  }, [token, confirmed, dataMode]);

  const syncLancamentosFromApi = useCallback(async () => {
    dataMode();
    if (!getHasRemoteApi()) return;
    if (!token) throw new Error("Sua sessão expirou. Entre novamente para consultar o financeiro.");
    const list = await confirmed(listFinancialEntriesRemote(token));
    setData((d) => ({ ...d, lancamentos: list }));
  }, [token, confirmed, dataMode]);

  const value = useMemo<DataContextValue>(
    () => ({
      ...data,
      addCliente,
      updateCliente,
      deleteCliente,
      checkDuplicate,
      addLancamento,
      updateLancamento,
      deleteLancamento,
      addCotacao,
      updateCotacao,
      saveCotacaoFlightPlan,
      resetDemoData,
      isReady,
      hasRemoteApi,
      syncCotacoesFromApi,
      syncClientesFromApi,
      syncLancamentosFromApi,
    }),
    [
      data,
      addCliente,
      updateCliente,
      deleteCliente,
      checkDuplicate,
      addLancamento,
      updateLancamento,
      deleteLancamento,
      addCotacao,
      updateCotacao,
      saveCotacaoFlightPlan,
      resetDemoData,
      isReady,
      hasRemoteApi,
      syncCotacoesFromApi,
      syncClientesFromApi,
      syncLancamentosFromApi,
    ],
  );

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

/** Helpers para métricas e filtros (podem migrar para API depois) */
export function filterClientes(
  clientes: Cliente[],
  q: string,
  status: ClienteStatus | "todos",
) {
  let list = clientes;
  if (status !== "todos") list = list.filter((c) => c.status === status);
  if (q.trim()) {
    const low = q.toLowerCase();
    list = list.filter((c) => c.nome.toLowerCase().includes(low));
  }
  return list;
}

export function cotacoesEmAndamento(cotacoes: Cotacao[]) {
  const abertos: CotacaoStatus[] = [
    "aguardando",
    "em_cotacao",
    "aguardando_cliente",
  ];
  return cotacoes.filter((c) => abertos.includes(c.status));
}

export function computeFinanceiroResumo(lancamentos: LancamentoFinanceiro[]) {
  const validos = lancamentos.filter((l) => l.status !== "cancelado");
  let totalRecebido = 0;
  let aReceber = 0;
  let totalDespesas = 0;
  let faturamento = 0;
  for (const l of validos) {
    if (l.tipo === "entrada") {
      faturamento += l.valor;
      if (l.status === "confirmado") totalRecebido += l.valor;
      if (l.status === "previsto") aReceber += l.valor;
    } else if (l.tipo === "saida" && l.status === "confirmado") {
      totalDespesas += l.valor;
    }
  }
  return {
    faturamento,
    totalRecebido,
    aReceber,
    totalDespesas,
    saldo: totalRecebido - totalDespesas,
  };
}
