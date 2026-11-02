# Retomada de publicação — 22/10/2026

F10/V62 e F09/V63 continuam sem merge/publicação. Não houve alteração de produção nesta conferência. OpenAPI de produção respondeu HTTP 200.

## Bloqueios confirmados

- A sessão autenticada do navegador abriu o serviço API no ambiente `agencia-hub-api-pr-66` (`52c3cf05-8f9b-4483-9d71-a60b600d1e5f`). O painel mostra `Limited Access — Deploys have been paused due to an upstream issue`. O único deploy ativo visível permanece `46a5c8e1-d555-43ab-afd3-01724c9a4dc4`, anterior à revisão.
- O status oficial consultado, atualização de 22/10 às 12:30 UTC (09:30 Fortaleza), informa builds disponíveis para Pro/Enterprise e retomada ainda pendente para Hobby/Free/Trial. Não se deduz o plano desta conta; o bloqueio específico foi confirmado no próprio serviço.
- O conector Railway retorna `UNAUTHORIZED / oauth_token_invalid_grant` e exige reautenticação. A sessão do navegador continua utilizável para leitura. Não criar novos tokens nem alterar credenciais automaticamente para contornar essa falha.
- Railway divulgou incidente envolvendo possíveis acessos a segredos de configuração e recomenda rotacionar segredos e revisar atividade. Isso não prova que esta conta tenha sido afetada. Planejar a rotação coordenada com os respectivos provedores e serviços consumidores; não revogar credenciais de produção sem a substituição pronta.

Fontes: https://status.railway.com/ e https://blog.railway.com/p/security-disclosure-wednesday-october-21st.

## CI confirmada na conferência anterior

- F10 API `e82a06ddab449a1855d0ac2d2c3473a73bf6846a`: sucesso. UI `57fdf27cd94d885bd404beb9a6582f75f7ccf37b`: build e Vercel aprovados.
- F09 UI `50be3bb52397197fb6fbc8e536471ee0f019e326`: build e Vercel aprovados, deployment `dpl_GmDkzTujroMCjzC4tUrfh1X6u9Sf`.
- F09 API `58cd19c231778f6c287fc86aef55fdde0446397e`: gate recusou corretamente V63 porque main ainda exige V62. Log do job `119279383893` confirma a causa. Não contornar o gate.

## Ordem de retomada

1. Restabelecer acesso do conector, quando necessário, e aguardar liberação de builds deste serviço.
2. Construir uma única prévia F10 no head revisado; conferir commit, V62 e inicialização.
3. Publicar API #66, conferir V61→V62/saúde e depois publicar UI #59.
4. Atualizar F09 com main, preservar as integrações de privacidade/exclusão de ambos os módulos e repetir gate/validações.
5. Validar prévia F09 e publicar API #67/V63 antes da UI #60.

Claude já entregou o código dessas frentes. Integração e publicação permanecem com Codex. Créditos/recompensas por indicação continuam fora do cadastro entregue e dependem de regras de negócio próprias. Nenhuma migration nova reservada nesta conferência.
