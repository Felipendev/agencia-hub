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
  seedAtendimentos,
  seedClientes,
  seedCotacoes,
  seedLancamentos,
} from "@/data/seed";
import { createCustomerRemote, DuplicateCustomerError } from "@/lib/api/create-customer-remote";
import { createQuotationRemote } from "@/lib/api/create-quotation-remote";
import { updateQuotationRemote } from "@/lib/api/update-quotation-remote";
import { createOpportunityRemote } from "@/lib/api/create-opportunity-remote";
import { updateOpportunityRemote } from "@/lib/api/update-opportunity-remote";
import { createFinancialEntryRemote } from "@/lib/api/create-financial-entry-remote";
import { updateFinancialEntryRemote } from "@/lib/api/update-financial-entry-remote";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { listQuotationsRemote } from "@/lib/api/list-quotations-remote";
import { cotacaoStatusToApi, isUuid } from "@/lib/api/quotation-mapper";
import { mergeCotacaoDetalhes, migrateCotacao } from "@/lib/cotacao-migrate";
import { generateId } from "@/lib/format";
import type {
  Atendimento,
  AtendimentoStatus,
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
  atendimentos: Atendimento[];
  lancamentos: LancamentoFinanceiro[];
  cotacoes: Cotacao[];
};

function loadStored(): Stored {
  const hasApi = Boolean(getAgenciaHubApiBaseUrl());
  const empty: Stored = { clientes: [], atendimentos: [], lancamentos: [], cotacoes: [] };
  const fallback: Stored = hasApi ? empty : {
    clientes: seedClientes,
    atendimentos: seedAtendimentos,
    lancamentos: seedLancamentos,
    cotacoes: seedCotacoes,
  };

  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    return normalizeStored(JSON.parse(raw) as Partial<Stored>);
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
    atendimentos: partial.atendimentos ?? seedAtendimentos,
    lancamentos: partial.lancamentos ?? seedLancamentos,
    cotacoes: rawCot.map((c) => migrateCotacao(c)),
  };
}

export type DataContextValue = {
  clientes: Cliente[];
  atendimentos: Atendimento[];
  lancamentos: LancamentoFinanceiro[];
  cotacoes: Cotacao[];
  addCliente: (c: Omit<Cliente, "id" | "createdAt">) => Promise<Cliente>;
  updateCliente: (id: string, patch: Partial<Cliente>) => void;
  /** Verifica duplicidade antes de criar/editar. `excludeId` = próprio id ao editar. */
  checkDuplicate: (email: string, telefone: string, excludeId?: string) => ClienteDuplicateCheck;
  addAtendimento: (
    a: Omit<Atendimento, "id">,
  ) => Promise<Atendimento>;
  updateAtendimento: (id: string, patch: Partial<Atendimento>) => void;
  addLancamento: (
    l: Omit<LancamentoFinanceiro, "id">,
  ) => Promise<LancamentoFinanceiro>;
  updateLancamento: (id: string, patch: Partial<LancamentoFinanceiro>) => void;
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
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Stored>(() => ({
    clientes: seedClientes,
    atendimentos: seedAtendimentos,
    lancamentos: seedLancamentos,
    cotacoes: seedCotacoes,
  }));
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setData(loadStored());
    setIsReady(true);
  }, []);

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
      const remote = await createCustomerRemote(draft);
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
  }, []);

  const updateCliente = useCallback((id: string, patch: Partial<Cliente>) => {
    setData((d) => ({
      ...d,
      clientes: d.clientes.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    }));
  }, []);

  const checkDuplicate = useCallback(
    (email: string, telefone: string, excludeId?: string): ClienteDuplicateCheck =>
      checkClienteDuplicate(data.clientes, email, telefone, excludeId),
    [data.clientes],
  );

  const addAtendimento = useCallback(async (a: Omit<Atendimento, "id">) => {
    const draft: Atendimento = { ...a, id: generateId() };

    let novo = draft;
    try {
      const remote = await createOpportunityRemote(draft);
      if (remote) {
        novo = remote;
      }
    } catch (e) {
      console.warn(
        "[agencia-hub] Falha ao criar atendimento na API; usando só armazenamento local.",
        e,
      );
    }

    setData((d) => ({
      ...d,
      atendimentos: [novo, ...d.atendimentos],
    }));
    return novo;
  }, []);

  const updateAtendimento = useCallback(
    (id: string, patch: Partial<Atendimento>) => {
      setData((d) => {
        const current = d.atendimentos.find((x) => x.id === id);
        if (current) {
          updateOpportunityRemote(current, patch).catch((e) => {
            console.warn(
              "[agencia-hub] Falha ao atualizar atendimento na API; mudança salva localmente.",
              e,
            );
          });
        }
        return {
          ...d,
          atendimentos: d.atendimentos.map((x) =>
            x.id === id ? { ...x, ...patch } : x,
          ),
        };
      });
    },
    [],
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
        const remote = await createQuotationRemote(draft);
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
    [],
  );

  const updateCotacao = useCallback((id: string, patch: Partial<Cotacao>) => {
    const now = new Date().toISOString();
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
        return merged;
      }),
    }));

    // Sincroniza com o backend em background (fire-and-forget)
    setData((d) => {
      const current = d.cotacoes.find((x) => x.id === id);
      if (current) {
        updateQuotationRemote(current, patch).catch((e) => {
          console.warn(
            "[agencia-hub] Falha ao atualizar cotação na API; mudança salva localmente.",
            e,
          );
        });
      }
      return d;
    });
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh: Stored = {
      clientes: seedClientes,
      atendimentos: seedAtendimentos,
      lancamentos: seedLancamentos,
      cotacoes: seedCotacoes,
    };
    setData(fresh);
    saveStored(fresh);
  }, []);

  const hasRemoteApi = Boolean(getAgenciaHubApiBaseUrl());

  const syncCotacoesFromApi = useCallback(
    async (params?: SyncCotacoesFromApiParams) => {
      if (!getAgenciaHubApiBaseUrl()) return;
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
        setData((d) => ({ ...d, cotacoes: list }));
      } catch (e) {
        console.warn(
          "[agencia-hub] Falha ao listar cotações na API (lista local inalterada).",
          e,
        );
      }
    },
    [],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      ...data,
      addCliente,
      updateCliente,
      checkDuplicate,
      addAtendimento,
      updateAtendimento,
      addLancamento,
      updateLancamento,
      addCotacao,
      updateCotacao,
      resetDemoData,
      isReady,
      hasRemoteApi,
      syncCotacoesFromApi,
    }),
    [
      data,
      addCliente,
      updateCliente,
      checkDuplicate,
      addAtendimento,
      updateAtendimento,
      addLancamento,
      updateLancamento,
      addCotacao,
      updateCotacao,
      resetDemoData,
      isReady,
      hasRemoteApi,
      syncCotacoesFromApi,
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

export function atendimentosEmAndamento(atendimentos: Atendimento[]) {
  const abertos: AtendimentoStatus[] = [
    "novo_lead",
    "em_atendimento",
    "proposta_enviada",
  ];
  return atendimentos.filter((a) => abertos.includes(a.status));
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
