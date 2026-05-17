"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ContatoPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate sending — no backend needed for now
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setEnviado(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[var(--hub-bg-subtle)]">
      <header className="border-b border-[var(--hub-border)] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Logo variant="light" size="md" href="/" />
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">Contato</h1>
        <p className="mt-2 text-sm text-[var(--hub-text-secondary)]">
          Caso você já seja usuário do sistema, recomendamos utilizar o suporte via WhatsApp. Para novos interessados, preencha o formulário abaixo.
        </p>

        {enviado ? (
          <div className="mt-8 rounded-[var(--hub-radius-lg)] border border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-emerald-800">Mensagem enviada!</h2>
            <p className="mt-1 text-sm text-emerald-700">
              Recebemos sua mensagem e retornaremos em breve.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="assunto">Assunto</Label>
              <Input
                id="assunto"
                type="text"
                required
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Assunto da mensagem"
              />
            </div>
            <div>
              <Label htmlFor="mensagem">Mensagem</Label>
              <textarea
                id="mensagem"
                required
                rows={5}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Escreva sua mensagem..."
                className="w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 py-2 text-sm text-[var(--hub-blue-dark)] placeholder:text-[var(--hub-text-muted)] focus:border-[var(--hub-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--hub-blue)]/20"
              />
            </div>
            <Button type="submit" className="w-full !py-3 text-base" disabled={loading}>
              {loading ? "Enviando…" : "Enviar"}
            </Button>
          </form>
        )}

        <div className="mt-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--hub-border)]" />
          <span className="text-sm text-[var(--hub-text-muted)]">ou</span>
          <div className="h-px flex-1 bg-[var(--hub-border)]" />
        </div>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-[var(--hub-text-secondary)]">
            Se preferir, entre em contato através do WhatsApp.
          </p>
          <a
            href="https://wa.me/5531982615986"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[var(--hub-radius)] bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
          <p className="text-sm text-[var(--hub-text-muted)]">
            E-mail: <a href="o" className="font-medium text-[var(--hub-blue)] hover:underline">contato@agenciashub.com.br</a>
          </p>
        </div>
      </main>
    </div>
  );
}
