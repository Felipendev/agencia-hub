import Link from "next/link";

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[var(--hub-bg-subtle)]">
      <header className="border-b border-[var(--hub-border)] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--hub-radius)] bg-[var(--hub-yellow)] text-xs font-bold text-[var(--hub-blue-dark)]">
              AH
            </span>
            <span className="text-lg font-bold text-[var(--hub-blue-dark)]">AgênciasHub</span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold text-[var(--hub-blue-dark)]">
          Termos de Uso
        </h1>
        <p className="mt-2 text-sm text-[var(--hub-text-muted)]">Última atualização: Janeiro 2025 — Versão 1.0.0</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--hub-text-primary)]">
          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">1. Partes e Objeto</h2>
            <p className="mt-2">
              Estes Termos de Uso regulam a relação entre a FELTRIX LTDA - ME, inscrita no CNPJ sob o nº 43.984.680/0001-38
              (&quot;Plataforma&quot;), e a agência de viagens contratante (&quot;Agência&quot;), para uso do sistema AgênciasHub,
              uma plataforma SaaS de gestão para agências de viagens.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">2. Licenciamento</h2>
            <p className="mt-2">
              A Plataforma concede à Agência uma licença não exclusiva, intransferível e revogável para uso do sistema
              AgênciasHub durante a vigência da assinatura, conforme o plano contratado.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">3. Período de Teste (Trial)</h2>
            <p className="mt-2">
              Toda nova Agência recebe um período gratuito de 10 (dez) dias para avaliação do sistema.
              Após o término do período de teste, o acesso será suspenso até a contratação de um plano pago.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">4. Proteção de Dados (LGPD)</h2>
            <p className="mt-2">
              A Plataforma atua como operadora de dados pessoais em nome da Agência (controladora).
              Os dados inseridos pela Agência são de sua propriedade e responsabilidade.
              A Plataforma adota medidas técnicas e organizacionais para proteger os dados conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">5. Disponibilidade e SLA</h2>
            <p className="mt-2">
              A Plataforma se compromete com disponibilidade mínima de 99,5% ao mês, excluindo manutenções programadas
              comunicadas com antecedência mínima de 24 horas.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">6. Propriedade Intelectual</h2>
            <p className="mt-2">
              Todo o código-fonte, design, marca e tecnologia do AgênciasHub são de propriedade exclusiva da FELTRIX LTDA - ME.
              A Agência não adquire nenhum direito de propriedade intelectual sobre o sistema.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">7. Limitação de Responsabilidade</h2>
            <p className="mt-2">
              A Plataforma não se responsabiliza por danos indiretos, lucros cessantes ou perda de dados decorrentes
              de uso indevido do sistema pela Agência ou seus usuários.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">8. Cancelamento</h2>
            <p className="mt-2">
              A Agência pode solicitar o cancelamento a qualquer momento. Após o cancelamento, os dados permanecerão
              disponíveis para exportação por 30 (trinta) dias, após os quais serão permanentemente excluídos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">9. Foro</h2>
            <p className="mt-2">
              Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes destes Termos.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
