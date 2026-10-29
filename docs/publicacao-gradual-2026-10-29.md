# Publicação gradual — 29/10/2026

O usuário autorizou tentar os deploys de produção em 29/10. Atualizar as branches com main, validar os heads, integrar separadamente e confirmar cada implantação antes da próxima dependente. Fornecedores continuam pausados; V67 apenas reservada, sem SQL criado/aplicado. F05 e créditos F09 continuam bloqueados por regras de negócio.

## Base anterior

API `3a30bafbc2d62bc1d050c6409a7800986ecc7e8e`, Railway `f5cb7fad-5e8c-4fde-bb39-2e8494ae485d`, schema público V66. UI `be685c874290390d636d6151e4959846407e331b`, Vercel `dpl_9drBurR6nXYTCCjhNWbt4JyAx2TW`, domínio `www.agenciashub.com.br`. Site e OpenAPI retornaram 200 antes da rodada.

## Progresso confirmado

| Etapa | PR / head integrado | Merge na main | Produção |
| --- | --- | --- | --- |
| Persistência e sessão | UI #66 / `ffe6b9a` | `9d1837f034bf57e6ec5a1a197fbaae55d3467ba6` | Vercel `dpl_2QuqcmWWjgSmT866fgU5gQ5ipgck` READY, domínio principal associado |
| Dashboard financeiro | UI #69 / `9981f60` após main | `0c47d27585ea61f5466e73fe8ebec6202f2ee5e9` | Vercel `dpl_ZEF3UvAMzFwgjbW5hET5j9UferVn` READY, domínio principal associado |
| Correções comerciais | API #72 / `6163695` | `1c85bb7e5854734c0cd27a3b809e1efcacdeaa36` | Railway `16df0b78-4dcd-497e-b188-02616f06cabc` ACTIVE; inicialização/HTTP confirmados |
| Margem indisponível | UI #67 / `1cb2a28` após main | `60e34660ba051fb5b31b7d4f7f636a580439ce01` | Vercel `dpl_GYpz7R6LAHnPXZ34AiJ1de4FqkRB` READY |
| Histórico F11 | API #71 / `b469f1c` após main | `ba2a204056d6dcf668393739bc974fee131879e6` | Railway `b6158faa-c1c4-43ad-8411-0560e2b043a0` ACTIVE, commit exato confirmado no painel |
| Histórico F11 | UI #65 / `860163d` após main | `65249391d44adc35ada724603ac547d0a153c62e` | Vercel `dpl_CNwSLqA1Ho4ye7CjPoEYgz6oUvvp` READY |
| Exportação financeira | UI #68 / `8ccd53c` após main | `55badfed339a5be602a0e2f5089ae0365ab538ce` | Vercel `dpl_2TFqMXhsbBbqcNLQnYDWv1ZLr9jZ` READY, domínio principal associado |

## Validações já repetidas

- Persistência: 307 testes UI, tipos e lint sem erros; CI verde no head exato antes do merge.
- Dashboard com persistência integrada: 339 testes UI, tipos e lint sem erros; CI verde no head `9981f60` antes do merge. Prévia automática bem-sucedida.
- Comercial API: 15 testes HTTP/Spring/PostgreSQL, CI e prévia aprovados; OpenAPI da prévia 200 e vendas sem sessão 403 antes do merge.
- Histórico API combinado com comercial: 22 testes HTTP/Spring/PostgreSQL aprovados; CI e prévia verdes no head `b469f1c`; OpenAPI da prévia 200 antes do merge.
- API comercial em produção: Flyway validou 65 migrations, schema `public` na versão 66, pool iniciado e `Started AgenciaHubApplication` às 14:49:07 UTC. OpenAPI 200; vendas sem autenticação 403. Sem migration nova.
- Domínio principal após primeira publicação: página inicial 200; dashboard e financeiro sem sessão redirecionam com 307.

O conector Railway exigiu reautenticação. A sessão já existente no navegador permitiu ler o ambiente `production`, deploys e logs; nenhuma configuração, variável, pool ou schema foi alterado para contornar o acesso. O painel ainda exibe aviso geral de recuperação do provedor; isso não foi tratado como prova de falha dos deploys desta rodada.

## Validação autenticada

Login concluído e conferido em produção. Vendas e dashboard da mesma agência apresentaram totais compatíveis; despesas e saldo também foram conferidos. Acesso direto ao dashboard repetido, observando loading seguido dos valores retornados, sem visitar Fluxo de Caixa. Gráfico Receita vs Despesas preenchido no mês correspondente aos recebimentos. Histórico de Viagens consultado com sucesso, retornando eventos e opção de CSV. Nenhum registro real criado, quitado, excluído ou reconciliado. Capturas com dados reais ficaram apenas na pasta local ignorada .local/evidencias-producao-2026-10-29, sem envio ao GitHub.

## Encerramento da publicação

As sete entregas foram publicadas, API antes de suas interfaces dependentes. Produção final: API `ba2a204056d6dcf668393739bc974fee131879e6`, UI `55badfed339a5be602a0e2f5089ae0365ab538ce`. Os deploys anteriores foram substituídos normalmente; o estado REMOVED de um deploy antigo não indica indisponibilidade do atual.

- API final: pool iniciado às 14:54:47 UTC, 65 migrations validadas, schema público V66 sem alteração e aplicação iniciada às 14:54:51 UTC. Evidência do ambiente ativo em `coordination/evidencias-publicacao-2026-10-29/api-ativa.png`.
- UI combinada final: 362 testes em 61 arquivos, tipos sem erros e lint sem erros (dois avisos preexistentes). Revisão independente sem bloqueadores. CI final #68: execução 40897056012, job 123528959935, head `8ccd53c` aprovado antes do merge. Prévia `dpl_CdJC68DRzk58aEpFAwmgNeFJKvUB` READY.
- API combinada: 22 testes HTTP/Spring/PostgreSQL aprovados. CI #71: execução 40895054542, job 123521767348, head `b469f1c` aprovado antes do merge.
- Verificação pública final: site 200, dashboard sem sessão 307; OpenAPI da API 200, histórico sem sessão 403. Isso confirma disponibilidade/proteção, não os dados financeiros da conta.
- Conferência autenticada concluída após novo login: dashboard, comparação com Vendas, entrada direta com nova consulta e gráfico, além de leitura do histórico de Viagens.

Nenhuma variável/configuração Railway foi alterada nesta rodada. Nenhuma migration criada/aplicada. V67 continua reservada e pausada. TODO-015 permanece parcialmente aberto para a matriz comercial e decisão de reaproveitamento de fornecedores; F05 e créditos F09 continuam bloqueados.

Atualização da sessão: a primeira tentativa mostrou credenciais inválidas; o usuário entrou novamente e a validação autenticada foi concluída. Railway também reconectado; a API já havia sido validada pelo painel.
