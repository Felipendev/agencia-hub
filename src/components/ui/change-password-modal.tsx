"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api/authenticated-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";

/**
 * Blocking modal shown when the login response indicates the user
 * must change their password before accessing the system.
 */
export function ChangePasswordModal() {
  const { user, token, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!user?.mustChangePassword) return null;

  function validate(): string | null {
    if (!currentPassword) return "Informe sua senha atual.";
    if (newPassword.length < 8) return "A nova senha deve ter no mínimo 8 caracteres.";
    if (newPassword !== newPasswordConfirmation) return "As senhas não coincidem.";
    if (newPassword === currentPassword) return "A nova senha deve ser diferente da atual.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          newPasswordConfirmation,
        }),
      }, token);

      // Update user in storage to remove the flag
      const raw = localStorage.getItem("agencia-hub-user");
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.mustChangePassword = false;
        localStorage.setItem("agencia-hub-user", JSON.stringify(parsed));
      }
      // Reload to clear the modal
      window.location.reload();
    } catch (err) {
      setError((err as Error).message ?? "Erro ao alterar senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-[var(--hub-blue-dark)]">
          Alterar senha obrigatória
        </h2>
        <p className="mt-2 text-sm text-[var(--hub-text-secondary)]">
          Por segurança, você precisa definir uma nova senha antes de continuar usando o sistema.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="cp-current">Senha atual</Label>
            <Input
              id="cp-current"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div>
            <Label htmlFor="cp-new">Nova senha</Label>
            <Input
              id="cp-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
            <PasswordStrengthIndicator password={newPassword} />
          </div>

          <div>
            <Label htmlFor="cp-confirm">Confirmar nova senha</Label>
            <Input
              id="cp-confirm"
              type="password"
              autoComplete="new-password"
              value={newPasswordConfirmation}
              onChange={(e) => setNewPasswordConfirmation(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Salvando..." : "Alterar senha"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={logout}
              className="flex-1"
            >
              Sair
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
