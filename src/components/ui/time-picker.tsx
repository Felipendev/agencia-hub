"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

/** Gera horarios de 00:00 a 23:55 em intervalos de 5 min */
function gerarHorarios(): string[] {
  const h: string[] = [];
  for (let hora = 0; hora < 24; hora++) {
    for (let min = 0; min < 60; min += 5) {
      h.push(`${String(hora).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }
  }
  return h;
}

const HORARIOS = gerarHorarios();

export function TimePicker({ value, onChange, placeholder = "00:00", className = "", id }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Scroll para o horario selecionado ao abrir
  useEffect(() => {
    if (open && listRef.current && value) {
      const idx = HORARIOS.indexOf(value);
      if (idx >= 0) {
        const item = listRef.current.children[idx] as HTMLElement;
        item?.scrollIntoView({ block: "center" });
      }
    }
  }, [open, value]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        className="w-full rounded-lg border border-[var(--hub-border)] bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[var(--hub-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--hub-blue)]"
        autoComplete="off"
      />

      {open && (
        <div
          ref={listRef}
          className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--hub-border)] bg-white shadow-lg"
        >
          {HORARIOS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => {
                onChange(h);
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-sm transition-colors ${
                h === value
                  ? "bg-[var(--hub-blue)] text-white font-medium"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
