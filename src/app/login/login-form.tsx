"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";
  const resetSuccess = searchParams.get("reset") === "success";
  const { login, user, isReady } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReady && user) {
      router.replace(from);
    }
  }, [isReady, user, router, from]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      if (result.error?.includes("Verifique seu e-mail")) {
        router.push(`/cadastro/verificar?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      setError(result.error ?? "Erro ao entrar.");
      return;
    }
    router.replace(from);
  }

  return (
    <div className="flex min-h-screen bg-[var(--hub-bg)]">
      {/* ── Painel lateral (desktop) ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[420px] lg:shrink-0 lg:flex-col lg:justify-between bg-[var(--hub-blue-dark)] px-10 py-12">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--hub-radius)] bg-[var(--hub-yellow)] text-xs font-black text-[var(--hub-blue-dark)]">
              AH
            </span>
            <span className="text-lg font-bold tracking-tight text-white">AgênciasHub</span>
          </div>
          <div className="mt-16">
            <p className="text-3xl font-bold leading-snug text-white">
              Gerencie sua agência com clareza.
            </p>
            <p className="mt-4 text-base text-white/55 leading-relaxed">
              Cotações, clientes, equipe e financeiro em um só lugar.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            "Cotações e funil de vendas",
            "CRM de clientes",
            "Dashboard por agente",
            "Calculadora de milhas",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2.5 text-sm text-white/60">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--hub-yellow)]/20 text-[var(--hub-yellow)]">
                <svg viewBox="0 0 12 12" fill="currentColor" className="h-2.5 w-2.5">
                  <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              </span>
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* ── Formulário ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {/* Logo mobile */}
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--hub-radius)] bg-[var(--hub-blue-dark)] text-xs font-black text-white">
            AH
          </span>
          <span className="text-lg font-bold text-[var(--hub-text-primary)]">AgênciasHub</span>
        </Link>

        <div className="w-full max-w-[380px]">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--hub-text-primary)]">
            Entrar
          </h1>
          <p className="mt-1 text-sm text-[var(--hub-text-muted)]">
            Acesse o painel da sua agência.
          </p>

          {resetSuccess && (
            <div className="mt-4 rounded-[var(--hub-radius)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Senha redefinida com sucesso! Faça login com sua nova senha.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@agencia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label htmlFor="password" className="mb-0">Senha</Label>
                <Link
                  href="/recuperar-senha"
                  className="text-xs font-medium text-[var(--hub-blue)] hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-[var(--hub-radius-sm)] border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full py-2.5 text-sm" disabled={loading}>
              {loading ? "Entrando…" : "Acessar painel"}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm text-[var(--hub-text-muted)]">
            <span>
              Não tem conta?{" "}
              <Link href="/cadastro" className="font-medium text-[var(--hub-blue)] hover:underline">
                Criar conta
              </Link>
            </span>
            <Link href="/" className="text-xs hover:text-[var(--hub-text-secondary)]">
              Voltar à página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
