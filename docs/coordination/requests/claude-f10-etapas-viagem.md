# Solicitações de integração — F10 Etapas da viagem (Claude → Codex)

Arquivos compartilhados que **não** foram alterados em `claude/f10-etapas-viagem`. O item 1 é necessário para a feature ficar acessível pela navegação. O item 3 é necessário antes de publicar a API.

## 1. Página central da viagem — `src/app/(app)/viagens/[id]/page.tsx`

Adicionar o link **Etapas da viagem** → `/viagens/${id}/etapas` no cabeçalho da viagem, ao lado das ações existentes. Sugestão: mostrar a contagem retornada por `GET /trips/{id}/stages` (`stages.length`). Isso é opcional.

A rota já está coberta pelo `middleware.ts` (`/viagens/:path*`). Não é preciso alterar o menu.

## 2. Exclusão da viagem e dos anexos (texto de confirmação)

- `trip_stages.trip_id` usa `ON DELETE CASCADE`. Ao excluir a viagem, as etapas e os vínculos são removidos, e a auditoria (`trip_stage_events`, sem FK) é preservada. Sugestão para o diálogo de exclusão da viagem: "As etapas do roteiro (hotel, transfer, atividades) também serão removidas."
- `trip_stage_links.attachment_id` e `library_id` usam `ON DELETE CASCADE`. Excluir um anexo da viagem ou um material da Biblioteca remove só o vínculo com a etapa. Se quiser, o diálogo de exclusão do anexo pode avisar: "Se estiver vinculado a etapas, o vínculo será removido."

## 3. API — `AgencyDeletionScheduler`

`trip_stage_events.agency_id` referencia `agencies` **sem** cascata, para preservar a auditoria. Incluir `"trip_stage_events", "trip_stage_links", "trip_stages"`, nessa ordem, antes de `DELETE FROM trips`. Por exemplo, numa lista própria logo após as tabelas de `trip_savings_*`. Sem isso, o hard-delete da agência falha por FK.

## 4. API — `ProcessDataDeletionRequest` (decisão de produto)

As etapas podem ter texto livre (observações, local, fornecedor). Ao anonimizar uma pessoa, as etapas saem junto com as viagens dela. Os eventos guardam só tipo, título, datas, fuso e status, sem observações. Avaliar se o título das etapas na auditoria precisa ser anonimizado; nada foi implementado aqui.

## 5. Migration

`V62__trip_stages.sql`, conforme a reserva em `docs/migrations-reservadas-2026-10-15.md`. `scripts/check-migrations.sh origin/main` passou localmente. A migration também foi aplicada sobre V1–V61 num Postgres 16 efêmero, e cascatas e unicidade de vínculos foram conferidas.

Ordem: publicar a API (PR de API) antes da interface.
