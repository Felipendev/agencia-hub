"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { filterClientes, useData } from "@/contexts/data-context";
import { useToast } from "@/components/ui/toast";
import { DuplicateCustomerError } from "@/lib/api/create-customer-remote";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
import { DuplicateWarning } from "@/components/cliente/DuplicateWarning";
import { formatDateBR } from "@/lib/format";
import { exportarClientesCSV } from "@/lib/csv-export";
import { DownloadIcon, TrashIcon } from "@/components/icons";
import { softDeleteCustomer } from "@/lib/api/soft-delete-remote";
import { CLIENTE_STATUS_LABELS } from "@/lib/constants";
import { isUuid } from "@/lib/api/quotation-mapper";
import type { ClienteStatus } from "@/types";

export default function ClientesPage() {
  const { clientes, addCliente, checkDuplicate, isReady, hasRemoteApi } = useData();
  const { token } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClienteStatus | "todos">("todos");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [destino, setDestino] = useState("");
  const [status, setStatus] = useState<ClienteStatus>("prospecto");
  const [obs, setObs] = useState("");
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);

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

  // Verifica duplicidade em tempo real ao digitar email/telefone
  const duplicateCheck = useMemo(
    () => checkDuplicate(email, telefone),
    [checkDuplicate, email, telefone],
  );

  // Reseta confirmação quando os dados mudam
  const handleEmailChange = (v: string) => { setEmail(v); setConfirmDuplicate(false); };
  const handleTelChange   = (v: string) => { setTelefone(v); setConfirmDuplicate(false); };

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;

    // Bloqueia se há duplicata e usuário ainda não confirmou
    if (duplicateCheck.hasDuplicate && !confirmDuplicate) {
      setConfirmDuplicate(true); // mostra aviso e pede confirmação
      return;
    }

    try {
      await addCliente({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        destinoInteresse: destino.trim() || "—",
        status,
        observacoes: obs.trim(),
      });
      setNome("");
      setEmail("");
      setTelefone("");
      setDestino("");
      setStatus("prospecto");
      setObs("");
      setConfirmDuplicate(false);
      toast.success("Cliente cadastrado com sucesso!");
    } catch (e) {
      if (e instanceof DuplicateCustomerError) {
        toast.error(e.message);
      } else {
        toast.error("Erro ao cadastrar cliente. Tente novamente.");
      }
    }
  }

  function handleExportar() {
    exportarClientesCSV(filtrados);
    toast.success(`${filtrados.length} cliente(s) exportado(s)!`);
  }

  if (!isReady) {
    return <p className="text-sm text-slate-600">Carregando…</p>;
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
          Exportar Clientes ({filtrados.length})
        </Button>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
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
                    <div className="text-slate-800">{c.email}</div>
                    <div className="text-xs text-slate-500">{c.telefone}</div>
                  </Td>
                  <Td>{c.destinoInteresse}</Td>
                  <Td>
                    <Badge tone="muted">{CLIENTE_STATUS_LABELS[c.status]}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-slate-600">
                    {formatDateBR(c.createdAt)}
                  </Td>
                  <Td>
                    <button
                      type="button"
                      title="Excluir cliente"
                      onClick={() => handleDeleteRequest(c.id)}
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {filtrados.length === 0 ? (
            <p className="mt-4 text-center text-sm text-slate-500">
              Nenhum cliente encontrado com os filtros atuais.
            </p>
          ) : null}
        </Card>

        <Card className="h-fit">
          <CardTitle>Novo cliente</CardTitle>
          <form onSubmit={handleAdd} className="mt-4 space-y-3">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tel">Telefone</Label>
              <Input
                id="tel"
                value={telefone}
                onChange={(e) => handleTelChange(e.target.value)}
              />
            </div>

            {/* Aviso de duplicidade */}
            {duplicateCheck.hasDuplicate && (
              <DuplicateWarning
                matches={duplicateCheck.matches}
                mode={confirmDuplicate ? "warn" : "warn"}
              />
            )}

            <div>
              <Label htmlFor="destino">Destino de interesse</Label>
              <Input
                id="destino"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="st">Status do cliente</Label>
              <Select
                id="st"
                value={status}
                onChange={(e) => setStatus(e.target.value as ClienteStatus)}
              >
                <option value="prospecto">Prospecto</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
              />
            </div>
            {duplicateCheck.hasDuplicate && !confirmDuplicate ? (
              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600"
              >
                Cadastrar mesmo assim
              </Button>
            ) : (
              <Button type="submit" className="w-full">
                Salvar cliente
              </Button>
            )}
          </form>
        </Card>
      </div>

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
