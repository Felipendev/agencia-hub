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
| Margem indisponível | UI #67 / `1cb2a28` após main | `60e34660ba051fb5b31b7d4f7f636a580439ce01` | Implantação em acompanhamento |
| Histórico F11 | API #71 / `b469f1c` após main | `ba2a204056d6dcf668393739bc974fee131879e6` | Implantação em acompanhamento |
| Histórico F11 | UI #65 / `860163d` após main | Pendente | CI/testes em acompanhamento; aguarda API |
| Exportação financeira | UI #68 | Pendente | Aguarda atualização com a main final e gates |

## Validações já repetidas

- Persistência: 307 testes UI, tipos e lint sem erros; CI verde no head exato antes do merge.
- Dashboard com persistência integrada: 339 testes UI, tipos e lint sem erros; CI verde no head `9981f60` antes do merge. Prévia automática bem-sucedida.
- Comercial API: 15 testes HTTP/Spring/PostgreSQL, CI e prévia aprovados; OpenAPI da prévia 200 e vendas sem sessão 403 antes do merge.
- Histórico API combinado com comercial: 22 testes HTTP/Spring/PostgreSQL aprovados; CI e prévia verdes no head `b469f1c`; OpenAPI da prévia 200 antes do merge.
- API comercial em produção: Flyway validou 65 migrations, schema `public` na versão 66, pool iniciado e `Started AgenciaHubApplication` às 14:49:07 UTC. OpenAPI 200; vendas sem autenticação 403. Sem migration nova.
- Domínio principal após primeira publicação: página inicial 200; dashboard e financeiro sem sessão redirecionam com 307.

O conector Railway exigiu reautenticação. A sessão já existente no navegador permitiu ler o ambiente `production`, deploys e logs; nenhuma configuração, variável, pool ou schema foi alterado para contornar o acesso. O painel ainda exibe aviso geral de recuperação do provedor; isso não foi tratado como prova de falha dos deploys desta rodada.

## Validação autenticada

Foi solicitada uma sessão no domínio principal para conferir o dashboard com dados reais da conta. Até a confirmação do login, os testes e a inspeção com fixtures não equivalem à conferência dos recebimentos reais da FELTRIX. Não foram criados, quitados, excluídos ou reconciliados registros reais para validar esta publicação.
