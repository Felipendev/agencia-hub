"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DownloadIcon, EditIcon, WhatsAppIcon } from "@/components/icons";
import { formatDateBR, formatDateTimeBR } from "@/lib/format";
import { imprimirCotacao, baixarCotacaoHtml } from "@/lib/pdf-generator";
import { COTACAO_STATUS_LABELS } from "@/lib/constants";
import {
  labelFormaPagamento,
  SERVICOS_DESEJADOS_OPTIONS,
  FLEXIBILIDADE_OPTIONS,
  HORARIO_SAIDA_OPTIONS,
  PREFERENCIA_VOO_OPTIONS,
  COMUNICACAO_OPTIONS,
  HOSPEDAGEM_CATEGORIA_OPTIONS,
} from "@/lib/cotacao-options";
import { formatBrPhoneDisplay } from "@/lib/br-phone";
import { TimelineView } from "@/components/timeline/TimelineView";
import { BackButton } from "@/components/ui/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { EditarCotacaoModal } from "@/components/cotacao/EditarCotacaoModal";
import { EnviarWhatsAppModal } from "@/components/cotacao/EnviarWhatsAppModal";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { listSalesAgentsRemote } from "@/lib/api/users-remote";
import type { ApiUserResponse } from "@/lib/api/auth-types";
import type { CotacaoStatus } from "@/types";

export default function CotacaoDetalhePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { isOwner, token, user } = useAuth();
  const { clientes, cotacoes, updateCotacao, isReady } = useData();
  const toast = useToast();

  const cotacao = cotacoes.find((c) => c.id === id);
  const cliente = clientes.find((c) => c.id === cotacao?.clienteId);

  const [statusEdit, setStatusEdit] = useState<CotacaoStatus>("aguardando");
  const [valorEdit, setValorEdit] = useState("");
  const [validadeEdit, setValidadeEdit] = useState("");
  const [obsEdit, setObsEdit] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [sellers, setSellers] = useState<ApiUserResponse[]>([]);
  const [nomeAgencia, setNomeAgencia] = useState(() => {
    try {
      const raw = localStorage.getItem("agencia-hub-solicitacao-config");
      if (raw) {
        const parsed = JSON.parse(raw) as { nomeMarca?: string };
        if (parsed?.nomeMarca) return parsed.nomeMarca;
      }
    } catch { /* ignore */ }
    return "Agência";
  });

  useEffect(() => {
    if (!isOwner || !token || !getAgenciaHubApiBaseUrl()) return;
    let cancelled = false;
    void listSalesAgentsRemote(token)
      .then((rows) => {
        if (!cancelled) setSellers(rows);
      })
      .catch(() => {
        if (!cancelled) setSellers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOwner, token]);

  /** Agentes da API + o dono logado (não costuma vir em `/users/sales-agents`). */
  const sellerOptions = useMemo((): ApiUserResponse[] => {
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
    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [sellers, user, isOwner]);

  // Agency name for print/PDF — localStorage read is in useState initializer; fallback to API
  useEffect(() => {
    if (!token) return;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    fetch("/api/app/solicitacao-config", { credentials: "include", headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { config?: { nomeMarca?: string } } | null) => {
        if (data?.config?.nomeMarca) setNomeAgencia(data.config.nomeMarca);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!cotacao) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing form state from derived data
    setStatusEdit(cotacao.status);
    setValorEdit(cotacao.valorTotal > 0 ? String(cotacao.valorTotal).replace(".", ",") : "");
    setValidadeEdit(cotacao.validade);
    setObsEdit(cotacao.observacoes);
  }, [cotacao]);

  if (!isReady) {
    return <p className="text-sm text-[var(--hub-text-muted)]">Carregando…</p>;
  }

  if (!cotacao) {
    return (
      <div className="space-y-4 rounded-[var(--hub-radius-lg)] border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <BackButton href="/cotacoes" label="Cotacoes" />
        <p className="font-medium">Cotacao nao encontrada.</p>
      </div>
    );
  }

  const d = cotacao.detalhes;

  // Verifica se o cliente tem telefone para habilitar o botao WhatsApp
  const temTelefone = !!(
    cliente?.whatsapp ||
    cliente?.telefone ||
    d.whatsapp ||
    d.celular
  );

  function saveCampos() {
    const v = parseFloat(valorEdit.replace(",", ".")) || 0;
    updateCotacao(id, {
      valorTotal: v,
      validade: validadeEdit,
      observacoes: obsEdit.trim(),
      status: statusEdit,
    });
    toast.success("Cotacao atualizada com sucesso!");
  }

  function aplicarStatus(novo: CotacaoStatus) {
    updateCotacao(id, { status: novo });
    setStatusEdit(novo);
    toast.success(`Status alterado para "${COTACAO_STATUS_LABELS[novo]}"`);
  }

  function handleImprimir() {
    if (!cliente) { toast.error("Cliente nao encontrado"); return; }
    try {
      imprimirCotacao(cotacao!, cliente, nomeAgencia);
      toast.success("Abrindo janela de impressao...");
    } catch {
      toast.error("Erro ao abrir impressao. Verifique se popups estao permitidos.");
    }
  }

  function handleBaixarHtml() {
    if (!cliente) { toast.error("Cliente nao encontrado"); return; }
    try {
      baixarCotacaoHtml(cotacao!, cliente, nomeAgencia);
      toast.success("Download iniciado!");
    } catch {
      toast.error("Erro ao baixar arquivo");
    }
  }

  return (
    <div className="space-y-8">
      <BackButton href="/cotacoes" label="Cotações" />
      <PageHeader title={cotacao.titulo} description={cotacao.destino}>
        <button
          type="button"
          onClick={() => setEditModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--hub-text-primary)] shadow-[var(--hub-shadow-xs)] transition-colors hover:bg-[var(--hub-bg-subtle)]"
        >
          <EditIcon className="h-4 w-4" />
          Editar
        </button>
        <button
          type="button"
          onClick={() => {
            if (!cliente) { toast.error("Cliente não encontrado"); return; }
            if (!temTelefone) { toast.error("Telefone do cliente não cadastrado"); return; }
            setWaModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-[var(--hub-radius)] bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-[var(--hub-shadow-xs)] transition-colors hover:bg-emerald-700"
        >
          <WhatsAppIcon className="h-4 w-4" />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={handleImprimir}
          className="inline-flex items-center gap-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--hub-text-primary)] shadow-[var(--hub-shadow-xs)] transition-colors hover:bg-[var(--hub-bg-subtle)]"
        >
          <DownloadIcon className="h-4 w-4" />
          Imprimir / PDF
        </button>
        <button
          type="button"
          onClick={handleBaixarHtml}
          className="inline-flex items-center gap-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--hub-text-primary)] shadow-[var(--hub-shadow-xs)] transition-colors hover:bg-[var(--hub-bg-subtle)]"
        >
          <DownloadIcon className="h-4 w-4" />
          Baixar HTML
        </button>
      </PageHeader>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="warning">{COTACAO_STATUS_LABELS[cotacao.status]}</Badge>
        {cotacao.origemCriacao === "formulario_publico" && (
          <span className="rounded-[var(--hub-radius-sm)] border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-900">
            Formulário público
          </span>
        )}
        {cotacao.origemCriacao === "interna" && (
          <span className="rounded-[var(--hub-radius-sm)] border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--hub-text-secondary)]">
            Criada no sistema
          </span>
        )}
        {cotacao.prioridade && (
          <span className="rounded-[var(--hub-radius-sm)] bg-[var(--hub-yellow)]/35 px-2 py-0.5 text-xs font-semibold text-[var(--hub-blue-dark)]">
            Prioridade
          </span>
        )}
        <span className="text-xs text-[var(--hub-text-muted)]">Resp.: {cotacao.responsavel}</span>
        {cotacao.criadoPorNome && (
          <span className="text-xs text-[var(--hub-text-muted)]">· Registro: {cotacao.criadoPorNome}</span>
        )}
      </div>

      {/* Cards principais */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Cliente e vinculos</CardTitle>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase text-[var(--hub-text-muted)]">Vendedor</dt>
              <dd className="mt-1">
                {isOwner && sellerOptions.length > 0 ? (
                  <Select
                    aria-label="Vendedor responsável"
                    value={cotacao.vendedorId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateCotacao(id, {
                        vendedorId: v ? v : "",
                      });
                      toast.success(
                        v ? "Cotação atribuída com sucesso." : "Responsável removido da cotação.",
                      );
                    }}
                  >
                    <option value="">Nenhum</option>
                    {sellerOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <span className="text-[var(--hub-text-primary)]">
                    {cotacao.vendedorNome ?? "—"}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-[var(--hub-text-muted)]">Cliente</dt>
              <dd>
                {cliente ? (
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="font-medium text-[var(--hub-blue)] hover:underline"
                  >
                    {cliente.nome}
                  </Link>
                ) : "—"}
              </dd>
            </div>
            {cotacao.tags.length > 0 && (
              <div>
                <dt className="text-xs font-medium uppercase text-[var(--hub-text-muted)]">Tags</dt>
                <dd className="flex flex-wrap gap-1">
                  {cotacao.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[var(--hub-radius-sm)] border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-2 py-0.5 text-xs"
                    >
                      #{t}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium uppercase text-[var(--hub-text-muted)]">
                Criada / atualizada
              </dt>
              <dd className="text-[var(--hub-text-primary)]">
                {formatDateTimeBR(cotacao.createdAt)} · {formatDateTimeBR(cotacao.updatedAt)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle>Atalhos de status</CardTitle>
          <p className="mt-2 text-sm text-[var(--hub-text-secondary)]">
            O mesmo fluxo pode ser feito pelo quadro Kanban na lista de cotacoes.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(COTACAO_STATUS_LABELS) as CotacaoStatus[]).map((s) => (
              <Button
                key={s}
                type="button"
                variant={cotacao.status === s ? "primary" : "secondary"}
                className="!py-2 text-xs"
                disabled={cotacao.status === s}
                onClick={() => aplicarStatus(s)}
              >
                {COTACAO_STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Ficha da solicitação */}
      <Card>
        <CardTitle>Solicitação do cliente</CardTitle>

        {/* Serviços — destaque visual */}
        {d.servicosDesejados.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {d.servicosDesejados.map((s) => {
              const label = SERVICOS_DESEJADOS_OPTIONS.find((o) => o.id === s)?.label ?? s;
              return (
                <span
                  key={s}
                  className="rounded-full bg-sky-50 px-3 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200"
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}

        {/* ── Roteiro ── */}
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hub-text-muted)]">Roteiro</p>
          <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <p className="text-xs text-[var(--hub-text-muted)]">Origem</p>
              <p className="font-medium text-[var(--hub-blue-dark)]">{d.origem || "—"}</p>
            </div>
            <div className="sm:col-span-1 xl:col-span-2">
              <p className="text-xs text-[var(--hub-text-muted)]">Destinos</p>
              <p className="font-medium text-[var(--hub-blue-dark)]">
                {d.destinosTrechos.filter((x) => x.trim()).join(" → ") || d.destinoForm || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--hub-text-muted)]">Data de ida</p>
              <p className="font-medium">{d.dataIda ? formatDateBR(d.dataIda) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--hub-text-muted)]">Data de volta</p>
              <p className="font-medium">{d.dataVolta ? formatDateBR(d.dataVolta) : "—"}</p>
            </div>
            {d.flexibilidadeIda && (
              <div>
                <p className="text-xs text-[var(--hub-text-muted)]">Flexibilidade ida</p>
                <p className="font-medium">
                  {FLEXIBILIDADE_OPTIONS.find((o) => o.id === d.flexibilidadeIda)?.label ?? d.flexibilidadeIda}
                  {d.flexibilidadeIda === "outro" && d.flexibilidadeIdaOutro ? `: ${d.flexibilidadeIdaOutro}` : ""}
                </p>
              </div>
            )}
            {d.flexibilidadeVolta && (
              <div>
                <p className="text-xs text-[var(--hub-text-muted)]">Flexibilidade volta</p>
                <p className="font-medium">
                  {FLEXIBILIDADE_OPTIONS.find((o) => o.id === d.flexibilidadeVolta)?.label ?? d.flexibilidadeVolta}
                  {d.flexibilidadeVolta === "outro" && d.flexibilidadeVoltaOutro ? `: ${d.flexibilidadeVoltaOutro}` : ""}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Passageiros e Bagagem ── */}
        <div className="mt-5 border-t border-[var(--hub-border)] pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hub-text-muted)]">Passageiros e bagagem</p>
          <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <p className="text-xs text-[var(--hub-text-muted)]">Passageiros</p>
              <p className="font-medium">
                {d.adultos} adulto{d.adultos !== 1 ? "s" : ""}
                {d.criancas > 0 ? `, ${d.criancas} criança${d.criancas !== 1 ? "s" : ""}` : ""}
                {d.bebes > 0 ? `, ${d.bebes} bebê${d.bebes !== 1 ? "s" : ""}` : ""}
              </p>
              {d.idadesCriancas && (
                <p className="mt-0.5 text-xs text-[var(--hub-text-muted)]">Idades: {d.idadesCriancas}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-[var(--hub-text-muted)]">Malas despachadas</p>
              <p className="font-medium">
                {d.malasDespachadas
                  ? <span className="text-emerald-700">{d.qtdMalas ? `Sim — ${d.qtdMalas}` : "Sim"}</span>
                  : <span className="text-[var(--hub-text-muted)]">Não</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--hub-text-muted)]">Bagagem especial</p>
              <p className="font-medium">
                {d.bagagemEspecial
                  ? <span className="text-amber-700">Sim</span>
                  : <span className="text-[var(--hub-text-muted)]">Não</span>}
              </p>
            </div>
          </div>
        </div>

        {/* ── Preferências de voo ── */}
        {(d.horarioSaidaIda || d.horarioSaidaVolta || d.preferenciaVooIda || d.preferenciaVooVolta || d.usaMilhas) && (
          <div className="mt-5 border-t border-[var(--hub-border)] pt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hub-text-muted)]">Preferências de voo</p>
            <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
              {d.horarioSaidaIda && (
                <div>
                  <p className="text-xs text-[var(--hub-text-muted)]">Horário saída (ida)</p>
                  <p className="font-medium">{HORARIO_SAIDA_OPTIONS.find((o) => o.id === d.horarioSaidaIda)?.label ?? d.horarioSaidaIda}</p>
                </div>
              )}
              {d.horarioSaidaVolta && (
                <div>
                  <p className="text-xs text-[var(--hub-text-muted)]">Horário saída (volta)</p>
                  <p className="font-medium">{HORARIO_SAIDA_OPTIONS.find((o) => o.id === d.horarioSaidaVolta)?.label ?? d.horarioSaidaVolta}</p>
                </div>
              )}
              {d.preferenciaVooIda && (
                <div>
                  <p className="text-xs text-[var(--hub-text-muted)]">Preferência voo (ida)</p>
                  <p className="font-medium">{PREFERENCIA_VOO_OPTIONS.find((o) => o.id === d.preferenciaVooIda)?.label ?? d.preferenciaVooIda}</p>
                </div>
              )}
              {d.preferenciaVooVolta && (
                <div>
                  <p className="text-xs text-[var(--hub-text-muted)]">Preferência voo (volta)</p>
                  <p className="font-medium">{PREFERENCIA_VOO_OPTIONS.find((o) => o.id === d.preferenciaVooVolta)?.label ?? d.preferenciaVooVolta}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-[var(--hub-text-muted)]">Uso de milhas</p>
                <p className="font-medium">
                  {d.usaMilhas
                    ? <span className="text-emerald-700">Sim</span>
                    : <span className="text-[var(--hub-text-muted)]">Não</span>}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Hospedagem ── */}
        {(d.categoriaHospedagem || d.comodidadesHospedagem.length > 0 || d.qtdQuartos > 0) && (
          <div className="mt-5 border-t border-[var(--hub-border)] pt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hub-text-muted)]">Hospedagem</p>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              {d.categoriaHospedagem && (
                <div>
                  <p className="text-xs text-[var(--hub-text-muted)]">Categoria</p>
                  <p className="font-medium">{HOSPEDAGEM_CATEGORIA_OPTIONS.find((o) => o.id === d.categoriaHospedagem)?.label ?? d.categoriaHospedagem}</p>
                </div>
              )}
              {d.qtdQuartos > 0 && (
                <div>
                  <p className="text-xs text-[var(--hub-text-muted)]">Quartos</p>
                  <p className="font-medium">{d.qtdQuartos} quarto{d.qtdQuartos !== 1 ? "s" : ""}</p>
                </div>
              )}
              {d.comodidadesHospedagem.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-[var(--hub-text-muted)]">Comodidades</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {d.comodidadesHospedagem.map((c) => (
                      <span key={c} className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-violet-200">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Contato e Pagamento ── */}
        <div className="mt-5 border-t border-[var(--hub-border)] pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hub-text-muted)]">Contato e pagamento</p>
          <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
            {d.celular && (
              <div>
                <p className="text-xs text-[var(--hub-text-muted)]">Celular</p>
                <p className="font-medium">{formatBrPhoneDisplay(d.celular)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-[var(--hub-text-muted)]">WhatsApp</p>
              <p className="font-medium">
                {d.whatsappIgualCelular
                  ? "Mesmo do celular"
                  : d.whatsapp ? formatBrPhoneDisplay(d.whatsapp) : "—"}
              </p>
            </div>
            {d.preferenciaComunicacao && (
              <div>
                <p className="text-xs text-[var(--hub-text-muted)]">Preferência de contato</p>
                <p className="font-medium">{COMUNICACAO_OPTIONS.find((o) => o.id === d.preferenciaComunicacao)?.label ?? d.preferenciaComunicacao}</p>
              </div>
            )}
            {d.formaPagamento && (
              <div>
                <p className="text-xs text-[var(--hub-text-muted)]">Forma de pagamento</p>
                <p className="font-medium">
                  {d.formaPagamento === "outro" && d.formaPagamentoOutro
                    ? d.formaPagamentoOutro
                    : labelFormaPagamento(d.formaPagamento)}
                </p>
              </div>
            )}
            {d.cupomCodigo.trim() && (
              <div>
                <p className="text-xs text-[var(--hub-text-muted)]">Cupom de desconto</p>
                <p className="font-medium text-emerald-700">
                  {d.cupomCodigo}
                  {d.cupomValidoAte ? <span className="ml-1 text-xs font-normal text-[var(--hub-text-muted)]">válido até {formatDateBR(d.cupomValidoAte)}</span> : null}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Editar proposta */}
      <Card>
        <CardTitle>Editar proposta</CardTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="st">Status</Label>
            <Select
              id="st"
              value={statusEdit}
              onChange={(e) => setStatusEdit(e.target.value as CotacaoStatus)}
            >
              {(Object.keys(COTACAO_STATUS_LABELS) as CotacaoStatus[]).map((s) => (
                <option key={s} value={s}>{COTACAO_STATUS_LABELS[s]}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="valor">Valor total (R$)</Label>
            <Input
              id="valor"
              inputMode="decimal"
              value={valorEdit}
              onChange={(e) => setValorEdit(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="val">Validade</Label>
            <Input
              id="val"
              type="date"
              value={validadeEdit}
              onChange={(e) => setValidadeEdit(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="obs">Observacoes</Label>
          <Textarea
            id="obs"
            value={obsEdit}
            onChange={(e) => setObsEdit(e.target.value)}
          />
        </div>
        <Button type="button" className="mt-4" onClick={saveCampos}>
          Salvar alteracoes
        </Button>
      </Card>

      {/* Timeline */}
      <Card>
        <TimelineView entityType="cotacao" entityId={cotacao.id} />
      </Card>

      {/* Modais */}
      <EditarCotacaoModal
        cotacao={cotacao}
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />

      {cliente && (
        <EnviarWhatsAppModal
          cotacao={cotacao}
          cliente={cliente}
          open={waModalOpen}
          onClose={() => setWaModalOpen(false)}
        />
      )}
    </div>
  );
}
