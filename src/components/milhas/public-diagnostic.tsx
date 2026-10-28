"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DiagnosticFields } from "./diagnostic-fields";
import {
  diagnosticsApi,
  emptyDiagnostic,
  type PublicDiagnosticConfig,
} from "@/lib/miles-diagnostics";
export function PublicDiagnostic({ id }: { id: string }) {
  return <PublicForm key={id} id={id} />;
}
function PublicForm({ id }: { id: string }) {
  const [config, setConfig] = useState<PublicDiagnosticConfig | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [loading, setLoading] = useState(true);
  const [data, setData] = useState(emptyDiagnostic),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  const pending = useRef(false),
    key = useRef("");
  useEffect(() => {
    let active = true;
    diagnosticsApi
      .publicConfig(id)
      .then((c) => {
        if (active) {
          setConfig(c);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(
            "Este formulário está indisponível. Confira o link com a agência ou tente novamente.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id, retry]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending.current || !consent || !config) return;
    pending.current = true;
    setBusy(true);
    setError("");
    if (!key.current) key.current = crypto.randomUUID();
    try {
      await diagnosticsApi.submit(
        id,
        key.current,
        data,
        consent,
        config.consentVersion,
      );
      setDone(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível enviar. Seus dados continuam no formulário.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm font-medium">{config?.agencyName ?? "Milhas"}</p>
        <h1 className="text-2xl font-semibold">
          {config?.title ?? "Diagnóstico de Milhas"}
        </h1>
        <p className="whitespace-pre-wrap text-sm">{config?.introduction}</p>
      </header>
      {loading && <p role="status">Carregando formulário…</p>}
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {!loading && !config && (
        <Button
          onClick={() => {
            setLoading(true);
            setError("");
            setRetry((n) => n + 1);
          }}
        >
          Tentar novamente
        </Button>
      )}
      {done ? (
        <p role="status" className="rounded-lg border p-4">
          Diagnóstico enviado para revisão da agência. O envio não cria cadastro
          nem altera sua carteira automaticamente.
        </p>
      ) : (
        config && (
          <form
            onSubmit={submit}
            className="space-y-5 rounded-xl border bg-white p-5"
          >
            <fieldset disabled={busy} className="contents">
              <DiagnosticFields value={data} onChange={setData} />
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                Autorizo o uso destes dados pela agência para revisar meu
                diagnóstico de milhas e entrar em contato. O envio será guardado
                com suas revisões; não acessa minhas contas nos programas.
              </label>
              <p className="text-xs text-[var(--hub-text-muted)]">
                Consentimento: {config.consentVersion}. Para solicitar exclusão
                de dados, consulte a{" "}
                <Link href="/privacidade" className="underline">
                  política de privacidade
                </Link>
                .
              </p>
              <Button type="submit" disabled={!consent || busy}>
                {busy ? "Enviando…" : "Enviar para revisão"}
              </Button>
            </fieldset>
          </form>
        )
      )}
    </main>
  );
}
