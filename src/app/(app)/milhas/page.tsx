"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { apiFetch } from "@/lib/api/authenticated-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ClientePicker } from "@/components/cliente/ClientePicker";

export type MilesDirectoryEntry = {
  customerId: string;
  name: string;
  archived: boolean;
  accounts: number;
  cards: number;
  clubs: number;
  nextExpiry: string | null;
};
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");

export default function MilesDirectoryPage() {
  const { token } = useAuth();
  const { clientes, syncClientesFromApi } = useData();
  const router = useRouter();
  const [rows, setRows] = useState<MilesDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    Promise.all([
      apiFetch<MilesDirectoryEntry[]>(
        "/miles-wallets",
        { signal: controller.signal },
        token,
      ),
      syncClientesFromApi(),
    ])
      .then(([data]) => {
        if (active) setRows(data);
      })
      .catch((e: Error) => {
        if (active && e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [token, syncClientesFromApi, revision]);
  function refresh() {
    setLoading(true);
    setError("");
    setRevision((n) => n + 1);
  }
  const visible = rows.filter(
    (r) =>
      (showArchived || !r.archived) &&
      normalize(r.name).includes(normalize(query.trim())),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Milhas"
        description="Um espaço próprio para acompanhar pontos, cartões, clubes e metas de viagem."
      >
        <Link
          href="/milhas/simulador"
          className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--hub-bg-subtle)]"
        >
          Simulador de acúmulo
        </Link>
      </PageHeader>
      <p className="text-sm text-[var(--hub-text-secondary)]">
        As pessoas são as mesmas do cadastro da agência. Aqui você acompanha o
        produto de milhas; cotações e reservas ficam na área de Viagens.
      </p>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      <Card>
        <CardTitle>Abrir ou cadastrar um perfil de milhas</CardTitle>
        <p className="mt-1 text-sm text-[var(--hub-text-secondary)]">
          Selecione uma pessoa existente ou cadastre uma nova pessoa, sem
          duplicar seus dados entre os produtos.
        </p>
        <form
          className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (selected && !loading && !error)
              router.push(`/milhas/clientes/${selected}`);
          }}
        >
          <div className="w-full sm:max-w-lg">
            <ClientePicker
              id="miles-customer-picker"
              label="Pessoa do cadastro compartilhado"
              clientes={clientes}
              value={selected}
              onChange={setSelected}
              required
              disabled={loading || !!error}
              loading={loading}
              loadError={error || undefined}
              onRetryLoad={refresh}
            />
          </div>
          <Button type="submit" disabled={!selected || loading || !!error}>
            Abrir perfil de milhas
          </Button>
        </form>
      </Card>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Perfis e carteiras cadastrados</CardTitle>
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={refresh}
          >
            {loading ? "Carregando…" : "Atualizar lista"}
          </Button>
        </div>
        <div className="my-4 flex flex-wrap items-center gap-4">
          <label className="w-full max-w-sm space-y-1 text-sm">
            Buscar pessoa
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome da pessoa"
            />
          </label>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Mostrar também carteiras apenas arquivadas
          </label>
        </div>
        {loading ? (
          <p role="status" className="text-sm">
            Carregando os acompanhamentos de milhas…
          </p>
        ) : error ? (
          <p className="text-sm">
            A lista não pôde ser atualizada. Tente novamente.
          </p>
        ) : !visible.length ? (
          <p className="text-sm text-[var(--hub-text-secondary)]">
            {query || showArchived || rows.length
              ? "Nenhum perfil neste filtro."
              : "Nenhum acompanhamento de milhas cadastrado. Selecione uma pessoa acima para começar."}
          </p>
        ) : (
          <div className="divide-y divide-[var(--hub-border)]">
            {visible.map((row) => (
              <article
                key={row.customerId}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="min-w-0">
                  <h2 className="break-words font-semibold">{row.name}</h2>
                  <p className="text-sm text-[var(--hub-text-secondary)]">
                    {row.archived
                      ? "Dados arquivados"
                      : `${row.accounts} conta(s) · ${row.cards} cartão(ões) · ${row.clubs} clube(s)`}
                  </p>
                  {row.nextExpiry && (
                    <p className="text-xs text-[var(--hub-text-muted)]">
                      Próximo vencimento informado:{" "}
                      {row.nextExpiry.split("-").reverse().join("/")}
                    </p>
                  )}
                </div>
                <Link
                  href={`/milhas/clientes/${row.customerId}`}
                  className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
                >
                  Abrir carteira →
                </Link>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
