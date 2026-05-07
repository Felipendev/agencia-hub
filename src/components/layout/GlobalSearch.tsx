"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/contexts/data-context";
import { SearchIcon, XIcon } from "@/components/icons";
import type { Cliente, Cotacao, Atendimento } from "@/types";

type SearchResult = {
  type: "cliente" | "cotacao" | "atendimento";
  id: string;
  title: string;
  subtitle: string;
  link: string;
  data: Cliente | Cotacao | Atendimento;
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { clientes, cotacoes, atendimentos } = useData();
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
    }
  }, [open]);

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

    // Buscar atendimentos
    for (const a of atendimentos) {
      if (
        a.titulo.toLowerCase().includes(q) ||
        a.destino.toLowerCase().includes(q)
      ) {
        const cliente = clientes.find((c) => c.id === a.clienteId);
        list.push({
          type: "atendimento",
          id: a.id,
          title: a.titulo,
          subtitle: `${a.destino} · ${cliente?.nome || "—"}`,
          link: `/atendimentos`,
          data: a,
        });
      }
    }

    return list.slice(0, 20);
  }, [query, clientes, cotacoes, atendimentos]);

  function handleSelect(result: SearchResult) {
    router.push(result.link);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-mono text-slate-600 sm:inline">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[15vh]">
      <div className="w-full max-w-2xl rounded-xl border border-[var(--hub-border)] bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--hub-border)] px-4 py-3">
          <SearchIcon className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clientes, cotações, atendimentos..."
            className="flex-1 bg-transparent text-sm text-[var(--hub-blue-dark)] placeholder-slate-400 outline-none"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {query.trim() === "" ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Digite para buscar...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Nenhum resultado encontrado
            </div>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(r)}
                    className="flex w-full items-start gap-3 border-b border-[var(--hub-border)] px-4 py-3 text-left transition-colors hover:bg-slate-50 last:border-b-0"
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
                      {r.type === "cliente"
                        ? "Cliente"
                        : r.type === "cotacao"
                          ? "Cotação"
                          : "Atend."}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--hub-blue-dark)]">
                        {r.title}
                      </p>
                      <p className="text-sm text-slate-600">{r.subtitle}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[var(--hub-border)] px-4 py-2 text-xs text-slate-500">
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
            ESC
          </kbd>{" "}
          para fechar
        </div>
      </div>
    </div>
  );
}
