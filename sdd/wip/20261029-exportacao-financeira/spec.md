# TODO-015 — exportação financeira

## Escopo

Completar os campos do CSV de lançamentos, separando o valor do lançamento de sua composição comercial. Incluir referências, observações, venda, custo, comissão, margens por lançamento e recorrência. Preservar seleção filtrada e valores desconhecidos; não consultar registros extras ou somar margens entre parcelas. Custo zero é conhecido. Texto potencialmente interpretado como fórmula deve ser neutralizado; números monetários negativos devem continuar numéricos.

Não há gestão de registros nova: exportação é uma projeção local de dados já consultados. Nenhum endpoint, migration ou operação de persistência é criado. API/permissões permanecem com os contratos existentes. A codificação CSV compartilhada também protege os exports já existentes de pessoas e resumo financeiro.

## Implementação

`src/lib/csv-export.ts`: células com aspas e escape, proteção de texto, números finitos com duas casas decimais e vírgula, campos de composição por lançamento. `src/lib/csv-export.test.ts`: reabrir o Blob efetivo e conferir conteúdo, download, nome, tipo e BOM; casos de seleção, vazios, zero, margem negativa e prefixos perigosos. Sem bibliotecas novas.

## Gates

1. Testes do artefato e cobertura de pelo menos 90% do arquivo alterado.
2. Suíte UI, tipos, lint, build e revisão manual de escopo/segurança.
3. PR de rascunho independente da main, CI observada no head; sem merge/deploy de produção.

A integração futura deve atualizar a branch com main, repetir os gates e considerar primeiro o PR UI #66 de isolamento/persistência. Não afirmar conclusão de todo TODO-015, TODO-037 ou dos itens F05/créditos F09 bloqueados pelo usuário.

Implementação e validação local concluídas: 13 testes focados, cobertura 100% do arquivo, suíte247, tipos/lint/build e revisão independente aprovados. PR draft/CI em preparação; integração e publicação pendentes.

PR draft UI #68 criado; CI verde no head b843dedc85336d641cfc7b82d4822ed5ae232cb9 (40867526572). Gates da implementação concluídos; integração/publicação pendentes por instrução do usuário.
