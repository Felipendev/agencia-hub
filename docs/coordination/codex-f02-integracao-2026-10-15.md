# F02 — revisão e integração pelo Codex

PRs pareados: [API #61](https://github.com/Felipendev/agencia-hub-api/pull/61) e [UI #54](https://github.com/Felipendev/agencia-hub/pull/54).

Esta integração incorpora os commits de produto do Claude (`beebff2` na API, `1967c05` na UI), sem reconstruir o módulo. Viagens e Milhas compartilham a pessoa, mas modelos, contratos e documentos registram o produto explicitamente. A passagem emitida com milhas continua sendo Viagens.

## Integrações e correções

- Proteção das rotas `/contratos*`, menu para gestor/vendedor e atalhos contextualizados: cadastro de viagens abre contratos TRAVEL; perfil de milhas abre MILES, sempre com o mesmo customerId.
- Exclusão de pessoa com contratos devolve conflito específico e orienta preservar documentos/inativar a pessoa. Rascunhos sem emissão continuam com exclusão própria.
- Exclusão programada já autorizada da agência limpa as tabelas de contratos na ordem das dependências, com teste em agência fictícia e preservação de outra agência.
- PDFs de versões anteriores usam o título do snapshot, inclusive após editar o título atual do rascunho. Corpo e título não são reconstruídos com dados atuais da pessoa.
- Índice V57 para contagem de contratos por modelo; V56 contém o schema final do F02 com produto e restrições. Numeração conferida contra main (até V55) antes da integração. Não reaplicar o V56 original de um preview anterior em produção.

## Anonimização e retenção

O fluxo automático não pode afirmar que os dados foram anonimizados enquanto snapshots/anexos pessoais continuam armazenados. Para pessoa com contratos, a solicitação permanece pendente, com mensagem explícita de revisão de retenção/anonimização. Nenhum prazo de retenção, exclusão de evidência ou conclusão automática foi inventado. A definição da política permanece uma evolução de domínio; o cadastro não é silenciosamente anonimizado com documentos intactos.

## Validação

Testes de negócio executados em PostgreSQL efêmero; não confundir CI de compilação com teste funcional. Conferir no registro final do PR a contagem e os commits efetivamente publicados. Interface: 105 testes aprovados, build e lint aprovados (duas diretivas antigas sem uso em cotações, sem erro).

Revisão visual do build real em desktop 1440×1000 e celular 390×844, com autenticação e respostas de API fictícias interceptadas somente na sessão local. Nenhum dado real foi criado. Filtro MILES oculta o contrato TRAVEL da mesma pessoa; largura da página em celular é 390 px, sem overflow global.

Evidências: [modelo desktop](evidencias-f02/modelos-desktop.png), [modelo celular](evidencias-f02/modelos-mobile.png), [novo contrato](evidencias-f02/novo-mobile.png), [lista filtrada](evidencias-f02/lista-mobile.png).

## Fora desta entrega

Autor da carteira F04 como `PlatformAccount@hash` foi confirmado por leitura do uso de `principal.getName()`, mas a correção pertence ao módulo de Milhas. Não misturar esse ajuste nem TODO-052 (simulações por cliente) nos PRs de contratos. F03 segue em branch/PR próprios do Claude.
