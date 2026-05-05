"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { useData } from "@/contexts/data-context";
import {
  calcular,
  fmtBRL,
  LUCRO_CONFIG_PADRAO,
  type CiaInput,
  type LucroConfig,
  type ResultadoCalculadora,
} from "@/lib/calculadora-milhas";
import {
  carregarTabelas,
  getValorMilheiro,
  type TabelasMilhas,
} from "@/lib/tabelas-milhas";
import { ResultadoCiaCard } from "./_resultado-cia";

type TipoTrecho = "ida_volta" | "so_ida" | "preco_unico";

type OpcaoVoo = {
  id: string;
  nome: string;
  ciaId: string;
  horarioSaida: string;
  horarioChegada: string;
  conexoes: string;
  milhasIda: number;
  milhasVolta: number;
  tipoTrecho: TipoTrecho;
  taxas: number;
  valorMala: number;
  qtdMalas: number;
  lucroConfig: LucroConfig;
  selecionada: boolean;
};

function novaOpcao(ciaId: string, nome: string, idx: number): OpcaoVoo {
  return {
    id: `op-${Date.now()}-${idx}`,
    nome: nome || `Opcao ${idx + 1}`,
    ciaId,
    horarioSaida: "",
    horarioChegada: "",
    conexoes: "",
    milhasIda: 0,
    milhasVolta: 0,
    tipoTrecho: "ida_volta",
    taxas: 0,
    valorMala: 0,
    qtdMalas: 0,
    lucroConfig: { ...LUCRO_CONFIG_PADRAO },
    selecionada: true,
  };
}

function opcaoToCiaInput(op: OpcaoVoo, tabelas: TabelasMilhas): CiaInput {
  const cia = tabelas.cias.find((c) => c.id === op.ciaId);
  const milhasTotal = op.tipoTrecho === "ida_volta" ? op.milhasIda + op.milhasVolta : op.milhasIda;
  const custoPorMilheiro = cia ? getValorMilheiro(cia, milhasTotal) : 0;
  return {
    cia: "OUTRA",
    nomeCustom: op.nome,
    trecho: {
      tipo: op.tipoTrecho,
      milhasIda: op.milhasIda,
      milhasVolta: op.milhasVolta,
      custoPorMilheiro,
      taxas: op.taxas,
    },
    lucroConfig: op.lucroConfig,
    valorMala: op.valorMala,
    qtdMalas: op.qtdMalas,
  };
}

function OpcaoVooForm({
  opcao, tabelas, onChange, onRemove, canRemove,
}: {
  opcao: OpcaoVoo;
  tabelas: TabelasMilhas;
  onChange: (v: OpcaoVoo) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  function set(patch: Partial<OpcaoVoo>) { onChange({ ...opcao, ...patch }); }

  const cia = tabelas.cias.find((c) => c.id === opcao.ciaId);
  const milhasTotal = opcao.tipoTrecho === "ida_volta" ? opcao.milhasIda + opcao.milhasVolta : opcao.milhasIda;
  const milheiroSugerido = cia ? getValorMilheiro(cia, milhasTotal) : 0;

  return (
    <div
      className={`rounded-xl border-2 bg-white p-4 transition-all ${opcao.selecionada ? "border-[var(--hub-blue)]" : "border-[var(--hub-border)] opacity-60"}`}
      style={cia?.cor ? { borderLeftColor: cia.cor, borderLeftWidth: "4px" } : {}}
    >
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={opcao.selecionada}
          onChange={(e) => set({ selecionada: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 accent-[var(--hub-blue)]"
          title="Incluir na cotacao" />
        {/* Nome colorido da CIA como prefixo */}
        {cia?.cor && (
          <span
            className="shrink-0 text-xs font-bold uppercase tracking-wide"
            style={{ color: cia.cor }}
          >
            {cia.nome}
          </span>
        )}
        <Input value={opcao.nome} onChange={(e) => set({ nome: e.target.value })}
          placeholder="Ex: Direto manha" className="h-8 flex-1 text-sm font-semibold" />
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-red-400 hover:text-red-600">
            Remover
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Companhia</Label>
          <Select value={opcao.ciaId} onChange={(e) => set({ ciaId: e.target.value })}>
            {tabelas.cias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
        </div>
        <div>
          <Label>Trecho</Label>
          <Select value={opcao.tipoTrecho} onChange={(e) => set({ tipoTrecho: e.target.value as TipoTrecho })}>
            <option value="ida_volta">Ida e volta</option>
            <option value="preco_unico">I+V preco unico</option>
            <option value="so_ida">So ida</option>
          </Select>
        </div>
        <div>
          <Label>Saida / Chegada</Label>
          <div className="flex gap-1">
            <Input placeholder="06:00" value={opcao.horarioSaida} onChange={(e) => set({ horarioSaida: e.target.value })} className="text-sm" />
            <Input placeholder="14:30" value={opcao.horarioChegada} onChange={(e) => set({ horarioChegada: e.target.value })} className="text-sm" />
          </div>
        </div>
        <div>
          <Label>Conexoes</Label>
          <Input placeholder="Direto / 1 escala GRU" value={opcao.conexoes} onChange={(e) => set({ conexoes: e.target.value })} className="text-sm" />
        </div>
        <div>
          <Label>{opcao.tipoTrecho === "preco_unico" ? "Milhas (I+V)" : "Milhas ida"}</Label>
          <Input inputMode="numeric" placeholder="Ex: 12000" value={opcao.milhasIda || ""}
            onChange={(e) => set({ milhasIda: parseInt(e.target.value.replace(/\D/g, "")) || 0 })} />
        </div>
        {opcao.tipoTrecho === "ida_volta" && (
          <div>
            <Label>Milhas volta</Label>
            <Input inputMode="numeric" placeholder="Ex: 12000" value={opcao.milhasVolta || ""}
              onChange={(e) => set({ milhasVolta: parseInt(e.target.value.replace(/\D/g, "")) || 0 })} />
          </div>
        )}
        <div>
          <Label>Taxas (R$)</Label>
          <Input inputMode="decimal" placeholder="Ex: 31.73" value={opcao.taxas || ""}
            onChange={(e) => set({ taxas: parseFloat(e.target.value.replace(",", ".")) || 0 })} />
        </div>
        <div>
          <Label>Mala (R$)</Label>
          <Input inputMode="decimal" placeholder="Ex: 130" value={opcao.valorMala || ""}
            onChange={(e) => set({ valorMala: parseFloat(e.target.value.replace(",", ".")) || 0 })} />
        </div>
        <div>
          <Label>Qtd. malas</Label>
          <Input inputMode="numeric" placeholder="0" value={opcao.qtdMalas || ""}
            onChange={(e) => set({ qtdMalas: parseInt(e.target.value.replace(/\D/g, "")) || 0 })} />
        </div>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Lucro</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={opcao.lucroConfig.usarPct}
              onChange={(e) => set({ lucroConfig: { ...opcao.lucroConfig, usarPct: e.target.checked } })}
              className="accent-[var(--hub-blue)]" />
            <span className="text-slate-600">%</span>
            <Input inputMode="decimal" value={opcao.lucroConfig.pct}
              onChange={(e) => set({ lucroConfig: { ...opcao.lucroConfig, pct: parseFloat(e.target.value.replace(",", ".")) || 0 } })}
              disabled={!opcao.lucroConfig.usarPct} className="h-7 w-16 text-xs" />
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={opcao.lucroConfig.usarFixo}
              onChange={(e) => set({ lucroConfig: { ...opcao.lucroConfig, usarFixo: e.target.checked } })}
              className="accent-[var(--hub-blue)]" />
            <span className="text-slate-600">R$ fixo</span>
            <Input inputMode="decimal" value={opcao.lucroConfig.fixo || ""}
              onChange={(e) => set({ lucroConfig: { ...opcao.lucroConfig, fixo: parseFloat(e.target.value.replace(",", ".")) || 0 } })}
              disabled={!opcao.lucroConfig.usarFixo} className="h-7 w-20 text-xs" />
          </label>
          {milheiroSugerido > 0 && (
            <span className="text-[10px] text-slate-400">Milheiro: R${milheiroSugerido}/1000</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CalculadoraMilhasPage() {
  const router = useRouter();
  const { clientes } = useData();
  const [tabelas, setTabelas] = useState<TabelasMilhas | null>(null);
  const [clienteId, setClienteId] = useState("");
  const [qtdPessoas, setQtdPessoas] = useState(1);
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [dataIda, setDataIda] = useState("");
  const [dataVolta, setDataVolta] = useState("");
  const [opcoes, setOpcoes] = useState<OpcaoVoo[]>([]);
  const [resultado, setResultado] = useState<ResultadoCalculadora | null>(null);

  useEffect(() => {
    const t = carregarTabelas();
    setTabelas(t);
    if (t.cias.length > 0) {
      setOpcoes([
        novaOpcao(t.cias[0].id, `${t.cias[0].nome} — Opcao 1`, 0),
        novaOpcao(t.cias[1]?.id ?? t.cias[0].id, `${t.cias[1]?.nome ?? t.cias[0].nome} — Opcao 2`, 1),
      ]);
    }
  }, []);

  function updateOpcao(idx: number, v: OpcaoVoo) {
    setOpcoes((prev) => prev.map((o, i) => (i === idx ? v : o)));
  }
  function addOpcao() {
    if (!tabelas) return;
    const cia = tabelas.cias[0];
    setOpcoes((prev) => [...prev, novaOpcao(cia.id, `${cia.nome} — Opcao ${prev.length + 1}`, prev.length)]);
  }
  function removeOpcao(idx: number) {
    setOpcoes((prev) => prev.filter((_, i) => i !== idx));
  }
  function calcularAgora() {
    if (!tabelas) return;
    const sel = opcoes.filter((o) => o.selecionada);
    if (sel.length === 0) return;
    const r = calcular({ qtdPessoas, cias: sel.map((o) => opcaoToCiaInput(o, tabelas)) });
    setResultado(r);
  }

  const temMala = opcoes.some((o) => o.qtdMalas > 0 && o.valorMala > 0);
  const selecionadas = opcoes.filter((o) => o.selecionada);

  if (!tabelas) return <p className="text-sm text-slate-500">Carregando...</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">Calculadora de Milhas</h1>
          <p className="mt-0.5 text-sm text-slate-500">Compare opcoes de voo e gere o comparativo para o cliente.</p>
        </div>
        <Link href="/calculadora/milheiro"
          className="rounded-lg border border-[var(--hub-border)] px-3 py-2 text-xs font-medium text-slate-600 hover:border-[var(--hub-blue)] hover:text-[var(--hub-blue)]">
          Precificar milheiro
        </Link>
      </div>

      {/* Barra de filtros */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-auto sm:flex-1">
            <ClientePicker id="calc-cliente" label="Cliente" clientes={clientes} value={clienteId} onChange={setClienteId} />
          </div>
          <div className="w-20">
            <Label htmlFor="calc-pax">Pax</Label>
            <Input id="calc-pax" type="number" min={1} max={20} value={qtdPessoas}
              onChange={(e) => setQtdPessoas(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
          <div className="w-24">
            <Label htmlFor="calc-orig">Origem</Label>
            <Input id="calc-orig" placeholder="SSA" value={origem} onChange={(e) => setOrigem(e.target.value.toUpperCase())} />
          </div>
          <div className="w-24">
            <Label htmlFor="calc-dest">Destino</Label>
            <Input id="calc-dest" placeholder="GRU" value={destino} onChange={(e) => setDestino(e.target.value.toUpperCase())} />
          </div>
          <div>
            <Label htmlFor="calc-ida">Ida</Label>
            <Input id="calc-ida" type="date" value={dataIda} onChange={(e) => setDataIda(e.target.value)} className="w-36" />
          </div>
          <div>
            <Label htmlFor="calc-volta">Volta</Label>
            <Input id="calc-volta" type="date" value={dataVolta} onChange={(e) => setDataVolta(e.target.value)} className="w-36" />
          </div>
          <Button type="button" onClick={calcularAgora} disabled={selecionadas.length === 0}>
            Calcular
          </Button>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
        {/* Opcoes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Opcoes de voo
              <span className="ml-2 text-xs font-normal text-slate-400">(marque as que deseja incluir na cotacao)</span>
            </p>
            <button type="button" onClick={addOpcao}
              className="text-xs font-medium text-[var(--hub-blue)] hover:underline">
              + Adicionar opcao
            </button>
          </div>
          {opcoes.map((op, i) => (
            <OpcaoVooForm key={op.id} opcao={op} tabelas={tabelas}
              onChange={(v) => updateOpcao(i, v)} onRemove={() => removeOpcao(i)} canRemove={opcoes.length > 1} />
          ))}
        </div>

        {/* Resultados */}
        <div className="space-y-3">
          {resultado && resultado.resultados.length > 0 ? (
            <>
              <Card>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-[var(--hub-blue-dark)]">
                    {origem && destino ? `${origem} -> ${destino}` : "Comparativo"}
                  </p>
                  {clienteId && <p className="text-slate-500">{clientes.find((c) => c.id === clienteId)?.nome}</p>}
                  <p className="text-slate-500">
                    {qtdPessoas} passageiro{qtdPessoas > 1 ? "s" : ""}
                    {dataIda && ` · ${new Date(dataIda + "T12:00:00").toLocaleDateString("pt-BR")}`}
                    {dataVolta && ` -> ${new Date(dataVolta + "T12:00:00").toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {resultado.maisBarataSemMala && (
                    <div className="rounded-lg bg-emerald-50 p-2.5">
                      <p className="text-[10px] font-bold uppercase text-emerald-700">Mais barata</p>
                      <p className="mt-0.5 text-sm font-semibold text-emerald-900">
                        {resultado.resultados.find((r) => r.cia === resultado.maisBarataSemMala)?.label}
                      </p>
                      <p className="text-xs text-emerald-700">
                        {fmtBRL(resultado.resultados.find((r) => r.cia === resultado.maisBarataSemMala)?.precoTotalSemMala ?? 0)}
                      </p>
                    </div>
                  )}
                  {resultado.maiorLucro && (
                    <div className="rounded-lg bg-amber-50 p-2.5">
                      <p className="text-[10px] font-bold uppercase text-amber-700">Maior lucro</p>
                      <p className="mt-0.5 text-sm font-semibold text-amber-900">
                        {resultado.resultados.find((r) => r.cia === resultado.maiorLucro)?.label}
                      </p>
                      <p className="text-xs text-amber-700">
                        {fmtBRL(resultado.resultados.find((r) => r.cia === resultado.maiorLucro)?.lucroTotal ?? 0)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
              {resultado.resultados.map((r, i) => (
                <ResultadoCiaCard key={i} resultado={r} qtdPessoas={qtdPessoas} temMala={temMala}
                  isMaisBarata={r.cia === resultado.maisBarataSemMala}
                  isMaiorLucro={r.cia === resultado.maiorLucro}
                  corCia={tabelas.cias.find((c) => opcoes.find((o) => o.selecionada && o.nome === r.label)?.ciaId === c.id)?.cor}
                />
              ))}
            </>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-3xl">✈️</p>
                <p className="mt-3 text-sm font-medium text-slate-600">Preencha as opcoes e clique em Calcular</p>
                <p className="mt-1 text-xs text-slate-400">Apenas as opcoes marcadas serao calculadas</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
