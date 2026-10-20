# Solicitações de integração — F07 Agenda e atas (Claude → Codex)

Arquivos compartilhados que **não** foram alterados em `claude/f07-agenda-atas`. Os itens 1 a 3 (navegação) são necessários para concluir a feature.

## 1. `src/middleware.ts`

Adicionar `"/agenda"` em `PROTECTED_PREFIXES` e `"/agenda", "/agenda/:path*"` em `config.matcher`. Não reutilizar `/atendimentos`, que redireciona para cotações.

## 2. Menu `src/components/layout/dashboard-shell.tsx`

Item **Agenda e atas** → `/agenda` no grupo Principal (perto de Pessoas/Contratos), para dono e vendedor, porque atende os dois produtos. Alternativa: um item em cada grupo de produto, com `/agenda?product=TRAVEL` e `/agenda?product=MILES`. As rotas aceitam os dois formatos.

## 3. Atalhos nas páginas da pessoa

- Viagens — `src/app/(app)/clientes/[id]/page.tsx`: `/agenda?customerId=${id}&product=TRAVEL` e `/agenda/novo?customerId=${id}&product=TRAVEL`.
- Milhas — `src/app/(app)/milhas/clientes/[id]/page.tsx`: os mesmos links com `product=MILES`.

O produto vem do contexto da página, nunca do cadastro.

## 4. API — arquivos centrais

- `GlobalExceptionHandler.handleDataIntegrity`: `appointments.customer_id` e `appointments.responsible_id` não têm cascata, para preservar o histórico de atendimentos. Sugestão de mensagem específica para `appointments_customer_id_fkey`: 409 `AGENDA_HISTORY_EXISTS` — "Esta pessoa possui compromissos ou atas. Cancele os compromissos e inative a pessoa para preservar o histórico." Para `appointments_responsible_id_fkey`, ao remover um usuário: "Este usuário é responsável por compromissos. Transfira os compromissos antes de removê-lo."
- `AgencyDeletionScheduler`: apagar `appointment_events`, `appointment_minutes_versions`, `appointment_minutes` e `appointments` da agência **antes** de viagens, pessoas e usuários.
- `ProcessDataDeletionRequest`: atas e eventos podem conter dados pessoais em texto livre. Seguir a mesma regra adotada para contratos e economia: manter a solicitação pendente quando a pessoa tiver compromissos/atas, até a decisão de retenção/anonimização.
- `appointments.trip_id` usa `ON DELETE SET NULL`: excluir a viagem preserva o compromisso e remove só o vínculo.

## 5. Migration

`V59__appointments_and_minutes.sql`, conforme a reserva em `docs/migrations-reservadas-2026-10-15.md`. `scripts/check-migrations.sh origin/main` aprovado localmente. Integrar antes da V60 (F01).

## 6. Integração futura com F01

Os próximos passos da ata são texto (`description`, `owner` livre, `dueOn`). Quando o contrato de tarefas do F01 estiver publicado, um PR próprio pode oferecer "criar tarefa a partir deste passo", com origem `APPOINTMENT`/id e produto do compromisso, de forma idempotente. Nada disso foi implementado agora.
