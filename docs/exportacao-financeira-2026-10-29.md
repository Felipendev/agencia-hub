# TODO-015 — exportação financeira

Branch `codex/exportacao-financeira`, independente da main da interface. A função existente descartava fornecedor, observações e composição comercial dos lançamentos. Esta entrega completa essas colunas no arquivo baixado; não cria registros, endpoints ou migrations.

O CSV contém valor e status do lançamento, referências do lançamento/cliente/fornecedor, observações, venda informada, custo, comissão, lucro bruto/líquido do lançamento e recorrência configurada. O valor do lançamento não é somado à margem, e seu status distingue confirmação, previsão e cancelamento: ele não representa automaticamente caixa recebido. Valores comerciais são os informados em cada lançamento, não um consolidado por venda: somá-los entre parcelas pode duplicar a composição comercial. O ID do fornecedor é exportado como ID; seu nome não é inferido de uma pessoa do CRM.

Margem exige entrada, venda e custo conhecidos; custo zero continua válido e ausência de custo deixa a margem vazia. Comissão não informada segue a regra da tela atual, equivalente a ausência de comissão no cálculo. Saídas não recebem margem. Células numéricas não finitas ficam vazias. Datas e valores mantêm os formatos existentes; o CSV usa vírgula, aspas e BOM UTF-8.

Textos com prefixos de fórmula, inclusive após espaços ou controles, recebem apóstrofo. Campos com aspas, vírgula, CR ou LF permanecem em uma célula. Valores monetários negativos continuam números, sem serem convertidos em texto por essa proteção. A codificação compartilhada protege também o CSV de pessoas e o resumo financeiro existentes.

O botão Financeiro continua passando apenas os registros filtrados. A função não consulta dados adicionais nem amplia a seleção. API, permissões e persistência permanecem sob seus contratos atuais; os testes deste arquivo não comprovam autorização do servidor. Não há CRUD novo: o resultado é um arquivo derivado dos registros consultados.

## Aceite e validação

- Conferir o conteúdo do Blob efetivamente baixado, reabrindo o CSV nos testes: composição, referências, seleção recebida, vazios, zero, margem negativa, aspas e quebras de linha.
- Conferir proteção de fórmula nos textos, incluindo nome/telefone do CSV de pessoas, e preservação de números negativos no resumo.
- Conferir download, nome do arquivo, tipo e BOM, além de suíte UI, tipos, lint e build.
- Não presumir compatibilidade de abertura automática em todas as configurações regionais de planilha; não foi usado um Excel real nesta validação.

Manter PR em rascunho, sem merge/publicação nesta etapa. Antes de integrar, atualizar com main e repetir gates. Recomenda-se integrar primeiro a correção de isolamento e persistência do PR UI #66; a exportação usa o estado já consultado. Esta branch não contém os commits de #66, F11 ou das correções comerciais #67.

TODO-015 continua aberto para completar sua matriz de CRUD de fornecedores e entradas comerciais, filtros e permissões. O aceite real do leitor de arquivos TODO-037 e as regras bloqueadas F05/créditos F09 não são substituídos por esta entrega.

Validação: 13 testes do CSV aprovados, com 100% de linhas, branches e funções de csv-export.ts; 247 testes da suíte da branch aprovados. Tipos, lint e build local webpack aprovados. Revisão independente de consistência sem bloqueadores; nenhum Excel real ou dado de produção utilizado. O gate da CI desta base executa tipos/lint/build; execução contínua de testes será acrescentada pelo PR independente UI #66.

PR draft UI #68: b843dedc85336d641cfc7b82d4822ed5ae232cb9. CI em execução. Sem merge/deploy de produção.

Validação final: CI verde no head b843dedc85336d641cfc7b82d4822ed5ae232cb9, execução 40867526572. Prévia automática Vercel concluída. Nenhum merge ou deploy de produção.

## Atualização de publicação — 29/10/2026

Subentrega publicada na rodada autorizada: API final ba2a204 ACTIVE/V66; UI final 55badfed READY no domínio principal. 362 testes UI/22 API combinados aprovados. Sem migration nova; fornecedores/V67 continuam pausados. Registro completo e limite da validação autenticada em publicacao-gradual-2026-10-29.md. Notas anteriores de integração/deploy pendentes são históricas. A publicação das subentregas comerciais não encerra toda a matriz TODO-015.
