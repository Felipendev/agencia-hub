"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { useData } from "@/contexts/data-context";
import {
  calcular,
  fmtBRL,
  type CiaInput,
  type CompanhiaId,
  type ResultadoCalculadora,
} from "@/lib/calculadora-milhas";
import { FormCia } from "./_form-cia";
import { ResultadoCiaCard } from "./_resultado-cia";

// ─── Estado inicial de uma CIA ────────────────────────────────────────────────

function novaCia(cia: CompanhiaId = "LATAM"): CiaInput {
  return {
    cia,
    trecho: {
      tipo: "ida_volta",
      milhasIda: 0,
      milhasVolta: 0,
      custoPorMilheiro: 26,
      taxas: 0,
    },
    lucro: 0,
    valorMala: 0,
    qtdMalas: 0,
  };
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CalculadoraMilhasPage() {
  const { clientes } = useData();

  // Contexto da viagem
  const [clienteId, setClienteId] = useState("");
  const [qtdPessoas, setQtdPessoas] = useState(1);
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [dataIda, setDataIda] = useState("");
  const [dataVolta, setDataVolta] = useState("");

  // CIAs
  const [cias, setCias] = useState<CiaInput[]>([
    novaCia("LATAM"),
    novaCia("AZUL"),
    novaCia("GOL"),
  ]);

  // Resultado
  const [resultado, setResultado] = useState<ResultadoCalculadora | null>(null);

  function updateCia(index: number, value: CiaInput) {
    setCias((prev) => prev.map((c, i) => (i === index ? value : c)));
    // Recalcula em tempo real se ja tem resultado
    if (resultado) calcularAgora(cias.map((c, i) => (i === index ? value : c)));
  }

  function addCia() {
    const usadas = new Set(cias.map((c) => c.cia));
    const proxima =
      (["LATAM", "AZUL", "GOL", "TAP", "OUTRA"] as CompanhiaId[]).find(
        (c) => !usadas.has(c),
      ) ?? "OUTRA";
    setCias((prev) => [...prev, novaCia(proxima)]);
  }

  function removeCia(index: number) {
    setCias((prev) => prev.filter((_, i) => i !== index));
  }

  function calcularAgora(ciasInput = cias) {
    const r = calcular({ qtdPessoas, cias: ciasInput });
    setResultado(r);
  }

  const temMala = cias.some((c) => c.qtdMalas > 0 && c.valorMala > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">
          Calculadora de Milhas
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Compare opcoes de emissao por companhia e encontre o melhor preco para o cliente.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {/* Coluna esquerda: formulario */}
        <div className="space-y-4">
          {/* Contexto da viagem */}
          <Card>
            <CardTitle>Dados da viagem</CardTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <ClientePicker
                  id="calc-cliente"
                  label="Cliente (opcional)"
                  clientes={clientes}
                  value={clienteId}
                  onChange={setClienteId}
                />
              </div>
              <div>
                <Label htmlFor="calc-pessoas">Qtd. de pessoas</Label>
                <Input
                  id="calc-pessoas"
                  type="number"
                  min={1}
                  max={20}
                  value={qtdPessoas}
                  onChange={(e) =>
                    setQtdPessoas(Math.max(1, parseInt(e.target.value) || 1))
                  }
                />
              </div>
              <div>
                <Label htmlFor="calc-origem">Origem</Label>
                <Input
                  id="calc-origem"
                  placeholder="Ex: SSA, GRU, BSB"
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label htmlFor="calc-destino">Destino</Label>
                <Input
                  id="calc-destino"
                  placeholder="Ex: GRU, LIS, MIA"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label htmlFor="calc-ida">Data de ida</Label>
                <Input
                  id="calc-ida"
                  type="date"
                  value={dataIda}
                  onChange={(e) => setDataIda(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="calc-volta">Data de volta</Label>
                <Input
                  id="calc-volta"
                  type="date"
                  value={dataVolta}
                  onChange={(e) => setDataVolta(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* CIAs */}
          <div className="space-y-3">
            {cias.map((cia, i) => (
              <FormCia
                key={i}
                index={i}
                value={cia}
                onChange={(v) => updateCia(i, v)}
                onRemove={() => removeCia(i)}
                canRemove={cias.length > 1}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={addCia}
              disabled={cias.length >= 5}
            >
              + Adicionar CIA
            </Button>
            <Button
              type="button"
              onClick={() => calcularAgora()}
              disabled={qtdPessoas < 1}
            >
              Calcular
            </Button>
          </div>
        </div>

        {/* Coluna direita: resultados */}
        <div className="space-y-4">
          {resultado && resultado.resultados.length > 0 ? (
            <>
              {/* Resumo */}
              <Card>
                <CardTitle>Resumo</CardTitle>
                <div className="mt-3 space-y-1.5 text-sm">
                  {clienteId && (
                    <p className="text-slate-600">
                      <span className="font-medium">Cliente:</span>{" "}
                      {clientes.find((c) => c.id === clienteId)?.nome ?? "—"}
                    </p>
                  )}
                  <p className="text-slate-600">
                    <span className="font-medium">Rota:</span>{" "}
                    {origem || "—"} → {destino || "—"}
                  </p>
                  <p className="text-slate-600">
                    <span className="font-medium">Pessoas:</span> {qtdPessoas}
                  </p>
                  {dataIda && (
                    <p className="text-slate-600">
                      <span className="font-medium">Ida:</span>{" "}
                      {new Date(dataIda + "T12:00:00").toLocaleDateString("pt-BR")}
                      {dataVolta && (
                        <>
                          {" "}·{" "}
                          <span className="font-medium">Volta:</span>{" "}
                          {new Date(dataVolta + "T12:00:00").toLocaleDateString("pt-BR")}
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* Destaques */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {resultado.maisBarataSemMala && (
                    <div className="rounded-lg bg-emerald-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        Mais barata
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-emerald-900">
                        {resultado.resultados.find(
                          (r) => r.cia === resultado.maisBarataSemMala,
                        )?.label}
                      </p>
                      <p className="text-xs text-emerald-700">
                        {fmtBRL(
                          resultado.resultados.find(
                            (r) => r.cia === resultado.maisBarataSemMala,
                          )?.precoTotalSemMala ?? 0,
                        )}
                      </p>
                    </div>
                  )}
                  {resultado.maiorLucro && (
                    <div className="rounded-lg bg-amber-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        Maior lucro
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-amber-900">
                        {resultado.resultados.find(
                          (r) => r.cia === resultado.maiorLucro,
                        )?.label}
                      </p>
                      <p className="text-xs text-amber-700">
                        {fmtBRL(
                          resultado.resultados.find(
                            (r) => r.cia === resultado.maiorLucro,
                          )?.lucroTotal ?? 0,
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Cards por CIA */}
              {resultado.resultados.map((r) => (
                <ResultadoCiaCard
                  key={r.cia}
                  resultado={r}
                  qtdPessoas={qtdPessoas}
                  temMala={temMala}
                  isMaisBarata={r.cia === resultado.maisBarataSemMala}
                  isMaiorLucro={r.cia === resultado.maiorLucro}
                />
              ))}
            </>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl">✈️</div>
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Preencha os dados e clique em Calcular
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Os resultados aparecerao aqui comparando todas as CIAs
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
