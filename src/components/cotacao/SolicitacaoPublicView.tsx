"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CotacaoDetalhesForm } from "@/components/cotacao/CotacaoDetalhesForm";
import { SolicitacaoSocialPanel } from "@/components/cotacao/SolicitacaoSocialRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  brPhoneDigits,
  formatBrPhoneDisplay,
  isValidBrazilianPhone,
} from "@/lib/br-phone";
import { emptyCotacaoDetalhes } from "@/lib/cotacao-defaults";
import type { CotacaoDetalhes } from "@/types";
import type { SolicitacaoPublicaConfig } from "@/types/solicitacao-publica";

const LEMBRETE_KEY = "agencia-hub-solicitacao-lembrete";

type Props = { slug: string };

export function SolicitacaoPublicView({ slug }: Props) {
  const searchParams = useSearchParams();
  const sellerPublicCode = searchParams.get("vendedor")?.trim() || null;
  const [config, setConfig] = useState<SolicitacaoPublicaConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [det, setDet] = useState<CotacaoDetalhes>(() => emptyCotacaoDetalhes());
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LEMBRETE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as {
          nome?: string;
          email?: string;
          telefone?: string;
        };
        if (p.nome) setNome(p.nome);
        if (p.email) setEmail(p.email);
        if (p.telefone) setTelefone(brPhoneDigits(p.telefone));
        setLembrar(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/solicitacao/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error("Não foi possível carregar a página.");
        const data = (await res.json()) as { config: SolicitacaoPublicaConfig };
        if (!cancelled) setConfig(data.config);
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Erro ao carregar configuração.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const patchDet = useCallback((patch: Partial<CotacaoDetalhes>) => {
    setDet((d) => ({ ...d, ...patch }));
  }, []);

  const toggleServico = useCallback((id: string) => {
    setDet((d) => {
      const set = new Set(d.servicosDesejados);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...d, servicosDesejados: [...set] };
    });
  }, []);

  const toggleComodidade = useCallback((label: string) => {
    setDet((d) => {
      const set = new Set(d.comodidadesHospedagem);
      if (set.has(label)) set.delete(label);
      else set.add(label);
      return { ...d, comodidadesHospedagem: [...set] };
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErroEnvio(null);
    if (!nome.trim() || !telefone.trim()) {
      setErroEnvio("Informe nome e celular.");
      return;
    }
    const telDigits = brPhoneDigits(telefone);
    if (!isValidBrazilianPhone(telDigits)) {
      setErroEnvio("Informe um celular ou telefone válido com DDD.");
      return;
    }
    setEnviando(true);
    try {
      const celularFinal = brPhoneDigits(det.celular) || telDigits;
      const whatsFinal = det.whatsappIgualCelular
        ? celularFinal
        : brPhoneDigits(det.whatsapp) || celularFinal;
      const detalhes: CotacaoDetalhes = {
        ...det,
        celular: celularFinal,
        whatsapp: whatsFinal,
      };
      const body = {
        slug,
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        detalhes,
        observacoes: observacoes.trim(),
        sellerPublicCode,
      };
      const res = await fetch("/api/public/solicitacao/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Falha ao enviar.");
      }
      if (lembrar) {
        localStorage.setItem(
          LEMBRETE_KEY,
          JSON.stringify({
            nome: nome.trim(),
            email: email.trim(),
            telefone: brPhoneDigits(telefone),
          }),
        );
      } else {
        localStorage.removeItem(LEMBRETE_KEY);
      }
      setSucesso(true);
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setEnviando(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16 text-center text-slate-600 sm:px-8">
        <p>{loadError}</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16 text-center text-slate-600 sm:px-8">
        <p>Carregando formulário…</p>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16 text-center sm:px-8">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-10">
          <h2 className="text-xl font-bold text-emerald-900">
            Recebemos sua solicitação
          </h2>
          <p className="mt-3 text-emerald-800">
            Em breve nossa equipe entra em contato pelos dados informados.
          </p>
        </div>
      </div>
    );
  }

  const temLinksSociais = config.linksSociais.some((l) => l.url?.trim());

  return (
    <div className="mx-auto w-full max-w-[92rem] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <header className="mb-12 lg:mb-14">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-white via-white to-sky-50/40 p-7 shadow-[0_22px_60px_-18px_rgba(15,40,64,0.12)] sm:p-9 lg:p-10">
          <div
            className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[var(--hub-yellow)]/[0.12] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-200/25 blur-2xl"
            aria-hidden
          />

          <div
            className={
              temLinksSociais
                ? "relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]"
                : "relative grid gap-8"
            }
          >
            <div className="min-w-0 border-l-4 border-[var(--hub-yellow)] pl-5 sm:pl-7">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                {config.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.logoDataUrl}
                    alt={config.nomeMarca}
                    className="h-auto max-h-32 w-auto max-w-[200px] shrink-0 object-contain sm:max-h-36"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--hub-yellow)] to-amber-300/90 text-xl font-bold text-[var(--hub-blue-dark)] shadow-md ring-2 ring-white/80">
                    {config.nomeMarca.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {config.nomeMarca}
                  </p>
                  <h1 className="mt-2 text-balance text-3xl font-bold leading-tight text-[var(--hub-blue-dark)] sm:text-4xl lg:text-[2.35rem]">
                    {config.tituloPagina}
                  </h1>
                  {config.textoIntro ? (
                    <p className="mt-4 max-w-3xl text-pretty text-base leading-relaxed text-slate-600 sm:text-[1.05rem]">
                      {config.textoIntro}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {temLinksSociais ? (
              <div className="lg:justify-self-end lg:self-start">
                <SolicitacaoSocialPanel links={config.linksSociais} />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-[1.35rem] border border-[var(--hub-border)] bg-white p-6 shadow-[0_16px_48px_-20px_rgba(15,40,64,0.1)] sm:p-8 lg:p-10"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
          <div className="sm:col-span-2 xl:col-span-3">
            <Label htmlFor="sp-nome">Seu nome completo *</Label>
            <Input
              id="sp-nome"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Informe o seu nome"
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="sp-tel">Celular *</Label>
            <Input
              id="sp-tel"
              required
              inputMode="numeric"
              value={formatBrPhoneDisplay(telefone)}
              onChange={(e) => setTelefone(brPhoneDigits(e.target.value))}
              placeholder="(11) 98765-4321"
              autoComplete="tel"
            />
          </div>
          <div>
            <Label htmlFor="sp-email">E-mail</Label>
            <Input
              id="sp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-3">
            <input
              id="sp-lem"
              type="checkbox"
              checked={lembrar}
              onChange={(e) => setLembrar(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="sp-lem" className="text-sm text-slate-700">
              Lembrar meus dados neste dispositivo
            </label>
          </div>
        </div>

        <div className="mt-6 border-t border-[var(--hub-border)] pt-2">
          <CotacaoDetalhesForm
            det={det}
            onToggleServico={toggleServico}
            onToggleComodidade={toggleComodidade}
            onPatch={patchDet}
            secoesAbertas
          />
        </div>

        <div className="mt-4">
          <Label htmlFor="sp-obs">Observações</Label>
          <Textarea
            id="sp-obs"
            className="mt-1"
            rows={4}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Preferências, restrições, ocasião da viagem…"
          />
        </div>

        {erroEnvio ? (
          <p className="mt-3 text-sm font-medium text-red-600">{erroEnvio}</p>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={enviando} className="min-w-[140px]">
            {enviando ? "Enviando…" : "Enviar solicitação"}
          </Button>
        </div>
      </form>

      <p className="mt-10 text-pretty text-xs text-slate-500 sm:text-sm lg:max-w-4xl">
        Envio seguro — seus dados são usados apenas para contato sobre este
        orçamento.
      </p>
    </div>
  );
}
