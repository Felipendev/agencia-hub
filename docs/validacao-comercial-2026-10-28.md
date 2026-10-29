# TODO-015 — correções encontradas na validação comercial

Branch `codex/validacao-comercial`, criada da main `3a30baf`. Sem migrations, backfill, exclusão de históricos, integração ou publicação de produção.

Três testes HTTP falharam antes da correção: pagamento direto do cliente ao fornecedor gerava uma obrigação para a agência; detalhe de venda calculava lucro como se um custo desconhecido fosse zero; edição de fornecedor aceitava nome vazio. A edição também passa a rejeitar outro fornecedor com o mesmo nome, sem distinguir maiúsculas, dentro da agência, como a criação já fazia.

O pagamento direto continua compondo custo e margem, mas deixa de criar uma nova conta a pagar pela agência. Obrigações antigas não são apagadas nem reconciliadas automaticamente. Custos desconhecidos mantêm lucro indisponível no resumo e no detalhe. A interface dependente mostra o motivo, sem converter null em zero. Fornecedor mantém o mesmo ID na edição.

Os testes cobrem as regressões, consulta após alteração, exclusão de fornecedor sem vínculo e isolamento entre agências, incluindo tentativa de usar fornecedor de outra agência numa venda e rollback. A unicidade de nome não ganha trava concorrente nova nesta entrega; usa a validação existente na criação e equivalente na edição.

Esta correção não encerra todo TODO-015. A matriz completa de fornecedores vinculados, filtros, exportação e entradas comerciais permanece em validação. Para registros financeiros históricos, usar estorno/cancelamento conforme o domínio; não excluir para contornar integridade.

Antes da futura integração: atualizar as branches com main e repetir os testes no novo head. API deve ser integrada antes da UI que apresenta lucro indisponível. A implementação é independente de F11 e DEBT-001.

Validação local final: 15 testes HTTP/Spring/PostgreSQL aprovados (CommercialFlowIntegrationTest, RequestedFeaturesIntegrationTest, SaleCommissionVisibilityIntegrationTest, FinancialEntryHttpIntegrationTest e FinancialEntryMultiTenancyIntegrationTest). Interface: 234 testes, tipos, lint e build webpack aprovados. Revisão independente dos diffs aprovada. Três casos vermelhos antes da correção estão registrados no log local commercial-red.log; logs são ignorados e não contêm evidências de produção.

PRs em rascunho: API #72 (61636957fcc372f6dba2bbed49f7435a1025b7b7), UI #67 (6917712e07989ec423984cda10da400bf007340e). CI em execução. Sem merge/deploy de produção.

Atualização final: CI verde nos heads acima, execuções API 40792315700 e UI 40792331677. A prévia Vercel concluiu; a prévia Railway automática ainda estava em implantação na última consulta. Nenhuma depende de merge em produção. A inicialização/HTTP da prévia API não foi validada manualmente nesta etapa.
