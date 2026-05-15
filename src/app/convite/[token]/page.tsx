"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

type InviteData = {
  email: string;
  agencyName: string;
};

type InviteError = {
  type: "expired" | "used" | "revoked" | "not_found" | "network";
  message: string;
};

export default function ConvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteError, setInviteError] = useState<InviteError | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function validateToken() {
      const base = getAgenciaHubApiBaseUrl();
      if (!base) {
        // Mock mode
        setInviteData({ email: "vendedor@agencia.com", agencyName: "Agência Demo" });
        setLoadingInvite(false);
        return;
      }

      try {
        const res = await fetch(`${base}/auth/invite/${token}`);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const message =
            data && typeof data === "object" && "message" in data
              ? (data as { message: string }).message
              : "Convite inválido.";

          let type: InviteError["type"] = "not_found";
          if (res.status === 410) {
            if (message.includes("expirou")) type = "expired";
            else if (message.includes("utilizado")) type = "used";
            else if (message.includes("cancelado")) type = "revoked";
          }

          setInviteError({ type, message });
          return;
        }

        setInviteData({
          email: data.email,
          agencyName: data.agencyName,
        });
      } catch {
        setInviteError({ type: "network", message: "Erro de conexão com o servidor." });
      } finally {
        setLoadingInvite(false);
      }
    }

    validateToken();
  }, [token]);

  function validate(): string | null {
    if (!name.trim()) return "Informe seu nome.";
    if (password.length < 8) return "A senha deve ter no mínimo 8 caracteres.";
    if (password !== passwordConfirmation) return "As senhas não coincidem.";
    if (phone && phone.length !== 10 && phone.length !== 11) {
      return "Telefone inválido (DDD + número).";
    }
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
        router.push(`/cadastro/verificar?email=${encodeURIComponent(inviteData?.email || "")}`);
        return;
      }

      const res = await fetch(`${base}/auth/register-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          password,
          passwordConfirmation,
          phone: phone || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "message" in data
            ? (data as { message: string }).message
            : "Erro ao criar conta.";
        setError(msg);
        return;
      }

      router.push(`/cadastro/verificar?email=${encodeURIComponent(inviteData?.email || "")}`);
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (loadingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--hub-blue-dark)] via-[var(--hub-blue)] to-[#1a5080]">
        <div className="text-white/80">Validando convite…</div>
      </div>
    );
  }

  // Error state
  if (inviteError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[var(--hub-blue-dark)] via-[var(--hub-blue)] to-[#1a5080] px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-[var(--hub-blue-dark)]">
            Convite inválido
          </h1>
          <p className="mt-2 text-sm text-slate-600">{inviteError.message}</p>
          <Link
            href="/login"
            className="mt-6 inline-block font-medium text-[var(--hub-blue)] hover:underline"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  // Form state
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
            Cadastro via convite
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Você foi convidado para a agência{" "}
            <span className="font-medium text-[var(--hub-blue-dark)]">
              {inviteData?.agencyName}
            </span>
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="invite-email">E-mail</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteData?.email || ""}
                disabled
                className="bg-slate-50"
              />
            </div>

            <div>
              <Label htmlFor="invite-name">Nome</Label>
              <Input
                id="invite-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <Label htmlFor="invite-password">Senha</Label>
              <Input
                id="invite-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <PasswordStrengthIndicator password={password} />
            </div>

            <div>
              <Label htmlFor="invite-password-confirm">Confirmar senha</Label>
              <Input
                id="invite-password-confirm"
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <Label htmlFor="invite-phone">Telefone/WhatsApp (opcional)</Label>
              <PhoneInput
                id="invite-phone"
                value={phone}
                onChange={setPhone}
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full !py-3 text-base" disabled={loading}>
              {loading ? "Criando conta…" : "Criar conta"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--hub-blue)] hover:underline"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
