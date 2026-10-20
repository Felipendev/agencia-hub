"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api/authenticated-fetch";
import { BackButton } from "@/components/ui/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { MilesWallet } from "@/components/cliente/MilesWallet";

function MilesCustomer({ id }: { id: string }) {
  const { token } = useAuth();
  const [person, setPerson] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<{ id: string; name: string }>(
      `/customers/${id}`,
      { signal: controller.signal },
      token,
    )
      .then(setPerson)
      .catch((e: Error) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [id, token]);
  return (
    <div className="space-y-5">
      <BackButton href="/milhas" label="Milhas" />
      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      ) : person ? (
        <>
          <PageHeader
            title={person.name}
            description="Perfil do produto Milhas · contas, acúmulo e planejamento."
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-[var(--hub-text-secondary)]">
              Nome e contatos pertencem ao cadastro compartilhado da pessoa. O
              acompanhamento de milhas tem histórico próprio.
            </p>
            <Link
              href={`/clientes/${person.id}`}
              className="font-medium text-[var(--hub-blue)] hover:underline"
            >
              Cadastro da pessoa e viagens →
            </Link>
          </div>
          <MilesWallet key={person.id} customerId={person.id} defaultOpen />
          <div className="flex flex-wrap gap-4 text-sm">
            <Link className="text-[var(--hub-blue)] hover:underline" href={`/agenda?customerId=${person.id}&product=MILES`}>Agenda de Milhas</Link>
            <Link className="text-[var(--hub-blue)] hover:underline" href={`/agenda/novo?customerId=${person.id}&product=MILES`}>Novo compromisso de Milhas</Link>
          </div>
          <div className="flex flex-wrap gap-4 text-sm"><Link className="text-[var(--hub-blue)] hover:underline" href={`/contratos?customerId=${person.id}&product=MILES`}>Contratos de Milhas</Link><Link className="text-[var(--hub-blue)] hover:underline" href={`/contratos/novo?customerId=${person.id}&product=MILES`}>Novo contrato de Milhas</Link></div>
          <Link className="text-sm text-[var(--hub-blue)] hover:underline" href={`/milhas/tarefas?customerId=${person.id}`}>Tarefas de Milhas</Link>
        </>
      ) : (
        <p role="status">Carregando a pessoa…</p>
      )}
    </div>
  );
}
export default function MilesCustomerPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <MilesCustomer key={id} id={id} />;
}
