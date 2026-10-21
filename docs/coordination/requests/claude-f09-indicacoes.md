# Solicitações de integração — F09 Indicações (Claude → Codex)

Especificação: `docs/coordination/claude/f09-indicacoes.md`. Branch `claude/f09-indicacoes` nos dois repositórios. Os arquivos abaixo **não** são alterados nessa branch.

## 0. Reserva de migration — bloqueia o SQL

Pedido: reservar **um** arquivo para F09 em `docs/migrations-reservadas-2026-10-15.md`, depois da V62 (F10). Sugestão: **V63**, `V63__referrals.sql`, branch `claude/f09-indicacoes`, a publicar depois da V62.

Conteúdo previsto (aditivo, sem alterar tabelas existentes):
- `referrals`:
  - indicador e indicado com FK para `customers`, ou contato do indicado ainda sem cadastro;
  - responsável com FK para `users`;
  - venda opcional com FK para `sales`;
  - produto `TRAVEL`/`MILES`, estado, versão e motivo;
  - índice único parcial (`agency_id`, `product`, `referred_customer_id`) para indicações não canceladas.
- `referral_events`: auditoria sem FK de indicação, para preservar exclusões.

Até a reserva, só entram na branch domínio puro, interface e testes que não dependem do schema.

## 1. Middleware — `src/middleware.ts`

Adicionar `"/indicacoes"` em `PROTECTED_PREFIXES` e `"/indicacoes", "/indicacoes/:path*"` em `config.matcher`.

## 2. Menu — `src/components/layout/dashboard-shell.tsx`

Como a indicação tem produto explícito, sugiro um item em cada grupo, para dono e vendedor:
- Viagens: **Indicações** → `/indicacoes?product=TRAVEL`
- Milhas: **Indicações** → `/indicacoes?product=MILES`

A alternativa é um único item em Principal, perto de Agenda e atas, para `/indicacoes`; a lista tem filtro de produto. As duas formas funcionam.

## 3. Atalhos nas páginas da pessoa

- Viagens, `src/app/(app)/clientes/[id]/page.tsx`: "Indicações" → `/indicacoes?customerId=${id}&product=TRAVEL` e "Registrar indicação feita por esta pessoa" → `/indicacoes/nova?referrerId=${id}&product=TRAVEL`.
- Milhas, `src/app/(app)/milhas/clientes/[id]/page.tsx`: os mesmos links com `product=MILES`.

O produto vem do contexto da página, nunca do cadastro.

## 4. API — arquivos centrais (depois da reserva)

- **`GlobalExceptionHandler.handleDataIntegrity`:** as FKs `referrals.referrer_customer_id` e `referrals.referred_customer_id` **não** terão cascata, para preservar o histórico das indicações, que é base de futuros créditos.
  - Sugestão para a FK do indicador ou do indicado: 409 `REFERRAL_HISTORY_EXISTS` — "Esta pessoa participa de indicações. Cancele ou exclua as indicações antes de excluir a pessoa."
  - `referrals.responsible_id`, ao remover usuário: "Este usuário é responsável por indicações. Altere o responsável antes de removê-lo." A alternativa é `ON DELETE SET NULL`, se o Codex preferir; me avise para eu ajustar a migration.
  - `referrals.sale_id` usará `ON DELETE SET NULL`: excluir a venda remove só a evidência, e o histórico registra.
- **`AgencyDeletionScheduler`:** apagar `referral_events` e `referrals` da agência **antes** de vendas, pessoas e usuários.
- **`ProcessDataDeletionRequest`:** a indicação guarda nome, telefone e e-mail de quem ainda não é cliente, além de observações livres. Proposta: seguir a regra de contratos e agenda e manter a solicitação pendente quando a pessoa participar de indicações, até a decisão de retenção ou anonimização. Contatos de não clientes podem ser anonimizados pela própria indicação, numa extensão futura.

## 5. Decisões de negócio pendentes (não implementadas)

Créditos de indicação dependem de:
- gatilho: cadastro, venda aprovada ou pagamento confirmado;
- valor ou percentual e limite;
- produto ou campanha;
- forma de resgate (abatimento em venda, pagamento, outro);
- regra de estorno em cancelamento ou reembolso.

Quando essas regras forem definidas, o crédito entra em PR próprio, ligado às indicações `CONVERTED` e ao financeiro por operação explícita.
