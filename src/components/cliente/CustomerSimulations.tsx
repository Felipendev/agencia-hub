"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api/authenticated-fetch";
import { Button } from "@/components/ui/button";
import type { SavedSimulation } from "@/lib/accumulation-simulation";

/** Reading plans never enrolls a customer in a wallet or writes to CRM. */
export function CustomerSimulations({ customerId }: { customerId: string }) {
  const { token } = useAuth();
  const [retry, setRetry] = useState(0);
  const requestKey = `${token ?? ""}:${customerId}:${retry}`;
  const [view, setView] = useState<{
    key: string;
    rows: SavedSimulation[] | null;
    error: string;
  }>({ key: "", rows: null, error: "" });
  const rows = view.key === requestKey ? view.rows : null;
  const error = view.key === requestKey ? view.error : "";
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    apiFetch<SavedSimulation[]>(
      `/accumulation-simulations?customerId=${encodeURIComponent(customerId)}`,
      { signal: controller.signal },
      token,
    )
      .then((result) => {
        if (!controller.signal.aborted)
          setView({ key: requestKey, rows: result, error: "" });
      })
      .catch((e: Error) => {
        if (!controller.signal.aborted && e.name !== "AbortError")
          setView({ key: requestKey, rows: null, error: e.message });
      });
    return () => controller.abort();
  }, [token, customerId, requestKey]);
  return (
    <section
      className="space-y-3 rounded-xl border border-[var(--hub-border)] bg-white p-4"
      aria-label="Planos de acúmulo do cliente"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Planos de acúmulo</h2>
        <Link
          className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
          href={`/milhas/simulador?customerId=${encodeURIComponent(customerId)}`}
        >
          Novo plano para esta pessoa
        </Link>
      </div>
      <p className="text-xs text-[var(--hub-text-muted)]">
        Planos do simulador, sem alterar os saldos ou criar contas de milhas.
      </p>
      {error ? (
        <div role="alert">
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="secondary" onClick={() => setRetry((r) => r + 1)}>
            Tentar carregar planos
          </Button>
        </div>
      ) : !rows ? (
        <p role="status" className="text-sm">
          Carregando planos…
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[var(--hub-text-muted)]">
          Nenhum plano vinculado a esta pessoa.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--hub-border)]">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <h3 className="break-words font-medium">
                  {row.assumptions.title}
                </h3>
                <p className="text-sm text-[var(--hub-text-muted)]">
                  {row.assumptions.destination} · {row.assumptions.months} meses
                  · versão {row.version}
                </p>
              </div>
              <Link
                className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
                href={`/milhas/simulador?customerId=${encodeURIComponent(customerId)}&simulationId=${encodeURIComponent(row.id)}`}
              >
                Consultar ou editar plano
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
