"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  seedClientes,
  seedCotacoes,
  seedLancamentos,
} from "@/data/seed";
import { createCustomerRemote, DuplicateCustomerError } from "@/lib/api/create-customer-remote";
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

function loadStored(): Stored {
  const hasApi = getHasRemoteApi();
  const empty: Stored = { clientes: [], lancamentos: [], cotacoes: [] };
  const fallback: Stored = hasApi ? empty : {
    clientes: seedClientes,
    lancamentos: seedLancamentos,
    cotacoes: seedCotacoes,
  };

  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const normalized = normalizeStored(JSON.parse(raw) as Partial<Stored>);
    return stripSeedDataWhenRemote(normalized, hasApi);
  } catch {
    return fallback;
  }
}

function saveStored(data: Stored) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function normalizeStored(partial: Partial<Stored>): Stored {
  const rawCot = partial.cotacoes ?? seedCotacoes;
  return {
    clientes: partial.clientes ?? seedClientes,
    lancamentos: partial.lancamentos ?? seedLancamentos,
    cotacoes: rawCot.map((c) => migrateCotacao(c)),
  };
}

export type DataContextValue = {
  clientes: Cliente[];
  lancamentos: LancamentoFinanceiro[];
  cotacoes: Cotacao[];
  addCliente: (c: Omit<Cliente, "id" | "createdAt">) => Promise<Cliente>;
  updateCliente: (id: string, patch: Partial<Cliente>) => void;
  deleteCliente: (id: string) => Promise<void>;
  /** Verifica duplicidade antes de criar/editar. `excludeId` = próprio id ao editar. */
  checkDuplicate: (email: string, telefone: string, excludeId?: string) => ClienteDuplicateCheck;
  addLancamento: (
    l: Omit<LancamentoFinanceiro, "id">,
  ) => Promise<LancamentoFinanceiro>;
  updateLancamento: (id: string, patch: Partial<LancamentoFinanceiro>) => void;
  deleteLancamento: (id: string) => Promise<void>;
  addCotacao: (
    c: Omit<Cotacao, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Cotacao>;
  updateCotacao: (id: string, patch: Partial<Cotacao>) => void;
  resetDemoData: () => void;
  isReady: boolean;
  /** Base URL da API configurada em build (`NEXT_PUBLIC_AGENCIA_HUB_API_URL`). */
  hasRemoteApi: boolean;
  /** Carrega cotações do backend e substitui a lista em memória (e localStorage). */
  syncCotacoesFromApi: (params?: SyncCotacoesFromApiParams) => Promise<void>;
  syncClientesFromApi: () => Promise<void>;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [data, setData] = useState<Stored>(() => ({
    clientes: seedClientes,
    lancamentos: seedLancamentos,
    cotacoes: seedCotacoes,
  }));
  const [isReady, setIsReady] = useState(false);
  const hasRemoteApi = getHasRemoteApi();

  // Initial load
  useEffect(() => {
    setData(loadStored());
    setIsReady(true);
  }, []);

  // Reset data when the signed-in user changes (login / logout / account switch)
  const prevUserIdRef = { current: user?.id };
  useEffect(() => {
    if (!isReady) return;
    if (user?.id === prevUserIdRef.current) return;
    prevUserIdRef.current = user?.id;
    setData(loadStored());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isReady]);

  useEffect(() => {
    if (!isReady) return;
    saveStored(data);
  }, [data, isReady]);

  const addCliente = useCallback(async (c: Omit<Cliente, "id" | "createdAt">) => {
    const draft: Cliente = {
      ...c,
      id: generateId(),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    let novo = draft;
    try {
      const remote = await createCustomerRemote(draft, token);
      if (remote) {
        novo = remote;
      }
    } catch (e) {
      // Duplicidade confirmada pelo backend — propaga para o chamador tratar
      if (e instanceof DuplicateCustomerError) throw e;
      // Outros erros de rede: salva só localmente
      console.warn(
        "[agencia-hub] Falha ao criar cliente na API; usando só armazenamento local.",
        e,
      );
    }

    setData((d) => ({ ...d, clientes: [novo, ...d.clientes] }));
    return novo;
  }, [token]);

  const updateCliente = useCallback((id: string, patch: Partial<Cliente>) => {
    setData((d) => ({
      ...d,
      clientes: d.clientes.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    }));
  }, []);

  const deleteCliente = useCallback(async (id: string) => {
    if (hasRemoteApi && token && isUuid(id)) {
      await softDeleteCustomer(id, token);
    }
    setData((d) => ({
      ...d,
      clientes: d.clientes.filter((c) => c.id !== id),
      cotacoes: d.cotacoes.filter((c) => c.clienteId !== id),
    }));
  }, [token, hasRemoteApi]);

  const checkDuplicate = useCallback(
    (email: string, telefone: string, excludeId?: string): ClienteDuplicateCheck =>
      checkClienteDuplicate(data.clientes, email, telefone, excludeId),
    [data.clientes],
  );

  const addLancamento = useCallback(
    async (l: Omit<LancamentoFinanceiro, "id">) => {
      const draft: LancamentoFinanceiro = { ...l, id: generateId() };

      let novo = draft;
      try {
        const remote = await createFinancialEntryRemote(draft);
        if (remote) {
          novo = remote;
        }
      } catch (e) {
        console.warn(
          "[agencia-hub] Falha ao criar lançamento na API; usando só armazenamento local.",
          e,
        );
      }

      setData((d) => ({
        ...d,
        lancamentos: [novo, ...d.lancamentos],
      }));
      return novo;
    },
    [],
  );

  const updateLancamento = useCallback(
    (id: string, patch: Partial<LancamentoFinanceiro>) => {
      setData((d) => ({
        ...d,
        lancamentos: d.lancamentos.map((x) =>
          x.id === id ? { ...x, ...patch } : x,
        ),
      }));

      // Sincroniza com o backend em background (fire-and-forget)
      setData((d) => {
        const current = d.lancamentos.find((x) => x.id === id);
        if (current) {
          updateFinancialEntryRemote(current, patch).catch((e) => {
            console.warn(
              "[agencia-hub] Falha ao atualizar lançamento na API; mudança salva localmente.",
              e,
            );
          });
        }
        return d;
      });
    },
    [],
  );

  const deleteLancamento = useCallback(
    async (id: string) => {
      setData((d) => ({ ...d, lancamentos: d.lancamentos.filter((x) => x.id !== id) }));
      try {
        await deleteFinancialEntryRemote(id, token);
      } catch (e) {
        console.warn("[agencia-hub] Falha ao excluir lançamento na API.", e);
      }
    },
    [token],
  );

  const addCotacao = useCallback(
    async (c: Omit<Cotacao, "id" | "createdAt" | "updatedAt">) => {
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
      try {
        const remote = await createQuotationRemote(draft, token);
        if (remote) {
          novo = remote;
        }
      } catch (e) {
        console.warn(
          "[agencia-hub] Falha ao criar cotação na API; usando só armazenamento local.",
          e,
        );
      }

      setData((d) => ({
        ...d,
        cotacoes: [novo, ...d.cotacoes],
      }));
      return novo;
    },
    [token],
  );

  const updateCotacao = useCallback((id: string, patch: Partial<Cotacao>) => {
    const now = new Date().toISOString();
    let mergedForRemote: Cotacao | null = null;
    setData((d) => ({
      ...d,
      cotacoes: d.cotacoes.map((x) => {
        if (x.id !== id) return x;
        const merged: Cotacao = { ...x, ...patch, updatedAt: now };
        if (patch.detalhes) {
          merged.detalhes = mergeCotacaoDetalhes({
            ...x.detalhes,
            ...patch.detalhes,
          });
        }
        mergedForRemote = merged;
        return merged;
      }),
    }));

    if (mergedForRemote) {
      void updateQuotationRemote(mergedForRemote, patch, token)
        .then((apiMerged) => {
          if (!apiMerged) return;
          setData((d) => ({
            ...d,
            cotacoes: d.cotacoes.map((x) => (x.id === id ? apiMerged : x)),
          }));
        })
        .catch((e) => {
          console.warn(
            "[agencia-hub] Falha ao atualizar cotação na API; mudança salva localmente.",
            e,
          );
        });
    }
  }, [token]);

  const resetDemoData = useCallback(() => {
    const hasApi = getHasRemoteApi();
    const fresh: Stored = {
      clientes: hasApi ? [] : seedClientes,
      lancamentos: hasApi ? [] : seedLancamentos,
      cotacoes: hasApi ? [] : seedCotacoes,
    };
    setData(fresh);
    saveStored(fresh);
  }, []);

  const syncCotacoesFromApi = useCallback(
    async (params?: SyncCotacoesFromApiParams) => {
      if (!getHasRemoteApi()) return;
      try {
        const list = await listQuotationsRemote({
          customerId:
            params?.customerId && isUuid(params.customerId) ?
              params.customerId
            : undefined,
          status:
            params?.status != null ?
              cotacaoStatusToApi(params.status)
            : undefined,
          search: params?.search?.trim() || undefined,
          token: params?.token,
        });
        setData((d) => {
          // Keep locally-created cotações (non-UUID IDs) not yet synced to the API
          const apiIds = new Set(list.map((c) => c.id));
          const localOnly = d.cotacoes.filter((c) => !isUuid(c.id) && !apiIds.has(c.id));
          return { ...d, cotacoes: [...list, ...localOnly] };
        });
      } catch (e) {
        console.warn(
          "[agencia-hub] Falha ao listar cotações na API (lista local inalterada).",
          e,
        );
        // Repropaga para que os chamadores possam exibir mensagem ao usuário
        throw e;
      }
    },
    [],
  );

  const syncClientesFromApi = useCallback(async () => {
    if (!getHasRemoteApi() || !token) return;
    try {
      const list = await listCustomersRemote(token);
      setData((d) => ({ ...d, clientes: list }));
    } catch (e) {
      console.warn("[agencia-hub] Falha ao listar clientes da API.", e);
    }
  }, [token]);

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
      resetDemoData,
      isReady,
      hasRemoteApi,
      syncCotacoesFromApi,
      syncClientesFromApi,
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
      resetDemoData,
      isReady,
      hasRemoteApi,
      syncCotacoesFromApi,
      syncClientesFromApi,
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
