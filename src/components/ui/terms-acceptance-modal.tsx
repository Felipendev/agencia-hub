"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api/authenticated-fetch";
import { Button } from "@/components/ui/button";

/**
 * Blocking modal shown when the login response indicates the user
 * needs to accept a new version of the Terms of Use.
 */
export function TermsAcceptanceModal() {
  const { user, token, logout } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!user?.requiresTermsAcceptance) return null;

  async function handleAccept() {
    if (!accepted || !token) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch("/terms/accept", {
        method: "POST",
        body: JSON.stringify({ termsVersion: "1.0.0" }),
      }, token);
      // Update user in storage to remove the flag
      const raw = localStorage.getItem("agencia-hub-user");
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.requiresTermsAcceptance = false;
        localStorage.setItem("agencia-hub-user", JSON.stringify(parsed));
      }
      // Reload to clear the modal
      window.location.reload();
    } catch (err) {
      setError((err as Error).message ?? "Erro ao aceitar termos.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-[var(--hub-blue-dark)]">
          Aceite os Termos de Uso
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Uma nova versão dos Termos de Uso foi publicada. Para continuar usando a plataforma, é necessário aceitar os novos termos.
        </p>

        <div className="mt-6 flex items-start gap-3">
          <input
            type="checkbox"
            id="terms-accept"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="terms-accept" className="text-sm text-slate-700">
            Li e aceito os{" "}
            <Link href="/termos" target="_blank" className="text-[var(--hub-blue)] hover:underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" target="_blank" className="text-[var(--hub-blue)] hover:underline">
              Política de Privacidade
            </Link>
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            onClick={handleAccept}
            disabled={!accepted || saving}
            className="flex-1"
          >
            {saving ? "Salvando..." : "Aceitar e continuar"}
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
      </div>
    </div>
  );
}
