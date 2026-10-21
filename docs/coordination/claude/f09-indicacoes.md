# F09 — Indicações (TODO-049) — Claude

Branch `claude/f09-indicacoes` nos dois repositórios, criada a partir de `origin/main` (frontend `a3b67c8`, API `a9932f8`, migrations publicadas até V61; V62 reservada para F10).

**Migration:** **V63** reservada pelo Codex em 21/10, um arquivo `V63__referrals.sql`. Publicar depois da V62 (F10, #66).

## Escopo desta entrega

O cadastro e o acompanhamento da relação **indicador → indicado**: de onde veio a indicação, para qual produto e em que estado está.

Fora do escopo: **créditos, descontos, resgates e estornos.** O comparativo (F09) condiciona essas operações a regras ainda não definidas:
- o gatilho do crédito (cadastro, venda aprovada ou pagamento confirmado);
- valor ou percentual, e limite por indicador;
- produto e campanha;
- resgate pelo financeiro;
- estorno em cancelamento ou reembolso.

Esta entrega não cria lançamento financeiro, cupom, comissão, desconto nem saldo. Também não tem campo de valor do crédito. A interface mostra: "Créditos de indicação ainda não são controlados pelo sistema".

Também **não** se confunde com outros recursos do Hub:
- `quotation_submissions.referral_seller_id`, que é a atribuição de vendedor no formulário público;
- os cupons (`coupons`);
- as comissões de venda.

## Produto

Toda indicação tem produto explícito: `TRAVEL` (Viagens) ou `MILES` (Milhas), conforme `dominios-viagens-milhas-2026-10-14.md`. Não é deduzido da pessoa. A mesma pessoa pode ser indicada uma vez para cada produto, por indicadores diferentes. Não há regra compartilhada entre os produtos.

## Modelo

**Indicação** (`referrals`):

| Campo | Regra |
|---|---|
| `product` | `TRAVEL` ou `MILES`, obrigatório. Não muda depois de criada; se errado, cancelar e registrar outra. |
| `referrerId` | Pessoa do CRM da mesma agência, obrigatória. |
| Indicado | Pessoa do CRM da agência (`referredCustomerId`) **ou** contato ainda não cadastrado: `referredName` obrigatório nesse caso, mais `referredPhone` e/ou `referredEmail`, com pelo menos um contato. O indicado não pode ser o próprio indicador. |
| `referredOn` | Data da indicação (data local, sem hora), obrigatória; não pode estar no futuro no fuso da agência. |
| `channel` | Origem: `CONVERSATION` (conversa), `WHATSAPP`, `SOCIAL_MEDIA` (rede social), `EVENT` (evento), `OTHER` (outro). Para `OTHER`, `channelDetail` é obrigatório. |
| `responsibleId` | Membro da equipe da agência, opcional, para quem acompanha o contato. |
| `notes` | Observações, até 4.000 caracteres. |
| `status` | Ver o ciclo abaixo. |
| `saleId` | Opcional, só em `TRAVEL` e na conversão: venda existente da agência cujo cliente é o indicado. Serve de evidência para regras futuras; não gera efeito. |

**Ciclo** (transições auditadas, com `expectedVersion`):

| De | Para | Requisito |
|---|---|---|
| `RECEIVED` (recebida) | `CONTACTED` (em contato) | — |
| `RECEIVED` ou `CONTACTED` | `CONVERTED` (convertida) | Indicado vinculado a uma pessoa do CRM; data de conversão. Venda opcional (Viagens). |
| `RECEIVED` ou `CONTACTED` | `NOT_CONVERTED` (não convertida) | Motivo |
| `NOT_CONVERTED` ou `CONVERTED` | `CONTACTED` (reabrir/corrigir) | Motivo; a conversão anterior fica no histórico |
| Qualquer estado, exceto `CANCELLED` | `CANCELLED` (cancelada) | Motivo |
| `CANCELLED` | `RECEIVED` (reativar) | Motivo |

## Regras

1. **Agência:** todas as referências (indicador, indicado, responsável, venda) são validadas na agência da sessão. Referência fora dela retorna 404.
2. **Criação:** `Idempotency-Key` = ID da indicação. Repetir a chave devolve a mesma indicação; reusá-la com outros dados, ou depois de excluída, retorna 409.
3. **Edição:** mantém o ID, com `expectedVersion` (409 em conflito). Não altera o produto nem o estado; o estado muda por `/status`. Mudanças de indicador ou indicado ficam no histórico com os valores anteriores.
4. **Sem duplicidade por pessoa:** uma pessoa do CRM só pode ter **uma indicação ativa** (não cancelada) por produto, com índice único parcial e 409 mostrando a indicação existente. É a base para um futuro crédito não duplicar.
5. **Contato ainda não cadastrado:** se o telefone ou e-mail normalizado coincidir com uma indicação ativa do mesmo produto, ou com uma pessoa do CRM, a API devolve **aviso** sem bloquear, e a interface sugere vincular à pessoa existente.
6. **Vincular o indicado ao CRM:** operação explícita `PUT /referrals/{id}/referred-customer/{customerId}`. Na interface, "Cadastrar pessoa" usa o `POST /customers` existente e depois vincula. Ao vincular, a regra 4 vale. Os dados de contato digitados ficam no histórico da indicação; os dados do CRM não são alterados.
7. **Exclusão:** permitida para indicação registrada por engano que nunca foi convertida, com `expectedVersion` e registro no histórico. Uma indicação que já passou por `CONVERTED` é **cancelada**, não excluída, para preservar a base de créditos futuros. A interface explica o motivo.
8. **Permissões:** dono e vendedor (como CRM), com o mesmo escopo de agência. `PLATFORM_ADMIN` recebe 403.
9. **Histórico:** auditoria própria (`referral_events`), com ação, autor (`nome <e-mail>`), data e detalhe, sem tokens. Inclui as exclusões.

## API (prefixo `/api/v1`)

| Método | Rota |
|---|---|
| GET | `/referrals?product&status&customerId&referrerId&from&to&q` (`customerId` busca nos dois lados: indicações feitas e recebidas) |
| POST | `/referrals` (`Idempotency-Key`) |
| GET / PATCH / DELETE | `/referrals/{id}` (DELETE `?expectedVersion`) |
| POST | `/referrals/{id}/status` `{status, reason, convertedOn, saleId, expectedVersion}` |
| PUT | `/referrals/{id}/referred-customer/{customerId}` `{expectedVersion}` |
| GET | `/referrals/summary?product&from&to` (contagem por estado e principais indicadores; quantidades, sem valores) |

## Interface

Rotas próprias:

- **`/indicacoes`:** lista com filtros de produto, estado, período e busca, além de um resumo por estado. Aceita `?product=TRAVEL|MILES` e `?customerId=`.
- **`/indicacoes/nova`:** cadastro. Aceita `?product=` e `?referrerId=` vindos da pessoa.
- **`/indicacoes/[id]`:** detalhe com edição, mudança de estado (com motivo), vínculo e cadastro do indicado, exclusão e histórico.

Arquivos compartilhados solicitados ao Codex: menu, atalhos nas páginas da pessoa em Viagens e em Milhas, handler central, exclusão de agência e de dados da pessoa.

## Critérios de aceite

- CRUD completo com edição pelo mesmo ID; persistência após recarregar; sucesso somente após confirmação da API; conflito de versão preserva o formulário.
- Produto explícito em API, persistência e interface; filtros por produto não misturam Viagens e Milhas.
- Estados e transições auditados; cancelamento e não conversão com motivo; convertida só com o indicado no CRM.
- Sem indicação ativa duplicada para a mesma pessoa e produto; aviso para contato coincidente.
- Isolamento entre agências; dono e vendedor com acesso; `PLATFORM_ADMIN` sem acesso.
- Nenhum crédito, cupom, comissão, desconto ou lançamento financeiro é criado, e o CRM não é alterado sem ação explícita.

## Plano

1. Especificação e pedido de reserva (este documento). ✔
2. Domínio puro na API (validação, ciclo, normalização de contato) e testes, sem SQL. ✔ (`domain/referrals/Referrals.java`, `ReferralsTest`)
3. Interface com cliente de API, filtros e testes (com respostas simuladas). ✔ `/indicacoes`, `/indicacoes/nova`, `/indicacoes/[id]`; 14 testes; evidências em `evidencias-f09/`. Usa também `GET /referrals/members` (equipe da agência, como a agenda).
4. Migration V63, serviço/controller, testes de integração e validação em Postgres efêmero. ✔
5. PRs em rascunho `[F09][API] Indicações (Vxx)` e `[F09][UI] Indicações`, vinculados.
