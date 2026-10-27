# F10 (extensão) — Etapas da viagem (TODO-050) — Claude

Branch `claude/f10-etapas-viagem` nos dois repositórios, a partir de `origin/main` (frontend `a3b67c8`, API `a9932f8`, migrations até V61). Migration **V62** reservada em `docs/migrations-reservadas-2026-10-15.md`: um único arquivo, `V62__trip_stages.sql`.

Produto: **Viagens**. Hotel, transfer e atividades pertencem à viagem (diretriz `dominios-viagens-milhas-2026-10-14.md`).

## Escopo

- **Etapa** (`trip_stages`) de uma viagem existente da agência, com tipo `HOTEL`, `TRANSFER`, `ACTIVITY` ou `OTHER`.
- Campos: título, início e fim (`TIMESTAMPTZ`), fuso do local (IANA, padrão `America/Fortaleza`), fornecedor/prestador (texto), código de confirmação/voucher, endereço ou local, origem e destino (transfer), número de pessoas e observações.
- Situação: `PLANNED` (prevista), `CONFIRMED` (confirmada) ou `CANCELLED` (cancelada, com motivo). Cancelar preserva o registro; exclusão é permitida e auditada, porque etapas não têm efeito financeiro.
- **Sem duplicar:** trechos aéreos continuam em `trip_segments` e não entram como etapa. Anexos são **vínculos** a anexos que a viagem já tem (`agency_attachments.trip_id`) e materiais da Biblioteca (`agency_library`) são **vínculos** ao material: nenhum arquivo é copiado. Um arquivo novo é enviado pelo endpoint existente `/attachments/trips/{tripId}` e então vinculado.
- **Sem efeito financeiro:** não cria despesa, venda, recebível nem pagamento, e não altera a viagem.

## Regras

1. A viagem precisa ser da agência da sessão (404 se não for). Não se cria etapa em viagem cancelada (409); as etapas existentes continuam consultáveis.
2. O fim não pode ser anterior ao início. Etapa fora do período da viagem (partida/retorno) gera **aviso**, sem bloqueio.
3. Editar mantém o mesmo ID com `expectedVersion` (409 em conflito). Mudança de data ou horário fica registrada com o valor anterior. Criação idempotente por `Idempotency-Key`.
4. O anexo vinculado precisa pertencer à **mesma viagem**, e o material da Biblioteca à **mesma agência**. Vincular duas vezes não duplica. Se o anexo ou o material for excluído no módulo de origem, o vínculo some junto (FK com cascata), e a auditoria da etapa preserva o registro.
5. Permissões: dono e vendedor (como viagens). `PLATFORM_ADMIN` sem acesso.
6. Auditoria própria (`trip_stage_events`): ação, autor (`nome <e-mail>`), data e detalhe, sem senha/token. Inclui exclusões.

## API (prefixo `/api/v1`)

| Método | Rota |
|---|---|
| GET | `/trips/{tripId}/stages` (etapas em ordem cronológica + avisos) |
| POST | `/trips/{tripId}/stages` (`Idempotency-Key`) |
| GET/PATCH/DELETE | `/trips/{tripId}/stages/{id}` (DELETE `?expectedVersion`) |
| POST | `/trips/{tripId}/stages/{id}/status` `{status, reason, expectedVersion}` |
| PUT/DELETE | `/trips/{tripId}/stages/{id}/attachments/{attachmentId}` |
| PUT/DELETE | `/trips/{tripId}/stages/{id}/library/{libraryId}` |

## Interface

Rota própria `/viagens/[id]/etapas`, com:
- roteiro cronológico agrupado por dia no fuso de cada etapa;
- criação e edição;
- confirmação e cancelamento;
- exclusão;
- vínculo com anexos da viagem (incluindo envio de arquivo novo pelo endpoint existente) e com materiais da Biblioteca;
- histórico.

A integração Codex em 21/10 adicionou o link "Etapas da viagem" à página central, avisos de exclusão e proteção do histórico de dados pessoais. Ver `docs/f10-integracao-2026-10-21.md`; pedidos originais preservados como histórico.

## Critérios de aceite

- CRUD da etapa com edição pelo mesmo ID, cancelamento com motivo e exclusão auditada; persistência após recarregar; sucesso somente após a API.
- Datas, horários e fuso consistentes; aviso fora do período da viagem.
- Vínculos com anexos da própria viagem e com a Biblioteca da agência, sem copiar arquivos e sem duplicar vínculo.
- Nenhum trecho aéreo, anexo, despesa ou venda é criado ou alterado.
- Isolamento entre agências e entre viagens; permissões; conflito de versão preserva o formulário.
