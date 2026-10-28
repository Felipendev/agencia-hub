"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { DiagnosticFields } from "./diagnostic-fields";
import {
  diagnosticsApi,
  emptyDiagnostic,
  type DiagnosticConfig,
  type DiagnosticSummary,
} from "@/lib/miles-diagnostics";
export function DiagnosticDirectory() {
  const { token, isOwner } = useAuth();
  return token ? (
    <Directory key={token} token={token} owner={isOwner} />
  ) : (
    <p role="alert">Entre no sistema para consultar os diagnósticos.</p>
  );
}
function Directory({ token, owner }: { token: string; owner: boolean }) {
  const [rows, setRows] = useState<DiagnosticSummary[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [config, setConfig] = useState<DiagnosticConfig | null | undefined>(
      undefined,
    ),
    [query, setQuery] = useState(""),
    [archived, setArchived] = useState(false),
    [creating, setCreating] = useState(false),
    [draft, setDraft] = useState(emptyDiagnostic),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const pending = useRef(false),
    key = useRef("");
  useEffect(() => {
    let active = true;
    Promise.all([diagnosticsApi.list(token), diagnosticsApi.config(token)])
      .then(([r, c]) => {
        if (active) {
          setRows(r);
          setConfig(c);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(
            "Não foi possível carregar a fila e o link. Tente novamente.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [token, retry]);
  const refresh = () => {
    setLoading(true);
    setError("");
    setRetry((n) => n + 1);
  };
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    if (!key.current) key.current = crypto.randomUUID();
    try {
      const entry = await diagnosticsApi.create(token, key.current, draft);
      setRows((current) => [
        {
          id: entry.id,
          name: entry.data.name,
          email: entry.data.email,
          version: entry.version,
          archived: false,
          incorporated: false,
          createdAt: entry.createdAt,
        },
        ...current.filter((r) => r.id !== entry.id),
      ]);
      setCreating(false);
      setNotice("Diagnóstico criado para revisão, sem atualizar a carteira.");
      setDraft(emptyDiagnostic());
      key.current = "";
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível criar o diagnóstico.",
      );
    } finally {
      setBusy(false);
      pending.current = false;
    }
  }
  return (
    <div className="space-y-5">
      <PageHeader
        title="Diagnósticos de Milhas"
        description="Revise as declarações antes de incorporá-las à carteira."
      >
        <Link href="/milhas" className="text-sm underline">
          Voltar a Milhas
        </Link>
        <Button onClick={() => setCreating(true)}>Novo diagnóstico</Button>
      </PageHeader>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {loading ? (
        <p role="status">Carregando diagnósticos…</p>
      ) : (
        <Button variant="secondary" disabled={busy} onClick={refresh}>
          Atualizar lista e link
        </Button>
      )}
      {config !== undefined && (
        <ConfigEditor
          key={`${config?.version ?? 0}`}
          token={token}
          owner={owner}
          config={config}
          onSaved={(c) => {
            setConfig(c);
            setNotice("Configuração do link confirmada pela API.");
          }}
        />
      )}
      {creating && (
        <form
          onSubmit={create}
          className="space-y-4 rounded-xl border bg-white p-5"
        >
          <h2 className="font-semibold">Novo diagnóstico interno</h2>
          <p className="text-sm">
            Registro manual da agência; não representa consentimento de um envio
            público. Criar não incorpora dados à carteira.
          </p>
          <fieldset className="contents" disabled={busy}>
            <DiagnosticFields internal value={draft} onChange={setDraft} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                {busy ? "Criando…" : "Criar diagnóstico"}
              </Button>
              <Button variant="secondary" onClick={() => setCreating(false)}>
                Fechar formulário
              </Button>
            </div>
          </fieldset>
        </form>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Buscar pessoa ou e-mail
          <Input value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
          />
          Incluir arquivados
        </label>
      </div>
      {!loading &&
        !error &&
        rows.filter(
          (r) =>
            (archived || !r.archived) &&
            `${r.name} ${r.email}`
              .toLocaleLowerCase()
              .includes(query.toLocaleLowerCase()),
        ).length === 0 && (
          <p className="text-sm">
            Nenhum diagnóstico encontrado. Você pode criar um registro ou
            compartilhar o link habilitado.
          </p>
        )}
      <ul className="divide-y rounded-xl border bg-white">
        {rows
          .filter(
            (r) =>
              (archived || !r.archived) &&
              `${r.name} ${r.email}`
                .toLocaleLowerCase()
                .includes(query.toLocaleLowerCase()),
          )
          .map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0 break-words">
                <h2 className="font-medium">{r.name}</h2>
                <p className="text-sm text-[var(--hub-text-muted)]">
                  {r.email}
                </p>
                <p className="text-xs">
                  {r.incorporated ? "Incorporado" : "Aguardando revisão"}
                  {r.archived ? " · Arquivado" : ""} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Link
                className="text-sm underline"
                href={`/milhas/diagnosticos/${r.id}`}
              >
                Revisar diagnóstico
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
function ConfigEditor({
  token,
  owner,
  config,
  onSaved,
}: {
  token: string;
  owner: boolean;
  config: DiagnosticConfig | null;
  onSaved: (c: DiagnosticConfig) => void;
}) {
  const [title, setTitle] = useState(config?.title ?? "Diagnóstico de Milhas"),
    [intro, setIntro] = useState(
      config?.introduction ??
        "Conte seus objetivos e quais contas, cartões e clubes utiliza. A agência revisará os dados antes de atualizar sua carteira.",
    ),
    [enabled, setEnabled] = useState(config?.enabled ?? false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const pending = useRef(false);
  async function run(revoke: boolean) {
    if (pending.current) return;
    if (
      revoke &&
      !window.confirm(
        "Revogar o link atual? Ele deixará de funcionar; os diagnósticos recebidos serão preservados. Para voltar a receber, habilite e compartilhe o novo link.",
      )
    )
      return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const saved = revoke
        ? await diagnosticsApi.revoke(token, config!.version)
        : await diagnosticsApi.configure(token, {
            title,
            introduction: intro,
            enabled,
            expectedVersion: config?.version ?? 0,
          });
      onSaved(saved);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível atualizar o link.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const url =
    config?.enabled && typeof window !== "undefined"
      ? `${window.location.origin}/diagnostico-milhas/${config.token}`
      : "";
  return (
    <section className="space-y-3 rounded-xl border bg-white p-5">
      <h2 className="font-semibold">Link público do diagnóstico</h2>
      <p className="text-sm">
        {config?.enabled
          ? "Habilitado. Quem receber o link pode enviar declarações, sem consultar dados da agência."
          : "Desabilitado. Nenhum envio público será aceito."}
      </p>
      {url && (
        <>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block break-all text-sm underline"
          >
            {url}
          </a>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setNotice("Link copiado.");
              } catch {
                setError("Não foi possível copiar. Selecione o link acima.");
              }
            }}
          >
            Copiar link público
          </Button>
        </>
      )}
      {owner && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(false);
          }}
          className="space-y-3"
        >
          <fieldset disabled={busy} className="contents">
            <label className="block text-sm">
              Título do formulário
              <Input
                required
                maxLength={160}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Introdução
              <textarea
                className="block w-full rounded-lg border p-2 text-sm"
                maxLength={1000}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
              />
            </label>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Habilitar recebimento público
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                {busy ? "Salvando…" : "Salvar configuração do link"}
              </Button>
              {config && (
                <Button variant="danger" onClick={() => run(true)}>
                  Revogar link
                </Button>
              )}
            </div>
          </fieldset>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
    </section>
  );
}
