import Link from "next/link";

export default function PrivacidadePage() {
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
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-[var(--hub-text-muted)]">Última atualização: Janeiro 2025 — Versão 1.0.0</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--hub-text-primary)]">
          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">1. Introdução</h2>
            <p className="mt-2">
              Esta Política de Privacidade descreve como a FELTRIX LTDA - ME, inscrita no CNPJ sob o nº 43.984.680/0001-38,
              coleta, utiliza, armazena e protege os dados pessoais dos usuários do sistema AgênciasHub,
              em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">2. Dados Coletados</h2>
            <p className="mt-2">Coletamos os seguintes dados pessoais:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Nome completo do proprietário e vendedores</li>
              <li>Endereço de e-mail</li>
              <li>Número de telefone/WhatsApp</li>
              <li>CNPJ da agência</li>
              <li>Endereço comercial</li>
              <li>Dados de acesso (senha armazenada com hash seguro)</li>
              <li>Endereço IP no momento do aceite dos termos</li>
              <li>Dados de uso do sistema (logs de acesso)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">3. Finalidade do Tratamento</h2>
            <p className="mt-2">Os dados são tratados para as seguintes finalidades:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Criação e manutenção de conta de usuário</li>
              <li>Autenticação e segurança do acesso</li>
              <li>Comunicação sobre o serviço (verificação de e-mail, recuperação de senha)</li>
              <li>Cumprimento de obrigações legais e regulatórias</li>
              <li>Melhoria contínua do serviço</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">4. Base Legal</h2>
            <p className="mt-2">
              O tratamento de dados pessoais é realizado com base no consentimento do titular (Art. 7º, I da LGPD)
              e na execução de contrato (Art. 7º, V da LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">5. Compartilhamento de Dados</h2>
            <p className="mt-2">
              Não compartilhamos dados pessoais com terceiros, exceto quando necessário para:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Prestação do serviço (provedores de infraestrutura e e-mail)</li>
              <li>Cumprimento de obrigação legal ou determinação judicial</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">6. Segurança</h2>
            <p className="mt-2">
              Adotamos medidas técnicas e organizacionais para proteger os dados pessoais, incluindo:
              criptografia em trânsito (HTTPS/TLS), hash seguro de senhas (BCrypt), controle de acesso
              baseado em roles e isolamento de dados por agência (multi-tenancy).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">7. Retenção de Dados</h2>
            <p className="mt-2">
              Os dados são mantidos enquanto a conta estiver ativa. Após cancelamento, os dados são mantidos
              por 30 dias para exportação e então permanentemente excluídos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">8. Direitos do Titular</h2>
            <p className="mt-2">
              Conforme a LGPD, o titular dos dados tem direito a: confirmação da existência de tratamento,
              acesso aos dados, correção de dados incompletos ou desatualizados, anonimização ou eliminação
              de dados desnecessários, portabilidade dos dados e revogação do consentimento.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--hub-blue-dark)]">9. Contato</h2>
            <p className="mt-2">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato
              pelo e-mail: contato@agenciashub.com.br
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
