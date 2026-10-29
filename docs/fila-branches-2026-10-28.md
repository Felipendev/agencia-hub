# Fila de integração — atualizada em 29/10/2026

Em 29/10, o usuário autorizou retomar os deploys de produção. As sete entregas abaixo foram atualizadas com main, validadas, integradas e publicadas separadamente. Registro final: docs/publicacao-gradual-2026-10-29.md. As descrições de rascunho/testes originais abaixo são históricas; a validação combinada final foi de 362 testes UI e 22 API.

| Entrega | Base e branch | PR | Estado |
| --- | --- | --- | --- |
| F11: histórico e exportação, API | main `3a30baf` → `codex/f11-historico-exportacao` | [API #71](https://github.com/Felipendev/agencia-hub-api/pull/71) | Publicado em 29/10; detalhes e gates em publicacao-gradual-2026-10-29.md |
| F11: histórico e exportação, UI | main `be685c8` → `codex/f11-historico-exportacao` | [UI #65](https://github.com/Felipendev/agencia-hub/pull/65) | Publicado em 29/10; detalhes e gates em publicacao-gradual-2026-10-29.md |
| DEBT-001: confirmação de persistência e isolamento do estado | main `be685c8` → `codex/regressao-persistencia` | [UI #66](https://github.com/Felipendev/agencia-hub/pull/66) | Publicado em 29/10; detalhes e gates em publicacao-gradual-2026-10-29.md |
| TODO-015: correções na validação comercial | main API `3a30baf` / UI `be685c8` → `codex/validacao-comercial` | [API #72](https://github.com/Felipendev/agencia-hub-api/pull/72), [UI #67](https://github.com/Felipendev/agencia-hub/pull/67) | Publicado em 29/10; detalhes e gates em publicacao-gradual-2026-10-29.md |
| TODO-015: CSV financeiro completo e proteção de textos | main UI `be685c8` → `codex/exportacao-financeira` | [UI #68](https://github.com/Felipendev/agencia-hub/pull/68) | Publicado em 29/10; detalhes e gates em publicacao-gradual-2026-10-29.md |
| TODO-056: carregamento financeiro no dashboard | main UI `be685c8` → `codex/dashboard-financeiro` | [UI #69](https://github.com/Felipendev/agencia-hub/pull/69) | Publicado em 29/10; detalhes e gates em publicacao-gradual-2026-10-29.md |

Não há dependência de código entre DEBT-001 e F11. Nenhuma dessas entregas cria migration; V67 está reservada em pausa para fornecedores; nenhum SQL foi criado ou aplicado. Na criação, as branches eram independentes; na publicação foram atualizadas com a main progressivamente.

A exportação UI #68 também parte diretamente da main. Recomenda-se integrar #66 primeiro, pois a exportação usa o estado consultado e a correção de isolamento por sessão está nesse PR. Não há mudanças na API ou no banco para #68. O dashboard #69 faz consulta financeira própria e não depende dessas branches nem de uma nova API/migration; preservar #66 ao combinar as entregas.

Atualização de escopo em 29/10: o usuário pausou fornecedores para revisar o reaproveitamento de Pessoas/fornecedor comercial, antes de criar outro CRUD. V67 foi reservada antes da pausa, mas nenhum SQL foi criado ou aplicado. Não retomar essa frente automaticamente; o bug do dashboard passou a ser a tarefa ativa.

## Procedimento aplicado na publicação de 29/10

1. Buscar a main vigente, atualizar cada branch e resolver conflitos preservando as duas entregas.
2. Repetir os gates no head atualizado. DEBT-001 acrescenta testes à CI; depois de integrar ambas as branches, executar também a suíte combinada.
3. Integrar uma API por vez e confirmar migrations, inicialização e saúde. Só então integrar a UI dependente. F11 exige API #71 antes de UI #65; correções comerciais exigem API #72 antes de UI #67. DEBT-001 pode entrar independentemente.
4. Fazer smoke com sessão real após cada publicação e registrar as evidências. Uma prévia automática verde não equivale a smoke de produção.

## Pendências que não devem ser confundidas com código novo pronto

- F05/estoque de milhas e créditos F09: usuário confirmou em 28/10 que devem permanecer bloqueados; aguardam regras sobre custódia, aquisição, consumo, evento gerador, valores, limites e estorno. Não gerar efeitos financeiros com regras presumidas.
- TODO-015: código comercial já está na main. A rodada de 28/10 aprovou os testes existentes de lucro fixo, aprovação, viagem, previsão financeira, liquidação/estorno sem duplicação e visibilidade de comissão. Não é evidência suficiente para fechar toda a matriz de fornecedores, edição, filtros, exportação e isolamento do fluxo comercial completo. Manter a validação abrangente pendente.
- TODO-015 em 29/10: CSV financeiro completado no PR #68. Permanece uma lacuna concreta na interface de fornecedores comerciais: Vendas tem criação rápida usando uma pessoa do CRM, seguida de cadastro de fornecedor apenas pelo nome, sem gestão equivalente de contatos/edição/exclusão do fornecedor comercial. Editar a pessoa não comprova editar o registro de `/suppliers`. A API possui CRUD. Próxima subentrega deve completar essa integração de ponta a ponta e testar reconsulta, falhas, permissões e tratamento de fornecedores vinculados, preservando o histórico.
- TODO-037: importação já está na main. Os testes conferidos usam visão simulada para cache/cota/concorrência e texto fixo para parsing. Não comprovam precisão do OCR com PDF/PNG/JPEG reais e serviço externo. Manter a aceitação por amostras reais pendente; não afirmar que uma execução simulada valida a disponibilidade do provedor.

Validação adicional da main API `3a30baf`: 13 testes aprovados em `RequestedFeaturesIntegrationTest`, `SaleCommissionVisibilityIntegrationTest`, `FlightImportIntegrationTest` e `QuotationFlightPlansTest`. Os 34 testes de CRUD/isolamento de pessoas, cotações e lançamentos financeiros foram executados separadamente para DEBT-001. Nenhuma gravação em produção foi necessária.

Nova frente em andamento: codex/validacao-comercial, API/UI desde main. Três regressões reproduzidas e corrigidas, sem migration ou alteração retroativa; 15 testes API e 234 UI, tipos/lint/build aprovados. PRs draft API #72 e UI #67, CI verde (API 40792315700 / UI 40792331677); API antes da UI. Não representa conclusão de toda a matriz TODO-015.

## Produção confirmada em 29/10

PRs API #72/#71 e UI #66/#69/#67/#65/#68 publicados. API ba2a204, Railway b6158faa ACTIVE, schema V66. UI 55badfed, Vercel dpl_2TFqMXhsbBbqcNLQnYDWv1ZLr9jZ READY no domínio principal. Consulta autenticada dos recebimentos FELTRIX concluída: dashboard compatível com Vendas, recarga direta e gráfico aprovados; histórico de Viagens consultado. Fornecedores continuam pausados, V67 sem SQL. Nenhuma nova frente foi iniciada nesta rodada.
