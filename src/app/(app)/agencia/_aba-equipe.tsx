"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
import { formatBRL } from "@/lib/format";
import { createUserRemote, listUsersRemote, updateUserRemote } from "@/lib/api/users-remote";
import type { AccountKind, ApiUserResponse } from "@/lib/api/auth-types";

type Props = { token: string | null };

export function AbaEquipe({ token }: Props) {
  const toast = useToast();
  const [users, setUsers] = useState<ApiUserResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario novo usuario
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<AccountKind>("SALES_AGENT");
  const [commType, setCommType] = useState<"pct" | "fixed" | "none">("pct");
  const [commPct, setCommPct] = useState("");
  const [commFixed, setCommFixed] = useState("");
  const [saving, setSaving] = useState(false);

  // Edicao inline de comissao
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"pct" | "fixed" | "none">("pct");
  const [editPct, setEditPct] = useState("");
  const [editFixed, setEditFixed] = useState("");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    listUsersRemote(token)
      .then(setUsers)
      .catch(() => toast.error("Erro ao carregar usuarios."))
      .finally(() => setLoading(false));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const created = await createUserRemote({
        name: nome.trim(), email: email.trim(), password: senha, accountKind: role,
        commissionPct: commType === "pct" && commPct ? parseFloat(commPct) : undefined,
        commissionFixed: commType === "fixed" && commFixed ? parseFloat(commFixed.replace(",", ".")) : undefined,
      }, token);
      setUsers((p) => [...p, created]);
      setNome(""); setEmail(""); setSenha(""); setCommPct(""); setCommFixed("");
      toast.success("Usuario criado!");
    } catch (err) {
      toast.error((err as Error).message ?? "Erro ao criar usuario.");
    } finally { setSaving(false); }
  }

  async function handleToggle(u: ApiUserResponse) {
    if (!token) return;
    try {
      const updated = await updateUserRemote(u.id, { active: !u.active }, token);
      setUsers((p) => p.map((x) => x.id === u.id ? updated : x));
      toast.success(updated.active ? "Ativado." : "Desativado.");
    } catch { toast.error("Erro ao atualizar."); }
  }

  async function handleSaveComm(u: ApiUserResponse) {
    if (!token) return;
    try {
      const updated = await updateUserRemote(u.id, {
        commissionPct: editType === "pct" && editPct ? parseFloat(editPct) : null,
        commissionFixed: editType === "fixed" && editFixed ? parseFloat(editFixed.replace(",", ".")) : null,
      }, token);
      setUsers((p) => p.map((x) => x.id === u.id ? updated : x));
      setEditingId(null);
      toast.success("Comissao atualizada.");
    } catch { toast.error("Erro ao atualizar comissao."); }
  }

  function startEdit(u: ApiUserResponse) {
    setEditingId(u.id);
    if (u.commissionPct != null) { setEditType("pct"); setEditPct(String(u.commissionPct)); setEditFixed(""); }
    else if (u.commissionFixed != null) { setEditType("fixed"); setEditFixed(String(u.commissionFixed)); setEditPct(""); }
    else { setEditType("none"); setEditPct(""); setEditFixed(""); }
  }

  function commLabel(u: ApiUserResponse) {
    if (u.commissionPct != null) return `${u.commissionPct}%`;
    if (u.commissionFixed != null) return `${formatBRL(u.commissionFixed)} fixo`;
    return "—";
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Tabela */}
      <Card>
        <p className="mb-4 text-sm font-semibold text-[var(--hub-blue-dark)]">Membros da equipe</p>
        {loading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : !token ? (
          <p className="text-sm text-slate-500">Configure a URL da API para gerenciar usuarios.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr><Th>Nome</Th><Th>E-mail</Th><Th>Perfil</Th><Th>Comissao</Th><Th>Status</Th><Th>Acao</Th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <Td className="font-medium text-[var(--hub-blue-dark)]">{u.name}</Td>
                    <Td className="text-sm text-slate-600">{u.email}</Td>
                    <Td><Badge tone={u.accountKind === "AGENCY_OWNER" ? "warning" : "muted"}>{u.accountKind === "AGENCY_OWNER" ? "Dono" : "Vendedor"}</Badge></Td>
                    <Td>
                      {editingId === u.id ? (
                        <div className="flex items-center gap-1.5">
                          <Select value={editType} onChange={(e) => setEditType(e.target.value as "pct" | "fixed" | "none")} className="w-20 text-xs">
                            <option value="pct">%</option>
                            <option value="fixed">Fixo</option>
                            <option value="none">Nenhuma</option>
                          </Select>
                          {editType === "pct" && <Input className="w-16 text-xs" placeholder="5" value={editPct} onChange={(e) => setEditPct(e.target.value)} />}
                          {editType === "fixed" && <Input className="w-20 text-xs" placeholder="200" value={editFixed} onChange={(e) => setEditFixed(e.target.value)} />}
                          <button type="button" onClick={() => handleSaveComm(u)} className="rounded bg-[var(--hub-blue)] px-2 py-1 text-xs text-white">OK</button>
                          <button type="button" onClick={() => setEditingId(null)} className="text-xs text-slate-400">x</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => startEdit(u)} className="text-sm text-slate-700 hover:text-[var(--hub-blue)] hover:underline">
                          {commLabel(u)}
                        </button>
                      )}
                    </Td>
                    <Td><Badge tone={u.active ? "success" : "danger"}>{u.active ? "Ativo" : "Inativo"}</Badge></Td>
                    <Td>
                      <button type="button" onClick={() => handleToggle(u)} className="text-xs text-slate-500 hover:text-[var(--hub-blue)]">
                        {u.active ? "Desativar" : "Ativar"}
                      </button>
                    </Td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="border-b border-[var(--hub-border)] px-4 py-6 text-center text-sm text-slate-500">Nenhum usuario cadastrado.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      {/* Formulario */}
      <Card className="h-fit">
        <p className="mb-4 text-sm font-semibold text-[var(--hub-blue-dark)]">Novo usuario</p>
        {!token ? (
          <p className="text-sm text-slate-500">Configure a URL da API para criar usuarios.</p>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3">
            <div><Label htmlFor="eq-nome">Nome</Label><Input id="eq-nome" required value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <div><Label htmlFor="eq-email">E-mail</Label><Input id="eq-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label htmlFor="eq-senha">Senha (min. 6)</Label><Input id="eq-senha" type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
            <div>
              <Label htmlFor="eq-role">Perfil</Label>
              <Select id="eq-role" value={role} onChange={(e) => setRole(e.target.value as AccountKind)}>
                <option value="SALES_AGENT">Vendedor</option>
                <option value="AGENCY_OWNER">Dono</option>
              </Select>
            </div>
            {role === "SALES_AGENT" && (
              <>
                <div>
                  <Label htmlFor="eq-ctype">Tipo de comissao</Label>
                  <Select id="eq-ctype" value={commType} onChange={(e) => setCommType(e.target.value as "pct" | "fixed" | "none")}>
                    <option value="pct">Percentual (%)</option>
                    <option value="fixed">Valor fixo (R$)</option>
                    <option value="none">Sem comissao</option>
                  </Select>
                </div>
                {commType === "pct" && <div><Label htmlFor="eq-pct">Percentual (%)</Label><Input id="eq-pct" inputMode="decimal" placeholder="5" value={commPct} onChange={(e) => setCommPct(e.target.value)} /></div>}
                {commType === "fixed" && <div><Label htmlFor="eq-fixed">Valor fixo (R$)</Label><Input id="eq-fixed" inputMode="decimal" placeholder="200,00" value={commFixed} onChange={(e) => setCommFixed(e.target.value)} /></div>}
              </>
            )}
            <Button type="submit" className="w-full" disabled={saving}>{saving ? "Criando..." : "Criar usuario"}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
