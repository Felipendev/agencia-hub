"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  carregarTabelas,
  formatarFaixa,
  resetarTabelas,
  salvarTabelas,
  type CiaMilheiro,
  type FaixaMilheiro,
  type TabelasMilhas,
} from "@/lib/tabelas-milhas";
import { useToast } from "@/components/ui/toast";

// ─── Card de CIA ──────────────────────────────────────────────────────────────

function CiaCard({
  cia,
  onChange,
}: {
  cia: CiaMilheiro;
  onChange: (updated: CiaMilheiro) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [faixas, setFaixas] = useState<FaixaMilheiro[]>(cia.faixas);
  const [nome, setNome] = useState(cia.nome);

  function salvar() {
    onChange({ ...cia, nome, faixas });
    setEditando(false);
  }

  function cancelar() {
    setFaixas(cia.faixas);
    setNome(cia.nome);
    setEditando(false);
  }

  function updateFaixa(i: number, patch: Partial<FaixaMilheiro>) {
    setFaixas((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  function addFaixa() {
    const ultima = faixas[faixas.length - 1];
    const novoInicio = ultima ? ultima.ate + 1 : 0;
    setFaixas((prev) => [
      ...prev,
      { de: novoInicio, ate: 9999999, valorPorMilheiro: 0 },
    ]);
  }

  function removeFaixa(i: number) {
    if (faixas.length <= 1) return;
    setFaixas((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="rounded-xl border border-[var(--hub-border)] bg-white p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        {editando ? (
          <div className="flex items-center gap-2">
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-7 w-40 text-sm font-bold"
            />
            <input
              type="color"
              value={cia.cor ?? "#000000"}
              onChange={(e) => onChange({ ...cia, nome, faixas, cor: e.target.value })}
              className="h-7 w-8 cursor-pointer rounded border border-slate-200 p-0.5"
              title="Cor da CIA"
            />
          </div>
        ) : (
          <h3
            className="text-sm font-bold uppercase tracking-wide"
            style={{ color: cia.cor ?? "var(--hub-blue-dark)" }}
          >
            {cia.nome}
          </h3>
        )}
      </div>

      {/* Faixas */}
      <div className="mt-3 space-y-2">
        {editando ? (
          <>
            {faixas.map((f, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5 items-end">
                <div>
                  <p className="mb-0.5 text-[10px] text-slate-400">De (milhas)</p>
                  <Input
                    inputMode="numeric"
                    value={f.de}
                    onChange={(e) =>
                      updateFaixa(i, { de: parseInt(e.target.value.replace(/\D/g, "")) || 0 })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] text-slate-400">Ate (milhas)</p>
                  <Input
                    inputMode="numeric"
                    value={f.ate >= 9999999 ? "" : f.ate}
                    placeholder="sem limite"
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      updateFaixa(i, { ate: v ? parseInt(v) : 9999999 });
                    }}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] text-slate-400">R$/1000 milhas</p>
                  <Input
                    inputMode="decimal"
                    value={f.valorPorMilheiro || ""}
                    placeholder="0"
                    onChange={(e) =>
                      updateFaixa(i, {
                        valorPorMilheiro:
                          parseFloat(e.target.value.replace(",", ".")) || 0,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFaixa(i)}
                  disabled={faixas.length <= 1}
                  className="mb-0.5 h-8 w-8 rounded text-slate-400 hover:text-red-500 disabled:opacity-30"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addFaixa}
              className="mt-1 text-xs text-[var(--hub-blue)] hover:underline"
            >
              + Adicionar faixa
            </button>
          </>
        ) : (
          <div className="space-y-1">
            {cia.faixas.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{formatarFaixa(f)}</span>
                <span className="font-semibold tabular-nums text-[var(--hub-blue-dark)]">
                  R$ {f.valorPorMilheiro.toFixed(2).replace(".", ",")}
                  <span className="ml-1 font-normal text-slate-400">/1000</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botoes */}
      <div className="mt-3 border-t border-slate-100 pt-3">
        {editando ? (
          <div className="flex gap-2">
            <Button type="button" onClick={salvar} className="flex-1 !py-1.5 text-xs">
              Salvar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={cancelar}
              className="flex-1 !py-1.5 text-xs"
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="w-full rounded-lg border border-[var(--hub-border)] py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[var(--hub-blue)] hover:text-[var(--hub-blue)]"
          >
            Editar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PrecificarMilheiroPage() {
  const router = useRouter();
  const toast = useToast();
  const [tabelas, setTabelas] = useState<TabelasMilhas | null>(() => carregarTabelas());

  function updateCia(id: string, updated: CiaMilheiro) {
    if (!tabelas) return;
    const novas = { ...tabelas, cias: tabelas.cias.map((c) => (c.id === id ? updated : c)) };
    setTabelas(novas);
    salvarTabelas(novas);
    toast.success("Tabela salva!");
  }

  function addCia() {
    if (!tabelas) return;
    const nova: CiaMilheiro = {
      id: `cia-${Date.now()}`,
      nome: "Nova CIA",
      faixas: [{ de: 0, ate: 9999999, valorPorMilheiro: 0 }],
    };
    const novas = { ...tabelas, cias: [...tabelas.cias, nova] };
    setTabelas(novas);
    salvarTabelas(novas);
  }

  function handleReset() {
    const padrao = resetarTabelas();
    setTabelas(padrao);
    toast.success("Tabelas restauradas para os valores padrao.");
  }

  if (!tabelas) {
    return <p className="text-sm text-slate-500">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">
            Precificar Milheiro
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Defina o valor de cada 1.000 milhas por companhia e faixa de quantidade.
            Esses valores sao usados automaticamente na calculadora.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-[var(--hub-border)] px-3 py-2 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700"
          >
            Restaurar padrao
          </button>
          <Button
            type="button"
            onClick={() => router.push("/calculadora")}
            className="gap-2"
          >
            Calcular passagem
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Grid de CIAs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tabelas.cias.map((cia) => (
          <CiaCard
            key={cia.id}
            cia={cia}
            onChange={(updated) => updateCia(cia.id, updated)}
          />
        ))}

        {/* Botao adicionar */}
        <button
          type="button"
          onClick={addCia}
          className="flex min-h-[120px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 transition-colors hover:border-[var(--hub-blue)] hover:text-[var(--hub-blue)]"
        >
          + Adicionar CIA
        </button>
      </div>

      {/* Tabela de bagagens */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-[var(--hub-blue-dark)]">
          Taxas de bagagem nacional (R$ por mala)
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--hub-border)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--hub-border)] bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">CIA</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Antes</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Check-in</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Aeroporto</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Depois 48h</th>
              </tr>
            </thead>
            <tbody>
              {tabelas.bagagens.map((b, i) => (
                <tr
                  key={b.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                >
                  <td className="px-4 py-3 font-medium text-[var(--hub-blue-dark)]">
                    {b.nome}
                  </td>
                  {(["antes", "checkin", "aeroporto", "depois48h"] as const).map(
                    (campo) => (
                      <td key={campo} className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={b.bagagem[campo]}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const novas: TabelasMilhas = {
                              ...tabelas,
                              bagagens: tabelas.bagagens.map((bg) =>
                                bg.id === b.id
                                  ? { ...bg, bagagem: { ...bg.bagagem, [campo]: val } }
                                  : bg,
                              ),
                            };
                            setTabelas(novas);
                            salvarTabelas(novas);
                          }}
                          className="w-20 rounded border border-transparent bg-transparent px-1 py-0.5 text-right text-sm tabular-nums text-slate-800 focus:border-[var(--hub-blue)] focus:bg-white focus:outline-none"
                        />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Clique em qualquer valor para editar. Salvo automaticamente.
        </p>
      </div>
    </div>
  );
}
