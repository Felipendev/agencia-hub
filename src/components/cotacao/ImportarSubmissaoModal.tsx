"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { XIcon } from "@/components/icons";
import { formatDateBR, formatPhoneBR } from "@/lib/format";
import type { SolicitacaoPublicSubmission } from "@/types/solicitacao-publica";
import type { Cliente, CotacaoStatus } from "@/types";

type Props = {
  open: boolean;
  onClose: () => void;
  submission: SolicitacaoPublicSubmission;
  clientes: Cliente[];
  onImport: (params: {
    clienteId: string;
    isNewClient: boolean;
    status: CotacaoStatus;
    observacoes: string;
  }) => Promise<void>;
};

export function ImportarSubmissaoModal({
  open,
  onClose,
  submission,
  clientes,
  onImport,
}: Props) {
  const [clienteId, setClienteId] = useState("");
  const [status, setStatus] = useState<CotacaoStatus>("aguardando");
  const [observacoes, setObservacoes] = useState(submission.observacoes || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const matches = clientes.filter(
      (c) =>
        c.email.toLowerCase() === submission.email.toLowerCase() ||
        c.telefone.replace(/\D/g, "") === submission.telefone.replace(/\D/g, ""),
    );
    if (matches.length > 0) {
      setClienteId(matches[0].id);
    } else {
      setClienteId("");
    }
    setStatus("aguardando");
    setObservacoes(submission.observacoes || "");
  }, [open, submission, clientes]);

  if (!open) return null;

  const clientesMatch = clientes.filter(
    (c) =>
      c.email.toLowerCase() === submission.email.toLowerCase() ||
      c.telefone.replace(/\D/g, "") === submission.telefone.replace(/\D/g, "")
  );

  const handleImport = async () => {
    if (!clienteId) return;
    setLoading(true);
    try {
      await onImport({
        clienteId,
        isNewClient: clienteId === "new",
        status,
        observacoes,
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const destinos =
    submission.detalhes.destinosTrechos?.filter((t) => t.trim()).join(" → ") ||
    submission.detalhes.destinoForm ||
    "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--hub-border)] bg-white px-6 py-4">
          <h2 className="text-xl font-bold text-[var(--hub-blue-dark)]">
            Importar Solicitação
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 transition-colors hover:bg-slate-100"
            aria-label="Fechar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Dados da submissão */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--hub-blue-dark)]">
              Dados da Solicitação
            </h3>
            <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm">
              <div className="grid gap-1">
                <span className="font-medium text-slate-600">Nome:</span>
                <span className="text-[var(--hub-blue-dark)]">
                  {submission.nome}
                </span>
              </div>
              <div className="grid gap-1">
                <span className="font-medium text-slate-600">E-mail:</span>
                <span className="text-[var(--hub-blue-dark)]">
                  {submission.email || "—"}
                </span>
              </div>
              <div className="grid gap-1">
                <span className="font-medium text-slate-600">Telefone:</span>
                <span className="text-[var(--hub-blue-dark)]">
                  {formatPhoneBR(submission.telefone)}
                </span>
              </div>
              <div className="grid gap-1">
                <span className="font-medium text-slate-600">Destino:</span>
                <span className="text-[var(--hub-blue-dark)]">{destinos}</span>
              </div>
              <div className="grid gap-1">
                <span className="font-medium text-slate-600">Origem:</span>
                <span className="text-[var(--hub-blue-dark)]">
                  {submission.detalhes.origem || "—"}
                </span>
              </div>
              <div className="grid gap-1">
                <span className="font-medium text-slate-600">Datas:</span>
                <span className="text-[var(--hub-blue-dark)]">
                  {submission.detalhes.dataIda
                    ? formatDateBR(submission.detalhes.dataIda)
                    : "—"}{" "}
                  até{" "}
                  {submission.detalhes.dataVolta
                    ? formatDateBR(submission.detalhes.dataVolta)
                    : "—"}
                </span>
              </div>
              <div className="grid gap-1">
                <span className="font-medium text-slate-600">Passageiros:</span>
                <span className="text-[var(--hub-blue-dark)]">
                  {submission.detalhes.adultos || 0} adulto(s),{" "}
                  {submission.detalhes.criancas || 0} criança(s),{" "}
                  {submission.detalhes.bebes || 0} bebê(s)
                </span>
              </div>
              <div className="grid gap-1">
                <span className="font-medium text-slate-600">Recebido em:</span>
                <span className="text-[var(--hub-blue-dark)]">
                  {formatDateBR(submission.createdAt.slice(0, 10))} às{" "}
                  {new Date(submission.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div>
            <Label htmlFor="cliente-select">Cliente</Label>
            {clientesMatch.length > 0 && (
              <div className="mb-2 rounded-lg bg-amber-50 p-3 text-sm">
                <p className="font-medium text-amber-900">
                  ⚠️ Cliente(s) encontrado(s) com mesmo e-mail ou telefone:
                </p>
                <ul className="mt-2 space-y-1">
                  {clientesMatch.map((c) => (
                    <li key={c.id} className="text-amber-800">
                      • {c.nome} ({c.email || c.telefone})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Select
              id="cliente-select"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              <option value="new">➕ Criar novo cliente</option>
              <optgroup label="Clientes existentes">
                {clientes
                  .slice()
                  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.email || c.telefone})
                    </option>
                  ))}
              </optgroup>
            </Select>
          </div>

          {/* Status inicial */}
          <div>
            <Label htmlFor="status-select">Status inicial da cotação</Label>
            <Select
              id="status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as CotacaoStatus)}
            >
              <option value="aguardando">Aguardando</option>
              <option value="em_cotacao">Em cotação</option>
              <option value="aguardando_cliente">Aguardando cliente</option>
            </Select>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="obs-import">
              Observações adicionais (opcional)
            </Label>
            <Textarea
              id="obs-import"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Notas internas sobre esta solicitação..."
            />
          </div>

          {/* Ações */}
          <div className="flex gap-3 border-t border-[var(--hub-border)] pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={!clienteId || loading}
              className="flex-1"
            >
              {loading ? "Importando..." : "Importar Cotação"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
