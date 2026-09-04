"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { DuplicateCustomerError } from "@/lib/api/create-customer-remote";
import { getHasRemoteApi } from "@/lib/api/agencia-hub-env";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import { lookupCustomerRemote } from "@/lib/api/lookup-customer-remote";
import { isUuid } from "@/lib/api/quotation-mapper";
import type { SolicitacaoPublicSubmission } from "@/types/solicitacao-publica";
import type { Cliente, CotacaoStatus } from "@/types";

export const SUBMISSIONS_UPDATED_EVENT = "solicitacao-submissions-updated";

function validadeEmDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function useSolicitacaoSubmissions() {
  const { token } = useAuth();
  const { clientes, addCliente, addCotacao, isReady } = useData();
  const toast = useToast();
  const [list, setList] = useState<SolicitacaoPublicSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SolicitacaoPublicSubmission | null>(null);
  const [remoteClientes, setRemoteClientes] = useState<Cliente[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const hasRemoteApi = getHasRemoteApi();

  const mergedClientes = useMemo(() => {
    const byId = new Map<string, Cliente>();
    for (const c of remoteClientes) byId.set(c.id, c);
    for (const c of clientes) {
      if (!byId.has(c.id)) byId.set(c.id, c);
    }
    return [...byId.values()];
  }, [clientes, remoteClientes]);

  const authHeaders = useCallback((): HeadersInit => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/app/solicitacao-submissions", {
        credentials: "include",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        submissions?: SolicitacaoPublicSubmission[];
      };
      setList(data.submissions ?? []);
    } catch (error) {
      setRefreshError("Não foi possível atualizar as solicitações. Tente novamente.");
      console.warn("[submissions] Falha ao atualizar solicitações.", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [authHeaders]);

  // Consulta uma vez ao abrir Cotações. Atualizações seguintes são manuais.
  useEffect(() => {
    if (!isReady || !token) return;
    void refresh();
  }, [isReady, token, refresh]);

  // Refresh when another instance (e.g. the banner) imports a submission
  useEffect(() => {
    function onUpdate() {
      void refresh();
    }
    window.addEventListener(SUBMISSIONS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(SUBMISSIONS_UPDATED_EVENT, onUpdate);
  }, [refresh]);

  // Load remote clients for merge
  useEffect(() => {
    if (!isReady || !hasRemoteApi || !token) return;
    void listCustomersRemote(token)
      .then(setRemoteClientes)
      .catch(() => {});
  }, [isReady, hasRemoteApi, token]);

  const handleImport = useCallback(
    async (params: {
      clienteId: string;
      isNewClient: boolean;
      status: CotacaoStatus;
      observacoes: string;
    }) => {
      if (!selectedSubmission) return;

      try {
        let clienteId = params.clienteId;

        if (params.isNewClient) {
          try {
            const cliente = await addCliente({
              nome: selectedSubmission.nome,
              email: selectedSubmission.email || "",
              telefone: selectedSubmission.telefone,
              destinoInteresse:
                selectedSubmission.detalhes.destinosTrechos
                  ?.filter((x) => x.trim())
                  .join(" · ") ||
                selectedSubmission.detalhes.destinoForm ||
                selectedSubmission.detalhes.origem ||
                "—",
              status: "prospecto",
              observacoes: `Lead: formulário público (slug ${selectedSubmission.slug}).`,
            });
            clienteId = cliente.id;
            toast.success(`Cliente "${cliente.nome}" criado com sucesso!`);
          } catch (e) {
            if (e instanceof DuplicateCustomerError && token) {
              const found = await lookupCustomerRemote(token, {
                email: selectedSubmission.email,
                phone: selectedSubmission.telefone,
              });
              if (found) {
                clienteId = found.id;
                toast.success(
                  `Este contato já estava cadastrado como "${found.nome}". Vinculamos à cotação.`,
                );
              } else {
                throw e;
              }
            } else {
              throw e;
            }
          }
        }

        const dest =
          selectedSubmission.detalhes.destinosTrechos
            ?.filter((x) => x.trim())
            .join(" · ") ||
          selectedSubmission.detalhes.destinoForm ||
          selectedSubmission.detalhes.origem ||
          "Solicitação";

        await addCotacao({
          clienteId,
          titulo: `Web — ${dest}`,
          destino: dest,
          valorTotal: 0,
          moeda: "BRL",
          status: params.status,
          validade: validadeEmDias(30),
          dataInicioViagem: selectedSubmission.detalhes.dataIda || undefined,
          dataFimViagem: selectedSubmission.detalhes.dataVolta || undefined,
          observacoes: params.observacoes,
          detalhes: {
            ...selectedSubmission.detalhes,
            whatsapp:
              selectedSubmission.detalhes.whatsapp ||
              selectedSubmission.telefone,
          },
          tags: ["formulario-web", selectedSubmission.slug],
          prioridade: false,
          responsavel: "Equipe",
          origemCriacao: "formulario_publico",
          publicSubmissionId:
            isUuid(selectedSubmission.id) ? selectedSubmission.id : undefined,
          vendedorId:
            selectedSubmission.referralSellerId &&
            isUuid(selectedSubmission.referralSellerId)
              ? selectedSubmission.referralSellerId
              : undefined,
        });

        const delRes = await fetch(
          `/api/app/solicitacao-submissions?id=${encodeURIComponent(selectedSubmission.id)}`,
          {
            method: "DELETE",
            credentials: "include",
            headers: authHeaders(),
          },
        );
        if (!delRes.ok) {
          console.warn("[submissions] Falha ao remover submissão:", delRes.status);
        }

        toast.success("Cotação importada com sucesso!");
        setSelectedSubmission(null);
        window.dispatchEvent(new CustomEvent(SUBMISSIONS_UPDATED_EVENT));
      } catch (e) {
        if (e instanceof DuplicateCustomerError) {
          toast.error(e.message);
        } else {
          console.error("Erro ao importar:", e);
          toast.error("Erro ao importar solicitação. Tente novamente.");
        }
      }
    },
    [selectedSubmission, addCliente, addCotacao, toast, token, authHeaders],
  );

  return {
    list,
    refresh,
    selectedSubmission,
    setSelectedSubmission,
    handleImport,
    mergedClientes,
    isRefreshing,
    refreshError,
  };
}
