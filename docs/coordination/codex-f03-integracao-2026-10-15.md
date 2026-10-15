# F03 — revisão e integração Codex

PRs: [API #62](https://github.com/Felipendev/agencia-hub-api/pull/62) e [UI #55](https://github.com/Felipendev/agencia-hub/pull/55). Atualizada a branch de cada repositório com a main que contém F02 publicado.

## Correções e integrações

- V57 de contratos preservada; migração de economia renumerada para V58. Nenhuma migração já publicada foi alterada.
- Menu em Viagens para gestor/vendedor, rotas autenticadas, atalhos na viagem e na pessoa. Exclusão de viagem avisa que análise, versões e evidências saem, enquanto relatórios já emitidos permanecem.
- Confirmações de equivalência não bastam sem rota, data de ida, passageiros, tarifa e bagagem registrados: resultado indisponível e motivo explícito, sem inventar economia.
- Prévia completa inclui condições, datas do comparativo, custos, ajustes, fontes e metodologia. PDF preserva as datas originais do comparativo. Ocultações atuam sobre campos estruturados; textos livres precisam de revisão explícita.
- API exige o hash do conteúdo revisado antes de emitir o relatório. Mudança nas bases/opções invalida a prévia (409), sem gravar documento diferente. Interface invalida a prévia após conflito e conserva os campos do formulário.
- Relatório preservado impede exclusão silenciosa da pessoa por FK, com mensagem própria. Anonimização com análises/relatórios continua pendente para revisão das versões, anexos e documentos. Não foi criada política de retenção automática.
- Exclusão programada já autorizada da agência limpa as tabelas de economia e viagens antes das pessoas, sem afetar outra agência.

## Validações

47 testes backend aprovados em PostgreSQL efêmero real, Flyway V1–V58, incluindo regressões de contratos, privacidade e exclusão de agência. Comando: `mvn clean test -Dtest=TripSavingsIntegrationTest,TripSavingsTest,SavingsReportPdfTest,ContractIntegrationTest,ContractTemplateRendererTest,ContractValuesTest,ContractPdfRendererTest,DataDeletionIntegrationTest,DataDeletionMultiTenancyIntegrationTest,AgencyDeletionSchedulerIntegrationTest`.

114 testes frontend aprovados; tipos no build, lint sem erros (duas diretivas antigas sem uso em cotações) e build Next/Turbopack aprovados. Corrigida a asserção de PDF que esperava hífen onde o texto emitido usa travessão; preservada a verificação de conteúdo e paginação.

Revisão visual do build real em 1440×1000 e 390×844 com dados fictícios e respostas interceptadas somente na sessão local. Sem escrita na API real e sem overflow global em celular. Evidências em `evidencias-f03/`.

## Prévia e produção

Prévia Railway `agencia-hub-api-pr-62` é um ambiente efêmero com volume PostgreSQL próprio. Como sua V57 experimental já havia sido aplicada, a revisão usa o esquema novo `f03_v58_review`, com Flyway/Hibernate/pool alinhados somente nesse ambiente. O esquema anterior é preservado. Essas variáveis não pertencem à produção.

Produção continua usando seu esquema habitual: V56/V57 de contratos e V58 de economia. Registrar estado final e commits de merge nos PRs e no backlog após confirmar os deploys. Os dados comerciais não são alterados pela geração de análise ou relatório.
