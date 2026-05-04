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
}: ClientePickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
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

  function pick(clienteId: string) {
    onChange(clienteId);
    setSearch("");
    setOpen(false);
  }

  function clearSelection() {
    onChange("");
    setSearch("");
    setOpen(false);
  }

  const q = search.trim();
  const showHintMinChars = q.length > 0 && q.length < CLIENTE_SEARCH_MIN_CHARS;
  const showResults =
    open && !disabled && q.length >= CLIENTE_SEARCH_MIN_CHARS;

  return (
    <>
      <div className="space-y-1">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Label htmlFor={selected && !disabled ? undefined : id} className="mb-0">
            {label}
            {required ? " *" : ""}
          </Label>
          {showNovoButton && !disabled ? (
            <Button
              type="button"
              variant="secondary"
              className="!py-1.5 text-xs"
              onClick={() => setModalOpen(true)}
            >
              Novo cliente
            </Button>
          ) : null}
        </div>

        {selected && !disabled ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[var(--hub-blue-dark)]">
                {selected.nome}
              </p>
              {selected.email ? (
                <p className="truncate text-xs text-slate-500">
                  {selected.email}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              className="!py-1 shrink-0 text-xs"
              onClick={clearSelection}
            >
              Trocar
            </Button>
          </div>
        ) : null}

        {selected && disabled ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            {selected.nome}
          </p>
        ) : null}

        {!selected && !disabled ? (
          <div ref={wrapRef} className="relative">
            <Input
              id={id}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Digite para buscar (mín. 2 caracteres)"
              autoComplete="off"
            />
            {showHintMinChars ? (
              <p className="mt-1 text-xs text-slate-500">
                Digite {CLIENTE_SEARCH_MIN_CHARS} ou mais caracteres para buscar.
              </p>
            ) : null}
            {showResults ? (
              <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-slate-500">
                    Nenhum cliente encontrado.
                  </li>
                ) : (
                  filtered.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                        onClick={() => pick(c.id)}
                      >
                        <span className="font-medium text-[var(--hub-blue-dark)]">
                          {c.nome}
                        </span>
                        {c.email ? (
                          <span className="ml-2 text-xs text-slate-500">
                            {c.email}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
        ) : null}

      </div>

      <NovoClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(c) => pick(c.id)}
      />
    </>
  );
}
