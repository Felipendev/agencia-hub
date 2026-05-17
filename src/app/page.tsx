import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo, LogoMarkOnly } from "@/components/ui/logo";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B1B2B]">
      {/* Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <Logo variant="dark" size="md" href="/" />
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 md:flex">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <Link href="/contato" className="hover:text-white transition-colors">Contato</Link>
            <Link href="/suporte" className="hover:text-white transition-colors">Suporte</Link>
            <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link href="/cadastro">
              <Button className="!py-2 text-sm !bg-[var(--hub-yellow)] !text-[var(--hub-blue-dark)] hover:!bg-[var(--hub-yellow-hover)]">
                Criar conta grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1B2B] via-[#102030] to-[#0B1B2B]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[var(--hub-blue)]/15 blur-[120px]" />
          <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-[var(--hub-yellow)]/8 blur-[100px]" />

          <div className="relative mx-auto max-w-6xl px-4 py-20 lg:flex lg:items-center lg:gap-16 lg:py-32 lg:px-8">
            {/* Left: Text content */}
            <div className="max-w-xl flex-1">
              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white lg:text-5xl xl:text-6xl">
                Simplicidade na gestão da sua agência
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-white/70">
                Tenha o controle total da sua agência de viagens. Clientes, cotações, financeiro e equipe — tudo em um único painel inteligente.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/cadastro">
                  <Button className="!px-8 !py-3.5 text-base !bg-[var(--hub-yellow)] !text-[var(--hub-blue-dark)] shadow-lg shadow-[var(--hub-yellow)]/30 hover:!bg-[var(--hub-yellow-hover)]">
                    Criar conta
                  </Button>
                </Link>
                <Link href="/login">
                  <button
                    type="button"
                    className="rounded-[var(--hub-radius)] border border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 hover:border-white/30"
                  >
                    Já tenho conta
                  </button>
                </Link>
              </div>
            </div>

            {/* Right: Visual illustration */}
            <div className="mt-16 hidden flex-1 lg:block">
              <div className="relative">
                {/* Main dashboard mockup */}
                <div className="rounded-[var(--hub-radius-xl)] border border-white/10 bg-white/5 p-1 shadow-2xl shadow-black/40 backdrop-blur-sm">
                  <div className="rounded-[var(--hub-radius-lg)] bg-[#0d1f33] p-6">
                    {/* Top bar */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-400/60" />
                        <div className="h-3 w-3 rounded-full bg-[var(--hub-yellow)]/60" />
                        <div className="h-3 w-3 rounded-full bg-emerald-400/60" />
                      </div>
                      <div className="h-4 w-32 rounded bg-white/10" />
                    </div>
                    {/* Dashboard content */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-[var(--hub-radius)] bg-white/5 p-3">
                        <div className="text-[10px] text-white/40">Cotações</div>
                        <div className="mt-1 text-lg font-bold text-white">24</div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                          <div className="h-full w-3/4 rounded-full bg-[var(--hub-yellow)]" />
                        </div>
                      </div>
                      <div className="rounded-[var(--hub-radius)] bg-white/5 p-3">
                        <div className="text-[10px] text-white/40">Clientes</div>
                        <div className="mt-1 text-lg font-bold text-white">156</div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                          <div className="h-full w-2/3 rounded-full bg-sky-400" />
                        </div>
                      </div>
                      <div className="rounded-[var(--hub-radius)] bg-white/5 p-3">
                        <div className="text-[10px] text-white/40">Faturamento</div>
                        <div className="mt-1 text-lg font-bold text-emerald-400">R$ 48k</div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                          <div className="h-full w-4/5 rounded-full bg-emerald-400" />
                        </div>
                      </div>
                    </div>
                    {/* Chart area */}
                    <div className="mt-4 rounded-[var(--hub-radius)] bg-white/5 p-4">
                      <div className="flex items-end justify-between gap-1 h-20">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-gradient-to-t from-[var(--hub-blue)] to-[var(--hub-yellow)]/80"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating cards */}
                <div className="absolute -left-8 top-8 rounded-[var(--hub-radius-lg)] border border-white/10 bg-[#0d1f33]/90 p-3 shadow-xl backdrop-blur-sm animate-[float_6s_ease-in-out_infinite]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20">
                      <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/50">Destino</div>
                      <div className="text-xs font-semibold text-white">Paris, França</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-4 bottom-16 rounded-[var(--hub-radius-lg)] border border-white/10 bg-[#0d1f33]/90 p-3 shadow-xl backdrop-blur-sm animate-[float_5s_ease-in-out_infinite_1s]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                      <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/50">Cotação aprovada</div>
                      <div className="text-xs font-semibold text-emerald-400">+R$ 12.500</div>
                    </div>
                  </div>
                </div>

                {/* Airplane SVG */}
                <div className="absolute -right-2 -top-6 text-white/20">
                  <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="funcionalidades" className="relative border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-white lg:text-3xl">
              Tudo que sua agência precisa
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-white/50">
              Ferramentas pensadas para o dia a dia de agências de viagem e agentes autônomos.
            </p>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                  ),
                  title: "Gestão de Clientes",
                  desc: "Carteira organizada com destinos de interesse, histórico e status. Encontre qualquer cliente em segundos.",
                },
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  ),
                  title: "Cotações Inteligentes",
                  desc: "Kanban visual com drag-and-drop. Crie, acompanhe e envie cotações profissionais por WhatsApp.",
                },
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                    </svg>
                  ),
                  title: "Controle Financeiro",
                  desc: "Entradas, saídas, comissões e saldo em tempo real. Saiba exatamente quanto sua agência fatura.",
                },
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                  ),
                  title: "Equipe de Vendedores",
                  desc: "Convide vendedores, acompanhe comissões e gerencie permissões. Cada um vê apenas seus dados.",
                },
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  ),
                  title: "Segurança e LGPD",
                  desc: "Dados isolados por agência, criptografia, verificação por e-mail e conformidade com a LGPD.",
                },
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                    </svg>
                  ),
                  title: "Dashboard Inteligente",
                  desc: "Métricas em tempo real: cotações abertas, aprovadas, faturamento do mês e desempenho da equipe.",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group rounded-[var(--hub-radius-lg)] border border-white/10 bg-white/5 p-6 transition-all hover:border-[var(--hub-yellow)]/30 hover:bg-white/[0.07]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--hub-radius)] bg-[var(--hub-yellow)]/10 text-[var(--hub-yellow)] transition-colors group-hover:bg-[var(--hub-yellow)]/20">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="planos" className="relative border-t border-white/5">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--hub-blue-dark)]/50 to-transparent" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 text-center lg:px-8">
            <h2 className="text-2xl font-bold text-white lg:text-3xl">
              Pronto para transformar sua agência?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/50">
              Entre em contato para saber mais sobre a plataforma.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link href="/contato">
                <Button className="!px-10 !py-4 text-base !bg-[var(--hub-yellow)] !text-[var(--hub-blue-dark)] shadow-lg shadow-[var(--hub-yellow)]/30 hover:!bg-[var(--hub-yellow-hover)]">
                  Entrar em contato
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row lg:px-8">
          <Logo variant="dark" size="sm" href="/" />
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/termos" className="hover:text-white/70 transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-white/70 transition-colors">Privacidade</Link>
          </div>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} FELTRIX LTDA - ME
          </p>
        </div>
      </footer>
    </div>
  );
}
