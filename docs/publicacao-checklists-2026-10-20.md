# F01 — publicação de checklists e tarefas

Concluída em 20/10/2026, após F07/V59. API [#63](https://github.com/Felipendev/agencia-hub-api/pull/63), head 9db4b4d6262734fdf80cf8ea149d9d092ffb4faa e merge 9f7f224df444d29870ed4eeaeda1073e9063e273. Railway 1f607de2-62b2-4037-9724-d42e17ef1ab6 SUCCESS; logs confirmam public V59→V60, uma migration aplicada, inicialização concluída. OpenAPI 200 e /work/tasks anônimo 403.

Interface [#56](https://github.com/Felipendev/agencia-hub/pull/56), head 9d3ced79491ddd14d8daf3cedb40163e06523b99 e merge 04f903b5a10cd7ef6754047454e2273047ed516d. Vercel dpl_74yf3vx9tpkbSXhsbegqUhhqMHvj READY, alias www.agenciashub.com.br confirmado para o commit correto.

32 testes backend na integração com V59 e upgrade real V59→V60, preservando agenda/tarefas nos arquivos compartilhados. 135 testes frontend, build/tipos e lint sem erros (dois avisos antigos). Prévia #63 iniciou com V60 no deploy 0efddc14-677a-4e06-b26a-6a5196e4317d, OpenAPI 200 e rota protegida 403, antes do merge. PostgreSQL da prévia iniciado no ambiente correto, sem mudança no banco de produção. Repair automático permanece desativado.

CRUD aplicável de tarefas/modelos e edição de execuções pelo ID; cancelamento preserva histórico. Pessoa compartilhada, produto explícito, responsável, prazo, idempotência, versões e isolamento. Não foi implementada criação automática de tarefas a partir de carteiras ou atas: integrações futuras em PRs próprios. Não houve novo CRUD autenticado com registros reais em produção; persistência e permissões foram testadas com PostgreSQL efêmero e contexto real da API.
