"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";

type AgencyStatus =
  | "PENDING_VERIFICATION"
  | "TRIAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "CANCELED"
  | "DELETION_PENDING";

type AgencyAdminSummary = {
  id: string;
  name: string;
  status: AgencyStatus;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  createdAt: string;
  deletionScheduledAt: string | null;
  ownerCount: number;
  sellerCount: number;
  customerCount: number;
  quotationCount: number;
  ownerEmail: string | null;
};

const STATUS_LABELS: Record<AgencyStatus, string> = {
  PENDING_VERIFICATION: "Pendente",
  TRIAL: "Trial",
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  CANCELED: "Cancelado",
  DELETION_PENDING: "Exclusão Pendente",
};

const STATUS_COLORS: Record<AgencyStatus, string> = {
  PENDING_VERIFICATION: "bg-yellow-100 text-yellow-800",
  TRIAL: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-orange-100 text-orange-800",
  CANCELED: "bg-gray-100 text-gray-800",
  DELETION_PENDING: "bg-red-100 text-red-800 animate-pulse",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function AdminAgenciasPage() {
  const { token } = useAuth();
  const [agencies, setAgencies] = useState<AgencyAdminSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const base = getAgenciaHubApiBaseUrl();
      const res = await fetch(`${base}/admin/agencies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAgencies(Array.isArray(data) ? data : []);
    } catch {
      setError("Erro ao carregar agências.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function action(agencyId: string, endpoint: string) {
    setActionLoading(`${agencyId}-${endpoint}`);
    setError("");
    try {
      const base = getAgenciaHubApiBaseUrl();
      const res = await fetch(`${base}/admin/agencies/${agencyId}/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.message ?? "Erro na operação.");
      } else {
        await load();
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = agencies.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.ownerEmail ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  // Summary cards
  const total = agencies.length;
  const active = agencies.filter((a) => a.status === "ACTIVE").length;
  const trial = agencies.filter((a) => a.status === "TRIAL").length;
  const deletionPending = agencies.filter((a) => a.status === "DELETION_PENDING").length;
  const suspended = agencies.filter((a) => a.status === "SUSPENDED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Agências</h1>
        <p className="mt-1 text-sm text-white/50">Gerencie todas as agências da plataforma.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: total, color: "bg-white/10 text-white" },
          { label: "Ativas", value: active, color: "bg-green-900/40 text-green-300" },
          { label: "Trial", value: trial, color: "bg-blue-900/40 text-blue-300" },
          { label: "Exclusão", value: deletionPending, color: "bg-red-900/40 text-red-300" },
          { label: "Suspensas", value: suspended, color: "bg-orange-900/40 text-orange-300" },
        ].map((c) => (
          <div key={c.label} className={`rounded-lg p-4 ${c.color}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs opacity-75 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail do owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/40"
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm text-white/80">
            <thead className="bg-white/5 text-xs text-white/50 uppercase tracking-wider">
              <tr>
                {["Nome", "Status", "Assinatura", "Trial Ends", "Owner", "Clientes", "Cotações", "Criado em", "Ações"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{a.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status]}`}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{a.subscriptionStatus}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmt(a.trialEndsAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-white/60">{a.ownerEmail ?? "—"}</td>
                  <td className="px-4 py-3 text-center">{a.customerCount}</td>
                  <td className="px-4 py-3 text-center">{a.quotationCount}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmt(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {a.status === "DELETION_PENDING" && (
                        <button
                          onClick={() => action(a.id, "cancel-deletion")}
                          disabled={actionLoading === `${a.id}-cancel-deletion`}
                          className="rounded px-2 py-1 text-xs bg-green-800/60 text-green-200 hover:bg-green-700/60 disabled:opacity-50 whitespace-nowrap"
                        >
                          Cancelar exclusão
                        </button>
                      )}
                      {a.status !== "SUSPENDED" && a.status !== "CANCELED" && a.status !== "DELETION_PENDING" && (
                        <button
                          onClick={() => action(a.id, "suspend")}
                          disabled={actionLoading === `${a.id}-suspend`}
                          className="rounded px-2 py-1 text-xs bg-orange-800/60 text-orange-200 hover:bg-orange-700/60 disabled:opacity-50"
                        >
                          Suspender
                        </button>
                      )}
                      {(a.status === "SUSPENDED" || a.status === "CANCELED") && (
                        <button
                          onClick={() => action(a.id, "reactivate")}
                          disabled={actionLoading === `${a.id}-reactivate`}
                          className="rounded px-2 py-1 text-xs bg-blue-800/60 text-blue-200 hover:bg-blue-700/60 disabled:opacity-50"
                        >
                          Reativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-white/30">
                    Nenhuma agência encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
