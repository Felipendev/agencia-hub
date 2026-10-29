# Fila de integração — 28/10/2026

Por instrução do usuário, desenvolver e validar em branches independentes, mantendo PRs em rascunho. Não integrar ou publicar novas entregas nesta etapa. A disponibilidade da hospedagem não determina a conclusão da implementação.

| Entrega | Base e branch | PR | Estado |
| --- | --- | --- | --- |
| F11: histórico e exportação, API | main `3a30baf` → `codex/f11-historico-exportacao` | [API #71](https://github.com/Felipendev/agencia-hub-api/pull/71) | Implementado, 7 testes HTTP/Spring/PostgreSQL, CI verde |
| F11: histórico e exportação, UI | main `be685c8` → `codex/f11-historico-exportacao` | [UI #65](https://github.com/Felipendev/agencia-hub/pull/65) | Implementado, 244 testes, tipos/lint/build e revisão visual aprovados, CI verde |
| DEBT-001: confirmação de persistência e isolamento do estado | main `be685c8` → `codex/regressao-persistencia` | [UI #66](https://github.com/Felipendev/agencia-hub/pull/66) | Implementado, 307 testes, tipos/lint/build aprovados; CI verde no head ffe6b9a (execução 40791711202) |

Não há dependência de código entre DEBT-001 e F11. Nenhuma dessas entregas cria migration; V67 continua sem reserva. As branches não contêm commits uma da outra.

## Integração futura

1. Buscar a main vigente, atualizar cada branch e resolver conflitos preservando as duas entregas.
2. Repetir os gates no head atualizado. DEBT-001 acrescenta testes à CI; depois de integrar ambas as branches, executar também a suíte combinada.
3. Integrar uma API por vez e confirmar migrations, inicialização e saúde. Só então integrar a UI dependente. F11 exige API #71 antes de UI #65. DEBT-001 pode entrar independentemente.
4. Fazer smoke com sessão real após cada publicação e registrar as evidências. Uma prévia automática verde não equivale a smoke de produção.

## Pendências que não devem ser confundidas com código novo pronto

- F05/estoque de milhas e créditos F09: usuário confirmou em 28/10 que devem permanecer bloqueados; aguardam regras sobre custódia, aquisição, consumo, evento gerador, valores, limites e estorno. Não gerar efeitos financeiros com regras presumidas.
- TODO-015: código comercial já está na main. A rodada de 28/10 aprovou os testes existentes de lucro fixo, aprovação, viagem, previsão financeira, liquidação/estorno sem duplicação e visibilidade de comissão. Não é evidência suficiente para fechar toda a matriz de fornecedores, edição, filtros, exportação e isolamento do fluxo comercial completo. Manter a validação abrangente pendente.
- TODO-037: importação já está na main. Os testes conferidos usam visão simulada para cache/cota/concorrência e texto fixo para parsing. Não comprovam precisão do OCR com PDF/PNG/JPEG reais e serviço externo. Manter a aceitação por amostras reais pendente; não afirmar que uma execução simulada valida a disponibilidade do provedor.

Validação adicional da main API `3a30baf`: 13 testes aprovados em `RequestedFeaturesIntegrationTest`, `SaleCommissionVisibilityIntegrationTest`, `FlightImportIntegrationTest` e `QuotationFlightPlansTest`. Os 34 testes de CRUD/isolamento de pessoas, cotações e lançamentos financeiros foram executados separadamente para DEBT-001. Nenhuma gravação em produção foi necessária.

Nova frente em andamento: codex/validacao-comercial, API/UI desde main. Três regressões reproduzidas e corrigidas, sem migration ou alteração retroativa; 15 testes API e 234 UI, tipos/lint/build aprovados. PRs draft API #72 e UI #67, CI em execução; API antes da UI. Não representa conclusão de toda a matriz TODO-015.
