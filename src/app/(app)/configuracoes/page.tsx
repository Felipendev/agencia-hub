"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

export default function ConfiguracoesPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (user?.accountKind !== "AGENCY_OWNER") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[var(--hub-text-muted)]">Acesso restrito ao gestor da agência.</p>
      </div>
    );
  }

  const expectedEmail = user.email;
  const isEmailMatching = confirmEmail.trim().toLowerCase() === expectedEmail.toLowerCase();

  async function handleRequestDeletion() {
    if (!isEmailMatching) return;
    setLoading(true);
    setError("");
    try {
      const base = getAgenciaHubApiBaseUrl();
      const res = await fetch(`${base}/auth/account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "Erro ao solicitar exclusão.");
        setLoading(false);
        return;
      }
      setDialogOpen(false);
      setSuccess(
        "Exclusão agendada. Sua conta e todos os dados da agência serão deletados em 7 dias. Entre em contato com suporte@agenciashub.com.br se mudar de ideia.",
      );
      setTimeout(() => {
        logout();
        router.replace("/login");
      }, 5000);
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Preferências e configurações da sua conta." />

      {success && (
        <div className="rounded-[var(--hub-radius)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      {/* Zona de Perigo */}
      <div className="rounded-[var(--hub-radius-lg)] border-2 border-red-200 bg-red-50/30 p-6">
        <h2 className="text-base font-semibold text-red-700">Zona de Perigo</h2>
        <p className="mt-1 text-sm text-red-600/80">
          Ações irreversíveis. Prossiga com cautela.
        </p>

        <div className="mt-6 border-t border-red-200 pt-6">
          <h3 className="text-sm font-semibold text-red-700">Excluir minha conta</h3>
          <p className="mt-1.5 text-sm text-[var(--hub-text-secondary)]">
            Ao excluir sua conta, <strong>todos os dados da agência serão permanentemente apagados</strong> —
            clientes, cotações, lançamentos financeiros e membros da equipe. Este processo tem um prazo de
            7 dias, durante o qual apenas o suporte pode reverter.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-[var(--hub-text-muted)]">
            <li>• Dados de clientes e histórico de cotações</li>
            <li>• Lançamentos financeiros e relatórios</li>
            <li>• Membros da equipe e convites ativos</li>
            <li>• Configurações da agência e formulários públicos</li>
          </ul>
          <Button
            variant="danger"
            className="mt-4"
            onClick={() => {
              setConfirmEmail("");
              setError("");
              setDialogOpen(true);
            }}
          >
            Excluir minha conta
          </Button>
        </div>
      </div>

      {/* Confirm Dialog */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDialogOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-red-700">Excluir conta permanentemente</h2>
            <p className="mt-2 text-sm text-[var(--hub-text-secondary)]">
              Sua conta e todos os dados da agência serão excluídos em <strong>7 dias</strong>.
              Durante esse período, apenas o suporte pode cancelar o processo entrando em{" "}
              <strong>suporte@agenciashub.com.br</strong>. Após os 7 dias, a exclusão é
              definitiva e irreversível.
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--hub-text-secondary)]">
              O que será deletado:
            </p>
            <ul className="mt-1 space-y-0.5 text-sm text-[var(--hub-text-muted)]">
              <li>• Todos os clientes e cotações</li>
              <li>• Lançamentos financeiros</li>
              <li>• Membros da equipe</li>
              <li>• Todos os dados da agência</li>
            </ul>

            <div className="mt-5">
              <Label htmlFor="confirm-email" className="text-sm font-medium">
                Para confirmar, digite seu e-mail: <span className="font-semibold">{expectedEmail}</span>
              </Label>
              <Input
                id="confirm-email"
                type="email"
                className="mt-1.5"
                placeholder={expectedEmail}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleRequestDeletion}
                disabled={!isEmailMatching || loading}
              >
                {loading ? "Processando…" : "Sim, excluir minha conta"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
