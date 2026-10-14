# F02 — Contratos (TODO-046) — Claude

Branch `claude/f02-contratos` nos dois repositórios, a partir de `origin/main` de 14/10/2026 (frontend `fe86a8c`, API `91614f0`).
PRs: API [Felipendev/agencia-hub-api#61](https://github.com/Felipendev/agencia-hub-api/pull/61) · UI [Felipendev/agencia-hub#54](https://github.com/Felipendev/agencia-hub/pull/54).

## Especificação

### Regras de negócio

- **Produto explícito** (diretriz de 14/10, `docs/dominios-viagens-milhas-2026-10-14.md`): modelo, contrato e documento emitido registram `TRAVEL` (Viagens) ou `MILES` (Milhas). O produto é escolhido pela pessoa usuária, nunca deduzido do cliente ou do uso de milhas, e não muda depois de criado. O banco impede contrato com modelo de outro produto (FK composta). A mesma pessoa pode ter contratos dos dois produtos, com vigência, assinatura e cancelamento independentes; cancelar um não altera o outro nem a pessoa. Campo de modelo `{{contrato.produto}}` e filtros `?product=` na lista de contratos e de modelos.
- **Modelo** (`contract_templates` + `contract_template_versions`): texto fornecido pela agência; o sistema só substitui campos `{{chave}}` de um catálogo fechado (pessoa, agência, termos). Campo desconhecido é recusado ao salvar. Não há cláusulas geradas pelo sistema.
- Editar nome/descrição mantém o mesmo ID e a mesma versão; alterar o conteúdo cria a versão `n+1`. Versões são imutáveis.
- Excluir modelo sem contratos remove de fato; modelo já usado é **arquivado** (não aparece para novos rascunhos, pode ser reativado).
- **Rascunho** (`contracts`, `DRAFT`): pessoa da mesma agência + modelo/versão + título, plano, valor, vigência, forma de pagamento (à vista/parcelado com 2–120 parcelas), condições e observações internas. Pessoa não pode ser trocada depois. Criação idempotente por `Idempotency-Key` (= ID do contrato).
- **Campos faltantes**: o detalhe e a pré-visualização listam os campos usados pelo modelo sem valor; a geração é recusada com HTTP 422 e a lista `missingFields`.
- **Documento emitido** (`contract_documents`): grava corpo do modelo, texto renderizado, retrato dos valores usados (`data_snapshot`) e SHA-256. Repetir a geração sem mudança devolve o mesmo documento. Alterar pessoa/agência/modelo depois não altera documentos já emitidos. PDF gerado a partir do texto gravado.
- **Estados**: `DRAFT → SENT` (exige documento correspondente à revisão atual dos dados e data de envio não futura) → `SIGNED` (exige arquivo de evidência; data não futura e não anterior ao envio). `SENT → DRAFT` por revisão com motivo (documento anterior permanece). Qualquer estado → `CANCELLED` com motivo; cancelar enviado/assinado é exclusivo do dono. Não há assinatura eletrônica integrada; a UI diz isso.
- **Exclusão**: só rascunho sem documento gerado. Com documento, enviado ou assinado: cancelamento (histórico preservado). Evidência de assinatura não é excluível.
- **Recebíveis**: vínculo opcional e explícito a recebíveis existentes da mesma pessoa/agência (somente dono, pois o financeiro é restrito ao dono). Nenhuma venda, receita, cobrança ou lançamento é criado ou alterado.
- **Auditoria** (`contract_audit`): recurso, ação, autor (nome + e-mail), data e detalhe sem senha/token, inclusive exclusões.
- **Permissões**: dono e vendedor usam contratos; somente dono cria/edita/arquiva modelos, vincula recebíveis e cancela emitidos. `PLATFORM_ADMIN` sem acesso. Toda consulta filtra `agency_id` da sessão.
- **Concorrência**: `row_version` com `expectedVersion` (409 em conflito) e `SELECT … FOR UPDATE` no contrato/modelo/pessoa durante escrita.

### Contratos REST (prefixo `/api/v1`)

| Método | Rota | Observação |
|---|---|---|
| GET | `/contract-templates/fields` | catálogo de campos |
| GET/POST | `/contract-templates` | `?includeArchived=true`; POST só dono |
| GET/PATCH/DELETE | `/contract-templates/{id}` | DELETE `?expectedVersion` → `{outcome: DELETED\|ARCHIVED, message}` |
| GET | `/contract-templates/{id}/versions/{v}` | |
| POST | `/contract-templates/{id}/restore?expectedVersion` | |
| GET/POST | `/contracts` | `?customerId&status`; POST com `Idempotency-Key` |
| GET/PATCH/DELETE | `/contracts/{id}` | PATCH só `DRAFT`; DELETE `?expectedVersion` |
| GET | `/contracts/{id}/preview` | texto com dados atuais + `missingFields` |
| POST | `/contracts/{id}/documents` | `{expectedVersion}`; 422 com `missingFields` |
| GET | `/contracts/{id}/documents/{v}` e `/pdf` | |
| POST | `/contracts/{id}/send` `/revise` `/cancel` | JSON |
| POST | `/contracts/{id}/sign` | multipart: `file`, `signedOn`, `expectedVersion`, `note?` |
| POST/GET/DELETE | `/contracts/{id}/attachments[/{attId}]` | até 5 MB; PDF, JPG, PNG, WEBP, Word |
| PUT/DELETE | `/contracts/{id}/receivables/{receivableId}` | só dono |

### Interface

Rotas próprias: `/contratos` (lista e filtros, `?customerId=`), `/contratos/modelos`, `/contratos/novo?customerId=`, `/contratos/[id]`. Componentes em `src/components/contratos/`, cliente HTTP e formatação em `src/lib/contracts/`. Não foram alterados menu, página da pessoa, contexts, `src/types/index.ts` nem `middleware.ts` — ver `docs/coordination/requests/claude-f02-contratos.md`.

## Critérios de aceite e status

| Critério | Status |
|---|---|
| CRUD de modelos com isolamento por agência; editar mantém ID | Implementado; teste de integração escrito |
| Produto TRAVEL/MILES explícito em modelo, contrato e documento; independência entre produtos | Implementado; teste de integração escrito e testes UI passando |
| Rascunho vinculado à pessoa, preenchido com dados existentes, preço/plano, vigência, pagamento | Implementado |
| Campos faltantes destacados antes de gerar | Implementado (API 422 + destaque na UI); testes UI passando |
| Documento preserva versão do modelo e retrato dos dados; alterar a pessoa não muda emitido | Implementado; teste de integração escrito |
| Estados rascunho/enviado/assinado/cancelado auditados; assinado exige evidência | Implementado; testes UI passando, integração escrita |
| Emitidos usam revisão/cancelamento; explicação na UI | Implementado |
| Vínculo opcional a recebíveis existentes sem criar venda/receita | Implementado; teste verifica contagens de `sales`, `receivables`, `financial_entries` |
| Falhas sem confirmação falsa de sucesso | Testes UI passando |
| Navegação (menu, link na pessoa) | **Pendente de integração pelo Codex** |

## Validação

- Frontend: `npx tsc --noEmit`, `npm run lint` (0 erros), `npx vitest run` (29 arquivos, 105 testes, incluindo 21 de contratos) e `next build` com as rotas `/contratos*`.
  O build local precisou substituir temporariamente `next/font/google` porque este ambiente não acessa o Google Fonts; o arquivo não foi alterado no commit.
- API: CI do PR (compile, Flyway em PostgreSQL 16 com a nova migration, package com compilação dos testes) verde. A migration também foi aplicada em PostgreSQL 16 efêmero local e as consultas SQL principais foram executadas.
  **Os testes JUnit não foram executados aqui**: o Maven Central está bloqueado na rede deste ambiente e a CI atual não roda testes. Executar antes do merge: `mvn test -Dtest='ContractIntegrationTest,ContractTemplateRendererTest,ContractValuesTest,ContractPdfRendererTest'`.

## Migration

`V56__agency_contracts.sql` — provisória. O integrador atribui a próxima versão global livre antes do merge.
