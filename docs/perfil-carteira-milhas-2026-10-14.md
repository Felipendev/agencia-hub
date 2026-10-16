# Perfil e carteira de milhas — TODO-040 / F04

## Escopo desta tarefa

Carteira manual integrada à página da pessoa em Pessoas. Gestor e vendedor da mesma agência podem criar, consultar e editar o perfil, contas de programas, cartões, clubes e pontos a vencer. Campos opcionais não bloqueiam o cadastro. Sem senha de programa, número completo de cartão, integração com companhia ou movimentação financeira automática.

Perfil: objetivos, frequência de viagens, destinos e plano de ações. Histórico por versão com autor e data. Arquivar e reativar substituem a exclusão destrutiva do perfil para manter o diagnóstico anterior.

Contas: programa e titular explícitos; saldo inicial declarado com fonte e data. O saldo atual resulta das movimentações. Depois da criação, saldo inicial/fonte/data não são sobrescritos; correções usam movimentação ou estorno. Arquivamento e reativação preservam saldos e histórico. Pessoas com histórico de movimentação devem ser inativadas, em vez de excluídas.

Cartões: emissor, nome/categoria, pontos por dólar, gasto previsto e dia previsto de crédito. Clubes: programa, custo/pontos mensais e dia previsto de crédito. Vencimentos: conta, quantidade, data e fonte opcional, com filtros de hoje/próximos 90 dias, passados e todos. Têm CRUD completo por identificador; exclusão conserva uma cópia no histórico de auditoria. Pontos futuros e lembretes de vencimento não alteram saldo.

Movimentações: entrada ou saída, quantidade inteira, data e motivo. Confirmações repetidas retornam a mesma movimentação. Saídas concorrentes e estornos não podem deixar saldo negativo. Movimentos confirmados são imutáveis: estorno registra o efeito inverso com vínculo à operação original e pode ser confirmado novamente sem duplicação. Recriar, após excluir, com a mesma confirmação antiga é recusado.

As tabelas preparatórias V30 não possuíam fluxos de aplicação. A V55 acrescenta tabelas próprias para o modelo declarado/auditável sem alterar as tabelas antigas. Não representa estoque de custódia, reservas ou lotes da F05.

## Contrato de interface

Usar os componentes e variáveis visuais do Hub. Carteira recolhida na página da pessoa para preservar a leitura do CRM; ao abrir, navegação por perfil, contas, cartões, clubes, vencimentos, movimentos e histórico. Formulários rotulados, ações específicas do domínio, confirmação de exclusão/arquivamento e sucesso somente após a API. Layout refluído em telas pequenas; tabela de movimentos com rolagem horizontal própria.

## Dependências posteriores

Esta tarefa entrega o cadastro e a carteira manual. A geração de tarefas do plano depende de F01; não foi marcada como implementada. Um formulário público de diagnóstico de milhas também permanece uma extensão de F04: o formulário público atual é de solicitação de viagem e não deve sobrescrever uma carteira com base apenas em telefone/e-mail informados por visitante.

## API

Base: `/customers/{customerId}/miles-wallet`, sempre validando pessoa e agência.

- GET da carteira consolidada, com perfil, itens, movimentos e auditoria.
- PUT/DELETE `/profile`: salvar com versão esperada ou arquivar.
- POST `/items` com confirmação identificada; PATCH/DELETE `/items/{id}` com versão esperada.
- POST `/items/{id}/restore`: reativar conta arquivada.
- POST `/accounts/{id}/movements`: entrada/saída com confirmação persistida.
- POST `/movements/{id}/reverse`: estorno com motivo.

As mutações serializam pela pessoa dentro da agência. Conflitos retornam 409; recursos de outra pessoa/agência retornam 404. Valores fracionários de pontos são recusados.

## Validação e publicação

Publicado em 14/10/2026. Acesso: Pessoas → abrir a pessoa → Perfil e carteira de milhas → Abrir carteira.

- Frontend `fe86a8cdfe73f255d28e6408e6958f820e8a3c9e`: Vercel `dpl_Cd96Psoxm9pN8oTUJL8CP5sjDSMG`, READY e associado a `www.agenciashub.com.br`.
- API `91614f0cfc00c4d468402283235e4083d7fb7b34`: Railway `6d823c84-752b-41c9-90ba-69f0e4e501d3`, SUCCESS; V55 aplicada às 20:09:22 UTC (17:09:22 em Fortaleza).
- GitHub Actions dos dois commits: sucesso.
- 77 testes frontend e 56 testes selecionados da API aprovados na cópia de entrega. Testes da carteira cobrem persistência, edição pelo mesmo ID, histórico, remoção, arquivamento/reativação, repetição, estorno, concorrência, valores inválidos, acesso compartilhado por vendedor/gestor e restrição de perfil/agência/pessoa.
- Tipos, estilo sem erros e compilação de produção aprovados. Permanecem dois avisos antigos de diretivas de estilo sem uso em telas de cotação.
- Consulta autenticada da carteira em produção: HTTP 200, perfil ausente e listas vazias, sem gravação em dados reais. A página publicada carregou a carteira corretamente. Preflight de criação: HTTP 200, domínio oficial e cabeçalhos de autorização/tipo de conteúdo/confirmação aceitos.
- Conferência visual dos componentes e estilos da entrega em sessão isolada, com dados fictícios e gravação desativada. Desktop 1440×1000 e celular 390×844; largura da página permaneceu em 390px, e a tabela de movimentos teve rolagem própria. Evidências em `evidencias-carteira/`: perfil, conta, edição e movimentos. As imagens de dados preenchidos são exemplos visuais, não registros de produção.
