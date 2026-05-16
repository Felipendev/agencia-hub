"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { Card, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatDateBR } from "@/lib/format";
import { getSalesAgentDashboardRemote } from "@/lib/api/users-remote";
import { COTACAO_STATUS_LABELS } from "@/lib/constants";
import type { ApiSalesAgentDashboardResponse } from "@/lib/api/auth-types";
import type { CotacaoStatus } from "@/types";

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  aguardando: "muted",
  em_cotacao: "warning",
  aguardando_cliente: "warning",
  aprovado: "success",
  reprovado: "danger",
  expirada: "muted",
  cancelada: "danger",
};

// Map API status → front status label
const API_TO_FRONT_STATUS: Record<string, CotacaoStatus> = {
  DRAFT: "aguardando",
  SENT: "em_cotacao",
  AWAITING_CLIENT: "aguardando_cliente",
  ACCEPTED: "aprovado",
  REJECTED: "reprovado",
  EXPIRED: "expirada",
  CANCELLED: "cancelada",
};

export default function MeuPainelPage() {
  const { user, token } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<ApiSalesAgentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getSalesAgentDashboardRemote(token)
      .then(setData)
      .catch(() => toast.error("Erro ao carregar painel."))
      .finally(() => setLoading(false));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <p className="text-sm text-[var(--hub-text-secondary)]">Carregando painel…</p>;
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[var(--hub-text-muted)]">
          Configure a URL da API para ver seu painel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Meu Painel"
        description={`Olá, ${user?.nome ?? ""}! Aqui estão suas cotações e comissões.`}
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total de cotações"
          value={String(data.totalQuotations)}
        />
        <KpiCard
          title="Em aberto"
          value={String(data.openQuotations)}
          accent="yellow"
        />
        <KpiCard
          title="Aprovadas"
          value={String(data.approvedQuotations)}
          accent="green"
        />
        <KpiCard
          title="Comissão acumulada"
          value={formatBRL(data.totalCommissionEarned)}
          accent="green"
          hint="Cotações aprovadas"
        />
      </div>

      {/* Comissão pendente */}
      {data.pendingCommission > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--hub-text-secondary)]">
                Comissão potencial (cotações em aberto)
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {formatBRL(data.pendingCommission)}
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
          <p className="mt-2 text-xs text-[var(--hub-text-muted)]">
            Valor estimado se todas as cotações em aberto forem aprovadas.
          </p>
        </Card>
      )}

      {/* Configuração de comissão */}
      {(data.salesAgent.commissionPct != null || data.salesAgent.commissionFixed != null) && (
        <Card>
          <CardTitle>Minha comissão</CardTitle>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xl font-bold">
              {data.salesAgent.commissionPct != null ? "%" : "R$"}
            </div>
            <div>
              {data.salesAgent.commissionPct != null ? (
                <p className="text-lg font-semibold text-[var(--hub-blue-dark)]">
                  {data.salesAgent.commissionPct}% sobre o valor da cotação aprovada
                </p>
              ) : (
                <p className="text-lg font-semibold text-[var(--hub-blue-dark)]">
                  {formatBRL(data.salesAgent.commissionFixed!)} fixo por cotação aprovada
                </p>
              )}
              <p className="text-sm text-[var(--hub-text-muted)]">
                Definido pelo dono da agência
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Cotações recentes */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Minhas cotações recentes</CardTitle>
          <Link
            href="/cotacoes"
            className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
          >
            Ver todas
          </Link>
        </div>

        {data.recentQuotations.length === 0 ? (
          <p className="text-sm text-[var(--hub-text-muted)]">
            Nenhuma cotação atribuída a você ainda.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--hub-border)]">
            {data.recentQuotations.map((q) => {
              const frontStatus =
                API_TO_FRONT_STATUS[q.status] ?? ("aguardando" as CotacaoStatus);
              return (
                <li
                  key={q.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"
                >
                  <div>
                    <Link
                      href={`/cotacoes/${q.id}`}
                      className="font-medium text-[var(--hub-blue)] hover:underline"
                    >
                      {q.title}
                    </Link>
                    <p className="text-xs text-[var(--hub-text-muted)]">
                      {q.customerName} · Validade {formatDateBR(q.validUntil)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={STATUS_TONE[frontStatus] ?? "muted"}>
                      {COTACAO_STATUS_LABELS[frontStatus]}
                    </Badge>
                    <span className="text-sm font-semibold tabular-nums text-[var(--hub-blue-dark)]">
                      {formatBRL(Number(q.totalAmount))}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
