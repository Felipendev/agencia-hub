"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RestoreIcon } from "@/components/icons";
import {
  listDeletedQuotations,
  listDeletedCustomers,
  restoreQuotation,
  restoreCustomer,
} from "@/lib/api/soft-delete-remote";
import { formatDateBR } from "@/lib/format";
import type { ApiQuotationResponse } from "@/lib/api/quotation-types";
import type { ApiCustomerResponse } from "@/lib/api/customer-types";

type Tab = "cotacoes" | "clientes";

export default function LixeiraPage() {
  const { token } = useAuth();
  const { hasRemoteApi } = useData();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("cotacoes");
  const [quotations, setQuotations] = useState<ApiQuotationResponse[]>([]);
  const [customers, setCustomers] = useState<ApiCustomerResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!hasRemoteApi || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [q, c] = await Promise.all([
        listDeletedQuotations(token),
        listDeletedCustomers(token),
      ]);
      setQuotations(q ?? []);
      setCustomers(c ?? []);
    } catch (e) {
      toast.error("Erro ao carregar itens da lixeira.");
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [token, hasRemoteApi, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRestoreQuotation = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await restoreQuotation(id, token);
        setQuotations((prev) => prev.filter((q) => q.id !== id));
        toast.success("Cotação restaurada com sucesso.");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Erro ao restaurar cotação.",
        );
      }
    },
    [token, toast],
  );

  const handleRestoreCustomer = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await restoreCustomer(id, token);
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        toast.success("Cliente restaurado com sucesso.");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Erro ao restaurar cliente.",
        );
      }
    },
    [token, toast],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">
          Lixeira
        </h1>
        <p className="mt-1 text-slate-600">
          Itens excluídos podem ser restaurados a qualquer momento.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[var(--hub-border)] bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setTab("cotacoes")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "cotacoes"
              ? "bg-white text-[var(--hub-blue-dark)] shadow-sm"
              : "text-slate-600 hover:text-[var(--hub-blue-dark)]"
          }`}
        >
          Cotações ({quotations.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("clientes")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "clientes"
              ? "bg-white text-[var(--hub-blue-dark)] shadow-sm"
              : "text-slate-600 hover:text-[var(--hub-blue-dark)]"
          }`}
        >
          Clientes ({customers.length})
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando…</p>
      ) : !hasRemoteApi ? (
        <Card>
          <p className="py-8 text-center text-sm text-slate-500">
            Nenhum item na lixeira.
          </p>
        </Card>
      ) : tab === "cotacoes" ? (
        <Card>
          {quotations.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Nenhuma cotação na lixeira.
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Título</Th>
                  <Th>Destino</Th>
                  <Th>Cliente</Th>
                  <Th>Excluído em</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id}>
                    <Td className="font-medium text-[var(--hub-blue-dark)]">
                      {q.title}
                    </Td>
                    <Td>{q.destination}</Td>
                    <Td>{q.customerName ?? "—"}</Td>
                    <Td className="whitespace-nowrap text-slate-500">
                      {q.deletedAt
                        ? formatDateBR(q.deletedAt.toString().slice(0, 10))
                        : "—"}
                    </Td>
                    <Td>
                      <Button
                        variant="secondary"
                        className="gap-1.5 text-xs"
                        onClick={() => handleRestoreQuotation(q.id)}
                      >
                        <RestoreIcon className="h-3.5 w-3.5" />
                        Restaurar
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      ) : (
        <Card>
          {customers.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Nenhum cliente na lixeira.
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>E-mail</Th>
                  <Th>Destino de interesse</Th>
                  <Th>Excluído em</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-medium text-[var(--hub-blue-dark)]">
                      {c.name}
                    </Td>
                    <Td>{c.email}</Td>
                    <Td>{c.interestDestination}</Td>
                    <Td className="whitespace-nowrap text-slate-500">
                      {c.deletedAt
                        ? formatDateBR(c.deletedAt.toString().slice(0, 10))
                        : "—"}
                    </Td>
                    <Td>
                      <Button
                        variant="secondary"
                        className="gap-1.5 text-xs"
                        onClick={() => handleRestoreCustomer(c.id)}
                      >
                        <RestoreIcon className="h-3.5 w-3.5" />
                        Restaurar
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
