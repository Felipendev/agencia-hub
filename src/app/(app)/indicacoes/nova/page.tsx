"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReferralFields, type Option } from "@/components/referrals/referral-form";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import { todayIn } from "@/lib/agenda/time";
import { referralsApi } from "@/lib/referrals/api";
import { emptyForm, isProduct, toInput, type ReferralForm } from "@/lib/referrals/format";
import type { Member } from "@/lib/referrals/types";

function NewReferral() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const today = todayIn();
  const initialProduct = params.get("product");
  // Sem produto na URL, a pessoa escolhe: nunca é deduzido do cadastro.
  const [form, setForm] = useState<ReferralForm>(emptyForm(today, isProduct(initialProduct) ? initialProduct : "", params.get("referrerId") ?? ""));
  const [people, setPeople] = useState<Option[] | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Mesma chave em reenvios do mesmo formulário: a API devolve a indicação já criada.
  const requestKey = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    if (!token) return;
    let active = true;
    listCustomersRemote(token)
      .then((rows) => { if (active) setPeople(rows.map((c) => ({ id: c.id, label: c.telefone ? `${c.nome} · ${c.telefone}` : c.email ? `${c.nome} · ${c.email}` : c.nome }))); })
      .catch((e: Error) => { if (active) { setPeople([]); setError(e.message); } });
    referralsApi.members(token).then((m) => { if (active) setMembers(m); }).catch(() => undefined);
    return () => { active = false; };
  }, [token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    let input;
    try { input = toInput(form, today); } catch (e) { setError(e instanceof Error ? e.message : "Revise os campos."); return; }
    setBusy(true);
    try {
      const created = await referralsApi.create(token, requestKey.current, input);
      router.push(`/indicacoes/${created.referral.id}?criada=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível registrar a indicação.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Nova indicação" description="Registre quem indicou e quem foi indicado. O andamento é atualizado depois, na própria indicação.">
        <Link href="/indicacoes" className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--hub-bg-subtle)]">Voltar</Link>
      </PageHeader>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <form onSubmit={submit}>
        <Card className="space-y-4">
          <ReferralFields form={form} onChange={setForm} people={people} members={members} editing={false} disabled={busy} today={today} />
          <Button type="submit" disabled={busy || !token}>{busy ? "Registrando…" : "Registrar indicação"}</Button>
        </Card>
      </form>
    </div>
  );
}

export default function NovaIndicacaoPage() {
  return <Suspense fallback={<p className="text-sm text-[var(--hub-text-muted)]">Carregando…</p>}><NewReferral /></Suspense>;
}
