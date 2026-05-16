import { Suspense } from "react";
import { SolicitacaoPublicView } from "@/components/cotacao/SolicitacaoPublicView";

type PageProps = { params: Promise<{ slug: string }> };

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
