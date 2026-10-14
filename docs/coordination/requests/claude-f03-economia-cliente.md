# Solicitações de integração — F03 Economia (Claude → Codex)

Arquivos compartilhados que **não** foram alterados em `claude/f03-economia-cliente`. A navegação (itens 1 a 3) é necessária para concluir a feature.

## 1. `src/middleware.ts`

Adicionar `"/economia"` em `PROTECTED_PREFIXES` e `"/economia", "/economia/:path*"` em `config.matcher`.

## 2. Menu `src/components/layout/dashboard-shell.tsx`

Grupo **Viagens**, para dono e vendedor: item "Economia do cliente" → `/economia` (ícone sugerido `cash` ou `chart`). O relatório compartilhável (`/economia/relatorios`) é acessado pela página e só aparece para o dono.

## 3. Atalhos

- Página da viagem `src/app/(app)/viagens/[id]/page.tsx`: link "Economia da viagem" → `/economia/viagens/${id}`.
- Página da pessoa em Viagens `src/app/(app)/clientes/[id]/page.tsx`: link "Economia" → `/economia?customerId=${id}`.

Não exige props, contexts ou tipos globais novos.

## 4. Exclusão de viagem e de pessoa

- `trip_savings.trip_id` usa `ON DELETE CASCADE`. Excluir a viagem (`DELETE /trips/{id}`, hard delete atual) remove a análise, as versões e as evidências; a auditoria (`trip_savings_audit`) e os relatórios já gerados permanecem. Sugestão: o diálogo de exclusão da viagem avisar "a análise de economia desta viagem também será excluída".
- `trip_savings_reports.customer_id` não tem FK, para preservar o retrato. Entra na mesma decisão LGPD da F02 (retenção × anonimização de retratos com dados pessoais).
- `AgencyDeletionScheduler`: incluir `trip_savings_audit`, `trip_savings_reports`, `trip_savings_evidence`, `trip_savings_versions` e `trip_savings` antes de remover viagens/pessoas da agência.

## 5. Migration

`V57__trip_savings.sql` pressupõe que a `V56` da F02 entre antes. Se a F03 for integrada primeiro, renumerar para a próxima versão livre antes do merge.

## 6. Achado no F02 (mesmo dono, outra branch)

O parser de valores do formulário de contratos recusa "3.000" (milhar brasileiro sem vírgula) com mensagem de erro. Não grava valor errado. A correção aplicada aqui no F03 também será aplicada na branch `claude/f02-contratos`.
