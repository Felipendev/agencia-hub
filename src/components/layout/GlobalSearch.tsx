"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { SearchIcon, XIcon } from "@/components/icons";
import type { Cliente, Cotacao } from "@/types";

type TripHit = { id: string; customerName: string; bookingLocator: string | null; serviceType: string };

type SearchResult = {
  type: "cliente" | "cotacao" | "viagem";
  id: string;
  title: string;
  subtitle: string;
  link: string;
  data: Cliente | Cotacao | TripHit;
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [trips, setTrips] = useState<TripHit[]>([]);
  const { token } = useAuth();
  const { clientes, cotacoes } = useData();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Resetting query when modal closes
      setQuery("");
      setTrips([]);
    }
  }, [open]);

  // Viagens não fazem parte do data-context local; buscamos direto na API, com debounce.
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL;
    const term = query.trim();
    if (!open || !base || !token || term.length < 2) {
      setTrips([]);
      return;
    }
    const timer = setTimeout(() => {
      void fetch(`${base}/trips?locator=${encodeURIComponent(term)}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => response.ok ? response.json() : [])
        .then((rows: TripHit[]) => setTrips(rows))
        .catch(() => setTrips([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open, token]);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const list: SearchResult[] = [];

    // Buscar clientes
    for (const c of clientes) {
      if (
        c.nome.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.telefone.includes(q) ||
        c.destinoInteresse.toLowerCase().includes(q)
      ) {
        list.push({
          type: "cliente",
          id: c.id,
          title: c.nome,
          subtitle: `${c.email || c.telefone} · ${c.destinoInteresse}`,
          link: `/clientes/${c.id}`,
          data: c,
        });
      }
    }

    // Buscar cotações
    for (const cot of cotacoes) {
      if (
        cot.titulo.toLowerCase().includes(q) ||
        cot.destino.toLowerCase().includes(q) ||
        cot.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        const cliente = clientes.find((c) => c.id === cot.clienteId);
        list.push({
          type: "cotacao",
          id: cot.id,
          title: cot.titulo,
          subtitle: `${cot.destino} · ${cliente?.nome || "—"}`,
          link: `/cotacoes/${cot.id}`,
          data: cot,
        });
      }
    }

    // Viagens (busca por localizador, feita no servidor — ver efeito acima)
    for (const trip of trips) {
      list.push({
        type: "viagem",
        id: trip.id,
        title: trip.bookingLocator || trip.serviceType,
        subtitle: `${trip.serviceType} · ${trip.customerName}`,
        link: `/viagens/${trip.id}`,
        data: trip,
      });
    }

    return list.slice(0, 20);
  }, [query, clientes, cotacoes, trips]);

  function handleSelect(result: SearchResult) {
    router.push(result.link);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 py-1.5 text-sm text-[var(--hub-text-muted)] transition-colors hover:border-[var(--hub-border)] hover:text-[var(--hub-text-primary)]"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden rounded border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-1.5 py-0.5 text-xs font-mono text-[var(--hub-text-secondary)] sm:inline">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[15vh]">
      <div className="w-full max-w-2xl rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--hub-border)] px-4 py-3">
          <SearchIcon className="h-5 w-5 text-[var(--hub-text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clientes, cotações e localizador de viagem..."
            className="flex-1 bg-transparent text-sm text-[var(--hub-blue-dark)] placeholder-slate-400 outline-none"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-[var(--hub-text-muted)] transition-colors hover:bg-[var(--hub-bg-subtle)] hover:text-[var(--hub-text-secondary)]"
            aria-label="Fechar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {query.trim() === "" ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--hub-text-muted)]">
              Digite para buscar...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--hub-text-muted)]">
              Nenhum resultado encontrado
            </div>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(r)}
                    className="flex w-full items-start gap-3 border-b border-[var(--hub-border)] px-4 py-3 text-left transition-colors hover:bg-[var(--hub-bg-subtle)] last:border-b-0"
                  >
                    <span
                      className={`mt-0.5 rounded px-2 py-0.5 text-xs font-semibold ${
                        r.type === "cliente"
                          ? "bg-blue-100 text-blue-700"
                          : r.type === "cotacao"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {r.type === "cliente" ? "Cliente" : r.type === "cotacao" ? "Cotação" : "Viagem"}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--hub-blue-dark)]">
                        {r.title}
                      </p>
                      <p className="text-sm text-[var(--hub-text-secondary)]">{r.subtitle}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[var(--hub-border)] px-4 py-2 text-xs text-[var(--hub-text-muted)]">
          <kbd className="rounded border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-1.5 py-0.5 font-mono">
            ESC
          </kbd>{" "}
          para fechar
        </div>
      </div>
    </div>
  );
}
