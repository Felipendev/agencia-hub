"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
import { formatBRL, formatDateBR } from "@/lib/format";
import { ATENDIMENTO_STATUS_LABELS } from "@/lib/constants";
import type { AtendimentoStatus } from "@/types";

function AtendimentosContent() {
  const searchParams = useSearchParams();
  const clienteIdFromUrl = searchParams.get("clienteId") ?? "";
  const [clienteIdManual, setClienteIdManual] = useState("");
  const clienteId = clienteIdManual || clienteIdFromUrl;

  const { clientes, atendimentos, addAtendimento, isReady } = useData();

  const [titulo, setTitulo] = useState("");
  const [destino, setDestino] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");
  const [status, setStatus] = useState<AtendimentoStatus>("novo_lead");
  const [dataPrevista, setDataPrevista] = useState("");
  const [obs, setObs] = useState("");

  const nomePorId = useMemo(() => {
    const m = new Map<string, string>();
    clientes.forEach((c) => m.set(c.id, c.nome));
    return m;
  }, [clientes]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !titulo.trim() || !dataPrevista) return;
    const v = parseFloat(valorEstimado.replace(",", ".")) || 0;
    void addAtendimento({
      clienteId,
      titulo: titulo.trim(),
      destino: destino.trim() || "—",
      valorEstimado: v,
      status,
      dataPrevistaViagem: dataPrevista,
      observacoes: obs.trim(),
    });
    setTitulo("");
    setDestino("");
    setValorEstimado("");
    setStatus("novo_lead");
    setDataPrevista("");
    setObs("");
  }

  if (!isReady) {
    return <p className="text-sm text-slate-600">Carregando…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">
          Atendimentos
        </h1>
        <p className="mt-1 text-slate-600">
          Oportunidades e negociações vinculadas a clientes — funil do lead ao
          fechamento.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Cliente</Th>
                <Th>Título / Destino</Th>
                <Th>Status</Th>
                <Th>Viagem</Th>
                <Th className="text-right">Valor est.</Th>
              </tr>
            </thead>
            <tbody>
              {atendimentos.map((a) => (
                <tr key={a.id}>
                  <Td>
                    <Link
                      href={`/clientes/${a.clienteId}`}
                      className="font-medium text-[var(--hub-blue)] hover:underline"
                    >
                      {nomePorId.get(a.clienteId) ?? "—"}
                    </Link>
                  </Td>
                  <Td>
                    <div className="font-medium text-[var(--hub-blue-dark)]">
                      {a.titulo}
                    </div>
                    <div className="text-xs text-slate-500">{a.destino}</div>
                  </Td>
                  <Td>
                    <Badge tone="warning">
                      {ATENDIMENTO_STATUS_LABELS[a.status]}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {formatDateBR(a.dataPrevistaViagem)}
                  </Td>
                  <Td className="text-right font-medium tabular-nums">
                    {formatBRL(a.valorEstimado)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card className="h-fit">
          <CardTitle>Novo atendimento</CardTitle>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <ClientePicker
                id="cli"
                label="Cliente"
                clientes={clientes}
                value={clienteId}
                onChange={(id) => setClienteIdManual(id)}
                required
              />
            </div>
            <div>
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="destino">Destino</Label>
              <Input
                id="destino"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="valor">Valor estimado (R$)</Label>
              <Input
                id="valor"
                inputMode="decimal"
                placeholder="0,00"
                value={valorEstimado}
                onChange={(e) => setValorEstimado(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="st">Status</Label>
              <Select
                id="st"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as AtendimentoStatus)
                }
              >
                <option value="novo_lead">Novo lead</option>
                <option value="em_atendimento">Em atendimento</option>
                <option value="proposta_enviada">Proposta enviada</option>
                <option value="fechado">Fechado</option>
                <option value="cancelado">Cancelado</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="data">Data prevista da viagem</Label>
              <Input
                id="data"
                type="date"
                required
                value={dataPrevista}
                onChange={(e) => setDataPrevista(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Salvar atendimento
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function AtendimentosWithKey() {
  const searchParams = useSearchParams();
  const k = searchParams.get("clienteId") ?? "default";
  return <AtendimentosContent key={k} />;
}

export default function AtendimentosPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-600">Carregando…</p>}>
      <AtendimentosWithKey />
    </Suspense>
  );
}
