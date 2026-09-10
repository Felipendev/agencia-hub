# Revisão de produto e proposta de design

## Contexto e limites da análise

Análise do frontend no commit `16c1676` de `origin/main`. Foram inspecionados a navegação, tokens e fonte, tipos de domínio e os fluxos de cotações, cadastro, viagens, vendas e financeiro. Não houve entrevistas, análise de métricas de uso nem validação com dados de produção. As conclusões de comportamento do usuário são hipóteses informadas pelo produto e precisam de teste.

O produto ajuda agências de viagem a receber pedidos, manter pessoas cadastradas, elaborar cotações, comparar emissões com milhas, acompanhar viagens e controlar vendas, parcelas, custos e comissões. O gestor organiza a operação e acessa informações financeiras globais; o agente trabalha com sua carteira. Há ainda a administração da plataforma e o cliente que preenche o formulário público.

A unidade principal de trabalho é o atendimento que liga **pessoa → pedido/cotação → viagem → venda → contas**, com relacionamentos explícitos. Aprovação da proposta, emissão, criação da viagem e recebimento são eventos diferentes.

## Inventário de telas e fluxos

| Área / rotas atuais | Tarefa | Tratamento proposto |
|---|---|---|
| `/`, `/contato`, `/suporte` | Conhecer o produto e obter ajuda | Preservar a entrada institucional; mostrar uma operação real em eventual revisão da landing. Fora das telas prioritárias deste protótipo. |
| `/login`, `/cadastro`, `/cadastro/verificar` | Acessar ou criar agência | Fluxo existente inventariado; preservar validação e mensagens de sessão. Não redesenhado em alta fidelidade nesta entrega. |
| `/recuperar-senha`, `/recuperar-senha/redefinir` | Recuperar acesso | Preservar contexto, feedback de envio e expiração. Não prototipado. |
| `/convite/[token]` | Entrar na equipe | Contextualizar agência e perfil antes da aceitação. Convite do gestor representado; aceitação não redesenhada. |
| `/dashboard`, `/meu-painel` | Decidir o que fazer | “Hoje”: pendências ordenadas por prazo e ações diretas; carteira e números filtrados por papel. Visão de gestor desenhada. |
| `/cotacoes` | Localizar, priorizar e acompanhar pedidos | Lista principal com cliente, rota, etapa, validade e total; quadro opcional; busca e filtros em drawer. |
| `/cotacoes/nova` | Registrar pedido | Pedido essencial primeiro; cliente existente, aeroportos, datas, passageiros e contexto; proposta vem depois. |
| `/cotacoes/[id]` | Preparar, revisar, compartilhar e aprovar | Detalhe por tarefa, próxima ação, proposta e histórico; edição em modal; confirmação de aprovação. |
| `/solicitacao/[slug]` | Cliente pedir cotação | Formulário mobile com viagem antes de contato; confirmação clara; acesso a privacidade e termos. |
| `/clientes`, `/clientes/[id]` | Manter relacionamento e dados da pessoa | Busca, perfis cumulativos, histórico de cotações e viagens; documentos tratados em área restrita. |
| `/atendimentos` | Visão relacionada a atendimento | Inventariada; proposta integra contexto do atendimento ao cliente e à cotação. Validar a necessidade de uma área independente. |
| `/calculadora`, `/calculadora/milheiro` | Comparar custo de emissão | Custo, taxa e margem explicitados; adicionar opção à cotação. Cenário fixo demonstrado. |
| `/viagens`, `/viagens/nova`, `/viagens/[id]` | Registrar reserva e acompanhar embarque | Lista por data, localizador, itinerário e responsável; criação a partir da aprovação com aviso sobre financeiro. |
| `/vendas`, `/financeiro/receita` | Registrar venda e acompanhar parcelas | Uma área “Vendas e caixa”; criação contextual pela viagem; previsão separada de recebimento. |
| `/financeiro`, `/financeiro/despesa` | Acompanhar caixa e obrigações | Abas A receber / A pagar / Vendas; vencimentos priorizados, confirmação com valor, data e conta. |
| `/minhas-comissoes` | Agente conferir ganhos | Mesmos padrões de tabela, período e estado; apenas próprias comissões. Não prototipado separadamente. |
| `/vendedores`, `/vendedores/convidar` | Gerenciar equipe | Convite dentro de Equipe e acessos, com descrição do escopo do perfil. |
| `/agencia`, `/configuracoes` | Configurar agência e conta | Separar identidade/atendimento da agência de preferências pessoais. Tela resumida de agência desenhada. |
| `/lixeira` | Recuperar registros | Recuperação contextual; confirmação antes de mover à lixeira, possibilidade de desfazer. Política de retenção a validar. |
| `/admin`, `/admin/agencias` | Administrar plataforma | Navegação separada da agência; não redesenhada no escopo operacional principal. |
| `/termos`, `/privacidade` | Consultar documentos | Manter páginas existentes e links no formulário; conteúdo jurídico precisa de revisão do responsável. |

## Problemas, intenção e decisão

| Evidência no código | Intenção original | Alternativas consideradas | Escolha |
|---|---|---|---|
| `dashboard-shell.tsx`: Vendas, Fluxo de Caixa, Receitas e Despesas como destinos separados; convidar agente como item permanente | Acesso rápido às tarefas financeiras e de equipe | Manter todos os atalhos; agrupar por objeto e contextualizar as ações | “Vendas e caixa” com abas; convite dentro de Equipe. Reduz decisões de navegação sem retirar a função. |
| `dashboard/page.tsx`: várias visualizações financeiras e distribuição de status antes de tratar trabalho pendente | Dar visão gerencial | Painel só de métricas; operação por prazo com números de contexto | Pendências primeiro; métricas compactas. Gráficos detalhados continuam possíveis em relatórios, sujeitos à demanda real. |
| `cotacoes/page.tsx`: KPIs em cards e Kanban como composição principal | Visualizar o funil e comparar etapas | Quadro único; lista única; alternância com padrão por tarefa | Lista para densidade, comparação e busca; quadro como alternativa. Não remover cards que ajudam no funil. |
| `cotacoes/[id]/page.tsx`: todos os status exibidos como atalhos, mais ações de edição, WhatsApp e exportação | Acelerar qualquer mudança | Menu único de status; ação contextual com opções secundárias | Uma próxima ação por contexto; aprovação com consequência explícita. Exportação e prévia permanecem junto do envio. |
| `cotacoes/[id]/page.tsx`: `Badge tone="warning"` usado para qualquer status | Mostrar a situação da cotação | Uma cor neutra para tudo; cores semânticas com texto | Cor e rótulo por significado. Aprovada em verde, retorno em âmbar, em cotação em azul; sem depender só de cor. |
| `viagens/nova/page.tsx`: registro de viagem e financeiro são separados | Separar operação e contabilidade | Criar tudo automaticamente; orientar próximos passos mantendo eventos separados | Após registrar viagem, oferecer “Registrar venda”, informando que nada foi recebido. Não inventar automação existente. |
| `vendas/page.tsx`: detalhe das contas aparece na mesma página e há ações de receber, pagar e desfazer | Preservar contexto e permitir conciliação | Navegar para cada parcela; modal contextual de confirmação | Confirmar valor, pessoa, parcela, data e conta em um contexto focado; manter rastreabilidade da venda. |
| `dashboard/page.tsx`: carregamento inicial apenas textual | Indicar espera | Spinner global; skeleton na geometria da informação | Skeleton de tabela e informação de recuperação. Dados parciais continuam visíveis com aviso local. |
| `Cliente` tem perfis de passageiro, cliente, fornecedor e representante, além de muitos documentos | Reaproveitar cadastro e suportar emissão | Formulário completo no primeiro contato; captura progressiva | Nome/contato/perfil primeiro, documento no contexto de emissão e com acesso apropriado. |

## Direção visual

**Mesa de operação de viagens.** Superfícies quentes e azul profundo lembram uma ferramenta de trabalho calma e precisa. A identidade aparece na tipografia, proporção e uso disciplinado da cor. Não há fotografia decorativa, gradiente, neon, gráficos sem pergunta ou marketing dentro da aplicação.

Plus Jakarta Sans foi encontrada em `src/app/layout.tsx` e mantida por continuidade, boa hierarquia e legibilidade. Não foi substituída para produzir diferença artificial. Valores usam números tabulares quando suportados. Títulos são curtos e as linhas de tabela trazem dados secundários que ajudam a reconhecer a entidade.

O fundo é `#F5F4F0`, superfície `#FFFEFB`, texto `#172D39`, apoio `#586B73` e ação `#154F63`. Sucesso, atenção e erro têm pares de primeiro plano/fundo próprios. Bordas e divisores estabelecem agrupamento; sombra é reservada a modal e drawer.

## Design System mínimo

| Sistema | Especificação |
|---|---|
| Fonte | Plus Jakarta Sans, pesos 400/500/600/700 |
| Escala | Display 44/52; título 28/36; seção 18/26; corpo 14/22; label 14/20; apoio 12/18; métrica 32/40 |
| Espaçamento | 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 |
| Grid | Desktop 1440, navegação 224, margem 32, gutter 24; mobile 390 com coluna única |
| Forma | Raio 4 nos controles, 8 em overlays; tabelas e seções com estrutura reta |
| Botão | Primário, secundário, destrutivo, hover, focus, disabled, loading; ação de toque de 44 px |
| Campo / select | Label persistente, preenchido, placeholder, help, erro, disabled e focus; grupo horizontal se houver espaço |
| Lista e tabela | Cabeçalho, linha de dois níveis, valor alinhado, rótulo de etapa e ação explícita; tabela vira registro empilhado no celular |
| Navegação | Item ativo com contraste; menu mobile; abas para visões da mesma área; breadcrumb em detalhe |
| Feedback | Badge semântico, alert contextual, confirmação de sucesso, erro recuperável e skeleton |
| Overlays | Modal para decisão limitada; drawer para filtros; fechamento e retorno explícitos, foco preso ao modal no HTML |
| Tooltips | Usar apenas para informação complementar; nunca esconder instrução obrigatória ou motivo de bloqueio somente no hover. No protótipo esses motivos estão visíveis. Componente de tooltip nativo permanece pendente. |
| Movimento | Dissolução de 160 ms para transições/feedback; respeitar `prefers-reduced-motion` na implementação |

O Figma já recebeu 50 variáveis em três coleções (18 primitivas, 18 semânticas e 14 dimensões), sete estilos Hub e um estilo de overlay. Há um estilo Body importado da biblioteca disponível, mas a proposta usa os estilos Hub porque o Body de 13 px encontrado não define a hierarquia escolhida. Os novos nomes `--hub-design-*` são propostas de handoff, não alterações já aplicadas ao CSS de produção.

O pacote importa componentes de botão, badge e field. Tabelas, navegação, modais e drawers permanecem como composições editáveis com Auto Layout onde o layout do DOM é linear. Estruturas com wrapping são posicionadas pela geometria medida; precisam de revisão de comportamento responsivo no Figma. Isso é uma limitação do importador, não uma biblioteca publicada pronta para produção.

## Estados e UX writing

- **Carregando:** manter geometria com skeleton; “Buscando cotações da agência…”.
- **Primeiro uso:** orientar o primeiro registro; “Criar primeira cotação”.
- **Sem resultados:** explicar o filtro; “Limpar filtros”, preservando a distinção de agência vazia.
- **Erro de conexão:** explicar que a lista não foi recuperada; “Tentar novamente”.
- **Validação:** erro junto ao destino e resumo no topo; dados preenchidos do cenário continuam disponíveis.
- **Sem permissão:** explicar o escopo e indicar o gestor; nenhuma informação protegida é mostrada.
- **Parcial:** manter a lista carregada e avisar que as solicitações públicas falharam.
- **Sucesso:** dizer o que foi criado e qual o próximo passo. Excluir significa “Mover para lixeira”, com confirmação e desfazer.
- **Financeiro:** “Confirmar recebimento” mostra valor, parcela e conta; “Venda registrada” não significa “Pagamento recebido”.

## Responsividade e acessibilidade

A navegação lateral vira menu explícito no celular. Métricas passam a duas colunas, os formulários viram uma coluna e os registros deixam de depender de uma tabela larga. O formulário público e a consulta de viagem são os casos prioritários de uso menor. A organização desktop não é comprimida proporcionalmente.

Verificados os pares principais de contraste por cálculo (resultado em `validation.json`), foco visível e alvos de ação. Estados incluem texto além de cor. Formulários têm labels, associação de erro e `aria-invalid`; modais oferecem Escape e contenção de foco. Uma auditoria completa com leitor de tela e navegação por teclado em todos os fluxos continua necessária na implementação.

## Validações de Product e usuários

1. Observar gestores e agentes priorizando cinco atendimentos reais. A ordenação por prazo corresponde à rotina?
2. Testar se “Vendas e caixa” reduz a confusão entre venda e receita, sem esconder tarefas frequentes.
3. Medir quando lista ou quadro ajudam mais e qual visão deve ser padrão por usuário.
4. Confirmar estados de cotação, transições permitidas e evidência exigida para aprovação. O início em “Em cotação” é proposta; o código atual cria em `aguardando`.
5. Confirmar vínculo entre viagem e venda e suporte da API ao encaminhamento contextual. O frontend atual registra financeiro separadamente; automatizar esse vínculo exige trabalho adicional.
6. Definir regras de permissão para documentos, custos, carteira compartilhada e comissões. O protótipo não implementa autorização.
7. Validar retenção da lixeira, quem pode restaurar e como registrar auditoria. Não pressupor prazo de recuperação.
8. Validar datas, fuso, disponibilidade de tarifa, check-in e tratamento de múltiplos trechos. Voos e horários do protótipo são ilustrativos.
9. Revisar consentimento, mensagens públicas e documentos jurídicos com o responsável; reutilizar os textos vigentes.
10. Revisar o plugin no Figma, refinar components/variants, Auto Layout e constraints, e realizar teste de usabilidade antes de implementar nas telas de produção.
