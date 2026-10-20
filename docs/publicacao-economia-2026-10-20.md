# F03 — publicação de Economia do cliente

Entrega concluída e verificada em 20/10/2026. Área de Viagens, compartilhando pessoas com Milhas sem misturar economia realizada, projeção de acúmulo e lucro da agência.

## Versões publicadas

- API [PR #62](https://github.com/Felipendev/agencia-hub-api/pull/62), head revisado `5aae9355d26930a4b6b8735d3a6e648fd1c4f4fa`, merge `cc5079b97bd6bbf9c70d2bf53f4ea3e665b891ff`, já integrado desde 15/10 no fuso de Fortaleza. Railway `70ad7fb6-a722-46e5-99c8-50c226379a7b` SUCCESS. Logs confirmam public V57 → V58 e aplicação iniciada. Nenhuma configuração de schema de prévia foi aplicada por esta publicação à produção.
- UI [PR #55](https://github.com/Felipendev/agencia-hub/pull/55), head revisado `d67a5b1c49ca0f97e7d9698bee316c3d4eee660f`, merge `0ce8b788e76abeeec17a6fbabdad198e773531c0`, integrado em 20/10. Vercel `dpl_yhN7wcRVyiS4YgNTNzNeNruJDLGV` READY para o merge correto, alias `www.agenciashub.com.br` confirmado.

## Comportamento entregue

Análise por viagem com CRUD, edição pelo mesmo ID e versões, evidências e comparação documentada de rota, datas, passageiros, tarifa e bagagem. Custos, taxas, honorários e ajustes ficam explícitos. Milhas com custo desconhecido ou comparação sem base suficiente deixam a economia indisponível com motivo. Cancelamentos são excluídos dos totais. Não cria ou modifica lançamentos financeiros.

Relatórios por cliente/período com revisão completa, ocultações e PDF. A API exige o hash da prévia revisada; alteração da fonte/opções exige nova revisão (409). Documento emitido é retrato imutável: corrigir a análise e gerar nova versão ou excluir o documento quando aplicável. Relatórios preservados bloqueiam exclusão silenciosa da pessoa; anonimização desses históricos exige revisão, sem confirmação parcial. Exclusão programada de agência mantém isolamento entre agências.

Menu Viagens, proteção das rotas, atalhos em pessoa/viagem e aviso de exclusão da análise com preservação de relatórios integrados.

## Evidência e limites

Validações anteriores em 15/10: 47 testes backend de negócio/integração/regressão + 1 teste adicional de inicialização com schema isolado (48 backend no total), 114 testes frontend, lint e build aprovados. O teste adicional inicia a aplicação real com URL JDBC/currentSchema, aplica V58 e confirma dados de public preservados. Revisão visual desktop/celular com dados fictícios na sessão local. Código de negócio não mudou desde esses testes; CI do head UI aprovada antes do merge.

Em 20/10, produção confirmou site e OpenAPI HTTP 200 e /savings sem sessão 403; rotas /economia, /economia/relatorios e /economia/viagens/{id} redirecionam para login preservando o destino. Não houve novo CRUD autenticado com dados reais em produção; persistência, permissões, isolamento e versões têm cobertura nos testes locais com PostgreSQL real. Não alegar teste autenticado ponta a ponta em produção nesta retomada.

O incidente da prévia F03 e a configuração Hikari estão documentados no runbook histórico. A recuperação manual da antiga prévia não é mais pendência para esta entrega. Não reaplicar suas variáveis à produção.

## Continuidade

Claude: F07 agenda/atas, V59 reservada, branch e PRs próprios a partir da main atualizada. Codex: F01 checklists V60, seguido do vínculo de simulações por cliente V61. Desenvolvimento paralelo, publicação sequencial V59 → V60 → V61. CI da API já contém o gate contra duplicidades, alterações de migrations integradas e novas versões fora da sequência. Reservas e donos: `migrations-reservadas-2026-10-15.md`.
