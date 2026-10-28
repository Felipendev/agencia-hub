"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import { saveBlob } from "@/lib/agenda/api";
import {
  historyApi,
  historyModules,
  historyOrigin,
  modulesFor,
  type HistoryFilters,
  type HistoryProduct,
  type HistoryResult,
} from "@/lib/activity-history";
import type { Cliente } from "@/types";

const zone = "America/Fortaleza";
function initial(product: HistoryProduct): HistoryFilters {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  const to = `${parts.year}-${parts.month}-${parts.day}`;
  const start = new Date(`${to}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 29);
  return {
    product,
    customerId: "",
    from: start.toISOString().slice(0, 10),
    to,
    modules: modulesFor(product),
  };
}
function validation(f: HistoryFilters) {
  const days = (Date.parse(f.to) - Date.parse(f.from)) / 86400000;
  return !f.from || !f.to || !Number.isFinite(days) || days < 0 || days >= 366
    ? "Escolha um período crescente de até 366 dias."
    : !f.modules.length
      ? "Selecione pelo menos um módulo."
      : "";
}
export function ActivityHistory({ product }: { product: HistoryProduct }) {
  const { token, isOwner } = useAuth();
  return token ? (
    <History
      key={`${token}:${product}`}
      token={token}
      product={product}
      owner={isOwner}
    />
  ) : (
    <p role="alert">Entre no sistema para consultar o histórico.</p>
  );
}
function History({
  token,
  product,
  owner,
}: {
  token: string;
  product: HistoryProduct;
  owner: boolean;
}) {
  const [draft, setDraft] = useState(() => initial(product));
  const [applied, setApplied] = useState<{
    filters: HistoryFilters;
    page: number;
  } | null>(() => ({ filters: initial(product), page: 0 }));
  const [result, setResult] = useState<HistoryResult | null>(null);
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false),
    [notice, setNotice] = useState("");
  const [people, setPeople] = useState<Cliente[]>([]),
    [peopleError, setPeopleError] = useState("");
  const [peopleLoading, setPeopleLoading] = useState(true),
    [peopleRetry, setPeopleRetry] = useState(0);
  const alive = useRef(true),
    exportPending = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    listCustomersRemote(token)
      .then((rows) => {
        if (active) {
          setPeople(rows);
          setPeopleLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setPeopleError("Não foi possível carregar as pessoas.");
          setPeopleLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [token, peopleRetry]);
  useEffect(() => {
    if (!applied) return;
    let active = true;
    historyApi
      .list(token, applied.filters, applied.page)
      .then((rows) => {
        if (active) {
          setResult(rows);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(
            e instanceof Error
              ? e.message
              : "Não foi possível consultar o histórico.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [token, applied]);
  function change(next: HistoryFilters) {
    setDraft(next);
    setApplied(null);
    setResult(null);
    setError("");
    setNotice("");
    setLoading(false);
  }
  function consult(page = 0) {
    const problem = validation(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setResult(null);
    setError("");
    setNotice("");
    setLoading(true);
    setApplied({ filters: { ...draft, modules: [...draft.modules] }, page });
  }
  async function exportCsv() {
    if (!applied || !result || !owner || exportPending.current) return;
    exportPending.current = true;
    setExporting(true);
    setError("");
    setNotice("");
    try {
      const blob = await historyApi.export(token, applied.filters);
      if (alive.current) {
        saveBlob(
          blob,
          `historico-${product.toLowerCase()}-${applied.filters.from}-${applied.filters.to}.csv`,
        );
        setNotice(
          "Arquivo gerado. O download contém os eventos de todas as páginas que atendem aos filtros.",
        );
      }
    } catch (e) {
      if (alive.current)
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível exportar. Tente novamente.",
        );
    } finally {
      exportPending.current = false;
      if (alive.current) setExporting(false);
    }
  }
  const productName = product === "MILES" ? "Milhas" : "Viagens";
  return (
    <section className="space-y-5">
      <PageHeader
        title={`Histórico de ${productName}`}
        description="Ações registradas nos módulos, reunidas por pessoa e período."
      >
        <Link
          href={product === "MILES" ? "/milhas" : "/viagens"}
          className="text-sm underline"
        >
          Voltar a {productName}
        </Link>
      </PageHeader>
      <p className="max-w-4xl text-sm text-[var(--hub-text-muted)]">
        O histórico é somente leitura. Corrija, cancele ou estorne no módulo de
        origem; os eventos já registrados são preservados. Esta consulta não
        reúne acessos ao sistema, conteúdos de atas, documentos nem valores
        financeiros.
      </p>
      <form
        className="space-y-4 rounded-xl border border-[var(--hub-border)] bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          consult();
        }}
      >
        <fieldset disabled={exporting} className="space-y-4">
          <legend className="font-semibold">
            Recorte da consulta · {productName}
          </legend>
          <div className="grid gap-4 md:grid-cols-3">
            <ClientePicker
              clientes={people}
              value={draft.customerId}
              label="Pessoa (opcional)"
              showNovoButton={false}
              loading={peopleLoading}
              loadError={peopleError}
              onRetryLoad={() => {
                setPeopleLoading(true);
                setPeopleError("");
                setPeopleRetry((v) => v + 1);
              }}
              onChange={(id) => change({ ...draft, customerId: id })}
            />
            <label className="text-sm">
              Data inicial
              <Input
                type="date"
                required
                value={draft.from}
                onChange={(e) => change({ ...draft, from: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Data final
              <Input
                type="date"
                required
                value={draft.to}
                onChange={(e) => change({ ...draft, to: e.target.value })}
              />
            </label>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Módulos</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {modulesFor(product).map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.modules.includes(m)}
                    onChange={(e) =>
                      change({
                        ...draft,
                        modules: e.target.checked
                          ? [...draft.modules, m]
                          : draft.modules.filter((x) => x !== m),
                      })
                    }
                  />
                  {historyModules[m]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">
              {loading ? "Atualizar consulta" : "Consultar histórico"}
            </Button>
            <p className="text-xs text-[var(--hub-text-muted)]">
              Dias inclusivos em Fortaleza · até 366 dias por consulta.
            </p>
          </div>
        </fieldset>
      </form>
      {error && (
        <div
          role="alert"
          className="space-y-2 rounded-lg border border-red-200 p-3 text-sm text-red-800"
        >
          <p>{error}</p>
          <Button
            onClick={() => consult(applied?.page ?? 0)}
            disabled={exporting}
          >
            Tentar consulta novamente
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className="rounded-lg border p-3 text-sm">
          {notice}
        </p>
      )}
      {loading && <p role="status">Carregando eventos…</p>}
      {!applied && !error && (
        <p role="status">
          Filtros alterados. Consulte para ver o novo resultado.
        </p>
      )}
      {result && applied && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Página {result.page + 1} · {result.events.length} evento(s) ·{" "}
              {applied.filters.from} a {applied.filters.to}
            </p>
            <Button
              variant="secondary"
              onClick={exportCsv}
              disabled={!owner || exporting}
            >
              {exporting
                ? "Gerando arquivo…"
                : "Exportar CSV com estes filtros"}
            </Button>
          </div>
          <p className="text-xs text-[var(--hub-text-muted)]">
            CSV: metadados de todas as páginas, até 5.000 eventos. Acima disso,
            reduza os filtros.{" "}
            {owner
              ? "Confira o recorte antes de exportar."
              : "Somente o dono da agência pode exportar."}
          </p>
          {!result.events.length ? (
            <p className="rounded-lg border p-6 text-sm">
              Nenhum evento encontrado neste recorte.
            </p>
          ) : (
            <ol className="divide-y rounded-xl border bg-white">
              {result.events.map((e) => (
                <li
                  key={`${e.module}:${e.id}`}
                  className="grid gap-3 p-4 md:grid-cols-[12rem_1fr_auto]"
                >
                  <time
                    dateTime={e.at}
                    className="text-sm text-[var(--hub-text-muted)]"
                  >
                    {new Date(e.at).toLocaleString("pt-BR", { timeZone: zone })}
                  </time>
                  <div className="min-w-0 space-y-1 text-sm">
                    <p className="font-semibold">
                      {historyModules[e.module]} ·{" "}
                      <span className="break-words">{e.action}</span>
                    </p>
                    <p className="break-all">Registro: {e.resourceId}</p>
                    <p className="break-words">Autor: {e.authorName}</p>
                    <p className="break-all text-xs text-[var(--hub-text-muted)]">
                      Evento: {e.id}
                      {e.customerId ? ` · Pessoa: ${e.customerId}` : ""}
                    </p>
                  </div>
                  <Link
                    href={historyOrigin(e, product)}
                    className="text-sm underline"
                  >
                    Abrir módulo de origem
                  </Link>
                </li>
              ))}
            </ol>
          )}
          <nav
            aria-label="Páginas do histórico"
            className="flex flex-wrap items-center gap-3"
          >
            <Button
              variant="secondary"
              disabled={result.page === 0 || exporting}
              onClick={() => consult(result.page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              disabled={!result.hasMore || result.page >= 49 || exporting}
              onClick={() => consult(result.page + 1)}
            >
              Próxima
            </Button>
            {result.hasMore && result.page >= 49 && (
              <p className="text-sm">
                Reduza os filtros para consultar os eventos restantes.
              </p>
            )}
          </nav>
        </div>
      )}
      <p className="text-xs text-[var(--hub-text-muted)]">
        Registros legados sem produto recuperável podem não aparecer. Versões
        removidas no módulo de origem não são reconstruídas. Um registro
        excluído pode continuar na auditoria, mas não abrir mais na origem.
        Autores antigos sem identificação comprovável não são deduzidos por
        e-mail.
      </p>
    </section>
  );
}
