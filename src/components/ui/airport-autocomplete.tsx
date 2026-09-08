"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";

type AirportSuggestion = { iata: string; city: string; name: string; country: string; label: string };

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

/**
 * Campo de cidade/aeroporto com autocomplete contra a nossa base própria (`GET /airports`).
 * Digite sigla IATA ou nome da cidade; o texto do campo continua livre (não trava numa opção),
 * então se a base não tiver o lugar o usuário ainda consegue digitar manualmente.
 */
export function AirportAutocomplete({ id, value, onChange, placeholder, className }: Props) {
  const { token } = useAuth();
  const [suggestions, setSuggestions] = useState<AirportSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL;
    const term = value.trim();
    if (!base || !token || term.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Clearing stale suggestions when the query becomes too short
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      void fetch(`${base}/airports?q=${encodeURIComponent(term)}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => (response.ok ? response.json() : []))
        .then((rows: AirportSuggestion[]) => {
          setSuggestions(rows);
          setHighlighted(0);
        })
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [value, token]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(suggestion: AirportSuggestion) {
    onChange(suggestion.label);
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
