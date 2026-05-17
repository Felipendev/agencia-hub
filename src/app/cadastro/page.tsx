"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";
import { TermsCheckbox } from "@/components/ui/terms-checkbox";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

export default function CadastroPage() {
  const router = useRouter();
  const [agencyName, setAgencyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (!agencyName.trim()) return "Informe o nome da agência.";
    if (!ownerName.trim()) return "Informe o nome do proprietário.";
    if (!email.trim()) return "Informe o e-mail.";
    if (password.length < 8) return "A senha deve ter no mínimo 8 caracteres.";
    if (password !== passwordConfirmation) return "As senhas não coincidem.";
    if (!ownerPhone || (ownerPhone.length !== 10 && ownerPhone.length !== 11)) {
      return "Informe um telefone válido (DDD + número).";
    }
    if (agencyPhone && agencyPhone.length !== 10 && agencyPhone.length !== 11) {
      return "Telefone comercial inválido (DDD + número).";
    }
    if (!termsAccepted) return "É necessário aceitar os Termos de Uso.";
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
        // Mock mode: redirect directly
        router.push(`/cadastro/verificar?email=${encodeURIComponent(email.trim())}`);
        return;
      }

      const res = await fetch(`${base}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: agencyName.trim(),
          ownerName: ownerName.trim(),
          email: email.trim(),
          password,
          passwordConfirmation,
          ownerPhone,
          agencyPhone: agencyPhone || undefined,
          termsAccepted: true,
          termsVersion: "1.0.0",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errData = data as { message?: string; code?: string } | null;
        setError(errData?.message ?? "Erro ao criar conta. Tente novamente.");
        return;
      }

      // Some backends return 200 or 201 — both are success
      router.push(`/cadastro/verificar?email=${encodeURIComponent(email.trim())}`);
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

        <div className="w-full max-w-md rounded-[var(--hub-radius-xl)] border border-white/15 bg-white p-8 shadow-xl">
          <h1 className="text-xl font-bold text-[var(--hub-blue-dark)]">
            Criar conta
          </h1>
          <p className="mt-1 text-sm text-[var(--hub-text-secondary)]">
            Cadastre sua agência e comece a usar o AgênciasHub.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="agencyName">Nome da agência</Label>
              <Input
                id="agencyName"
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Viagens Fantásticas"
              />
            </div>

            <div>
              <Label htmlFor="ownerName">Nome do proprietário</Label>
              <Input
                id="ownerName"
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="João Silva"
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@agencia.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <PasswordStrengthIndicator password={password} />
            </div>

            <div>
              <Label htmlFor="passwordConfirmation">Confirmar senha</Label>
              <PasswordInput
                id="passwordConfirmation"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <Label htmlFor="ownerPhone">Telefone/WhatsApp do proprietário</Label>
              <PhoneInput
                id="ownerPhone"
                value={ownerPhone}
                onChange={setOwnerPhone}
              />
            </div>

            <div>
              <Label htmlFor="agencyPhone">Telefone comercial da agência (opcional)</Label>
              <PhoneInput
                id="agencyPhone"
                value={agencyPhone}
                onChange={setAgencyPhone}
              />
            </div>

            <TermsCheckbox checked={termsAccepted} onChange={setTermsAccepted} />

            {error && (
              <p className="text-sm font-medium text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full !py-3 text-base" disabled={loading}>
              {loading ? "Criando conta…" : "Criar conta"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--hub-text-muted)]">
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
