import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function SuportePage() {
  return (
    <div className="min-h-screen bg-[var(--hub-bg-subtle)]">
      <header className="border-b border-[var(--hub-border)] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Logo variant="light" size="md" href="/" />
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">Suporte</h1>
        <p className="mt-2 text-sm text-[var(--hub-text-secondary)]">
          Canais de atendimento disponíveis para você.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {/* WhatsApp */}
          <div className="rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-6 w-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <h2 className="mt-4 text-base font-semibold text-[var(--hub-blue-dark)]">WhatsApp</h2>
            <p className="mt-2 text-sm text-[var(--hub-text-secondary)]">
              Nossa equipe está disponível de segunda a sexta, das 9h às 18h.
            </p>
            <a
              href="https://wa.me/5531982615986"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-[var(--hub-radius)] bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Chamar
            </a>
          </div>

          {/* E-mail */}
          <div className="rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
              <svg className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="mt-4 text-base font-semibold text-[var(--hub-blue-dark)]">E-mail</h2>
            <p className="mt-2 text-sm text-[var(--hub-text-secondary)]">
              Entre em contato pelo e-mail: contato@agenciashub.com.br
            </p>
            <a
              href="mailto:contato@agenciashub.com.br"
              className="mt-4 inline-flex items-center gap-2 rounded-[var(--hub-radius)] bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
            >
              Enviar e-mail
            </a>
          </div>

          {/* Formulário de Contato */}
          <div className="rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h2 className="mt-4 text-base font-semibold text-[var(--hub-blue-dark)]">Formulário de Contato</h2>
            <p className="mt-2 text-sm text-[var(--hub-text-secondary)]">
              Envie sua dúvida pelo formulário e receba retorno personalizado.
            </p>
            <Link
              href="/contato"
              className="mt-4 inline-flex items-center gap-2 rounded-[var(--hub-radius)] bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
            >
              Acessar formulário
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
