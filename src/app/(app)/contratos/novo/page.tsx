"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DraftFields } from "@/components/contratos/draft-fields";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import { contractsApi } from "@/lib/contracts/api";
import { PRODUCT_LABEL, emptyDraftForm, isProduct, toDraftInput, type DraftForm } from "@/lib/contracts/format";
import type { Product, TemplateSummary } from "@/lib/contracts/types";
import type { Cliente } from "@/types";

function NewContract() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [customers, setCustomers] = useState<Cliente[] | null>(null);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [customerId, setCustomerId] = useState(params.get("customerId") ?? "");
  const initialProduct = params.get("product");
  // Sem produto na URL, a pessoa escolhe: o produto nunca é deduzido do cadastro.
  const [product, setProduct] = useState<Product | "">(isProduct(initialProduct) ? initialProduct : "");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<DraftForm>(emptyDraftForm());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Mesma chave em reenvios do mesmo formulário: a API devolve o rascunho já criado.
  const requestKey = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([listCustomersRemote(token), contractsApi.listTemplates(token)])
      .then(([people, models]) => {
        if (!active) return;
        setCustomers(people);
        setTemplates(models);

      })
      .catch((e: Error) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [token]);

  const productTemplates = useMemo(() => templates.filter((t) => t.product === product), [templates, product]);

  function chooseProduct(next: Product | "") {
    setProduct(next);
    const available = templates.filter((t) => t.product === next);
    setForm((f) => ({ ...f, templateId: available.length === 1 ? available[0].id : "", templateVersion: null }));
  }

  const options = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return (customers ?? []).filter((c) => c.id === customerId || !term || `${c.nome} ${c.email ?? ""} ${c.telefone ?? ""}`.toLocaleLowerCase("pt-BR").includes(term)).slice(0, 200);
  }, [customers, search, customerId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!customerId) { setError("Escolha a pessoa do contrato."); return; }
    let input;
    try { input = toDraftInput(customerId, product, form); } catch (e) { setError(e instanceof Error ? e.message : "Revise os campos."); return; }
    setBusy(true);
    try {
      const created = await contractsApi.create(token, requestKey.current, input);
      router.push(`/contratos/${created.contract.id}?criado=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar o rascunho.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Novo contrato" description="O rascunho usa os dados atuais do cadastro da pessoa e da agência. Você revisa antes de gerar o documento.">
        <Link href="/contratos" className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--hub-bg-subtle)]">Voltar</Link>
      </PageHeader>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {product && productTemplates.length === 0 && customers !== null && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Nenhum modelo ativo de {PRODUCT_LABEL[product]}. <Link href="/contratos/modelos" className="underline">Cadastre o modelo da agência</Link> antes de criar contratos.
        </p>
      )}
      <form onSubmit={submit}>
        <Card className="space-y-4">
          <fieldset>
            <legend className="mb-1.5 text-xs font-medium text-[var(--hub-text-secondary)]">Produto <span aria-hidden="true" className="text-red-600">*</span></legend>
            <div className="flex flex-wrap gap-2">
              {(["TRAVEL", "MILES"] as Product[]).map((value) => (
                <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-[var(--hub-radius)] border px-3 py-2 text-sm ${product === value ? "border-[var(--hub-blue)] bg-[var(--hub-blue)]/5" : "border-[var(--hub-border)]"}`}>
                  <input type="radio" name="product" value={value} checked={product === value} disabled={busy} onChange={() => chooseProduct(value)} />
                  {PRODUCT_LABEL[value]}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-[var(--hub-text-muted)]">A mesma pessoa pode ter contratos de Viagens e de Milhas, com vigência e cancelamento independentes.</p>
          </fieldset>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="customer-search">Buscar pessoa</Label>
              <Input id="customer-search" placeholder="Nome, e-mail ou telefone" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="customer" required>Pessoa</Label>
              <select id="customer" required className="h-10 w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">{customers === null ? "Carregando pessoas…" : "Escolha a pessoa"}</option>
                {options.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.email ? ` · ${c.email}` : ""}</option>)}
              </select>
            </div>
          </div>
          <DraftFields form={form} onChange={setForm} templates={productTemplates} missing={[]} disabled={busy || !product} />
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || !token}>{busy ? "Criando…" : "Criar rascunho"}</Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

export default function NovoContratoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--hub-text-muted)]">Carregando…</p>}>
      <NewContract />
    </Suspense>
  );
}
