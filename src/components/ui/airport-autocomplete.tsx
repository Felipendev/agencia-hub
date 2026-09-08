"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";

type AirportSuggestion = { iata: string; city: string; name: string; country: string; label: string };

const DEFAULT_PLACEHOLDER = "Digite para buscar (mín. 2 caracteres)";

/**
 * Resultados por termo de busca (chave = termo em minúsculo já sem espaço nas pontas), compartilhado
 * por todos os campos da página. Digitar "port", apagar até "por" e digitar "port" de novo não repete
 * a chamada — cada termo só vai ao back uma vez por sessão da página (o conteúdo não muda em runtime).
 */
const searchCache = new Map<string, AirportSuggestion[]>();

type Props = {
  id?: string;
  /** Texto completo do campo, como guardado no state do formulário. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /**
   * O que buscar a partir do texto do campo. Por padrão é o texto inteiro; um campo que combina
   * origem e destino num só valor (ex.: "São Paulo — Porto") pode extrair só o trecho que o usuário
   * está digitando agora (o que vem depois do último "—"), sem perder o que já foi escolhido antes.
   */
  extractQuery?: (value: string) => string;
  /** Como reescrever o campo ao escolher uma sugestão. Por padrão substitui o valor inteiro. */
  applySelection?: (value: string, suggestion: AirportSuggestion) => string;
};

/**
 * Campo de cidade/aeroporto com autocomplete contra a nossa base própria (`GET /airports`).
 * Digite sigla IATA ou nome da cidade; o texto do campo continua livre (não trava numa opção),
 * então se a base não tiver o lugar o usuário ainda consegue digitar manualmente.
 */
export function AirportAutocomplete({
  id,
  value,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  className,
  extractQuery = (v) => v,
  applySelection = (_v, suggestion) => suggestion.label,
}: Props) {
  const { token } = useAuth();
  const [suggestions, setSuggestions] = useState<AirportSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL;
    const term = extractQuery(value).trim().toLowerCase();
    if (!base || !token || term.length < 2) {
      setSuggestions([]);
      return;
    }
    const cached = searchCache.get(term);
    if (cached) {
      setSuggestions(cached);
      setHighlighted(0);
      return;
    }
    const timer = setTimeout(() => {
      void fetch(`${base}/airports?q=${encodeURIComponent(term)}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => (response.ok ? response.json() : []))
        .then((rows: AirportSuggestion[]) => {
          searchCache.set(term, rows);
          setSuggestions(rows);
          setHighlighted(0);
        })
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- extractQuery/applySelection are stable per field, not reactive inputs
  }, [value, token]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(suggestion: AirportSuggestion) {
    onChange(applySelection(value, suggestion));
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (event.key === "Enter") {
      if (suggestions[highlighted]) {
        event.preventDefault();
        select(suggestions[highlighted]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white py-1 text-sm shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.iata}>
              <button
                type="button"
                className={`block w-full px-3 py-1.5 text-left ${index === highlighted ? "bg-[var(--hub-bg-subtle)] text-[var(--hub-blue-dark)]" : "text-[var(--hub-text-primary)]"}`}
                onMouseEnter={() => setHighlighted(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  select(suggestion);
                }}
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Extrai/reescreve só o trecho depois do último "—" — para campos "Origem — Destino" num valor só. */
export function lastSegmentAfterDash(value: string): string {
  const idx = value.lastIndexOf("—");
  return idx === -1 ? value : value.slice(idx + 1).trim();
}

export function applySelectionAfterDash(value: string, suggestion: AirportSuggestion): string {
  const idx = value.lastIndexOf("—");
  if (idx === -1) return `${suggestion.label} — `;
  return `${value.slice(0, idx + 1).trimEnd()} ${suggestion.label}`;
}
