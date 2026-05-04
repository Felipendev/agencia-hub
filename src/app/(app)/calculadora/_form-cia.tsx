"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  COMPANHIAS,
  TABELA_MILHEIRO,
  type CiaInput,
  type CompanhiaId,
  type TipoTrecho,
} from "@/lib/calculadora-milhas";

type Props = {
  index: number;
  value: CiaInput;
  onChange: (v: CiaInput) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export function FormCia({ index, value, onChange, onRemove, canRemove }: Props) {
  function set(patch: Partial<CiaInput>) {
    onChange({ ...value, ...patch });
  }
  function setTrecho(patch: Partial<CiaInput["trecho"]>) {
    onChange({ ...value, trecho: { ...value.trecho, ...patch } });
  }

  const sugestoesMilheiro = TABELA_MILHEIRO[value.cia] ?? [];

  return (
    <div className="rounded-xl border border-[var(--hub-border)] bg-white p-4">
      {/* Header da CIA */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[var(--hub-blue-dark)]">
          CIA {index + 1}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Remover
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {/* Companhia */}
        <div>
          <Label htmlFor={`cia-${index}`}>Companhia</Label>
          <Select
            id={`cia-${index}`}
            value={value.cia}
            onChange={(e) => {
              const cia = e.target.value as CompanhiaId;
              const primeiroMilheiro = TABELA_MILHEIRO[cia]?.[0]?.valor ?? 20;
              set({ cia, trecho: { ...value.trecho, custoPorMilheiro: primeiroMilheiro } });
            }}
          >
            {COMPANHIAS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Nome custom se OUTRA */}
        {value.cia === "OUTRA" && (
          <div>
            <Label htmlFor={`cia-nome-${index}`}>Nome da CIA</Label>
            <Input
              id={`cia-nome-${index}`}
              placeholder="Ex: American Airlines"
              value={value.nomeCustom ?? ""}
              onChange={(e) => set({ nomeCustom: e.target.value })}
            />
          </div>
        )}

        {/* Tipo de trecho */}
        <div>
          <Label htmlFor={`tipo-${index}`}>Tipo de trecho</Label>
          <Select
            id={`tipo-${index}`}
            value={value.trecho.tipo}
            onChange={(e) => setTrecho({ tipo: e.target.value as TipoTrecho })}
          >
            <option value="ida_volta">Ida e volta (separado)</option>
            <option value="preco_unico">Ida e volta (preco unico)</option>
            <option value="so_ida">So ida</option>
          </Select>
        </div>

        {/* Custo do milheiro */}
        <div>
          <Label htmlFor={`milheiro-${index}`}>R$ por milheiro</Label>
          <div className="flex gap-2">
            <Input
              id={`milheiro-${index}`}
              inputMode="decimal"
              placeholder="Ex: 26"
              value={value.trecho.custoPorMilheiro || ""}
              onChange={(e) =>
                setTrecho({
                  custoPorMilheiro: parseFloat(e.target.value.replace(",", ".")) || 0,
                })
              }
            />
          </div>
          {/* Sugestoes da tabela */}
          {sugestoesMilheiro.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {sugestoesMilheiro.map((s) => (
                <button
                  key={s.valor}
                  type="button"
                  onClick={() => setTrecho({ custoPorMilheiro: s.valor })}
                  className={`rounded border px-1.5 py-0.5 text-[10px] transition-colors ${
                    value.trecho.custoPorMilheiro === s.valor
                      ? "border-[var(--hub-blue)] bg-[var(--hub-blue)] text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[var(--hub-blue)] hover:text-[var(--hub-blue)]"
                  }`}
                >
                  R${s.valor} — {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Milhas ida */}
        <div>
          <Label htmlFor={`milhas-ida-${index}`}>
            {value.trecho.tipo === "preco_unico"
              ? "Milhas (total I+V)"
              : "Milhas ida"}
          </Label>
          <Input
            id={`milhas-ida-${index}`}
            inputMode="numeric"
            placeholder="Ex: 12000"
            value={value.trecho.milhasIda || ""}
            onChange={(e) =>
              setTrecho({ milhasIda: parseInt(e.target.value.replace(/\D/g, "")) || 0 })
            }
          />
        </div>

        {/* Milhas volta (apenas ida_volta) */}
        {value.trecho.tipo === "ida_volta" && (
          <div>
            <Label htmlFor={`milhas-volta-${index}`}>Milhas volta</Label>
            <Input
              id={`milhas-volta-${index}`}
              inputMode="numeric"
              placeholder="Ex: 12000"
              value={value.trecho.milhasVolta || ""}
              onChange={(e) =>
                setTrecho({ milhasVolta: parseInt(e.target.value.replace(/\D/g, "")) || 0 })
              }
            />
          </div>
        )}

        {/* Taxas */}
        <div>
          <Label htmlFor={`taxas-${index}`}>Taxas aeroportuarias (R$)</Label>
          <Input
            id={`taxas-${index}`}
            inputMode="decimal"
            placeholder="Ex: 31.73"
            value={value.trecho.taxas || ""}
            onChange={(e) =>
              setTrecho({ taxas: parseFloat(e.target.value.replace(",", ".")) || 0 })
            }
          />
        </div>

        {/* Lucro */}
        <div>
          <Label htmlFor={`lucro-${index}`}>Lucro por pessoa (R$)</Label>
          <Input
            id={`lucro-${index}`}
            inputMode="decimal"
            placeholder="Ex: 150"
            value={value.lucro || ""}
            onChange={(e) =>
              set({ lucro: parseFloat(e.target.value.replace(",", ".")) || 0 })
            }
          />
        </div>
      </div>

      {/* Malas */}
      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Bagagem despachada (opcional)
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`mala-valor-${index}`}>Valor por mala (R$)</Label>
            <Input
              id={`mala-valor-${index}`}
              inputMode="decimal"
              placeholder="Ex: 130"
              value={value.valorMala || ""}
              onChange={(e) =>
                set({ valorMala: parseFloat(e.target.value.replace(",", ".")) || 0 })
              }
            />
          </div>
          <div>
            <Label htmlFor={`mala-qtd-${index}`}>Qtd. de malas</Label>
            <Input
              id={`mala-qtd-${index}`}
              inputMode="numeric"
              placeholder="0"
              value={value.qtdMalas || ""}
              onChange={(e) =>
                set({ qtdMalas: parseInt(e.target.value.replace(/\D/g, "")) || 0 })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
