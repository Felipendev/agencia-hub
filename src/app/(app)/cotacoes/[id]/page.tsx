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
import { labelFormaPagamento } from "@/lib/cotacao-options";
import { formatBrPhoneDisplay } from "@/lib/br-phone";
import { TimelineView } from "@/components/timeline/TimelineView";
import { BackButton } from "@/components/ui/back-button";
import { EditarCotacaoModal } from "@/components/cotacao/EditarCotacaoModal";
import { EnviarWhatsAppModal } from "@/components/cotacao/EnviarWhatsAppModal";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { listSellersRemote } from "@/lib/api/users-remote";
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

  useEffect(() => {
    if (!isOwner || !token || !getAgenciaHubApiBaseUrl()) return;
    let cancelled = false;
    void listSellersRemote(token)
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

  /** Vendedores da API + o dono logado (não costuma vir em `/users/sellers`). */
  const sellerOptions = useMemo((): ApiUserResponse[] => {
    if (!isOwner || !user) return sellers;
    const map = new Map(sellers.map((s) => [s.id, s]));
    if (!map.has(user.id)) {
      map.set(user.id, {
        id: user.id,
        name: `${user.nome} (dono)`,
        email: user.email,
        role: "OWNER",
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

  useEffect(() => {
    if (!cotacao) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing form state from derived data
    setStatusEdit(cotacao.status);
    setValorEdit(String(cotacao.valorTotal));
    setValidadeEdit(cotacao.validade);
    setObsEdit(cotacao.observacoes);
  }, [cotacao]);

  if (!isReady) {
    return <p className="text-sm text-slate-600">Carregando…</p>;
  }

  if (!cotacao) {
    return (
      <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
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
      imprimirCotacao(cotacao!, cliente, "AgênciasHub");
      toast.success("Abrindo janela de impressao...");
    } catch {
      toast.error("Erro ao abrir impressao. Verifique se popups estao permitidos.");
    }
  }

  function handleBaixarHtml() {
    if (!cliente) { toast.error("Cliente nao encontrado"); return; }
    try {
      baixarCotacaoHtml(cotacao!, cliente, "AgênciasHub");
      toast.success("Download iniciado!");
    } catch {
      toast.error("Erro ao baixar arquivo");
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <BackButton href="/cotacoes" label="Cotacoes" />
          <h1 className="mt-4 text-2xl font-bold text-[var(--hub-blue-dark)]">
            {cotacao.titulo}
          </h1>
          <p className="mt-1 text-slate-600">{cotacao.destino}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="warning">{COTACAO_STATUS_LABELS[cotacao.status]}</Badge>
            {cotacao.origemCriacao === "formulario_publico" && (
              <span className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-900">
                Formulário público
              </span>
            )}
            {cotacao.origemCriacao === "interna" && (
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                Criada no sistema
              </span>
            )}
            {cotacao.prioridade && (
              <span className="rounded bg-[var(--hub-yellow)]/35 px-2 py-0.5 text-xs font-semibold text-[var(--hub-blue-dark)]">
                Prioridade
              </span>
            )}
            <span className="text-xs text-slate-500">Resp.: {cotacao.responsavel}</span>
            {cotacao.criadoPorNome ? (
              <span className="text-xs text-slate-500">
                · Registro: {cotacao.criadoPorNome}
              </span>
            ) : null}
          </div>
        </div>

        {/* Botoes de acao */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--hub-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--hub-blue-dark)] shadow-sm transition-colors hover:bg-slate-50"
          >
            <EditIcon className="h-4 w-4" />
            Editar cotacao
          </button>

          {/* WhatsApp — abre modal com mensagem editavel */}
          <button
            type="button"
            onClick={() => {
              if (!cliente) { toast.error("Cliente nao encontrado"); return; }
              if (!temTelefone) { toast.error("Telefone do cliente nao cadastrado"); return; }
              setWaModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp
          </button>

          <button
            type="button"
            onClick={handleImprimir}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--hub-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--hub-blue-dark)] shadow-sm transition-colors hover:bg-slate-50"
          >
            <DownloadIcon className="h-4 w-4" />
            Imprimir / PDF
          </button>

          <button
            type="button"
            onClick={handleBaixarHtml}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--hub-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--hub-blue-dark)] shadow-sm transition-colors hover:bg-slate-50"
          >
            <DownloadIcon className="h-4 w-4" />
            Baixar HTML
          </button>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Cliente e vinculos</CardTitle>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Vendedor</dt>
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
                  <span className="text-slate-800">
                    {cotacao.vendedorNome ?? "—"}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Cliente</dt>
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
                <dt className="text-xs font-medium uppercase text-slate-500">Tags</dt>
                <dd className="flex flex-wrap gap-1">
                  {cotacao.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs"
                    >
                      #{t}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">
                Criada / atualizada
              </dt>
              <dd className="text-slate-700">
                {formatDateTimeBR(cotacao.createdAt)} · {formatDateTimeBR(cotacao.updatedAt)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle>Atalhos de status</CardTitle>
          <p className="mt-2 text-sm text-slate-600">
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

      {/* Ficha do formulario */}
      <Card>
        <CardTitle>Ficha do formulario (solicitacao de orcamento)</CardTitle>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-slate-500">Servicos</p>
            <p className="text-[var(--hub-blue-dark)]">
              {d.servicosDesejados.length ? d.servicosDesejados.join(", ") : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Origem → destinos</p>
            <p>
              {d.origem || "—"}
              {d.destinosTrechos.some((x) => x.trim()) ? (
                <> → {d.destinosTrechos.map((x) => x.trim()).filter(Boolean).join(" · ")}</>
              ) : d.destinoForm ? (
                <> → {d.destinoForm}</>
              ) : " — "}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Datas ida / volta</p>
            <p>
              {d.dataIda ? formatDateBR(d.dataIda) : "—"} · {d.dataVolta ? formatDateBR(d.dataVolta) : "—"}
            </p>
          </div>
          {((d.flexibilidadeIda === "outro" && d.flexibilidadeIdaOutro.trim()) ||
            (d.flexibilidadeVolta === "outro" && d.flexibilidadeVoltaOutro.trim())) && (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase text-slate-500">Flexibilidade (outro)</p>
              <p>
                Ida: {d.flexibilidadeIda === "outro" ? d.flexibilidadeIdaOutro.trim() || "—" : "—"} ·
                Volta: {d.flexibilidadeVolta === "outro" ? d.flexibilidadeVoltaOutro.trim() || "—" : "—"}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase text-slate-500">Passageiros</p>
            <p>
              {d.adultos} adultos · {d.criancas} criancas · {d.bebes} bebes
              {d.idadesCriancas ? ` (${d.idadesCriancas})` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Pagamento / milhas</p>
            <p>
              {d.formaPagamento === "outro" && d.formaPagamentoOutro.trim()
                ? `Outro: ${d.formaPagamentoOutro}`
                : d.formaPagamento ? labelFormaPagamento(d.formaPagamento) : "—"}{" "}
              · Milhas: {d.usaMilhas ? "sim" : "nao"}
            </p>
          </div>
          {d.cupomCodigo.trim() && (
            <div>
              <p className="text-xs uppercase text-slate-500">Cupom</p>
              <p>
                {d.cupomCodigo}
                {d.cupomValidoAte ? ` (valido ate ${formatDateBR(d.cupomValidoAte)})` : ""}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase text-slate-500">Celular / WhatsApp</p>
            <p>
              {d.celular ? formatBrPhoneDisplay(d.celular) : "—"} · WA:{" "}
              {d.whatsappIgualCelular
                ? "mesmo do celular"
                : d.whatsapp ? formatBrPhoneDisplay(d.whatsapp) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Comunicacao</p>
            <p>{d.preferenciaComunicacao || "—"}</p>
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
