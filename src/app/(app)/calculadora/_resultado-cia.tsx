"use client";

import type { ResultadoCia } from "@/lib/calculadora-milhas";
import { fmtBRL } from "@/lib/calculadora-milhas";

type Props = {
  resultado: ResultadoCia;
  qtdPessoas: number;
  temMala: boolean;
  isMaisBarata: boolean;
  isMaiorLucro: boolean;
};

export function ResultadoCiaCard({ resultado: r, qtdPessoas, temMala, isMaisBarata, isMaiorLucro }: Props) {
  const destaque = isMaisBarata || isMaiorLucro;

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${destaque ? "border-[var(--hub-blue)] bg-blue-50 shadow-md" : "border-[var(--hub-border)] bg-white"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[var(--hub-blue-dark)]">{r.label}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {isMaisBarata && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                Mais barata
              </span>
            )}
            {isMaiorLucro && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                Maior lucro
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400">Total grupo</p>
          <p className="text-xl font-bold text-[var(--hub-blue-dark)] tabular-nums">
            {fmtBRL(temMala ? r.precoTotalComMala : r.precoTotalSemMala)}
          </p>
        </div>
      </div>

      {/* Detalhes — o que o cliente ve */}
      <div className="mt-3 space-y-1.5 rounded-lg bg-white/80 p-3 text-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          O que o cliente ve
        </p>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Passagens ({qtdPessoas} pax)</span>
          <span className="font-semibold tabular-nums">{fmtBRL(r.precoTotalSemMala)}</span>
        </div>
        {r.totalMalas > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Bagagens</span>
            <span className="font-semibold tabular-nums">{fmtBRL(r.totalMalas)}</span>
          </div>
        )}
        {r.totalMalas > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span className="font-semibold text-slate-700">Total</span>
            <span className="font-bold tabular-nums text-[var(--hub-blue-dark)]">{fmtBRL(r.precoTotalComMala)}</span>
          </div>
        )}
      </div>

      {/* Detalhes internos (agencia) */}
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-white/60 p-2">
          <p className="text-[10px] uppercase text-slate-400">Por pessoa</p>
          <p className="mt-0.5 font-semibold tabular-nums">{fmtBRL(r.precoPorPessoaSemMala)}</p>
        </div>
        <div className="rounded-lg bg-white/60 p-2">
          <p className="text-[10px] uppercase text-slate-400">Taxas</p>
          <p className="mt-0.5 font-semibold tabular-nums">{fmtBRL(r.detalhes.taxasPorPessoa)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2">
          <p className="text-[10px] uppercase text-emerald-600">Lucro total</p>
          <p className="mt-0.5 font-semibold tabular-nums text-emerald-700">{fmtBRL(r.lucroTotal)}</p>
        </div>
      </div>
    </div>
  );
}
