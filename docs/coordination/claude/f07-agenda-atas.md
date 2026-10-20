# F07 — Agenda e atas de atendimento (TODO-048) — Claude

Branch `claude/f07-agenda-atas` nos dois repositórios, a partir de `origin/main` (frontend `0ce8b78`, API `cc5079b`). Migration **V59** reservada para este módulo em `docs/migrations-reservadas-2026-10-15.md`: um único arquivo, `V59__appointments_and_minutes.sql`.

## Escopo

- **Compromisso** (`appointments`) da pessoa, com **produto explícito** `TRAVEL` (Viagens) ou `MILES` (Milhas). O produto é escolhido por quem cadastra, nunca deduzido. A mesma pessoa pode ter atendimentos dos dois produtos, filtrados separadamente.
- Campos: título, objetivo, início (`TIMESTAMPTZ`), duração (5 min a 12 h), fuso do agendamento (padrão `America/Fortaleza`), formato (presencial, vídeo, telefone, outro), local, link da reunião (http/https), responsável (usuário ativo da mesma agência) e viagem opcional (somente `TRAVEL`, da mesma pessoa e agência).
- **Ata** (`appointment_minutes`), uma por compromisso: participantes, resumo, decisões e próximos passos (texto, com responsável e prazo opcionais). Cada edição gera **versão imutável** consultável. A ata não é excluída: corrige-se com nova versão, para preservar o registro do atendimento. Próximos passos **não criam tarefas**; a integração com F01 virá em PR próprio depois que o contrato de tarefas estiver publicado.
- **Busca de atas**: a lista aceita `q`, que procura em título, objetivo, resumo, decisões e próximos passos.

## Estados e operações

| Estado | Pode | Observação |
|---|---|---|
| `SCHEDULED` (agendado) | editar/reagendar pelo mesmo ID, registrar ata, concluir, marcar "não compareceu", cancelar, excluir (só sem ata) | reagendamento audita o horário anterior |
| `COMPLETED` (realizado) | registrar/editar ata, reabrir com motivo | campos do compromisso travados |
| `NO_SHOW` (não compareceu) | reabrir com motivo | sem ata |
| `CANCELLED` (cancelado) | consultar | motivo obrigatório; terminal (criar outro compromisso) |

- Exclusão definitiva só para compromisso agendado sem ata (cadastro por engano), auditada. Os demais casos usam cancelamento, para preservar o histórico. A UI explica.
- **Sobreposição**: compromissos do mesmo responsável que se sobrepõem geram **aviso** (`overlaps`), sem bloquear.
- **Fuso**: a API recebe `startsAt` ISO-8601 com offset e o fuso IANA. Filtros `from`/`to` são datas no fuso da agência (`America/Fortaleza`), com fim inclusivo. A UI exibe no fuso do compromisso.
- **ICS**: `GET /appointments/{id}/ics` gera um arquivo `.ics` para a pessoa importar manualmente. **Não há sincronização** com agendas externas, e a UI deixa isso claro.
- Criação idempotente por `Idempotency-Key`; `expectedVersion` em edição, estado e ata (409 em conflito).
- Permissões: dono e vendedor da agência (como CRM/viagens). `PLATFORM_ADMIN` sem acesso. Isolamento por `agency_id` da sessão em toda consulta; pessoa, responsável e viagem de outra agência → 404.
- Auditoria própria (`appointment_events`): ação, autor (`nome <e-mail>`), data e detalhe, sem senha/token. Inclui exclusões.

## API (prefixo `/api/v1`)

| Método | Rota |
|---|---|
| GET | `/appointments?customerId&product&status&responsibleId&from&to&q` |
| GET | `/appointments/members` (usuários ativos da agência: id, nome) |
| POST | `/appointments` (`Idempotency-Key`) |
| GET/PATCH/DELETE | `/appointments/{id}` (DELETE `?expectedVersion`) |
| POST | `/appointments/{id}/status` `{status, reason, expectedVersion}` |
| PUT | `/appointments/{id}/minutes` `{data, expectedVersion}` (0 cria) |
| GET | `/appointments/{id}/minutes/versions/{v}` |
| GET | `/appointments/{id}/ics` |

## Interface

Rotas próprias: `/agenda` (lista por dia com filtros de período, produto, status, responsável, pessoa e busca nas atas), `/agenda/novo?customerId&product`, `/agenda/[id]` (detalhe, edição, estados, ata com versões, histórico, ICS). `/atendimentos` já redireciona para cotações e não é reutilizado. Menu, middleware e atalhos ficam em `docs/coordination/requests/claude-f07-agenda-atas.md`.

## Critérios de aceite

- CRUD do compromisso com edição pelo mesmo ID, cancelamento com motivo e exclusão restrita, explicados na UI.
- Ata com versões; correção não apaga o histórico; atas localizáveis pela busca.
- Produto explícito, independente entre Viagens e Milhas para a mesma pessoa.
- Horário consistente: o mesmo instante é exibido igual após recarregar; filtros por dia respeitam o fuso da agência.
- Responsável e viagem validados na agência; isolamento e permissões testados; sucesso somente após a API; conflito de versão preserva o formulário.
- Nenhuma tarefa, venda, viagem ou agenda externa é criada ou alterada.
