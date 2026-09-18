"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CLIENTE_SEARCH_MIN_CHARS,
  filterClientesForPicker,
} from "@/lib/cliente-search";
import type { Cliente } from "@/types";
import { NovoClienteModal } from "./NovoClienteModal";

export type ClientePickerProps = {
  clientes: Cliente[];
  value: string;
  onChange: (clienteId: string) => void;
  label?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  showNovoButton?: boolean;
  invalid?: boolean;
  loading?: boolean;
  loadError?: string;
  onRetryLoad?: () => void;
};

export function ClientePicker({
  clientes,
  value,
  onChange,
  label = "Cliente",
  id = "cliente-picker",
  required = false,
  disabled = false,
  showNovoButton = true,
  invalid = false,
  loading = false,
  loadError,
  onRetryLoad,
}: ClientePickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => clientes.find((c) => c.id === value),
    [clientes, value],
  );

  const filtered = useMemo(
    () => filterClientesForPicker(clientes, search),
    [clientes, search],
  );

  useEffect(() => {
    function handlePointer(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, []);

  useEffect(() => {
    inputRef.current?.setCustomValidity(required && !selected ? "Selecione um cliente nos resultados da busca." : "");
  }, [required, selected, search]);

  function pick(clienteId: string) {
    onChange(clienteId);
    setSearch("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function clearSelection() {
    onChange("");
    setSearch("");
    setOpen(true);
    setHighlighted(0);
    inputRef.current?.focus();
  }

  const q = search.trim();
  const effectiveInvalid = invalid || (required && value !== "" && !selected);
  const showHintMinChars = q.length > 0 && q.length < CLIENTE_SEARCH_MIN_CHARS;
  const showResults = open && !selected && !disabled && (q.length === 0 || q.length >= CLIENTE_SEARCH_MIN_CHARS);

  return (
    <>
      <div className="space-y-1">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Label htmlFor={id} className="mb-0">
            {label}
            {required ? <span aria-hidden="true" className="text-red-600"> *</span> : null}
          </Label>
          {showNovoButton && !disabled ? (
            <Button
              type="button"
              variant="secondary"
              className="!py-1.5 text-xs"
              onClick={() => setModalOpen(true)}
            >
              Nova pessoa
            </Button>
          ) : null}
        </div>

        <div ref={wrapRef} className="relative">
          <Input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showResults}
            aria-controls={`${id}-results`}
            aria-activedescendant={showResults && filtered[highlighted] ? `${id}-option-${highlighted}` : undefined}
            aria-describedby={`${id}-hint${effectiveInvalid ? ` ${id}-error` : ""}`}
            aria-invalid={effectiveInvalid || undefined}
            required={required}
            disabled={disabled}
            value={selected ? selected.nome : search}
            className={`${selected ? "pr-20" : ""} ${effectiveInvalid ? "!border-red-500 !ring-1 !ring-red-200 focus:border-red-600 focus:ring-red-200" : ""}`.trim()}
            onChange={(event) => {
              if (value) onChange("");
              setSearch(event.target.value);
              setHighlighted(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") { event.preventDefault(); setOpen(false); return; }
              if (event.key === "Enter" && !selected) {
                event.preventDefault();
                if (showResults && filtered[highlighted]) pick(filtered[highlighted].id);
                return;
              }
              if ((event.key === "ArrowDown" || event.key === "ArrowUp") && filtered.length) {
                event.preventDefault();
                setOpen(true);
                setHighlighted((h) => Math.max(0, Math.min(filtered.length - 1, h + (event.key === "ArrowDown" ? 1 : -1))));
              }
            }}
            placeholder="Busque por nome, e-mail ou telefone"
            autoComplete="off"
          />
          {selected && !disabled && <button type="button" className="absolute right-3 top-2 text-sm" onClick={clearSelection}>Trocar</button>}
          <p id={`${id}-hint`} className="mt-1 text-xs text-[var(--hub-text-muted)]" role="status">
            {loading ? "Carregando pessoas cadastradas…" : selected ? selected.email || selected.telefone : showHintMinChars
              ? `Digite ${CLIENTE_SEARCH_MIN_CHARS} ou mais caracteres para buscar.`
              : showResults && filtered.length === 0 ? "Nenhuma pessoa cadastrada encontrada." : "Selecione uma pessoa cadastrada ou busque por nome, e-mail ou telefone."}
          </p>
          {effectiveInvalid ? <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-600" role="alert">{label} é obrigatório.</p> : null}
          {loadError ? <div className="mt-1 flex items-center gap-2 text-xs text-red-600" role="alert"><span>{loadError}</span>{onRetryLoad ? <button type="button" className="font-semibold underline" onClick={onRetryLoad}>Tentar novamente</button> : null}</div> : null}
          {showResults && filtered.length > 0 && (
            <ul id={`${id}-results`} role="listbox" aria-label="Clientes encontrados" className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white py-1 shadow-lg">
              {filtered.map((c, index) => (
                <li key={c.id} id={`${id}-option-${index}`} role="option" aria-selected={index === highlighted}
                  className={`cursor-pointer px-3 py-2 text-sm ${index === highlighted ? "bg-[var(--hub-bg-subtle)]" : ""}`}
                  onMouseEnter={() => setHighlighted(index)}
                  onMouseDown={(event) => { event.preventDefault(); pick(c.id); }}>
                  <span className="font-medium text-[var(--hub-blue-dark)]">{c.nome}</span>
                  <span className="ml-2 text-xs text-[var(--hub-text-muted)]">{c.email || c.telefone}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      <NovoClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(c) => pick(c.id)}
      />
    </>
  );
}
