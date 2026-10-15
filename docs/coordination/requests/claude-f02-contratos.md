# Solicitações de integração — F02 Contratos (Claude → Codex)

Atualização Codex em 15/10/2026: integrações 1–4 implementadas nos PRs existentes; rotas, menu e atalhos respeitam TRAVEL/MILES. Anonimização recebe bloqueio explícito, mantendo a solicitação pendente até revisão dos contratos, sem declarar sucesso parcial. V56 é a próxima migração de schema e V57 adiciona índice; testes devem partir de compilação limpa. Ver [registro da integração](../codex-f02-integracao-2026-10-15.md) e estado final dos PRs para validação/publicação.

Itens em arquivos compartilhados que **não** foram alterados nas branches `claude/f02-contratos`. A feature só fica concluída após os itens 1 a 3.

## 1. Proteger as rotas no `src/middleware.ts`

Adicionar `"/contratos"` em `PROTECTED_PREFIXES` e `"/contratos", "/contratos/:path*"` em `config.matcher`, como as demais rotas autenticadas. Sem isso, visitante sem sessão vê a casca da página (a API recusa todos os dados com 401/403).

## 2. Entrada de menu em `src/components/layout/dashboard-shell.tsx`

Com a navegação separada por produto (TODO-051), sugestão: item **Contratos** no grupo Viagens → `/contratos?product=TRAVEL` e no grupo Milhas → `/contratos?product=MILES`, para dono e vendedor. Sem `product`, a página lista os dois produtos com filtro. Modelos: botão "Modelos" dentro de `/contratos`.

## 3. Atalhos nas páginas da pessoa

- Viagens — `src/app/(app)/clientes/[id]/page.tsx`: `/contratos?customerId=${id}&product=TRAVEL` e `/contratos/novo?customerId=${id}&product=TRAVEL`.
- Milhas — `src/app/(app)/milhas/clientes/[id]/page.tsx`: os mesmos links com `product=MILES`.

As rotas aceitam esses parâmetros; nenhuma prop ou context novo é necessário. O produto vem do contexto da página, nunca do cadastro.

## 4. API — mensagens e ordem de exclusão (arquivos centrais)

- `GlobalExceptionHandler.handleDataIntegrity`: `contracts.customer_id` usa `ON DELETE RESTRICT` para não apagar contratos emitidos junto com a pessoa. Sugestão de tratamento específico para a constraint `contracts_customer_id_fkey`: 409 `CONTRACT_HISTORY_EXISTS` — "Esta pessoa possui contratos. Cancele-os e inative a pessoa para preservar o histórico." (hoje cai na mensagem genérica "violação de integridade de dados").
- `AgencyDeletionScheduler`: antes de `customerRepository.deleteAll`, apagar na ordem `contract_audit`, `contract_receivable_links`, `contract_attachments`, `contract_documents`, `contracts`, `contract_template_versions`, `contract_templates` da agência. Observação: `agency_library` já tem FK para `agencies` sem cascata e provavelmente sofre do mesmo problema.

## 5. Decisão pendente (LGPD / F11)

`contract_documents.data_snapshot` e `rendered_content` guardam os dados pessoais usados na emissão (é o objetivo do retrato). A anonimização de `ProcessDataDeletionRequest` não alcança esses registros. Precisa de decisão de negócio/jurídica: retenção de contratos emitidos versus anonimização. Nenhuma regra foi inventada na F02.

## 6. Numeração da migration

`V56__agency_contracts.sql` é provisória; atribuir a próxima versão global livre antes do merge e testar em banco efêmero novo.

## 7. Observação fora do escopo (carteira F04)

`MilesWalletController` grava `principal.getName()` como autor. Como `PlatformAccount` não implementa `UserDetails`/`Principal` nem sobrescreve `toString()`, o valor tende a ser `PlatformAccount@<hash>`. Contratos usam `nome <e-mail>` via `SecurityContextUsers.requireUser()`. Não alterado por ser módulo do Codex.
