"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import { apiFetch } from "@/lib/api/authenticated-fetch";
import type { ApiQuotationResponse } from "@/lib/api/quotation-types";
import type { ApiSalesAgentDashboardResponse } from "@/lib/api/auth-types";
import { getSalesAgentDashboardRemote } from "@/lib/api/users-remote";
import { PageHeader } from "@/components/layout/page-header";

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "Aprovada",
  REJECTED: "Reprovada",
  DRAFT: "Rascunho",
  SENT: "Enviada",
  AWAITING_CLIENT: "Aguardando Cliente",
  EXPIRED: "Expirada",
  CANCELLED: "Cancelada",
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  ACCEPTED: "success",
  REJECTED: "danger",
  DRAFT: "muted",
  SENT: "warning",
  AWAITING_CLIENT: "warning",
  EXPIRED: "muted",
  CANCELLED: "danger",
};

export default function MinhasComissoesPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [dashboard, setDashboard] = useState<ApiSalesAgentDashboardResponse | null>(null);
  const [quotations, setQuotations] = useState<ApiQuotationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        const [dashData, quots] = await Promise.all([
          getSalesAgentDashboardRemote(token!),
          apiFetch<ApiQuotationResponse[]>("/quotations", {}, token),
        ]);
        setDashboard(dashData);
        // Filter to show only approved/accepted quotations for commission view
        const approved = quots.filter(
          (q) => q.status === "ACCEPTED"
        );
        setQuotations(approved);
      } catch {
        toast.error("Erro ao carregar comissões.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <p className="text-sm text-[var(--hub-text-secondary)]">Carregando comissões…</p>;
  }

  if (!dashboard) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[var(--hub-text-muted)]">
          Não foi possível carregar os dados de comissão.
        </p>
      </div>
    );
  }

  const commissionPct = dashboard.salesAgent.commissionPct;
  const commissionFixed = dashboard.salesAgent.commissionFixed;
  const hasCommissionConfig = commissionPct != null || commissionFixed != null;

  function calcCommission(totalAmount: number): number {
    if (commissionPct != null) {
      return (totalAmount * commissionPct) / 100;
    }
    if (commissionFixed != null) {
      return commissionFixed;
    }
    return 0;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Minhas Comissões"
        description="Acompanhe suas comissões sobre cotações aprovadas."
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-[var(--hub-text-secondary)]">Comissão acumulada</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {formatBRL(dashboard.totalCommissionEarned)}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-[var(--hub-text-secondary)]">Comissão pendente</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {formatBRL(dashboard.pendingCommission)}
          </p>
          <p className="mt-1 text-xs text-[var(--hub-text-muted)]">Cotações em aberto</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-[var(--hub-text-secondary)]">Minha taxa</p>
          <p className="mt-1 text-2xl font-bold text-[var(--hub-blue-dark)]">
            {commissionPct != null
              ? `${commissionPct}%`
              : commissionFixed != null
                ? formatBRL(commissionFixed) + " fixo"
                : "Não definida"}
          </p>
        </Card>
      </div>

      {/* Quotations table */}
      <Card>
        <CardTitle>Cotações aprovadas</CardTitle>

        {!hasCommissionConfig && (
          <p className="mt-4 text-sm text-amber-600">
            Sua taxa de comissão ainda não foi configurada pelo gestor da agência.
          </p>
        )}

        {quotations.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--hub-text-muted)]">
            Nenhuma cotação aprovada ainda. Quando suas cotações forem aprovadas, as comissões aparecerão aqui.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--hub-border)] text-left text-xs font-medium uppercase tracking-wide text-[var(--hub-text-muted)]">
                  <th className="pb-2 pr-4">Título</th>
                  <th className="pb-2 pr-4">Cliente</th>
                  <th className="pb-2 pr-4 text-right">Valor Total</th>
                  <th className="pb-2 pr-4 text-right">Comissão (%)</th>
                  <th className="pb-2 pr-4 text-right">Valor Comissão</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hub-border)]">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-[var(--hub-bg-subtle)]">
                    <td className="py-3 pr-4 font-medium text-[var(--hub-blue-dark)]">
                      {q.title}
                    </td>
                    <td className="py-3 pr-4 text-[var(--hub-text-secondary)]">
                      {q.customerName}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {formatBRL(q.totalAmount)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {commissionPct != null
                        ? `${commissionPct}%`
                        : commissionFixed != null
                          ? "Fixo"
                          : "—"}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums font-semibold text-emerald-600">
                      {hasCommissionConfig
                        ? formatBRL(calcCommission(q.totalAmount))
                        : "—"}
                    </td>
                    <td className="py-3">
                      <Badge tone={STATUS_TONE[q.status] ?? "muted"}>
                        {STATUS_LABELS[q.status] ?? q.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
