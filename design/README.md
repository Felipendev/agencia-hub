# Agência Hub · proposta de UX

Branch: `codex/ux-redesign-figma`, criada de `origin/main` no commit `16c1676` em 10/09/2026. Worktree: `C:\workspace-pessoal\agencia-hub-design`. As alterações existentes em `C:\workspace-pessoal\agencia-hub` foram preservadas.

## Entrega e estado real

- **Protótipo local navegável:** `prototype/index.html`. Execute `node design/prototype/server.cjs` na worktree e abra [a mesa de operação](http://localhost:4176). Também pode abrir o HTML diretamente; o servidor é necessário apenas para regenerar o JSON de importação.
- **Figma criado:** [Agência Hub · Operação de viagens](https://www.figma.com/design/Z2jTgdEYMGU6VCyvC5sTaV). Contém tokens, estilos, variantes de botão e uma primeira prancha de fundações. **Não é o protótipo final.** A prancha inicial precisa de correção de layout.
- **Importação preparada:** `screens.figma.json` e `figma-plugin/`. O JSON preserva geometria, textos, cores, hierarquia e destinos do protótipo. O plugin converte para camadas nativas, componentes e reações. **Ainda não executado nem validado visualmente no Figma.**
- **Análise e decisões:** [ux-review.md](ux-review.md).
- **Verificação:** [validation.json](validation.json), gerada por `node design/validate.cjs`. Cobre estrutura e conexões do pacote e contraste; não substitui QA do plugin no Figma.

O conector do Figma atingiu o limite de chamadas do plano Starter. Antes disso, o limite de três páginas também foi identificado; o arquivo foi organizado em três páginas com duas áreas por página. Não houve upgrade nem publicação externa. O plugin usa recursos locais do Figma Desktop e não depende do MCP, mas exige importação manual.

## Importar no Figma

1. Abra o arquivo acima no **Figma Desktop**.
2. Primeiro registre um plugin local em **Plugins → Development → New plugin**, escolhendo Design e uma interface de UI. O Figma gera um `id` no manifest. Execute `node design/figma-plugin/configure.cjs ID_GERADO` para colocar esse ID real no manifest do pacote. O arquivo entregue usa um placeholder explícito; não foi inventado um ID de registro. [Referência oficial do manifest](https://developers.figma.com/docs/plugins/manifest/).
3. Em **Plugins → Development → Import plugin from manifest**, escolha `design/figma-plugin/manifest.json` já configurado.
4. Execute **AgênciasHub · Importar proposta de UX**.
5. Escolha `design/screens.figma.json` e clique em **Criar telas e protótipo**.
6. Aguarde o resumo de telas e conexões. Na página `04 States · 05 Prototype`, inicie o fluxo **Cotação à venda** pelo botão de apresentação do Figma.
7. Revise quebras de texto, componentes e sobreposições. Os tamanhos foram medidos no navegador; diferenças de renderização entre navegador e Figma podem precisar de ajustes.

A opção de correção substitui somente a prancha `4:2`, criada nesta tarefa, quando nome e chave do arquivo coincidem, e somente depois de importar as telas. Ela preserva os tokens e os botões existentes. Em caso de falha durante a importação, use Desfazer antes de repetir; o plugin informa os IDs criados. A importação não deve ser executada duas vezes sem desfazer a primeira, pois cria outro conjunto de telas.

## Estrutura

| Área solicitada | Local no arquivo / pacote |
|---|---|
| 00 Foundations | Primeira página; variáveis e estilos criados |
| 01 Components | Primeira página; botões iniciais e biblioteca importável |
| 02 Main Flows | Mapa detalhado neste documento e em `ux-review.md`; percurso conectado na terceira página após importação |
| 03 Screens | Catálogo local e pacote JSON; terceira página após importação |
| 04 States | Estados conectados no catálogo e na terceira página após importação |
| 05 Prototype | Fluxos de operação e solicitação pública após importação |

A segunda página foi reservada para documentação e seleção de telas. Ela permanece vazia no Figma até a continuação do trabalho. Todas as conexões são importadas na mesma página para preservar a navegação entre telas.

## O que pode ser avaliado agora

**Operação:** Hoje → Nova cotação → Criar cotação → Preparar envio → Simular envio → Registrar aprovação → Registrar viagem → Registrar venda → Ver contas a receber → Registrar recebimento de Ana → Confirmar recebimento.

**Manutenção:** lista → detalhe → editar → salvar; lista → filtros → aplicar → limpar; detalhe → mover para lixeira → confirmar → desfazer.

**Cliente:** formulário público → solicitar cotação → confirmação. O formulário reorganiza os campos no celular, em vez de reduzir o desktop.

**Exceções:** o Guia do protótipo abre loading/skeleton, primeiro uso, vazio de busca, erro de conexão, validação, permissão insuficiente e conteúdo parcialmente disponível.

Campos editáveis e busca simples funcionam no navegador. Os cliques do cenário são uma simulação de design: não persistem registros, não recalculam a calculadora e não enviam mensagens ou solicitações. O cadastro de Ana é o cenário detalhado; outros registros demonstram variedade e volume e avisam quando levam ao cenário principal. As páginas jurídicas apontam o local previsto dos documentos existentes, sem inventar texto jurídico.

## Atualizar o pacote

1. Edite `prototype/app.js` e `prototype/style.css`.
2. Execute o servidor local e abra [o catálogo](http://localhost:4176/?catalog=1).
3. Clique em **Preparar arquivo de importação**. O servidor salva `design/screens.figma.json`.
4. Execute `node design/validate.cjs`.
5. Reimporte em um arquivo de revisão ou desfaça a importação anterior.

O servidor aceita apenas arquivos conhecidos e o endpoint de exportação na interface local. A tipografia é carregada do Google Fonts; sem internet, o HTML utiliza a fonte de sistema. O Figma carrega Plus Jakarta Sans pela biblioteca de fontes disponível.

Revisão de 11/09/2026: financeiro com gráficos de receitas/despesas e composição por categoria, indicadores com ícones SVG autorais em dois tons e cartões arredondados. Veja `finance-preview.png` e o protótipo em `http://localhost:4176/#finance`. Prévia compacta disponível em `http://localhost:4176/?mobile=1#finance`. O exportador agora preserva os SVGs como vetores; a importação nativa segue pendente de validação no Figma.
