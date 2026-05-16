"use client";

import { useState, useEffect, useMemo } from "react";
import { useData } from "@/contexts/data-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { XIcon } from "@/components/icons";
import { COTACAO_STATUS_LABELS } from "@/lib/constants";
import { SERVICOS_DESEJADOS_OPTIONS } from "@/lib/cotacao-options";
import { formatBRL } from "@/lib/format";
import type { Cotacao, CotacaoStatus } from "@/types";

// Funil principal (sem arquivo)
const FUNIL_STEPS: { id: CotacaoStatus; label: string; color: string }[] = [
  { id: "aguardando",        label: "Aguardando",         color: "bg-[var(--hub-text-muted)]" },
  { id: "em_cotacao",        label: "Em cotação",          color: "bg-amber-400" },
  { id: "aguardando_cliente",label: "Aguard. cliente",     color: "bg-sky-500"   },
  { id: "aprovado",          label: "Aprovado",            color: "bg-emerald-500"},
  { id: "reprovado",         label: "Reprovado",           color: "bg-red-500"   },
];

type Tab = "geral" | "viagem" | "passageiros" | "observacoes";

const TABS: { id: Tab; label: string }[] = [
  { id: "geral",       label: "Geral"       },
  { id: "viagem",      label: "Viagem"      },
  { id: "passageiros", label: "Passageiros" },
  { id: "observacoes", label: "Observações" },
];

type Props = {
  cotacao: Cotacao;
  open: boolean;
  onClose: () => void;
};

export function EditarCotacaoModal({ cotacao, open, onClose }: Props) {
  const { clientes, updateCotacao } = useData();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("geral");

  // --- Aba Geral ---
  const [titulo,      setTitulo]      = useState(cotacao.titulo);
  const [clienteId,   setClienteId]   = useState(cotacao.clienteId);
  const [status,      setStatus]      = useState<CotacaoStatus>(cotacao.status);
  const [valorTotal,  setValorTotal]  = useState(String(cotacao.valorTotal));
  const [validade,    setValidade]    = useState(cotacao.validade);
  const [responsavel, setResponsavel] = useState(cotacao.responsavel);
  const [prioridade,  setPrioridade]  = useState(cotacao.prioridade);
  const [tags,        setTags]        = useState(cotacao.tags.join(", "));

  // --- Aba Viagem ---
  const [origem,       setOrigem]       = useState(cotacao.detalhes.origem);
  const [destino,      setDestino]      = useState(cotacao.destino);
  const [dataIda,      setDataIda]      = useState(cotacao.detalhes.dataIda);
  const [dataVolta,    setDataVolta]    = useState(cotacao.detalhes.dataVolta);
  const [dataInicio,   setDataInicio]   = useState(cotacao.dataInicioViagem ?? "");
  const [dataFim,      setDataFim]      = useState(cotacao.dataFimViagem ?? "");
  const [servicos,     setServicos]     = useState<string[]>(cotacao.detalhes.servicosDesejados ?? []);

  // --- Aba Passageiros ---
  const [adultos,  setAdultos]  = useState(cotacao.detalhes.adultos);
  const [criancas, setCriancas] = useState(cotacao.detalhes.criancas);
  const [bebes,    setBebes]    = useState(cotacao.detalhes.bebes);
  const [idadesCriancas, setIdadesCriancas] = useState(cotacao.detalhes.idadesCriancas);

  // --- Aba Observações ---
  const [observacoes,    setObservacoes]    = useState(cotacao.observacoes);
  const [detalhesViagem, setDetalhesViagem] = useState(cotacao.detalhes.destinoForm);

  // Sincroniza ao abrir
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing form state from prop when modal opens
    setTab("geral");
    setTitulo(cotacao.titulo);
    setClienteId(cotacao.clienteId);
    setStatus(cotacao.status);
    setValorTotal(String(cotacao.valorTotal));
    setValidade(cotacao.validade);
    setResponsavel(cotacao.responsavel);
    setPrioridade(cotacao.prioridade);
    setTags(cotacao.tags.join(", "));
    setOrigem(cotacao.detalhes.origem);
    setDestino(cotacao.destino);
    setDataIda(cotacao.detalhes.dataIda);
    setDataVolta(cotacao.detalhes.dataVolta);
    setDataInicio(cotacao.dataInicioViagem ?? "");
    setDataFim(cotacao.dataFimViagem ?? "");
    setServicos(cotacao.detalhes.servicosDesejados ?? []);
    setAdultos(cotacao.detalhes.adultos);
    setCriancas(cotacao.detalhes.criancas);
    setBebes(cotacao.detalhes.bebes);
    setIdadesCriancas(cotacao.detalhes.idadesCriancas);
    setObservacoes(cotacao.observacoes);
    setDetalhesViagem(cotacao.detalhes.destinoForm);
  }, [open, cotacao]);

  const clienteSelecionado = useMemo(
    () => clientes.find((c) => c.id === clienteId),
    [clientes, clienteId]
  );

  if (!open) return null;

  function toggleServico(id: string) {
    setServicos((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleSave() {
    if (!titulo.trim()) { toast.error("Título é obrigatório"); return; }
    if (!clienteId)     { toast.error("Selecione um cliente"); return; }

    const v = parseFloat(valorTotal.replace(",", ".")) || 0;
    const tagList = tags.split(/[,#]/).map((t) => t.trim()).filter(Boolean);

    updateCotacao(cotacao.id, {
      titulo:          titulo.trim(),
      clienteId,
      destino:         destino.trim(),
      status,
      valorTotal:      v,
      validade,
      responsavel:     responsavel.trim() || "Equipe",
      prioridade,
      tags:            tagList,
      observacoes:     observacoes.trim(),
      dataInicioViagem: dataInicio || undefined,
      dataFimViagem:    dataFim    || undefined,
      detalhes: {
        ...cotacao.detalhes,
        origem,
        destinoForm:       destino.trim(),
        dataIda,
        dataVolta,
        servicosDesejados: servicos,
        adultos,
        criancas,
        bebes,
        idadesCriancas,
      },
    });
    toast.success("Cotação atualizada com sucesso!");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b border-[var(--hub-border)] px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[var(--hub-blue-dark)]">Editar Cotação</h2>
            <p className="truncate text-sm text-[var(--hub-text-muted)]">{cotacao.titulo}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 shrink-0 rounded-[var(--hub-radius)] p-1.5 text-[var(--hub-text-muted)] transition-colors hover:bg-[var(--hub-bg-subtle)] hover:text-[var(--hub-text-secondary)]"
            aria-label="Fechar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ── Funil de status ── */}
        <div className="border-b border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-6 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--hub-text-muted)]">
            Status da cotação
          </p>
          <div className="flex items-center gap-1">
            {FUNIL_STEPS.map((step, i) => {
              const isActive = status === step.id;
              const isPast   = FUNIL_STEPS.findIndex((s) => s.id === status) > i;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setStatus(step.id)}
                  title={COTACAO_STATUS_LABELS[step.id]}
                  className={`relative flex flex-1 items-center justify-center rounded px-2 py-1.5 text-[11px] font-semibold transition-all ${
                    isActive
                      ? `${step.color} text-white shadow-sm`
                      : isPast
                        ? "bg-[var(--hub-border)] text-[var(--hub-text-muted)]"
                        : "bg-white text-[var(--hub-text-muted)] ring-1 ring-slate-200 hover:bg-[var(--hub-bg-subtle)]"
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-inherit" />
                  )}
                </button>
              );
            })}
            {/* Arquivo */}
            <div className="mx-1 h-4 w-px bg-[var(--hub-border)]" />
            {(["expirada", "cancelada"] as CotacaoStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                title={COTACAO_STATUS_LABELS[s]}
                className={`rounded px-2 py-1.5 text-[11px] font-semibold transition-all ${
                  status === s
                    ? "bg-[var(--hub-bg-subtle)]0 text-white"
                    : "bg-white text-[var(--hub-text-muted)] ring-1 ring-slate-200 hover:bg-[var(--hub-bg-subtle)]"
                }`}
              >
                <span className="hidden sm:inline">{COTACAO_STATUS_LABELS[s]}</span>
                <span className="sm:hidden">{s === "expirada" ? "Exp" : "Can"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Abas ── */}
        <div className="flex border-b border-[var(--hub-border)]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-b-2 border-[var(--hub-blue)] text-[var(--hub-blue)]"
                  : "text-[var(--hub-text-muted)] hover:text-[var(--hub-text-primary)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Conteúdo das abas ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Aba: Geral */}
          {tab === "geral" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="eq-titulo">Título *</Label>
                <Input
                  id="eq-titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex.: Europa Sul — 12 noites"
                />
              </div>

              {/* Cliente */}
              <div>
                <Label htmlFor="eq-cliente">Cliente *</Label>
                {clienteSelecionado && (
                  <div className="mb-2 flex items-center gap-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-3 py-2 text-sm">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--hub-blue)] text-xs font-bold text-white">
                      {clienteSelecionado.nome.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--hub-blue-dark)]">
                        {clienteSelecionado.nome}
                      </p>
                      <p className="truncate text-xs text-[var(--hub-text-muted)]">
                        {clienteSelecionado.email || clienteSelecionado.telefone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setClienteId("")}
                      className="shrink-0 text-xs text-[var(--hub-text-muted)] hover:text-red-500"
                    >
                      Trocar
                    </button>
                  </div>
                )}
                {!clienteSelecionado && (
                  <Select
                    id="eq-cliente"
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                  >
                    <option value="">Selecione um cliente…</option>
                    {clientes
                      .slice()
                      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                          {c.email ? ` — ${c.email}` : ""}
                        </option>
                      ))}
                  </Select>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="eq-valor">Valor total (R$)</Label>
                  <Input
                    id="eq-valor"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={valorTotal}
                    onChange={(e) => setValorTotal(e.target.value)}
                  />
                  {parseFloat(valorTotal.replace(",", ".")) > 0 && (
                    <p className="mt-1 text-xs text-[var(--hub-text-muted)]">
                      {formatBRL(parseFloat(valorTotal.replace(",", ".")))}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="eq-validade">Validade</Label>
                  <Input
                    id="eq-validade"
                    type="date"
                    value={validade}
                    onChange={(e) => setValidade(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="eq-resp">Responsável</Label>
                  <Input
                    id="eq-resp"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="eq-tags">Tags (vírgula)</Label>
                  <Input
                    id="eq-tags"
                    placeholder="Europa, Lua de mel"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={prioridade}
                  onChange={(e) => setPrioridade(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--hub-border)] accent-[var(--hub-yellow)]"
                />
                <span className="text-sm font-medium text-[var(--hub-text-primary)]">
                  Marcar como prioridade
                </span>
              </label>
            </div>
          )}

          {/* Aba: Viagem */}
          {tab === "viagem" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="eq-origem">Origem</Label>
                  <Input
                    id="eq-origem"
                    placeholder="Ex.: São Paulo (GRU)"
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="eq-destino">Destino</Label>
                  <Input
                    id="eq-destino"
                    placeholder="Ex.: Lisboa / Porto"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="eq-ida">Data de ida</Label>
                  <Input
                    id="eq-ida"
                    type="date"
                    value={dataIda}
                    onChange={(e) => setDataIda(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="eq-volta">Data de volta</Label>
                  <Input
                    id="eq-volta"
                    type="date"
                    value={dataVolta}
                    onChange={(e) => setDataVolta(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="eq-inicio">Início da viagem</Label>
                  <Input
                    id="eq-inicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="eq-fim">Fim da viagem</Label>
                  <Input
                    id="eq-fim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Serviços desejados</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SERVICOS_DESEJADOS_OPTIONS.map((s) => {
                    const checked = servicos.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-[var(--hub-radius)] border px-3 py-2 text-sm transition-colors ${
                          checked
                            ? "border-[var(--hub-blue)] bg-sky-50 text-[var(--hub-blue-dark)]"
                            : "border-[var(--hub-border)] bg-white text-[var(--hub-text-secondary)] hover:border-[var(--hub-border)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleServico(s.id)}
                          className="h-3.5 w-3.5 accent-[var(--hub-blue)]"
                        />
                        {s.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Aba: Passageiros */}
          {tab === "passageiros" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Adultos",                  value: adultos,  set: setAdultos  },
                  { label: "Crianças (2 a 11 anos)",   value: criancas, set: setCriancas },
                  { label: "Bebês (0 a 23 meses)",     value: bebes,    set: setBebes    },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <Label>{label}</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => set(Math.max(0, value - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white text-lg font-bold text-[var(--hub-text-secondary)] hover:bg-[var(--hub-bg-subtle)]"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-lg font-semibold tabular-nums text-[var(--hub-blue-dark)]">
                        {value}
                      </span>
                      <button
                        type="button"
                        onClick={() => set(value + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white text-lg font-bold text-[var(--hub-text-secondary)] hover:bg-[var(--hub-bg-subtle)]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {criancas > 0 && (
                <div>
                  <Label htmlFor="eq-idades">Idades das crianças</Label>
                  <Input
                    id="eq-idades"
                    placeholder="Ex.: 5 anos, 8 anos"
                    value={idadesCriancas}
                    onChange={(e) => setIdadesCriancas(e.target.value)}
                  />
                </div>
              )}

              <div className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-4 py-3 text-sm text-[var(--hub-text-secondary)]">
                Total:{" "}
                <span className="font-semibold text-[var(--hub-blue-dark)]">
                  {adultos + criancas + bebes} passageiro{adultos + criancas + bebes !== 1 ? "s" : ""}
                </span>
                {" "}({adultos} adulto{adultos !== 1 ? "s" : ""}
                {criancas > 0 ? `, ${criancas} criança${criancas !== 1 ? "s" : ""}` : ""}
                {bebes > 0 ? `, ${bebes} bebê${bebes !== 1 ? "s" : ""}` : ""})
              </div>
            </div>
          )}

          {/* Aba: Observações */}
          {tab === "observacoes" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="eq-obs">Observações internas</Label>
                <Textarea
                  id="eq-obs"
                  rows={4}
                  placeholder="Notas para a equipe, condições especiais…"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="eq-det">Detalhes da viagem (para o cliente)</Label>
                <Textarea
                  id="eq-det"
                  rows={4}
                  placeholder="Roteiro, inclusões, exclusões, termos…"
                  value={detalhesViagem}
                  onChange={(e) => setDetalhesViagem(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-[var(--hub-border)] px-6 py-4">
          <p className="text-xs text-[var(--hub-text-muted)]">
            ID: {cotacao.id.slice(0, 8).toUpperCase()}
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave}>
              Salvar alterações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
