# DEBT-001 — confirmação de persistência

Branch `codex/regressao-persistencia`, criada da main `be685c8`. Independente do F11 e sem mudança na API ou migration. Entrega preparada para revisão; merge e publicação ficam para a etapa gradual solicitada pelo usuário.

## Falhas reproduzidas e corrigidas

Quatro testes falharam antes da correção: exclusão sem sessão removia a pessoa apenas localmente; resposta nula ao editar cotação deixava a alteração otimista; troca de conta mantinha estado/cache anterior; produção sem API criava dados de demonstração. Os testes de contrato também encontraram atualização de pessoa aceitando uma resposta 2xx vazia.

As mutações agora aguardam a confirmação da API. Respostas inválidas geram erro, sem confirmar dados locais. Estado e cache pertencem à combinação usuário/agência. Respostas tardias não repovoam outra sessão; renovar o token mantém o formulário. O modo local exige desenvolvimento e opção explícita. Descartar cache antigo não apaga registros no backend. Uma gravação já recebida pelo servidor não é cancelada pela troca de sessão.

## Evidências

- 73 testes focados: 28 do provider real e 45 dos clientes HTTP; erros 400/401/403/409/500, rede, resposta inválida, concorrência de sessão, cache e confirmação tardia.
- Suíte da interface: 307 testes aprovados. Tipos, lint e build local com webpack aprovados.
- Cobertura dos dois arquivos de produção alterados: 99,36% das linhas, 91,82% das branches e 100% das funções. Não representa cobertura global da aplicação.
- API main `3a30baf`: 34 testes HTTP de CRUD e isolamento entre agências aprovados, para pessoas, cotações e lançamentos financeiros; nenhuma alteração na API nesta branch.
- Revisão independente de consistência aprovada. A CI passa a executar a suíte frontend, além de tipos, lint e build.

Os testes HTTP da interface simulam o transporte; os testes Java usam Spring e PostgreSQL embarcado. Não equivalem a uma sessão de navegador com gravação em produção. Antes do merge: atualizar com main e repetir os gates no novo head. Depois da publicação gradual, conferir os fluxos com uma sessão real.

A primeira CI falhou ao iniciar jsdom/undici no Node 20. O jsdom 30.0.1 já presente exige Node ^22.22.2 ou ^24.15.0; o workflow foi alinhado ao Node 24, usado na validação local (24.18.0). Nenhuma dependência foi atualizada para contornar a falha.

PR UI #66: CI verde no head ffe6b9aa5524fe0eddbc492a8938163daae5b3c7, execução 40791711202. Nenhum merge/deploy de produção.

## Atualização de publicação — 29/10/2026

Subentrega publicada na rodada autorizada: API final ba2a204 ACTIVE/V66; UI final 55badfed READY no domínio principal. 362 testes UI/22 API combinados aprovados. Sem migration nova; fornecedores/V67 continuam pausados. Registro completo e limite da validação autenticada em publicacao-gradual-2026-10-29.md. Notas anteriores de integração/deploy pendentes são históricas. A publicação das subentregas comerciais não encerra toda a matriz TODO-015.
