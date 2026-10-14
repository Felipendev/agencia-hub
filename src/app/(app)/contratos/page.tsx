"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { contractsApi } from "@/lib/contracts/api";
import { PRODUCT_LABEL, STATUS_LABEL, STATUS_TONE, formatDay, formatMoney, formatMoment, isProduct } from "@/lib/contracts/format";
import type { ContractStatus, ContractSummary, Product } from "@/lib/contracts/types";

const linkButton =
  "inline-flex items-center justify-center rounded-[var(--hub-radius)] px-4 py-2 text-sm font-medium transition-colors";

function ContractsList() {
  const { token } = useAuth();
  const params = useSearchParams();
  const customerId = params.get("customerId") ?? "";
  const [rows, setRows] = useState<ContractSummary[] | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"" | ContractStatus>("");
  const initialProduct = params.get("product");
  const [product, setProduct] = useState<"" | Product>(isProduct(initialProduct) ? initialProduct : "");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    contractsApi
      .list(token, { customerId: customerId || undefined })
      .then((data) => { if (active) { setRows(data); setError(""); } })
      .catch((e: Error) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [token, customerId]);

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return (rows ?? []).filter((row) => (!status || row.status === status) && (!product || row.product === product)
      && (!term || `${row.title} ${row.customerName} ${row.planName ?? ""}`.toLocaleLowerCase("pt-BR").includes(term)));
  }, [rows, status, product, search]);

  const newQuery = new URLSearchParams();
  if (customerId) newQuery.set("customerId", customerId);
  if (product) newQuery.set("product", product);
  const newHref = `/contratos/novo${newQuery.size ? `?${newQuery}` : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Contratos" description="Rascunhos preenchidos com os dados da pessoa, documentos emitidos com versão e acompanhamento até a assinatura.">
        <Link href="/contratos/modelos" className={`${linkButton} border border-[var(--hub-border)] bg-white hover:bg-[var(--hub-bg-subtle)]`}>Modelos</Link>
        <Link href={newHref} className={`${linkButton} bg-[var(--hub-blue-dark)] text-white hover:bg-[var(--hub-blue)]`}>Novo contrato</Link>
      </PageHeader>

      {customerId && (
        <p className="text-sm text-[var(--hub-text-secondary)]">
          Mostrando os contratos de uma pessoa. <Link href="/contratos" className="underline">Ver todos</Link>
        </p>
      )}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Input aria-label="Buscar contratos" placeholder="Buscar por título, pessoa ou plano" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <select aria-label="Filtrar produto" className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm" value={product} onChange={(e) => setProduct(e.target.value as "" | Product)}>
          <option value="">Viagens e Milhas</option>
          <option value="TRAVEL">Viagens</option>
          <option value="MILES">Milhas</option>
        </select>
        <select aria-label="Filtrar status" className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value as "" | ContractStatus)}>
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_LABEL) as ContractStatus[]).map((key) => <option key={key} value={key}>{STATUS_LABEL[key]}</option>)}
        </select>
      </div>

      {rows === null && !error && <p className="text-sm text-[var(--hub-text-muted)]">Carregando contratos…</p>}
      {rows !== null && visible.length === 0 && (
        <p className="rounded-lg border border-dashed border-[var(--hub-border)] p-6 text-center text-sm text-[var(--hub-text-muted)]">
          {rows.length === 0 ? "Nenhum contrato ainda. Cadastre um modelo da agência e crie o primeiro rascunho." : "Nenhum contrato encontrado com esses filtros."}
        </p>
      )}

      {visible.length > 0 && (
        <div className="overflow-x-auto rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-[var(--hub-bg-subtle)] text-left text-xs text-[var(--hub-text-muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">Contrato</th>
                <th className="px-4 py-2 font-medium">Produto</th>
                <th className="px-4 py-2 font-medium">Pessoa</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Valor</th>
                <th className="px-4 py-2 font-medium">Vigência</th>
                <th className="px-4 py-2 font-medium">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="border-t border-[var(--hub-border)]">
                  <td className="px-4 py-3">
                    <Link href={`/contratos/${row.id}`} className="font-medium text-[var(--hub-blue-dark)] hover:underline">{row.title}</Link>
                    <p className="text-xs text-[var(--hub-text-muted)]">{row.templateName} · modelo v{row.templateVersion}{row.latestDocumentVersion ? ` · documento v${row.latestDocumentVersion}` : ""}</p>
                  </td>
                  <td className="px-4 py-3">{PRODUCT_LABEL[row.product]}</td>
                  <td className="px-4 py-3">{row.customerName}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                    {row.status === "DRAFT" && row.latestDocumentVersion && !row.documentCurrent && (
                      <p className="mt-1 text-xs text-amber-700">Alterado após o último documento</p>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatMoney(row.price)}</td>
                  <td className="px-4 py-3">{formatDay(row.startDate)}{row.endDate ? ` a ${formatDay(row.endDate)}` : ""}</td>
                  <td className="px-4 py-3 text-xs text-[var(--hub-text-muted)]">{formatMoment(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ContratosPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--hub-text-muted)]">Carregando contratos…</p>}>
      <ContractsList />
    </Suspense>
  );
}
