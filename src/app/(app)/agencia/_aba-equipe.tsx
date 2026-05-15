"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
import { formatBRL } from "@/lib/format";
import { listUsersRemote, updateUserRemote } from "@/lib/api/users-remote";
import type { ApiUserResponse } from "@/lib/api/auth-types";

type Props = { token: string | null };

export function AbaEquipe({ token }: Props) {
  const toast = useToast();
  const [users, setUsers] = useState<ApiUserResponse[]>([]);
  const [loading, setLoading] = useState(!!token);

  // Edição inline de comissão
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"pct" | "fixed" | "none">("pct");
  const [editPct, setEditPct] = useState("");
  const [editFixed, setEditFixed] = useState("");

  useEffect(() => {
    if (!token) return;
    listUsersRemote(token)
      .then(setUsers)
      .catch(() => toast.error("Erro ao carregar usuários."))
      .finally(() => setLoading(false));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

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
      toast.success("Comissão atualizada.");
    } catch { toast.error("Erro ao atualizar comissão."); }
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
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--hub-blue-dark)]">Membros da equipe</p>
          <Link
            href="/vendedores/convidar"
            className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
          >
            Convidar agente →
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : !token ? (
          <p className="text-sm text-slate-500">Configure a URL da API para gerenciar usuários.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr><Th>Nome</Th><Th>E-mail</Th><Th>Perfil</Th><Th>Comissão</Th><Th>Status</Th><Th>Ação</Th></tr>
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
                  <tr><td colSpan={6} className="border-b border-[var(--hub-border)] px-4 py-6 text-center text-sm text-slate-500">Nenhum usuário cadastrado.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
