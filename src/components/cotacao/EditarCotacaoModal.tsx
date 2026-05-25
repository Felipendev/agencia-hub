"use client";

import { useState, useEffect, useMemo } from "react";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { XIcon } from "@/components/icons";
import { CotacaoDetalhesForm } from "@/components/cotacao/CotacaoDetalhesForm";
import { COTACAO_STATUS_LABELS } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import { listSalesAgentsRemote } from "@/lib/api/users-remote";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import type { ApiUserResponse } from "@/lib/api/auth-types";
import type { Cotacao, CotacaoDetalhes, CotacaoStatus } from "@/types";

// Funil principal (sem arquivo)
const FUNIL_STEPS: { id: CotacaoStatus; label: string; color: string }[] = [
  { id: "aguardando",         label: "Aguardando",      color: "bg-[var(--hub-text-muted)]" },
  { id: "em_cotacao",         label: "Em cotação",       color: "bg-amber-400" },
  { id: "aguardando_cliente", label: "Aguard. cliente",  color: "bg-sky-500"   },
  { id: "aprovado",           label: "Aprovado",         color: "bg-emerald-500"},
  { id: "reprovado",          label: "Reprovado",        color: "bg-red-500"   },
];

type Tab = "geral" | "detalhes" | "observacoes";

const TABS: { id: Tab; label: string }[] = [
  { id: "geral",       label: "Geral"      },
  { id: "detalhes",    label: "Detalhes"   },
  { id: "observacoes", label: "Observações" },
];

type Props = {
  cotacao: Cotacao;
  open: boolean;
  onClose: () => void;
};

export function EditarCotacaoModal({ cotacao, open, onClose }: Props) {
  const { clientes, updateCotacao } = useData();
  const { token, user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("geral");

  // --- Aba Geral ---
  const [titulo,      setTitulo]      = useState(cotacao.titulo);
  const [clienteId,   setClienteId]   = useState(cotacao.clienteId);
  const [status,      setStatus]      = useState<CotacaoStatus>(cotacao.status);
  const [valorTotal,  setValorTotal]  = useState(cotacao.valorTotal > 0 ? String(cotacao.valorTotal).replace(".", ",") : "");
  const [validade,    setValidade]    = useState(cotacao.validade);
  const [responsavel, setResponsavel] = useState(cotacao.responsavel);
  const [prioridade,  setPrioridade]  = useState(cotacao.prioridade);
  const [tags,        setTags]        = useState(cotacao.tags.join(", "));
  const [dataInicio,  setDataInicio]  = useState(cotacao.dataInicioViagem ?? "");
  const [dataFim,     setDataFim]     = useState(cotacao.dataFimViagem ?? "");

  // --- Aba Detalhes ---
  const [det, setDet] = useState<CotacaoDetalhes>(cotacao.detalhes);

  // --- Aba Observações ---
  const [observacoes, setObservacoes] = useState(cotacao.observacoes);

  // --- Sellers (for responsável select) ---
  const isOwner = user?.accountKind === "AGENCY_OWNER";
  const [sellers, setSellers] = useState<ApiUserResponse[]>([]);

  useEffect(() => {
    if (!isOwner || !token || !getAgenciaHubApiBaseUrl()) return;
    let cancelled = false;
    void listSalesAgentsRemote(token)
      .then((rows) => { if (!cancelled) setSellers(rows); })
      .catch(() => { if (!cancelled) setSellers([]); });
    return () => { cancelled = true; };
  }, [isOwner, token]);

  const teamOptions = useMemo((): ApiUserResponse[] => {
    if (!isOwner || !user) return sellers;
    const map = new Map(sellers.map((s) => [s.id, s]));
    if (!map.has(user.id)) {
      map.set(user.id, {
        id: user.id,
        name: `${user.nome} (dono)`,
        email: user.email,
        accountKind: "AGENCY_OWNER",
        active: true,
        commissionPct: null,
        commissionFixed: null,
        createdAt: "",
      });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [sellers, user, isOwner]);

  // Sincroniza ao abrir
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing form state from prop when modal opens
    setTab("geral");
    setTitulo(cotacao.titulo);
    setClienteId(cotacao.clienteId);
    setStatus(cotacao.status);
    setValorTotal(cotacao.valorTotal > 0 ? String(cotacao.valorTotal).replace(".", ",") : "");
    setValidade(cotacao.validade);
    setResponsavel(cotacao.responsavel);
    setPrioridade(cotacao.prioridade);
    setTags(cotacao.tags.join(", "));
    setDataInicio(cotacao.dataInicioViagem ?? "");
    setDataFim(cotacao.dataFimViagem ?? "");
    setDet(cotacao.detalhes);
    setObservacoes(cotacao.observacoes);
  }, [open, cotacao]);

  const clienteSelecionado = useMemo(
    () => clientes.find((c) => c.id === clienteId),
    [clientes, clienteId],
  );

  if (!open) return null;

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

  function handleSave() {
    if (!titulo.trim()) { toast.error("Título é obrigatório"); return; }
    if (!clienteId)     { toast.error("Selecione um cliente"); return; }

    const v = parseFloat(valorTotal.replace(",", ".")) || 0;
    const tagList = tags.split(/[,#]/).map((t) => t.trim()).filter(Boolean);
    const destino =
      det.destinosTrechos.filter((x) => x.trim()).join(" · ") ||
      det.destinoForm.trim() ||
      cotacao.destino;

    updateCotacao(cotacao.id, {
      titulo:           titulo.trim(),
      clienteId,
      destino,
      status,
      valorTotal:       v,
      validade,
      responsavel:      responsavel.trim() || "Equipe",
      prioridade,
      tags:             tagList,
      observacoes:      observacoes.trim(),
      dataInicioViagem: dataInicio || undefined,
      dataFimViagem:    dataFim    || undefined,
      detalhes: {
        ...det,
        destinoForm: destino,
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
                  {teamOptions.length > 0 ? (
                    <Select
                      id="eq-resp"
                      value={responsavel}
                      onChange={(e) => setResponsavel(e.target.value)}
                    >
                      {!teamOptions.some((o) => o.name === responsavel) && responsavel && (
                        <option value={responsavel}>{responsavel}</option>
                      )}
                      {teamOptions.map((o) => (
                        <option key={o.id} value={o.name}>
                          {o.name}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id="eq-resp"
                      value={responsavel}
                      onChange={(e) => setResponsavel(e.target.value)}
                    />
                  )}
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

          {/* Aba: Detalhes */}
          {tab === "detalhes" && (
            <CotacaoDetalhesForm
              det={det}
              onToggleServico={toggleServico}
              onToggleComodidade={toggleComodidade}
              onPatch={patchDet}
              secoesAbertas
            />
          )}

          {/* Aba: Observações */}
          {tab === "observacoes" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="eq-obs">Observações internas</Label>
                <Textarea
                  id="eq-obs"
                  rows={6}
                  placeholder="Notas para a equipe, condições especiais…"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
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
