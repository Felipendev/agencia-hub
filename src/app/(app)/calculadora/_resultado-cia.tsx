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

export function ResultadoCiaCard({
  resultado: r,
  qtdPessoas,
  temMala,
  isMaisBarata,
  isMaiorLucro,
}: Props) {
  const destaque = isMaisBarata || isMaiorLucro;

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all ${
        destaque
          ? "border-[var(--hub-blue)] bg-blue-50 shadow-md"
          : "border-[var(--hub-border)] bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[var(--hub-blue-dark)]">
            {r.label}
          </h3>
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
          <p className="text-xs text-slate-500">Total do grupo</p>
          <p className="text-xl font-bold text-[var(--hub-blue-dark)] tabular-nums">
            {fmtBRL(temMala ? r.precoTotalComMala : r.precoTotalSemMala)}
          </p>
        </div>
      </div>

      {/* Detalhes */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div className="rounded-lg bg-white/70 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Por pessoa
          </p>
          <p className="mt-0.5 font-semibold tabular-nums text-slate-800">
            {fmtBRL(
              temMala ? r.precoPorPessoaComMala : r.precoPorPessoaSemMala,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-white/70 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Taxas
          </p>
          <p className="mt-0.5 font-semibold tabular-nums text-slate-800">
            {fmtBRL(r.detalhes.taxasPorPessoa)}
          </p>
        </div>

        <div className="rounded-lg bg-white/70 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Lucro total
          </p>
          <p className="mt-0.5 font-semibold tabular-nums text-emerald-700">
            {fmtBRL(r.lucroTotal)}
          </p>
        </div>

        {temMala && (
          <div className="rounded-lg bg-white/70 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Total malas
            </p>
            <p className="mt-0.5 font-semibold tabular-nums text-slate-800">
              {fmtBRL(r.detalhes.totalMalas)}
            </p>
          </div>
        )}
      </div>

      {/* Linha de precos sem/com mala */}
      {temMala && (
        <div className="mt-3 flex gap-4 border-t border-slate-200 pt-3 text-xs text-slate-500">
          <span>
            Sem mala:{" "}
            <strong className="text-slate-700">
              {fmtBRL(r.precoTotalSemMala)}
            </strong>
          </span>
          <span>
            Com mala:{" "}
            <strong className="text-slate-700">
              {fmtBRL(r.precoTotalComMala)}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
