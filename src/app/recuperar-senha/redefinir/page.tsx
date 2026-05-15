"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerificationCodeInput } from "@/components/ui/verification-code-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (code.length !== 6) return "Informe o código de 6 dígitos.";
    if (newPassword.length < 8) return "A nova senha deve ter no mínimo 8 caracteres.";
    if (newPassword !== newPasswordConfirmation) return "As senhas não coincidem.";
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

    setLoading(true);

    try {
      const base = getAgenciaHubApiBaseUrl();
      if (!base) {
        // Mock mode
        router.push("/login?reset=success");
        return;
      }

      const res = await fetch(`${base}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          newPassword,
          newPasswordConfirmation,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "message" in data
            ? (data as { message: string }).message
            : "Erro ao redefinir senha.";
        setError(msg);
        return;
      }

      router.push("/login?reset=success");
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (!email) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[var(--hub-blue-dark)] via-[var(--hub-blue)] to-[#1a5080] px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white p-8 shadow-xl text-center">
          <p className="text-slate-600">E-mail não informado.</p>
          <Link href="/recuperar-senha" className="mt-4 inline-block font-medium text-[var(--hub-blue)] hover:underline">
            Voltar à recuperação de senha
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[var(--hub-blue-dark)] via-[var(--hub-blue)] to-[#1a5080]">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-white/90 hover:text-white"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--hub-yellow)] text-sm font-bold text-[var(--hub-blue-dark)]">
            AH
          </span>
          <span className="text-xl font-bold">AgênciasHub</span>
        </Link>

        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white p-8 shadow-xl">
          <h1 className="text-xl font-bold text-[var(--hub-blue-dark)]">
            Redefinir senha
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Informe o código enviado para{" "}
            <span className="font-medium text-[var(--hub-blue-dark)]">{email}</span>{" "}
            e escolha uma nova senha.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <Label>Código de verificação</Label>
              <div className="mt-1.5">
                <VerificationCodeInput value={code} onChange={setCode} disabled={loading} />
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <PasswordStrengthIndicator password={newPassword} />
            </div>

            <div>
              <Label htmlFor="newPasswordConfirmation">Confirmar nova senha</Label>
              <Input
                id="newPasswordConfirmation"
                type="password"
                autoComplete="new-password"
                value={newPasswordConfirmation}
                onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full !py-3 text-base" disabled={loading}>
              {loading ? "Redefinindo…" : "Redefinir senha"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link
              href="/login"
              className="font-medium text-[var(--hub-blue)] hover:underline"
            >
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[var(--hub-blue-dark)] via-[var(--hub-blue)] to-[#1a5080]" />
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
