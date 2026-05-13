"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { VerificationCodeInput } from "@/components/ui/verification-code-input";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || !email) return;

    setResendSuccess(false);
    setError("");

    try {
      const base = getAgenciaHubApiBaseUrl();
      if (!base) {
        setResendCooldown(60);
        setResendSuccess(true);
        return;
      }

      const res = await fetch(`${base}/auth/resend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          data && typeof data === "object" && "message" in data
            ? (data as { message: string }).message
            : "Erro ao reenviar código.";
        setError(msg);
        return;
      }

      setResendCooldown(60);
      setResendSuccess(true);
    } catch {
      setError("Erro de conexão com o servidor.");
    }
  }, [email, resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Informe o código de 6 dígitos.");
      return;
    }

    setLoading(true);

    try {
      const base = getAgenciaHubApiBaseUrl();
      if (!base) {
        // Mock mode
        localStorage.setItem("agencia-hub-token", "mock-token");
        localStorage.setItem(
          "agencia-hub-user",
          JSON.stringify({
            id: "mock-owner",
            email,
            nome: "Usuário",
            empresa: "Minha Agência",
            role: "OWNER",
          }),
        );
        router.replace("/dashboard");
        return;
      }

      const res = await fetch(`${base}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "message" in data
            ? (data as { message: string }).message
            : "Código inválido ou expirado.";
        setError(msg);
        return;
      }

      // Store token and user data
      if (data?.token) {
        localStorage.setItem("agencia-hub-token", data.token);
        localStorage.setItem(
          "agencia-hub-user",
          JSON.stringify({
            id: data.userId,
            email: data.email,
            nome: data.name,
            empresa: data.agencyName || "AgênciasHub",
            role: data.role,
            linkPublicCode: data.publicLinkCode,
          }),
        );
        // Set auth cookie
        document.cookie = `ah_auth=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }

      router.replace("/dashboard");
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
          <Link href="/cadastro" className="mt-4 inline-block font-medium text-[var(--hub-blue)] hover:underline">
            Voltar ao cadastro
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
            Verificar e-mail
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Enviamos um código de 6 dígitos para{" "}
            <span className="font-medium text-[var(--hub-blue-dark)]">{email}</span>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <VerificationCodeInput value={code} onChange={setCode} disabled={loading} />

            {error && (
              <p className="text-center text-sm font-medium text-red-600">{error}</p>
            )}

            {resendSuccess && (
              <p className="text-center text-sm font-medium text-green-600">
                Novo código enviado!
              </p>
            )}

            <Button type="submit" className="w-full !py-3 text-base" disabled={loading || code.length !== 6}>
              {loading ? "Verificando…" : "Verificar"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-sm font-medium text-[var(--hub-blue)] hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
              >
                {resendCooldown > 0
                  ? `Reenviar código (${resendCooldown}s)`
                  : "Reenviar código"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VerificarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[var(--hub-blue-dark)] via-[var(--hub-blue)] to-[#1a5080]" />
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
