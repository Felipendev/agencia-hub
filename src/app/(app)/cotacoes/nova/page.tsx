"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { emptyCotacaoDetalhes } from "@/lib/cotacao-defaults";
import { Button } from "@/components/ui/button";
import { CotacaoDetalhesForm } from "@/components/cotacao/CotacaoDetalhesForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { BackButton } from "@/components/ui/back-button";
import type { CotacaoDetalhes } from "@/types";

export default function NovaCotacaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { clientes, addCotacao, isReady } = useData();

  const [clienteId, setClienteId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [validade, setValidade] = useState("");
  const [tags, setTags] = useState("");
  const [prioridade, setPrioridade] = useState(false);
  const [responsavel, setResponsavel] = useState(user?.nome ?? "");
  const [observacoes, setObservacoes] = useState("");
  const [det, setDet] = useState<CotacaoDetalhes>(() => emptyCotacaoDetalhes());

  useEffect(() => {
    const fromUrl = searchParams.get("clienteId");
    if (fromUrl && !clienteId) {
      setClienteId(fromUrl);
    }
  }, [searchParams, clienteId]);

  function toggleServico(id: string) {
    setDet((d) => {
      const set = new Set(d.servicosDesejados);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...d, servicosDesejados: [...set] };
    });
  }

  function toggleComodidade(label: string) {
    setDet((d) => {
      const set = new Set(d.comodidadesHospedagem);
      if (set.has(label)) set.delete(label);
      else set.add(label);
      return { ...d, comodidadesHospedagem: [...set] };
    });
  }

  function patchDet(patch: Partial<CotacaoDetalhes>) {
    setDet((d) => ({ ...d, ...patch }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !titulo.trim() || !validade) return;
    const v = parseFloat(valorTotal.replace(",", ".")) || 0;
    const tagList = tags
      .split(/[#,]/g)
      .map((t) => t.trim())
      .filter(Boolean);
    const trechosDestino =
      det.destinosTrechos.filter((x) => x.trim()).join(" · ") ||
      det.destinoForm.trim() ||
      "";

    const novo = await addCotacao({
      clienteId,
      titulo: titulo.trim(),
      destino: trechosDestino || "—",
      valorTotal: v,
      moeda: "BRL",
      status: "aguardando",
      validade,
      dataInicioViagem: det.dataIda || undefined,
      dataFimViagem: det.dataVolta || undefined,
      observacoes: observacoes.trim(),
      detalhes: {
        ...det,
        destinoForm: trechosDestino || det.destinoForm,
      },
      tags: tagList,
      prioridade,
      responsavel: responsavel.trim() || "Equipe",
    });
    router.push(`/cotacoes/${novo.id}`);
  }

  if (!isReady) {
    return <p className="text-sm text-slate-600">Carregando…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-[92rem] space-y-8 px-1 sm:px-0">
      <div>
        <BackButton href="/cotacoes" label="Cotações" />
        <h1 className="mt-4 text-2xl font-bold text-[var(--hub-blue-dark)] sm:text-3xl">
          Nova cotação
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600 sm:text-base">
          Mesma largura e estilo de leitura do formulário público enviado ao
          cliente — preencha com calma.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[1.35rem] border border-[var(--hub-border)] bg-white p-6 shadow-[0_16px_48px_-20px_rgba(15,40,64,0.1)] sm:p-8 lg:p-10"
      >
        <details open className="group border-b border-[var(--hub-border)] py-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--hub-blue-dark)]">
            Identificação e resumo
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            <div className="sm:col-span-2 xl:col-span-3">
              <ClientePicker
                id="nova-cli"
                label="Cliente"
                clientes={clientes}
                value={clienteId}
                onChange={(id) => {
                  setClienteId(id);
                }}
                required
              />
            </div>
            <div className="sm:col-span-2 xl:col-span-3">
              <Label htmlFor="nova-tit">Título *</Label>
              <Input
                id="nova-tit"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="nova-val">Valor total (R$)</Label>
              <Input
                id="nova-val"
                inputMode="decimal"
                placeholder="0"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="nova-venc">Validade da proposta *</Label>
              <Input
                id="nova-venc"
                type="date"
                required
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="nova-resp">Responsável</Label>
              <Input
                id="nova-resp"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 xl:col-span-2">
              <Label htmlFor="nova-tags">Tags (# separadas por vírgula)</Label>
              <Input
                id="nova-tags"
                placeholder="Europa, Lua de mel"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-3">
              <input
                id="nova-prio"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={prioridade}
                onChange={(e) => setPrioridade(e.target.checked)}
              />
              <label htmlFor="nova-prio" className="text-sm text-slate-700">
                Marcar como prioridade
              </label>
            </div>
          </div>
        </details>

        <CotacaoDetalhesForm
          det={det}
          onToggleServico={toggleServico}
          onToggleComodidade={toggleComodidade}
          onPatch={patchDet}
        />

        <div className="py-4">
          <Label htmlFor="nova-obs">Observações internas</Label>
          <Textarea
            id="nova-obs"
            className="mt-1"
            placeholder="Notas para a equipe…"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--hub-border)] pt-4">
          <Link
            href="/cotacoes"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--hub-blue-muted)] bg-white px-4 py-2.5 text-sm text-[var(--hub-blue)] transition-colors hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <Button type="submit">Criar cotação</Button>
        </div>
      </form>
    </div>
  );
}
