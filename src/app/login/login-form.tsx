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
            Entrar
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acesse o painel da sua agência.
          </p>

          {resetSuccess && (
            <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
              Senha redefinida com sucesso! Faça login com sua nova senha.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Link
                href="/recuperar-senha"
                className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            {error ? (
              <p className="text-sm font-medium text-red-600">{error}</p>
            ) : null}
            <Button type="submit" className="w-full !py-3 text-base" disabled={loading}>
              {loading ? "Entrando…" : "Acessar painel"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Não tem conta?{" "}
            <Link
              href="/cadastro"
              className="font-medium text-[var(--hub-blue)] hover:underline"
            >
              Criar conta
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-500">
            <Link
              href="/"
              className="font-medium text-[var(--hub-blue)] hover:underline"
            >
              Voltar à página inicial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
