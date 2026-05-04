"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
import { formatBRL } from "@/lib/format";
import {
  createUserRemote,
  listUsersRemote,
  updateUserRemote,
} from "@/lib/api/users-remote";
import type { ApiUserResponse, UserRole } from "@/lib/api/auth-types";

export default function VendedoresPage() {
  const { user, token } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<ApiUserResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulário novo usuário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<UserRole>("SELLER");
  const [commissionPct, setCommissionPct] = useState("");
  const [commissionFixed, setCommissionFixed] = useState("");
  const [commissionType, setCommissionType] = useState<"pct" | "fixed" | "none">("pct");
  const [saving, setSaving] = useState(false);

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

  if (user?.role !== "OWNER") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Acesso restrito ao dono da agência.</p>
      </div>
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const created = await createUserRemote(
        {
          name: nome.trim(),
          email: email.trim(),
          password: senha,
          role,
          commissionPct:
            commissionType === "pct" && commissionPct
              ? parseFloat(commissionPct)
              : undefined,
          commissionFixed:
            commissionType === "fixed" && commissionFixed
              ? parseFloat(commissionFixed.replace(",", "."))
              : undefined,
        },
        token,
      );
      setUsers((prev) => [...prev, created]);
      setNome(""); setEmail(""); setSenha("");
      setCommissionPct(""); setCommissionFixed("");
      toast.success(`${role === "SELLER" ? "Vendedor" : "Usuário"} criado com sucesso!`);
    } catch (err) {
      toast.error((err as Error).message ?? "Erro ao criar usuário.");
    } finally {
      setSaving(false);
    }
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
      <div>
        <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">
          Vendedores & Usuários
        </h1>
        <p className="mt-1 text-slate-600">
          Gerencie os membros da equipe, perfis de acesso e comissões.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Tabela de usuários */}
        <Card>
          <CardTitle>Equipe</CardTitle>
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
                        <Badge tone={u.role === "OWNER" ? "warning" : "muted"}>
                          {u.role === "OWNER" ? "Dono" : "Vendedor"}
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
                        Nenhum usuário cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card>

        {/* Formulário novo usuário */}
        <Card className="h-fit">
          <CardTitle>Novo usuário</CardTitle>
          <form onSubmit={handleCreate} className="mt-4 space-y-3">
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
              <Label htmlFor="email-u">E-mail</Label>
              <Input
                id="email-u"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="senha">Senha (mín. 6 caracteres)</Label>
              <Input
                id="senha"
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role">Perfil</Label>
              <Select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="SELLER">Vendedor</option>
                <option value="OWNER">Dono</option>
              </Select>
            </div>
            {role === "SELLER" && (
              <>
                <div>
                  <Label htmlFor="comm-type">Tipo de comissão</Label>
                  <Select
                    id="comm-type"
                    value={commissionType}
                    onChange={(e) =>
                      setCommissionType(e.target.value as "pct" | "fixed" | "none")
                    }
                  >
                    <option value="pct">Percentual (%)</option>
                    <option value="fixed">Valor fixo (R$)</option>
                    <option value="none">Sem comissão</option>
                  </Select>
                </div>
                {commissionType === "pct" && (
                  <div>
                    <Label htmlFor="comm-pct">Percentual (%)</Label>
                    <Input
                      id="comm-pct"
                      inputMode="decimal"
                      placeholder="5"
                      value={commissionPct}
                      onChange={(e) => setCommissionPct(e.target.value)}
                    />
                  </div>
                )}
                {commissionType === "fixed" && (
                  <div>
                    <Label htmlFor="comm-fixed">Valor fixo (R$)</Label>
                    <Input
                      id="comm-fixed"
                      inputMode="decimal"
                      placeholder="200,00"
                      value={commissionFixed}
                      onChange={(e) => setCommissionFixed(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Criando…" : "Criar usuário"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
