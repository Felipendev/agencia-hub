"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ImportarSubmissaoModal } from "@/components/cotacao/ImportarSubmissaoModal";
import { DuplicateCustomerError } from "@/lib/api/create-customer-remote";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import { lookupCustomerRemote } from "@/lib/api/lookup-customer-remote";
import { isUuid } from "@/lib/api/quotation-mapper";
import type { SolicitacaoPublicSubmission } from "@/types/solicitacao-publica";
import type { Cliente } from "@/types";
import type { CotacaoStatus } from "@/types";

function validadeEmDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function SolicitacaoSubmissionsBanner() {
  const { token } = useAuth();
  const { clientes, addCliente, addCotacao, isReady } = useData();
  const toast = useToast();
  const [list, setList] = useState<SolicitacaoPublicSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SolicitacaoPublicSubmission | null>(null);
  const [remoteClientes, setRemoteClientes] = useState<Cliente[]>([]);

  const hasRemoteApi = Boolean(getAgenciaHubApiBaseUrl());

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
    try {
      const res = await fetch("/api/app/solicitacao-submissions", {
        credentials: "include",
        headers: {
          ...authHeaders(),
        },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        submissions?: SolicitacaoPublicSubmission[];
      };
      setList(data.submissions ?? []);
    } catch (e) {
      console.error("Erro ao carregar submissões:", e);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (!isReady) return;
    void refresh();
  }, [isReady, refresh]);

  useEffect(() => {
    if (!isReady || !hasRemoteApi || !token) return;
    void listCustomersRemote(token)
      .then(setRemoteClientes)
      .catch(() => {
        /* API indisponível — segue só com clientes locais */
      });
  }, [isReady, hasRemoteApi, token]);

  async function handleImport(params: {
    clienteId: string;
    isNewClient: boolean;
    status: CotacaoStatus;
    observacoes: string;
  }) {
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
          isUuid(selectedSubmission.referralSellerId) ?
            selectedSubmission.referralSellerId
          : undefined,
      });

      await fetch(
        `/api/app/solicitacao-submissions?id=${encodeURIComponent(selectedSubmission.id)}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { ...authHeaders() },
        },
      );

      toast.success("Cotação importada com sucesso!");
      setSelectedSubmission(null);
      await refresh();
    } catch (e) {
      if (e instanceof DuplicateCustomerError) {
        toast.error(e.message);
      } else {
        console.error("Erro ao importar:", e);
        toast.error("Erro ao importar solicitação. Tente novamente.");
      }
    }
  }

  if (list.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
        <p className="text-sm font-semibold text-amber-950">
          {list.length === 1
            ? "1 solicitação recebida pelo link público"
            : `${list.length} solicitações recebidas pelo link público`}
        </p>
        <p className="mt-1 text-xs text-amber-900/90">
          Importe para criar ou vincular a um cliente existente e adicionar a
          cotação no quadro.
        </p>
        <ul className="mt-3 space-y-2">
          {list.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-2 rounded-lg border border-amber-200/80 bg-white/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <span className="font-medium text-slate-900">{s.nome}</span>
                <span className="ml-2 text-xs text-slate-500">
                  {new Date(s.createdAt).toLocaleString("pt-BR")} · {s.slug}
                  {s.referralSellerName ?
                    ` · ref.: ${s.referralSellerName}`
                  : s.referralSellerId ?
                    " · link com vendedor"
                  : s.sellerPublicCode ?
                    ` · ref. vendedor ${s.sellerPublicCode}`
                  : ""}
                </span>
              </div>
              <Button
                type="button"
                className="shrink-0 text-sm"
                onClick={() => setSelectedSubmission(s)}
              >
                Importar
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {selectedSubmission && (
        <ImportarSubmissaoModal
          open={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          submission={selectedSubmission}
          clientes={mergedClientes}
          onImport={handleImport}
        />
      )}
    </>
  );
}
