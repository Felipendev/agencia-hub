"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Informe o e-mail.");
      return;
    }

    setLoading(true);

    try {
      const base = getAgenciaHubApiBaseUrl();
      if (!base) {
        // Mock mode
        setSubmitted(true);
        return;
      }

      const res = await fetch(`${base}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      // Always show success regardless of response (prevent email enumeration)
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        // Only show error for rate limiting
        if (res.status === 429) {
          const msg =
            data && typeof data === "object" && "message" in data
              ? (data as { message: string }).message
              : "Muitas tentativas. Tente novamente mais tarde.";
          setError(msg);
          return;
        }
      }

      setSubmitted(true);
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[var(--hub-blue-dark)] via-[var(--hub-blue)] to-[#1a5080]">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-white/90 hover:text-white"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-[var(--hub-radius)] bg-[var(--hub-yellow)] text-sm font-bold text-[var(--hub-blue-dark)]">
            AH
          </span>
          <span className="text-xl font-bold">AgênciasHub</span>
        </Link>

        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white p-8 shadow-xl">
          <h1 className="text-xl font-bold text-[var(--hub-blue-dark)]">
            Recuperar senha
          </h1>

          {submitted ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-[var(--hub-radius)] bg-green-50 border border-green-200 p-4">
                <p className="text-sm text-green-800">
                  Se o e-mail estiver cadastrado, você receberá um código de verificação.
                  Verifique sua caixa de entrada e spam.
                </p>
              </div>
              <Link
                href={`/recuperar-senha/redefinir?email=${encodeURIComponent(email.trim())}`}
                className="block"
              >
                <Button className="w-full !py-3 text-base">
                  Já tenho o código
                </Button>
              </Link>
              <p className="text-center text-sm text-[var(--hub-text-muted)]">
                <Link
                  href="/login"
                  className="font-medium text-[var(--hub-blue)] hover:underline"
                >
                  Voltar ao login
                </Link>
              </p>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-[var(--hub-text-secondary)]">
                Informe seu e-mail para receber um código de recuperação.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>

                {error && (
                  <p className="text-sm font-medium text-red-600">{error}</p>
                )}

                <Button type="submit" className="w-full !py-3 text-base" disabled={loading}>
                  {loading ? "Enviando…" : "Enviar código"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-[var(--hub-text-muted)]">
                <Link
                  href="/login"
                  className="font-medium text-[var(--hub-blue)] hover:underline"
                >
                  Voltar ao login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
