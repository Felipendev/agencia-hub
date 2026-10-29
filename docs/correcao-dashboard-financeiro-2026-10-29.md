# Dashboard financeiro — carregamento direto

## Falha e correção

O dashboard calculava totais e gráficos a partir de `useData().lancamentos`, preenchido pelo cache ou pela visita anterior ao Fluxo de Caixa. Ele não consultava `/financial-entries` ao abrir. Vendas consulta vendas e parcelas separadamente, permitindo parcelas recebidas na lista e painel financeiro zerado. A reprodução local confirmou a ausência de consulta e o cálculo correto ao inserir os mesmos recebimentos no contexto.

O painel agora usa uma consulta própria à API autenticada, independente do cache global. Enquanto aguarda, mostra carregamento e oculta valores financeiros. Falha ou resposta inválida mostra erro e permite nova tentativa; somente uma consulta bem-sucedida vazia pode produzir zero. Há atualização manual, e voltar à página faz nova consulta. O cliente financeiro usa `cache: no-store` e aceita sinal opcional de cancelamento.

Respostas de sessão anterior não alteram os valores visíveis: a consulta pertence ao usuário, agência e token da sessão. Trocar sessão, renovar token, atualizar ou sair da página cancela a consulta anterior e descarta respostas tardias. Consultas financeiras não são feitas sem hidratação/sessão de gestor. Dados operacionais continuam visíveis quando só o financeiro falha; esta entrega não altera o carregamento do CRM.

O gráfico mantém apenas lançamentos confirmados nos 12 meses do calendário, incluindo o atual. Seus rótulos agora usam o primeiro dia de cada mês, evitando repetição de meses por transbordamento dos dias 29–31. Totais consolidados continuam usando as regras existentes: confirmado, previsto e cancelado não são tratados como o mesmo status. Venda não recebida não vira entrada confirmada.

## Escopo e limites

Branch `codex/dashboard-financeiro`, independente da main UI `be685c8`. Sem mudança na API, migration, gravação financeira, aprovação de venda ou quitação. Não relançar nem reconciliar dados históricos nesta correção. O teste usa dados fictícios e HTTP simulado; a existência dos lançamentos reais da FELTRIX não foi verificada no banco de produção. A correção elimina a dependência de navegação/cache confirmada no código.

Não há novo CRUD: a tela apenas consulta os lançamentos persistidos. Fornecedores permanecem pausados por instrução do usuário; V67 continua apenas reservada, sem SQL criado ou aplicado. Manter PR em rascunho, sem merge ou deploy de produção, conforme a diretriz vigente. Na integração futura, atualizar com main, repetir os gates e combinar com o isolamento do PR UI #66, sem substituir suas correções.

## Aceite

- Entrada direta com contexto vazio consulta API e mostra os recebimentos confirmados.
- Carregamento/falha não aparecem como saldo zero; retry e atualização reconsultam o servidor.
- Resposta vazia válida gera zeros; resposta malformada e erro HTTP geram indisponibilidade.
- Troca de agência/token e desmontagem descartam resultados antigos e abortam a requisição.
- Pendências/cancelamentos e meses fora da janela não entram no gráfico de confirmados; 12 rótulos distintos em fim de mês.
- Testes, tipos/lint/build, revisão e inspeção visual com fixtures; sem alegar smoke de produção.

Validação local: 32 testes focados da página com HTTP simulado; 266 testes na suíte desta branch. Hook e adaptador financeiro com 100% das linhas/funções e 98,24% das branches cobertas (não é cobertura global do dashboard). Tipos e build webpack aprovados. ESLint em src passou sem erros e com dois avisos preexistentes em cotações; o comando de lint na raiz também percorreu o harness ignorado .local e seus arquivos gerados, por isso esse resultado não foi usado como gate do código do produto. CI em checkout limpo ainda será observada. Revisão independente aprovou após exigir validação de valores nulos/vazios e datas inválidas, agora coberta pelos testes. Inspeção desktop/celular 390x844 aprovada sem overflow, com fixtures; evidências no repositório de coordenação em docs/coordination/evidencias-dashboard-2026-10-29.
