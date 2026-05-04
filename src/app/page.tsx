import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--hub-bg)]">
      <header className="border-b border-[var(--hub-border)] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--hub-yellow)] text-sm font-bold text-[var(--hub-blue-dark)]">
              AH
            </span>
            <span className="text-lg font-bold text-[var(--hub-blue-dark)]">
              AgenciaHub
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
            >
              Entrar
            </Link>
            <Link href="/login">
              <Button className="!py-2 text-sm">Testar plataforma</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-[var(--hub-border)] bg-gradient-to-br from-[var(--hub-blue-dark)] via-[var(--hub-blue)] to-[#1a5080] text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:flex lg:items-center lg:gap-12 lg:py-24 lg:px-8">
            <div className="max-w-xl flex-1">
              <p className="text-sm font-medium uppercase tracking-wide text-[var(--hub-yellow)]">
                Gestão para agências de viagem
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
                Seu financeiro e seus clientes no mesmo painel
              </h1>
              <p className="mt-4 text-lg text-white/85">
                O AgenciaHub concentra indicadores, carteira de clientes,
                atendimentos e fluxo de caixa em uma experiência simples e
                profissional — ideal para validar processos e crescer com
                controle.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/login">
                  <Button className="!px-6 !py-3 text-base">
                    Testar plataforma
                  </Button>
                </Link>
                <Link href="/login">
                  <button
                    type="button"
                    className="rounded-lg border-2 border-white/40 bg-transparent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Entrar
                  </button>
                </Link>
              </div>
            </div>
            <div className="mt-12 hidden flex-1 lg:block">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
                <p className="text-sm font-medium text-[var(--hub-yellow)]">
                  Visão do painel
                </p>
                <ul className="mt-4 space-y-3 text-sm text-white/90">
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--hub-yellow)]" />
                    Dashboard com faturamento e saldo do período
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--hub-yellow)]" />
                    Clientes e histórico de atendimento
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--hub-yellow)]" />
                    Lançamentos financeiros com categorias
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-[var(--hub-blue-dark)] lg:text-3xl">
            Por que usar o AgenciaHub
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            Foco em clareza financeira e organização comercial — sem ruído, para
            você apresentar o produto com confiança.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card>
              <CardTitle>Mais controle financeiro</CardTitle>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Entradas, saídas, categorias e status em um fluxo único. Veja o
                saldo do período e o que ainda está por receber.
              </p>
            </Card>
            <Card>
              <CardTitle>Carteira de clientes organizada</CardTitle>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Cadastro completo com destino de interesse e status. Busca e
                filtros para achar rapidamente quem precisa de follow-up.
              </p>
            </Card>
            <Card>
              <CardTitle>Operação centralizada</CardTitle>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Atendimentos ligados a clientes e funil com etapas claras. Tudo
                em um painel pensado para agências e agentes autônomos.
              </p>
            </Card>
          </div>
        </section>

        <section className="border-t border-[var(--hub-border)] bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 text-center lg:px-8">
            <h2 className="text-2xl font-bold text-[var(--hub-blue-dark)]">
              Pronto para demonstrar para sua agência?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Acesse o ambiente de demonstração com dados de exemplo e explore
              o fluxo completo.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/login">
                <Button className="!px-8 !py-3">Começar agora</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--hub-border)] bg-[var(--hub-blue-dark)] py-8 text-center text-sm text-white/70">
        <p>© {new Date().getFullYear()} AgenciaHub · MVP para validação</p>
      </footer>
    </div>
  );
}
