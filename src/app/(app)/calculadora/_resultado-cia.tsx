"use client";

import type { ResultadoCia } from "@/lib/calculadora-milhas";
import { fmtBRL } from "@/lib/calculadora-milhas";

type Props = {
  resultado: ResultadoCia;
  qtdPessoas: number;
  temMala: boolean;
  isMaisBarata?: boolean;
  isMaiorLucro?: boolean;
  corCia?: string;
};

export function ResultadoCiaCard({ resultado: r, qtdPessoas, temMala, corCia }: Props) {
  return (
    <div
      className="rounded-[var(--hub-radius-lg)] border-2 border-[var(--hub-border)] bg-white p-4"
      style={corCia ? { borderLeftColor: corCia, borderLeftWidth: "4px" } : {}}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3
            className="text-sm font-bold uppercase tracking-wide"
            style={{ color: corCia ?? "var(--hub-blue-dark)" }}
          >
            {r.label}
          </h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--hub-text-muted)]">Total grupo</p>
          <p className="text-xl font-bold text-[var(--hub-blue-dark)] tabular-nums">
            {fmtBRL(temMala ? r.precoTotalComMala : r.precoTotalSemMala)}
          </p>
        </div>
      </div>

      {/* Detalhes — o que o cliente ve */}
      <div className="mt-3 space-y-1.5 rounded-[var(--hub-radius)] bg-white/80 p-3 text-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--hub-text-muted)]">
          O que o cliente ve
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[var(--hub-text-secondary)]">Passagens ({qtdPessoas} pax)</span>
          <span className="font-semibold tabular-nums">{fmtBRL(r.precoTotalSemMala)}</span>
        </div>
        {r.totalMalas > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[var(--hub-text-secondary)]">Bagagens</span>
            <span className="font-semibold tabular-nums">{fmtBRL(r.totalMalas)}</span>
          </div>
        )}
        {r.totalMalas > 0 && (
          <div className="flex items-center justify-between border-t border-[var(--hub-border)] pt-1.5">
            <span className="font-semibold text-[var(--hub-text-primary)]">Total</span>
            <span className="font-bold tabular-nums text-[var(--hub-blue-dark)]">{fmtBRL(r.precoTotalComMala)}</span>
          </div>
        )}
      </div>

      {/* Detalhes internos (agencia) */}
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-[var(--hub-radius)] bg-white/60 p-2">
          <p className="text-[10px] uppercase text-[var(--hub-text-muted)]">Por pessoa</p>
          <p className="mt-0.5 font-semibold tabular-nums">{fmtBRL(r.precoPorPessoaSemMala)}</p>
        </div>
        <div className="rounded-[var(--hub-radius)] bg-white/60 p-2">
          <p className="text-[10px] uppercase text-[var(--hub-text-muted)]">Taxas</p>
          <p className="mt-0.5 font-semibold tabular-nums">{fmtBRL(r.detalhes.taxasPorPessoa)}</p>
        </div>
        <div className="rounded-[var(--hub-radius)] bg-emerald-50 p-2">
          <p className="text-[10px] uppercase text-emerald-600">Lucro total</p>
          <p className="mt-0.5 font-semibold tabular-nums text-emerald-700">{fmtBRL(r.lucroTotal)}</p>
        </div>
      </div>
    </div>
  );
}
