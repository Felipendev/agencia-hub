# Viagens e Milhas: dois produtos, uma identidade

Orientação explícita do usuário em 14/10/2026: perfil e carteira devem estar numa seção só de Milhas. Os mesmos clientes podem contratar produtos diferentes.

## Fronteiras de domínio

| Núcleo compartilhado | Produto Viagens | Produto Milhas |
|---|---|---|
| Pessoa, contatos, documentos de identidade, agência, equipe e autenticação | Solicitação de viagem, cotação, comparação de voos, reserva/viagem, trechos, hotel, transfer, atividades e economia realizada | Perfil de objetivos, contas por programa/titular, cartões, clubes, saldo declarado, movimentos, vencimentos, simulação e futuras rotinas de acúmulo |

Uma pessoa possui um único `customerId`, com relacionamentos independentes nos dois produtos. Abrir Milhas não cria uma segunda pessoa. Nem todas as pessoas cadastradas em Viagens estão em acompanhamento de Milhas: a lista de Milhas considera apenas registros de perfil/carteira existentes, incluindo consulta opcional dos arquivados.

Uma passagem paga/emitida com milhas pertence ao produto **Viagens**; milhas são o meio de emissão nesse caso. O serviço continuado de acompanhamento de pontos pertence ao produto **Milhas**. Não mover cotações nem a calculadora de preço de voos para Milhas por causa da unidade utilizada.

Não somar saldos de programas diferentes como patrimônio homogêneo, nem converter pontos projetados em dinheiro/lucro/receita. Movimentos manuais da carteira não são lançamentos financeiros. A ligação futura entre consumo de saldo e uma emissão será explícita, auditável e dependente das regras F05; aprovação de cotação não debita a carteira automaticamente.

## Organização desta entrega

- Navegação separada para Viagens e Milhas, para gestor e vendedor.
- `/milhas`: perfis/carteiras cadastrados, filtro, arquivados e seleção de uma pessoa do CRM compartilhado.
- `/milhas/clientes/{customerId}`: página exclusiva de perfil e carteira, preservando API, IDs, dados e CRUD já implementados.
- `/milhas/simulador`: simulador no produto Milhas. `/simulador-acumulo` redireciona para manter links antigos.
- `/clientes/{customerId}`: visão de identidade/relacionamento de viagens, com link explícito para a outra área; sem embutir o formulário de carteira.
- `/miles-wallets`: consulta agregada isolada por agência, sem criar matrículas, pessoas ou copiar saldos.

Esta mudança separa os fluxos existentes. Não cria outra autenticação, database, assinatura comercial, cobrança ou permissão por produto. Também não afirma que estados de contratos/receitas/tarefas já foram migrados: esses módulos precisam respeitar a fronteira ao serem implementados.

## Contrato para as próximas features

Para novos registros de negócio que possam atender aos dois produtos, usar um identificador explícito de produto: `TRAVEL` ou `MILES`. Essa nomenclatura é o contrato de planejamento; o schema de cada módulo deverá formalizá-lo e validá-lo em API/persistência antes do uso. O produto não deve ser deduzido do cliente, do programa de fidelidade ou de ter utilizado milhas em um voo.

- **F02 / Claude — contratos**: modelo e contrato identificam o produto; vigência, assinatura, cancelamento e cobrança do produto Milhas são independentes de uma venda de Viagens. O mesmo cliente pode ter ambos. Documento emitido preserva o produto e o retrato dos dados/modelo usados. Esta decisão deve entrar na primeira especificação de F02.
- **F01 / Codex — tarefas e rotinas**: tarefa/modelo identifica o produto; origem e vínculos devem ser consistentes com ele. Rotinas de milhas e obrigações de uma viagem não se misturam em filtros ou execução.
- **F08 / Codex — follow-up**: próxima ação por relacionamento/produto, sem um acompanhamento sobrescrever o outro na mesma pessoa.
- **F07 / Claude — agenda/atas**: atendimento com produto/contexto explícito. A mesma identidade pode ter atendimentos nos dois; futuras tarefas herdam o contexto correto.
- **F03 / Claude — economia**: resultado realizado de Viagens, com comparação equivalente e custo documentado. Potencial de acúmulo é projeção de Milhas e não integra esse indicador.
- **F09 / Claude — indicações**: produto da indicação explícito quando houver campanha/regra por produto; crédito só nasce após definir o gatilho. Não presumir regra compartilhada entre produtos.
- **F10 / Claude — etapas**: pertencem à viagem. Biblioteca é infraestrutura compartilhada e pode receber classificação/filtros de material por produto em extensão própria.
- **F11 / Codex — relatórios**: escopo de produto explícito; visão consolidada opcional deve separar indicadores e unidades, sem somar pontos com valores monetários.

Dados antigos sem classificação só recebem produto quando o vínculo comprova a origem. Despesas gerais da agência e registros administrativos não devem ser arbitrariamente atribuídos a Viagens; manter ausência de classificação ou contexto compartilhado até uma regra apropriada. Não aplicar uma migração global por suposição.

Arquivar/cancelar um relacionamento de produto não exclui a pessoa nem encerra seu outro relacionamento. Editar nome/contatos atualiza a identidade compartilhada, e a UI deve explicar esse alcance. Exclusão global da pessoa é uma operação distinta, sujeita às regras de histórico e vínculos existentes.

## Coordenação e aceite

Codex é dono da separação estrutural, rotas e navegação, em `codex/separacao-dominios-milhas`. Claude mantém as cinco frentes atribuídas, começando F02 com classificação de produto; não deve reconstruir carteira/CRM. Esta separação antecede as integrações de F01/F04 e não muda a divisão de responsabilidades.

Aceite: não duplicar pessoas ou carteiras; preservar CRUD/IDs/histórico; não alterar estado de viagem/identidade ao arquivar Milhas; consultar apenas a agência autorizada; exigir sessão nas novas rotas; links antigos do simulador continuam válidos; estados de erro não parecem uma lista vazia; navegação e ações utilizáveis em celular.

## Validação

Em andamento na branch de separação, com PRs distintos de API e interface. A documentação de coordenação do PR #52 será atualizada com esta fronteira antes do início das próximas features.
