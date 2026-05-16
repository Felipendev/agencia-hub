"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/authenticated-fetch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AbaSeguranca() {
  const { token, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSaving(true);
    try {
      if (token) {
        await apiFetch("/auth/change-password", {
          method: "POST",
          body: JSON.stringify({
            currentPassword,
            newPassword,
            newPasswordConfirmation: confirmPassword,
          }),
        }, token);
      }
      toast.success("Senha alterada com sucesso! Faça login novamente.");
      // Logout user since token is invalidated
      logout();
      router.push("/login");
    } catch (err) {
      setError((err as Error).message ?? "Erro ao alterar senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="max-w-md space-y-4 p-1">
        <div>
          <h3 className="text-base font-semibold text-[var(--hub-blue-dark)]">Alterar senha</h3>
          <p className="mt-1 text-sm text-[var(--hub-text-muted)]">
            Após alterar a senha, você será desconectado e precisará fazer login novamente.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label htmlFor="current-password">Senha atual</Label>
            <Input
              id="current-password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? "Alterando..." : "Alterar senha"}
          </Button>
        </form>
      </div>
    </Card>
  );
}
