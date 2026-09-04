"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { VerificationCodeInput } from "@/components/ui/verification-code-input";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { useAuth } from "@/contexts/auth-context";
import type { UsuarioSessao } from "@/types";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const codeFromUrl = searchParams.get("code") || "";
  const linkToken = searchParams.get("t") || "";   // opaque JWT from email button

  const { applySession } = useAuth();
  const [code, setCode] = useState(codeFromUrl);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendSuccess, setResendSuccess] = useState(false);
  const autoSubmittedRef = useRef(false);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleVerifyByLink(token: string) {
    setError("");
    setLoading(true);
    try {
      const base = getAgenciaHubApiBaseUrl();
      if (!base) {
        if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
          setError("Serviço de verificação não configurado. Tente novamente mais tarde.");
          return;
        }
        applySession(
          { id: "mock-owner", email: email || "usuario@demo.com", nome: "Usuário", empresa: "Minha Agência", accountKind: "AGENCY_OWNER" },
          "mock-token",
        );
        router.replace("/dashboard");
        return;
      }
      const res = await fetch(`${base}/auth/verify-email-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const errData = data as { message?: string } | null;
        setError(errData?.message ?? "Link inválido ou expirado. Use o código abaixo.");
        return;
      }
      if (data?.token) {
        const sessao: UsuarioSessao = {
          id: data.userId,
          email: data.email,
          nome: data.name,
          empresa: data.agencyName || "AgênciasHub",
          accountKind: data.accountKind,
          linkPublicCode: data.publicLinkCode,
        };
        applySession(sessao, data.token);
      }
      router.replace("/dashboard");
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(verifyCode: string) {
    setError("");
    setLoading(true);

    try {
      const base = getAgenciaHubApiBaseUrl();
      if (!base) {
        if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
          setError("Serviço de verificação não configurado. Tente novamente mais tarde.");
          return;
        }
        applySession(
          { id: "mock-owner", email, nome: "Usuário", empresa: "Minha Agência", accountKind: "AGENCY_OWNER" },
          "mock-token",
        );
        router.replace("/dashboard");
        return;
      }

      const res = await fetch(`${base}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verifyCode }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errData = data as { message?: string } | null;
        setError(errData?.message ?? "Código inválido ou expirado.");
        return;
      }

      if (data?.token) {
        const sessao: UsuarioSessao = {
          id: data.userId,
          email: data.email,
          nome: data.name,
          empresa: data.agencyName || "AgênciasHub",
          accountKind: data.accountKind,
          linkPublicCode: data.publicLinkCode,
        };
        applySession(sessao, data.token);
      }

      router.replace("/dashboard");
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-submit: opaque link token takes priority, fallback to plain code+email
  useEffect(() => {
    if (autoSubmittedRef.current) return;
    if (linkToken) {
      autoSubmittedRef.current = true;
      void handleVerifyByLink(linkToken);
    } else if (codeFromUrl.length === 6 && email) {
      autoSubmittedRef.current = true;
      void handleVerify(codeFromUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || !email) return;
    setResendSuccess(false);
    setError("");

    try {
      const base = getAgenciaHubApiBaseUrl();
      if (!base) {
        if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
          setError("Serviço de verificação não configurado. Tente novamente mais tarde.");
          return;
        }
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
        const errData = data as { message?: string } | null;
        setError(errData?.message ?? "Erro ao reenviar código.");
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
    if (code.length !== 6) {
      setError("Informe o código de 6 dígitos.");
      return;
    }
    await handleVerify(code);
  }

  const gradient = "bg-gradient-to-br from-[var(--hub-blue-dark)] via-[var(--hub-blue)] to-[#1a5080]";

  // Acess via link token: show loading while auto-submit runs
  if (!email && linkToken) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center ${gradient} px-4`}>
        <div className="w-full max-w-md rounded-[var(--hub-radius-xl)] border border-white/15 bg-white p-8 shadow-xl text-center space-y-4">
          {error ? (
            <>
              <div className="rounded-[var(--hub-radius)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              <Link href="/cadastro" className="inline-block font-medium text-[var(--hub-blue)] hover:underline text-sm">
                Voltar ao cadastro
              </Link>
            </>
          ) : (
            <>
              <svg className="mx-auto h-8 w-8 animate-spin text-[var(--hub-blue)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-sm text-[var(--hub-text-secondary)]">Verificando seu e-mail…</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center ${gradient} px-4`}>
        <div className="w-full max-w-md rounded-[var(--hub-radius-xl)] border border-white/15 bg-white p-8 shadow-xl text-center">
          <p className="text-[var(--hub-text-secondary)]">E-mail não informado.</p>
          <Link href="/cadastro" className="mt-4 inline-block font-medium text-[var(--hub-blue)] hover:underline">
            Voltar ao cadastro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen flex-col ${gradient}`}>
      {/* Back button */}
      <div className="px-4 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Página inicial
        </Link>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-8"><Logo variant="dark" size="lg" href="/" /></div>

        <div className="w-full max-w-md rounded-[var(--hub-radius-xl)] border border-white/15 bg-white p-8 shadow-xl">
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--hub-blue)]/10">
            <svg className="h-7 w-7 text-[var(--hub-blue)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>

          <h1 className="text-center text-xl font-bold text-[var(--hub-blue-dark)]">
            Verifique seu e-mail
          </h1>
          <p className="mt-2 text-center text-sm text-[var(--hub-text-secondary)]">
            Enviamos um código de 6 dígitos para
          </p>
          <p className="mt-0.5 text-center text-sm font-semibold text-[var(--hub-blue-dark)] break-all">
            {email}
          </p>
          <p className="mt-1 text-center text-xs text-[var(--hub-text-muted)]">
            Não encontrou? Verifique a pasta de spam ou lixo eletrônico.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <VerificationCodeInput value={code} onChange={setCode} disabled={loading} />

            {error && (
              <div className="rounded-[var(--hub-radius)] border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                {error}
              </div>
            )}

            {resendSuccess && (
              <div className="rounded-[var(--hub-radius)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
                Novo código enviado! Verifique sua caixa de entrada.
              </div>
            )}

            <Button
              type="submit"
              className="w-full !py-3 text-base"
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verificando…" : "Ativar conta"}
            </Button>

            {/* Resend section */}
            <div className="border-t border-[var(--hub-border)] pt-4 text-center">
              <p className="text-sm text-[var(--hub-text-muted)]">Não recebeu o código?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--hub-blue)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resendCooldown > 0 ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Reenviar em {resendCooldown}s
                  </>
                ) : (
                  "Reenviar código"
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-white/50">
          E-mail errado?{" "}
          <Link href="/cadastro" className="font-medium text-white/80 hover:text-white underline">
            Voltar ao cadastro
          </Link>
        </p>
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
