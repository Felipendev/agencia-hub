"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
import { formatBRL } from "@/lib/format";
import { listUsersRemote, updateUserRemote } from "@/lib/api/users-remote";
import type { ApiUserResponse } from "@/lib/api/auth-types";

export default function VendedoresPage() {
  const { user, token } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<ApiUserResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Edição inline de comissão
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPct, setEditPct] = useState("");
  const [editFixed, setEditFixed] = useState("");
  const [editType, setEditType] = useState<"pct" | "fixed" | "none">("pct");

  useEffect(() => {
    if (!token) return;
    listUsersRemote(token)
      .then(setUsers)
      .catch(() => toast.error("Erro ao carregar usuários."))
      .finally(() => setLoading(false));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (user?.accountKind !== "AGENCY_OWNER") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Acesso restrito ao dono da agência.</p>
      </div>
    );
  }

  async function handleToggleActive(u: ApiUserResponse) {
    if (!token) return;
    try {
      const updated = await updateUserRemote(u.id, { active: !u.active }, token);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      toast.success(updated.active ? "Usuário ativado." : "Usuário desativado.");
    } catch {
      toast.error("Erro ao atualizar usuário.");
    }
  }

  async function handleSaveCommission(u: ApiUserResponse) {
    if (!token) return;
    try {
      const updated = await updateUserRemote(
        u.id,
        {
          commissionPct:
            editType === "pct" && editPct ? parseFloat(editPct) : null,
          commissionFixed:
            editType === "fixed" && editFixed
              ? parseFloat(editFixed.replace(",", "."))
              : null,
        },
        token,
      );
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      setEditingId(null);
      toast.success("Comissão atualizada.");
    } catch {
      toast.error("Erro ao atualizar comissão.");
    }
  }

  function startEdit(u: ApiUserResponse) {
    setEditingId(u.id);
    if (u.commissionPct != null) {
      setEditType("pct");
      setEditPct(String(u.commissionPct));
      setEditFixed("");
    } else if (u.commissionFixed != null) {
      setEditType("fixed");
      setEditFixed(String(u.commissionFixed));
      setEditPct("");
    } else {
      setEditType("none");
      setEditPct(""); setEditFixed("");
    }
  }

  function commissionLabel(u: ApiUserResponse) {
    if (u.commissionPct != null) return `${u.commissionPct}%`;
    if (u.commissionFixed != null) return `${formatBRL(u.commissionFixed)} fixo`;
    return "—";
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">
            Equipe
          </h1>
          <p className="mt-1 text-slate-600">
            Gerencie os membros da equipe, perfis de acesso e comissões.
          </p>
        </div>
        <Link
          href="/vendedores/convidar"
          className="rounded-lg bg-[var(--hub-blue)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Convidar agente de venda
        </Link>
      </div>

      <Card>
        <CardTitle>Membros</CardTitle>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Carregando…</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>E-mail</Th>
                  <Th>Perfil</Th>
                  <Th>Comissão</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <Td className="font-medium text-[var(--hub-blue-dark)]">
                      {u.name}
                    </Td>
                    <Td className="text-slate-600 text-sm">{u.email}</Td>
                    <Td>
                      <Badge tone={u.accountKind === "AGENCY_OWNER" ? "warning" : "muted"}>
                        {u.accountKind === "AGENCY_OWNER" ? "Dono" : "Vendedor"}
                      </Badge>
                    </Td>
                    <Td>
                      {editingId === u.id ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={editType}
                            onChange={(e) =>
                              setEditType(e.target.value as "pct" | "fixed" | "none")
                            }
                            className="w-24 text-xs"
                          >
                            <option value="pct">%</option>
                            <option value="fixed">Fixo</option>
                            <option value="none">Nenhuma</option>
                          </Select>
                          {editType === "pct" && (
                            <Input
                              className="w-20 text-xs"
                              placeholder="5"
                              value={editPct}
                              onChange={(e) => setEditPct(e.target.value)}
                            />
                          )}
                          {editType === "fixed" && (
                            <Input
                              className="w-24 text-xs"
                              placeholder="200,00"
                              value={editFixed}
                              onChange={(e) => setEditFixed(e.target.value)}
                            />
                          )}
                          <Button
                            type="button"
                            className="text-xs px-2 py-1"
                            onClick={() => handleSaveCommission(u)}
                          >
                            Salvar
                          </Button>
                          <button
                            type="button"
                            className="text-xs text-slate-500 hover:text-slate-700"
                            onClick={() => setEditingId(null)}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="text-sm text-slate-700 hover:text-[var(--hub-blue)] underline-offset-2 hover:underline"
                          onClick={() => startEdit(u)}
                        >
                          {commissionLabel(u)}
                        </button>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={u.active ? "success" : "danger"}>
                        {u.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        className="text-xs text-slate-500 hover:text-[var(--hub-blue)]"
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.active ? "Desativar" : "Ativar"}
                      </button>
                    </Td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="border-b border-[var(--hub-border)] px-4 py-6 text-center text-sm text-slate-500"
                    >
                      Nenhum membro cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
