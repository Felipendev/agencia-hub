"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { filterClientes, useData } from "@/contexts/data-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
import { NovoClienteModal } from "@/components/cliente/NovoClienteModal";
import { formatDateBR } from "@/lib/format";
import { exportarClientesCSV } from "@/lib/csv-export";
import { DownloadIcon, TrashIcon } from "@/components/icons";
import { softDeleteCustomer } from "@/lib/api/soft-delete-remote";
import { CLIENTE_STATUS_LABELS } from "@/lib/constants";
import { isUuid } from "@/lib/api/quotation-mapper";
import type { ClienteStatus } from "@/types";

export default function ClientesPage() {
  const { clientes, isReady, hasRemoteApi } = useData();
  const { token } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClienteStatus | "todos">("todos");
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);

  // ── Soft-delete state ──────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [locallyDeleted, setLocallyDeleted] = useState<Set<string>>(new Set());

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteTarget(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    if (hasRemoteApi && token && isUuid(deleteTarget)) {
      try {
        await softDeleteCustomer(deleteTarget, token);
        toast.success("Cliente excluído com sucesso.");
        setLocallyDeleted((prev) => new Set(prev).add(deleteTarget));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao excluir cliente.");
      }
    } else {
      // Modo local (ou registro legado sem UUID): esconde da listagem
      setLocallyDeleted((prev) => new Set(prev).add(deleteTarget));
      toast.success("Cliente excluído com sucesso.");
    }
    setDeleteTarget(null);
  }, [deleteTarget, token, hasRemoteApi, toast]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const filtrados = useMemo(
    () => filterClientes(clientes, q, statusFilter).filter((c) => !locallyDeleted.has(c.id)),
    [clientes, q, statusFilter, locallyDeleted],
  );

  function handleExportar() {
    exportarClientesCSV(filtrados);
    toast.success(`${filtrados.length} cliente(s) exportado(s)!`);
  }

  if (!isReady) {
    return <p className="text-sm text-[var(--hub-text-secondary)]">Carregando…</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clientes"
        description="Cadastro e listagem da sua carteira — busque por nome e filtre por status."
      >
        <Button
          type="button"
          variant="secondary"
          className="text-xs"
          onClick={handleExportar}
        >
          <DownloadIcon className="mr-1.5 h-4 w-4" />
          Exportar ({filtrados.length})
        </Button>
        <Button
          type="button"
          onClick={() => setNovoClienteOpen(true)}
        >
          Novo cliente
        </Button>
      </PageHeader>

      <div className="space-y-0">
        <Card>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="busca">Buscar por nome</Label>
              <Input
                id="busca"
                placeholder="Ex.: Mariana"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="sm:w-48">
              <Label htmlFor="filtro-status">Status</Label>
              <Select
                id="filtro-status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ClienteStatus | "todos")
                }
              >
                <option value="todos">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="prospecto">Prospecto</option>
                <option value="inativo">Inativo</option>
              </Select>
            </div>
          </div>

          <Table>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Contato</Th>
                <Th>Destino de interesse</Th>
                <Th>Status</Th>
                <Th>Cadastro</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id}>
                  <Td>
                    <Link
                      href={`/clientes/${c.id}`}
                      className="font-medium text-[var(--hub-blue)] hover:underline"
                    >
                      {c.nome}
                    </Link>
                  </Td>
                  <Td>
                    <div className="text-[var(--hub-text-primary)]">{c.email}</div>
                    <div className="text-xs text-[var(--hub-text-muted)]">{c.telefone}</div>
                  </Td>
                  <Td>{c.destinoInteresse}</Td>
                  <Td>
                    <Badge tone="muted">{CLIENTE_STATUS_LABELS[c.status]}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-[var(--hub-text-secondary)]">
                    {formatDateBR(c.createdAt)}
                  </Td>
                  <Td>
                    <button
                      type="button"
                      title="Excluir cliente"
                      onClick={() => handleDeleteRequest(c.id)}
                      className="rounded p-1 text-[var(--hub-text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {filtrados.length === 0 ? (
            <p className="mt-4 text-center text-sm text-[var(--hub-text-muted)]">
              Nenhum cliente encontrado com os filtros atuais.
            </p>
          ) : null}
        </Card>
      </div>

      <NovoClienteModal
        open={novoClienteOpen}
        onClose={() => setNovoClienteOpen(false)}
        onCreated={() => {/* lista atualiza via contexto */}}
        keepOpenAfterSave
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir cliente"
        message="Esta ação remove o cliente de forma permanente, junto com as cotações vinculadas a ele. Não é possível desfazer."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
