"use client";

import { useCallback, useEffect, useState } from "react";
import { useData } from "@/contexts/data-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ImportarSubmissaoModal } from "@/components/cotacao/ImportarSubmissaoModal";
import { DuplicateCustomerError } from "@/lib/api/create-customer-remote";
import type { SolicitacaoPublicSubmission } from "@/types/solicitacao-publica";
import type { CotacaoStatus } from "@/types";

function validadeEmDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function SolicitacaoSubmissionsBanner() {
  const { clientes, addCliente, addCotacao, isReady } = useData();
  const toast = useToast();
  const [list, setList] = useState<SolicitacaoPublicSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SolicitacaoPublicSubmission | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/app/solicitacao-submissions", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        submissions?: SolicitacaoPublicSubmission[];
      };
      setList(data.submissions ?? []);
    } catch (e) {
      console.error("Erro ao carregar submissões:", e);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Async data fetch from external API is a legitimate effect pattern
    void refresh();
  }, [isReady, refresh]);

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
        toast.success(`Cliente "${cliente.nome}" criado com sucesso!`);      }

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
      });

      await fetch(
        `/api/app/solicitacao-submissions?id=${encodeURIComponent(selectedSubmission.id)}`,
        { method: "DELETE", credentials: "include" }
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
          clientes={clientes}
          onImport={handleImport}
        />
      )}
    </>
  );
}
