import { Suspense } from "react";
import type { Metadata } from "next";
import { SolicitacaoPublicView } from "@/components/cotacao/SolicitacaoPublicView";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { getPublicConfig } from "@/lib/solicitacao-server-store";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  let nomeMarca = "Agência de viagens";
  try {
    const base = getAgenciaHubApiBaseUrl();
    if (base) {
      const res = await fetch(`${base}/public/solicitacao-config/${encodeURIComponent(decodedSlug)}`);
      if (res.ok) {
        const data = await res.json() as { nomeMarca?: string };
        if (data.nomeMarca) nomeMarca = data.nomeMarca;
      }
    } else {
      const config = await getPublicConfig(decodedSlug);
      if (config.nomeMarca) nomeMarca = config.nomeMarca;
    }
  } catch { /* fallback já definido */ }
  return {
    title: `Solicitar orçamento — ${nomeMarca}`,
    description: `Preencha o formulário para solicitar sua cotação de viagem com ${nomeMarca}.`,
  };
}

export default async function SolicitacaoPublicPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_80%_-10%,rgba(56,189,248,0.08),transparent),radial-gradient(900px_500px_at_0%_100%,rgba(245,197,24,0.09),transparent),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
      <Suspense fallback={<div className="p-8 text-center text-[var(--hub-text-secondary)]">Carregando…</div>}>
        <SolicitacaoPublicView slug={decodeURIComponent(slug)} />
      </Suspense>
    </div>
  );
}
