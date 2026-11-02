# F02 — validação e publicação dos contratos

Entrega do Claude revisada e integrada pelo Codex, em PRs isolados: [API #61](https://github.com/Felipendev/agencia-hub-api/pull/61) e [interface #54](https://github.com/Felipendev/agencia-hub/pull/54).

## Resultado funcional

Modelos da agência com produto Viagens/Milhas explícito, edição pelo mesmo ID, versões de conteúdo e arquivamento de modelos usados. Contratos vinculados à pessoa compartilhada, rascunho editável, emissão com snapshot e PDF por versão, envio, registro de assinatura com evidência, cancelamento, anexos e vínculos a recebíveis já existentes. Nenhuma venda/receita é criada pelo módulo.

Menu de contratos para gestor/vendedor, rotas autenticadas e atalhos por produto na página de viagens da pessoa e no perfil de Milhas. Uma pessoa pode ter os dois produtos, com ciclos de vida independentes.

## Verificações executadas

- 105 testes frontend aprovados; tipos no build, lint sem erros e build Next/Turbopack aprovados. Restam somente duas diretivas antigas sem uso em arquivos de cotações, fora da alteração.
- 32 testes backend aprovados com `mvn clean test -Dtest=ContractIntegrationTest,ContractTemplateRendererTest,ContractValuesTest,ContractPdfRendererTest,DataDeletionIntegrationTest,DataDeletionMultiTenancyIntegrationTest,AgencyDeletionSchedulerIntegrationTest`. PostgreSQL efêmero real e Flyway, incluindo isolamento de agência, permissões, concorrência, ausência de efeito financeiro, PDF antigo após edição, anonimização pendente e descarte da agência sem afetar outra.
- Revisão visual do build real em desktop 1440×1000 e celular 390×844, com respostas fictícias interceptadas somente na sessão local. Filtro por produto e cliente correto, sem overflow global. Evidências no PR da interface em `docs/coordination/evidencias-f02/`.
- Compilação limpa removeu uma migração antiga que restara em `target`; não havia versão duplicada no código-fonte final. V56 cria os contratos com produto explícito e V57 adiciona o índice por agência/modelo.

## Publicação

API: merge `41a50d9ac3ca236c76e10163fed9ddb2bfec6ed3`; Railway `6b103d49-5c23-4595-a511-7ed85e9af192`, SUCCESS. Logs confirmam atualização de V55 para V57 e inicialização da aplicação; sem ocorrências de ERROR na consulta ao log desse deployment após iniciar.

Interface: merge `b528cbbf5f002573adfdc43b102db6ea40fad75f`; Vercel `dpl_GHmcHRH7Ez4oUTPctwKemr46Ezu1`, READY, alias `www.agenciashub.com.br`. CI dos dois commits de merge aprovada. Rotas `/contratos`, `/contratos/modelos`, `/contratos/novo` e detalhe devolvem 307 para login preservando `from` quando não há sessão; API de contratos recusa acesso anônimo (403). Publicação acessível em https://www.agenciashub.com.br/contratos.

Limite da checagem em produção: não havia sessão de usuário ativa nesta retomada, portanto não foi criado/alterado contrato real nem foi alegado teste autenticado em produção. Os fluxos de negócio e permissões foram validados em banco efêmero real; a revisão visual usou dados fictícios em sessão local isolada.

## Limites e próximas etapas

Documento emitido mantém o retrato dos dados, inclusive o título original do PDF. Exclusão de pessoa com contratos orienta preservar o histórico/inativar o cadastro; rascunhos sem emissão usam sua exclusão própria. Solicitação de anonimização de pessoa com contratos permanece pendente para revisão explícita dos documentos/anexos. Não há prazo de retenção ou descarte de evidências presumido.

Claude pode continuar F03 em branch/PR próprios, sincronizando com a main após esta integração. A versão V57 fica ocupada; a próxima migração deve ser coordenada e validada em banco efêmero novo. Não aplicar stashes de diagnóstico do leitor nem de versões intermediárias desta revisão.

TODO-052 (simulações por cliente) continua pendente sob Codex e não integra estes PRs. A identificação do autor da carteira de Milhas segue como correção do módulo de Milhas, separada dos contratos.
