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
import { emptyDraftForm, toDraftInput, type DraftForm } from "@/lib/contracts/format";
import type { TemplateSummary } from "@/lib/contracts/types";
import type { Cliente } from "@/types";

function NewContract() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [customers, setCustomers] = useState<Cliente[] | null>(null);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [customerId, setCustomerId] = useState(params.get("customerId") ?? "");
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
        if (models.length === 1) setForm((f) => (f.templateId ? f : { ...f, templateId: models[0].id }));
      })
      .catch((e: Error) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [token]);

  const options = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return (customers ?? []).filter((c) => c.id === customerId || !term || `${c.nome} ${c.email ?? ""} ${c.telefone ?? ""}`.toLocaleLowerCase("pt-BR").includes(term)).slice(0, 200);
  }, [customers, search, customerId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!customerId) { setError("Escolha a pessoa do contrato."); return; }
    let input;
    try { input = toDraftInput(customerId, form); } catch (e) { setError(e instanceof Error ? e.message : "Revise os campos."); return; }
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
      {templates.length === 0 && customers !== null && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Nenhum modelo ativo. <Link href="/contratos/modelos" className="underline">Cadastre o modelo da agência</Link> antes de criar contratos.
        </p>
      )}
      <form onSubmit={submit}>
        <Card className="space-y-4">
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
          <DraftFields form={form} onChange={setForm} templates={templates} missing={[]} disabled={busy} />
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
