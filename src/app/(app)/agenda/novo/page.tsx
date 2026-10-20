"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppointmentFields, toInput, type AppointmentForm, type Option } from "@/components/agenda/appointment-form";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import { agendaApi } from "@/lib/agenda/api";
import { isProduct } from "@/lib/agenda/format";
import { AGENCY_ZONE, todayIn } from "@/lib/agenda/time";
import type { Member } from "@/lib/agenda/types";

function NewAppointment() {
  const { token, user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const initialProduct = params.get("product");
  const [form, setForm] = useState<AppointmentForm>({
    // Sem produto na URL, a pessoa escolhe: nunca é deduzido do cadastro.
    product: isProduct(initialProduct) ? initialProduct : "",
    customerId: params.get("customerId") ?? "", tripId: "", title: "", purpose: "", date: todayIn(), time: "",
    durationMinutes: "60", timeZone: AGENCY_ZONE, format: "", location: "", meetingUrl: "", responsibleId: "",
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [customers, setCustomers] = useState<Option[] | null>(null);
  // Viagens guardadas com a pessoa a que pertencem; ao trocar de pessoa, a lista anterior não aparece.
  const [trips, setTrips] = useState<{ customerId: string; options: Option[] }>({ customerId: "", options: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Mesma chave em reenvios do mesmo formulário: a API devolve o compromisso já criado.
  const requestKey = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([agendaApi.members(token), listCustomersRemote(token)])
      .then(([team, people]) => {
        if (!active) return;
        setMembers(team);
        setCustomers(people.map((c) => ({ id: c.id, label: c.email ? `${c.nome} · ${c.email}` : c.nome })));
        const me = team.find((m) => m.id === user?.id);
        if (me) setForm((f) => (f.responsibleId ? f : { ...f, responsibleId: me.id }));
      })
      .catch((e: Error) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [token, user?.id]);

  useEffect(() => {
    const customerId = form.customerId;
    if (!token || !customerId || form.product !== "TRAVEL") return;
    agendaApi.tripsOf(token, customerId)
      .then((rows) => setTrips({ customerId, options: rows.map((t) => ({ id: t.id, label: `${t.serviceType}${t.bookingLocator ? ` · ${t.bookingLocator}` : ""}${t.travelStartDate ? ` · ${t.travelStartDate.split("-").reverse().join("/")}` : ""}` })) }))
      .catch(() => setTrips({ customerId, options: [] }));
  }, [token, form.customerId, form.product]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    let input;
    try { input = toInput(form); } catch (e) { setError(e instanceof Error ? e.message : "Revise os campos."); return; }
    setBusy(true);
    try {
      const created = await agendaApi.create(token, requestKey.current, input);
      router.push(`/agenda/${created.appointment.id}?criado=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar o compromisso.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Novo compromisso" description="Agende um atendimento com a pessoa. A ata é registrada depois, no próprio compromisso.">
        <Link href="/agenda" className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--hub-bg-subtle)]">Voltar</Link>
      </PageHeader>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <form onSubmit={submit}>
        <Card className="space-y-4">
          <AppointmentFields form={form} onChange={setForm} members={members} customers={customers} trips={trips.customerId === form.customerId ? trips.options : []} editing={false} disabled={busy} />
          <Button type="submit" disabled={busy || !token}>{busy ? "Agendando…" : "Agendar"}</Button>
        </Card>
      </form>
    </div>
  );
}

export default function NovoCompromissoPage() {
  return <Suspense fallback={<p className="text-sm text-[var(--hub-text-muted)]">Carregando…</p>}><NewAppointment /></Suspense>;
}
