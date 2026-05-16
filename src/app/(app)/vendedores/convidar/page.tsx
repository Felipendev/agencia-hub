"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/authenticated-fetch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";

type Invitation = {
  id: string;
  email: string;
  token: string;
  inviteUrl: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
};

function statusLabel(status: Invitation["status"]) {
  switch (status) {
    case "PENDING": return "Pendente";
    case "ACCEPTED": return "Aceito";
    case "EXPIRED": return "Expirado";
    case "REVOKED": return "Revogado";
  }
}

function statusTone(status: Invitation["status"]): "warning" | "success" | "danger" | "muted" {
  switch (status) {
    case "PENDING": return "warning";
    case "ACCEPTED": return "success";
    case "EXPIRED": return "danger";
    case "REVOKED": return "muted";
  }
}

export default function InviteSellersPage() {
  const { user, token } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadInvitations = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const data = await apiFetch<Invitation[]>("/invitations", {}, token);
      setInvitations(data);
    } catch {
      // API might not be available
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  // Route guard: OWNER only
  if (user?.accountKind !== "AGENCY_OWNER") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[var(--hub-text-muted)]">Acesso restrito ao dono da agência.</p>
      </div>
    );
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !email.trim()) return;

    setSending(true);
    try {
      const inv = await apiFetch<Invitation>("/invitations", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      }, token);
      setInvitations((prev) => [inv, ...prev]);
      setEmail("");
      toast.success(`Convite enviado para ${inv.email}`);
    } catch (err) {
      toast.error((err as Error).message ?? "Erro ao enviar convite");
    } finally {
      setSending(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!token) return;
    try {
      await apiFetch(`/invitations/${id}`, { method: "DELETE" }, token);
      setInvitations((prev) =>
        prev.map((inv) => inv.id === id ? { ...inv, status: "REVOKED" as const } : inv)
      );
      toast.success("Convite revogado.");
    } catch (err) {
      toast.error((err as Error).message ?? "Erro ao revogar convite");
    }
  }

  function handleCopyLink(inviteUrl: string) {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      toast.success("Link copiado!");
    }).catch(() => {
      toast.error("Erro ao copiar link");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">Convidar Vendedores</h1>
        <p className="mt-1 text-sm text-[var(--hub-text-muted)]">
          Envie convites por e-mail para vendedores se cadastrarem na sua agência.
        </p>
      </div>

      {/* Invite form */}
      <Card>
        <form onSubmit={handleInvite} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="invite-email">E-mail do vendedor</Label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendedor@email.com"
            />
          </div>
          <Button type="submit" disabled={sending} className="sm:w-auto">
            {sending ? "Enviando..." : "Enviar convite"}
          </Button>
        </form>
      </Card>

      {/* Invitations list */}
      <Card>
        <p className="mb-4 text-sm font-semibold text-[var(--hub-blue-dark)]">Convites enviados</p>
        {loading ? (
          <p className="text-sm text-[var(--hub-text-muted)]">Carregando...</p>
        ) : invitations.length === 0 ? (
          <p className="text-sm text-[var(--hub-text-muted)]">Nenhum convite enviado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>E-mail</Th>
                  <Th>Status</Th>
                  <Th>Expira em</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id}>
                    <Td className="font-medium text-[var(--hub-blue-dark)]">{inv.email}</Td>
                    <Td>
                      <Badge tone={statusTone(inv.status)}>{statusLabel(inv.status)}</Badge>
                    </Td>
                    <Td className="text-sm text-[var(--hub-text-secondary)]">
                      {new Date(inv.expiresAt).toLocaleDateString("pt-BR")}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        {inv.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(inv.inviteUrl)}
                              className="text-xs text-[var(--hub-blue)] hover:underline"
                            >
                              Copiar link
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevoke(inv.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Revogar
                            </button>
                          </>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
