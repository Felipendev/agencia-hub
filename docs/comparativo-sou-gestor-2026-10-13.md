# AgenciaHub × SOU GESTOR: comparação e oportunidades

Data: 13/10/2026. Estado: comparação atualizada após acesso autenticado às telas da referência.

## Escopo e evidência

Foram examinados o código atual do frontend `C:/workspace-pessoal/agencia-hub`, o backend `C:/workspace-pessoal/agencia-hub-api`, a divulgação pública e as telas autenticadas da referência, após login realizado pelo usuário. A análise percorreu as 25 rotas de navegação disponíveis, incluindo o dashboard e os módulos listados na matriz abaixo. Foram abertos formulários sem salvar e feita uma simulação com números fictícios. Não foram executados testes do Hub, alteradas funcionalidades nem verificadas configurações de produção. Alterações anteriores do workspace foram preservadas.

Referências externas:

- [Sistema indicado](https://acesso.sougestordemilhas.com/): área autenticada apresenta a marca Milhas Pro. Navegação, campos e opções descritos na matriz foram observados diretamente na conta disponibilizada pelo usuário.
- [Divulgação pública SOU GESTOR](https://sougestordemilhas.com/): anuncia contratos/cadastro, checklist de atendimento, marketing baseado no cliente, formulários de qualificação, simulações e IA estratégica. A FAQ diz que o produto é um método de gestão e não substitui CRM ou gestão de milhas. Também informa possibilidade de convidar pessoas ao painel.

O material público serve de contexto. A matriz autenticada abaixo substitui as hipóteses iniciais. Parceiros apresentados na página não comprovam integrações técnicas. Imagens promocionais não foram usadas para afirmar campos, regras ou telas atuais.

**Limite da verificação:** observar uma tela ou botão confirma sua presença, mas não comprova persistência, geração de arquivo, assinatura, integração ou isolamento entre contas. Não foram criados clientes, contratos, tarefas, viagens, indicações ou cobranças, nem enviados convites/mensagens. O próprio aplicativo registra acessos no histórico de segurança. Campos de credenciais dos programas foram identificados no formulário vazio, sem consultar ou copiar senhas existentes. Notas e imagens salvas não contêm dados pessoais dos clientes.

Legenda: **implementado** = evidência no código do Hub; **parcial** = base existente com extensão necessária; **não localizado** = não encontrado na análise; **observado** = controle/tela visto na referência; **não validado** = comportamento não exercitado. A leitura de código não garante funcionamento em produção.

## Inventário do Hub

Os caminhos frontend abaixo são relativos a `C:/workspace-pessoal/agencia-hub`. Os caminhos API são relativos a `C:/workspace-pessoal/agencia-hub-api/src/main/java/com/agenciahub/api`.

| Capacidade | Situação no Hub | Evidência principal |
|---|---|---|
| Pessoas e CRM | Implementado: cadastro, edição, documentos, contatos e histórico | `src/types/index.ts:39`; `src/app/(app)/clientes/[id]/page.tsx:231`; API `application/controller/doc/CustomerAPI.java:34` |
| Cotações e funil | Implementado: Kanban, responsáveis, prioridades e opções de voo | `src/app/(app)/cotacoes/page.tsx:195`; API `application/controller/doc/QuotationAPI.java:35` |
| Solicitação pública | Implementado: formulário por agência e conversão em cotação | `src/components/cotacao/ImportarSubmissaoModal.tsx`; API `application/controller/doc/PublicSolicitacaoSubmitAPI.java:14` |
| Calculadora de milhas | Implementado: milheiro, taxas, margem e criação de cotação; tabela de preços local ao navegador | `src/lib/calculadora-milhas.ts`; `src/lib/tabelas-milhas.ts:157` |
| Importação PDF/imagem | Implementado: extração, revisão e uso de IA conforme configuração | API `application/services/flights/FlightImportService.java:29`; `docs/flight-imports.md:27` |
| Memória de cálculo | Implementado: plano de voo persistido e histórico de cálculo | `src/lib/api/quotation-mapper.ts:104`; API `application/controller/QuotationFlightHistoryController.java:13` |
| Viagens e localizadores | Implementado: itinerário, companhia, documentos e vínculos comerciais | `src/app/(app)/viagens/nova/page.tsx:118`; API `application/controller/TripController.java:20` |
| Vendas e comissões | Implementado: itens, custos, fornecedores, recebíveis, pagamentos e lucro | `src/app/(app)/vendas/page.tsx:263`; API `application/controller/SaleController.java:33` |
| Financeiro | Implementado: fluxo de caixa, estados, filtros e exportação CSV | `src/app/(app)/financeiro/page.tsx:372`; API `application/controller/doc/FinancialEntryAPI.java:37` |
| Equipe e perfis | Implementado: dono, vendedor, administrador, convites e painel individual | API `domain/enums/AccountKind.java:7`; `application/controller/InvitationController.java:23` |
| Notificações | Implementado: vencimento de cotação e avisos internos de viagem/check-in | API `scheduling/QuotationExpirationScheduler.java:44`; `scheduling/CheckinNotificationScheduler.java:16` |
| Relatórios operacionais | Implementado: dashboard, indicadores, CSV e lucro por venda | `src/app/(app)/dashboard/page.tsx:35`; `src/app/(app)/financeiro/page.tsx:372` |
| Comunicação WhatsApp | Parcial: texto comercial e abertura de conversa; sem envio automático comprovado | `src/lib/whatsapp.ts:17`; `src/components/cotacao/EnviarWhatsAppModal.tsx:20` |
| Gestão operacional de milhas | Não localizada: conta/programa, saldo, lotes, validade, transferências e consumo | A migração `src/main/resources/db/migration/V30__miles_facet.sql:11` da API cria tabelas preparatórias, sem uso encontrado no Java |
| Contratos | Parcial: anexos suportados; geração, assinatura e versões não localizadas | `src/app/(app)/viagens/[id]/page.tsx:212`; `src/app/(app)/clientes/[id]/page.tsx:232`. PDF de `src/app/(app)/cotacoes/[id]/page.tsx:152` é cotação |
| Checklist por cliente | Não localizado; notas de histórico são base adjacente | `src/components/timeline/TimelineView.tsx:24`; `src/contexts/timeline-context.tsx:29` |
| Perfil de acúmulo de milhas | Parcial: CRM e preferência de milhas no formulário; cartões/pontuação não entregues | `src/types/index.ts:73` e `:160`; migração V30 da API, sem uso Java localizado |
| Economia realizada do cliente | Não localizada; há cálculo de preço e lucro da agência | `src/lib/calculadora-milhas.ts:62`; `src/app/(app)/vendas/page.tsx:470`; API `application/persistence/entity/Trip.java:10` |

## Matriz das telas autenticadas

| Tela da referência | O que foi observado | Situação do Hub e diferença útil |
|---|---|---|
| [Dashboard](https://acesso.sougestordemilhas.com/) | Indicadores de clientes/receita/viagens/ações, avisos, reuniões, pontos a vencer e próximas ações de leads | Dashboard existente; acrescentar agenda, vencimento de pontos e pendências de gestão |
| [Cadastro](https://acesso.sougestordemilhas.com/clientes) | Contrato com vigência e valor; contas por programa com saldo/expiração; cartões com geração e entrada de pontos; clubes com pontos/custo mensal | CRM existente; perfil operacional de milhas não entregue |
| [Painel de clientes](https://acesso.sougestordemilhas.com/painel-clientes) | Detalhe agrega saldo por programa, economia, documentos, atas e viagens; formulário de aumentar/diminuir pontos com motivo, data e preço pago | Detalhe de pessoa existente; faltam saldos e movimentações de pontos. Não houve conta preenchida para validar cálculo ou persistência |
| [Contratos](https://acesso.sougestordemilhas.com/contrato) | Seleção de cliente, dados do contratado, histórico e PDF; modelo manual externo também disponível | Anexos existentes; falta geração e ciclo do contrato. Assinatura eletrônica não observada |
| [Viagens](https://acesso.sougestordemilhas.com/viagens) | Cadastro com cliente/datas, preço normal e reduzido, milhas/taxas e indicação de hotel/transfer | Viagem existente; faltam referência de preço e economia do cliente |
| [Reuniões](https://acesso.sougestordemilhas.com/reuniao) | Ata por cliente com título, data, conteúdo e encaminhamentos | Notas locais existentes; faltam atas persistidas e vínculos com ações |
| [Simulação](https://acesso.sougestordemilhas.com/simulacao) | Projeção de acúmulo por gasto, pontuação, câmbio, meses e bônus; destinos e botão de relatório | Nossa calculadora precifica emissão. Simulação de acúmulo é uma feature distinta, ausente |
| [Indicações](https://acesso.sougestordemilhas.com/indicacao) | Indicador, indicado, contato, data, crédito/desconto e observação | Canal de origem/comissões/cupons existentes; falta relação entre clientes e controle de créditos |
| [Agenda](https://acesso.sougestordemilhas.com/agenda) | Calendário mensal e compromisso por cliente com data, horário, objetivo e link | Agenda de reuniões não localizada. Texto sobre Google não comprova sincronização |
| [Mentoria](https://acesso.sougestordemilhas.com/mentoria) | Central de acesso aos roteiros e rotinas de atendimento | Oportunidade de processo guiado, sem necessidade de copiar conteúdo da mentoria |
| [Filtro](https://acesso.sougestordemilhas.com/mentoria/filtro) | Link de modelo Respondi e cadastro de links próprios | Hub já tem formulário público nativo; ampliar qualificação se necessário, sem recriar ferramenta |
| [Apresentação](https://acesso.sougestordemilhas.com/mentoria/apresentacao) | Link de modelo Canva e lista de apresentações por link | Biblioteca de materiais pode complementar proposta; não foi observado gerador nativo de campanhas |
| [Fluxo do cliente](https://acesso.sougestordemilhas.com/mentoria/fluxo) | Roteiro editável em sete grupos; checklist por cliente com 25 itens na configuração consultada | Checklist não localizado no Hub; diferenciar modelo da execução por cliente |
| [Semanal](https://acesso.sougestordemilhas.com/mentoria/semanal) | Seis verificações por cliente/semana e navegação pelo histórico anual | Rotina recorrente de atendimento ausente; conclusão e persistência não testadas |
| [Mensal](https://acesso.sougestordemilhas.com/mentoria/mensal) | Cinco verificações por cliente/mês e histórico anual de revisões | Rotina de atualização de saldo/resultado ausente |
| [Plano de viagem](https://acesso.sougestordemilhas.com/mentoria/plano-viagem) | Etapas por viagem com data, categoria, localizador, observação, anexo e opções de PDF/impressão | Itinerário/anexos já existem; avaliar extensão para etapas de hotel/transfer/atividades |
| [Scripts](https://acesso.sougestordemilhas.com/mentoria/scripts) | Biblioteca por título, descrição e link de documento | Texto de cotação/WhatsApp existente; biblioteca geral não localizada |
| [Fechamento](https://acesso.sougestordemilhas.com/mentoria/fechamento) | Seleção de viagens marcadas com desconto; conta consultada sem viagem elegível | Conceito/tela observados, conteúdo final e exportação não validados |
| [CRM](https://acesso.sougestordemilhas.com/crm) | Quadro de leads, próxima ação/data de follow-up, resumo diário/mensal e controles de colunas | Hub já tem prospectos e etapas por cliente. Estender próxima ação e follow-up, sem chamar CRM de ausente |
| [Gestão do negócio](https://acesso.sougestordemilhas.com/gestao) | Receita, contratos ativos, economia e vendas | Vendas/financeiro do Hub já abrangem custos, recebíveis, fornecedores e comissões; reaproveitar |
| [Tarefas](https://acesso.sougestordemilhas.com/tarefas) | Responsável, categoria, importância, duração prevista e gráfico semanal de carga | Tarefas/capacidade da equipe ausentes. Formulário exige funcionário cadastrado |
| [Exportar](https://acesso.sougestordemilhas.com/exportar) | Opções PDF/Excel para reunir módulos da operação | CSV financeiro e exportação administrativa existentes; exportação comercial consolidada a avaliar |
| [Configurações](https://acesso.sougestordemilhas.com/configuracoes) | Marca/logotipo e dados usados no contrato | Configuração de agência existente; vincular identidade à geração contratual |
| [Histórico](https://acesso.sougestordemilhas.com/historico) | Registro de acessos/inclusões/alterações/exclusões com autor e filtros | Timeline local não equivale a auditoria central persistida |
| [Time](https://acesso.sougestordemilhas.com/convites) | Membros e convites aos dados compartilhados | Equipe/convites já existentes; não houve teste comparativo dos perfis |

**Não observado na navegação disponível:** assistente de IA estratégica, sincronização de contas de fidelidade, integração Google Calendar, busca aérea, WhatsApp Business e assinatura eletrônica. Isso não comprova ausência no produto completo ou em outros planos.

### Verificação pontual da simulação

Com gasto fictício de R$ 10.000/mês, 2 pontos por dólar, câmbio informado de R$ 5 e prazo de 12 meses, a tela calculou 4.000 pontos/mês e 48.000 no período. O resultado confirma, para esse cenário, a relação `gasto / câmbio × pontuação × meses`. Bônus por programa foi visto nos campos, mas não foi exercitado nessa verificação. Não foi gerado relatório nem salvo registro.

Evidências visuais sem dados pessoais: [simulação](evidencias-sou-gestor/simulacao-acumulo.png) e [formulário de contrato](evidencias-sou-gestor/contrato-formulario.png).

Não recriar CRM, financeiro, calculadora, viagens, formulário público ou comissões como se estivessem ausentes. A comparação aponta extensões específicas desses módulos.

## Features propostas

As definições abaixo são propostas para o Hub inspiradas nas diferenças observadas, não cópias das regras internas do concorrente. A prioridade considera impacto no atendimento, dependências e reaproveitamento do produto atual; não há dados de uso ou estimativa de retorno financeiro.

### F01 — Checklist e rotinas por cliente — prioridade alta

Problema: o estado da cotação não representa todas as obrigações do atendimento contínuo.

MVP: modelos de checklist por etapa, tarefa vinculada ao cliente e opcionalmente à cotação/viagem, responsável, prazo, situação, observação e visão de pendências. Acrescentar execução por semana/mês com histórico por período. Criação a partir de modelo deve ser explícita e não duplicar tarefas ao repetir a operação. Separar checklist inicial, rotina periódica e tarefa avulsa; uma mudança de modelo não deve reescrever execuções antigas.

Aceite:

- Outra pessoa autorizada da mesma agência consegue consultar a tarefa após recarregar.
- Há filtros por responsável, cliente e atraso; concluir registra autor e data.
- Usuários de outra agência não acessam tarefas nem modelos privados.
- Reaplicar um modelo não duplica silenciosamente suas tarefas.

Base: CRM, equipe e notificações. Dependência: persistência própria de tarefas e histórico; não usar apenas a timeline local como fonte de verdade.

### F02 — Contratos a partir do cadastro — prioridade alta

Problema: dados de cliente já existem, mas falta localizar um ciclo próprio de contratos.

MVP: modelo fornecido pela agência, preenchimento com dados existentes, revisão, geração de documento, vínculo ao cliente, versões e estados rascunho/enviado/assinado/cancelado. Incluir vigência, preço/plano, pagamento à vista/parcelado e vínculo opcional aos recebíveis existentes. Anexar um documento assinado pode atender a primeira versão; assinatura eletrônica integrada é uma extensão posterior e não foi observada na referência.

Aceite:

- Campos faltantes são destacados antes de gerar o documento.
- Documento emitido preserva os dados e a versão do modelo usados na geração.
- Alterar o cadastro não modifica contratos anteriores.
- Marcar como assinado exige registrar a evidência, sem alegar assinatura eletrônica integrada.

Base: CRM e documentos. Dependência: armazenar modelo, versão e arquivo com isolamento por agência.

### F03 — Economia realizada e relatório do cliente — prioridade alta

Problema: lucro da agência e economia do cliente são medidas distintas. O dashboard atual não resolve sozinho a demonstração de resultado ao cliente.

MVP: registrar preço comparável em dinheiro, fonte e data da comparação, custo efetivo da viagem e metodologia; consolidar por cliente/período e gerar relatório compartilhável mediante ação do gestor.

Aceite:

- Comparação identifica mesma rota, datas, passageiros e condições relevantes de bagagem/tarifa.
- O custo não omite taxas e honorários; custo de aquisição das milhas só entra quando conhecido, com origem registrada.
- Economia sem base documentada aparece como indisponível, sem número inventado.
- Cancelamentos e reembolsos ajustam o resultado; estimativa de cotação permanece distinta de resultado realizado.
- Compartilhamento permite revisar e remover dados pessoais antes da exportação.

Base: viagens, vendas, financeiro e cotações. Dependência: regra de cálculo definida e campos de comparação; dados de estoque podem enriquecer uma etapa posterior.

### F04 — Perfil e carteira de milhas do cliente — prioridade alta

Problema: uma solicitação de viagem descreve uma demanda; acompanhamento de milhas exige visão mais duradoura do cliente.

MVP: objetivos, frequência de viagens, destinos, contas por programa/titular, saldo inicial declarado e entradas/saídas manuais com motivo/data, pontos a vencer com quantidade/data, cartões por emissor/categoria com geração/data de crédito de pontos e clubes com custo/pontos mensais. Consolidar a carteira na página da pessoa e ligar o plano de ações a F01. A referência oferece usuário/senha no cadastro; a proposta do Hub não inclui copiar esse armazenamento. O perfil não deve armazenar senha de programa nem número completo de cartão.

Aceite:

- Formulário e edição pelo gestor alimentam o mesmo perfil persistido.
- Saldo declarado informa programa, fonte e data; não é apresentado como sincronizado.
- Após o saldo inicial, ajustes geram movimentação auditável e não sobrescrevem o histórico; confirmar duas vezes a mesma operação não duplica o efeito.
- Cartões e clubes podem ter vários registros por cliente; pontos futuros ficam distintos do saldo atual.
- Pontos a vencer aparecem em uma visão de próximos vencimentos, sem prometer atualização automática nos programas.
- Plano pode criar tarefas F01 e mantém histórico de alterações.
- Campos opcionais não bloqueiam cadastro e diferenças entre titular e passageiro ficam explícitas.

Base: CRM e formulário público. Dependência: validar o modelo com a operação antes de reaproveitar as tabelas preparatórias da migração V30.

### F05 — Estoque por lotes e reserva de milhas — prioridade condicionada ao negócio

A referência tem formulário de entradas/saídas por programa, saldo consolidado e preço pago. Não foram observados lotes com custo rastreável, reserva para emissão ou controle de concorrência. Esses controles mais completos são uma proposta própria do Hub, além da paridade de cadastro da F04. A conta disponibilizada não tinha contas preenchidas para validar o efeito das movimentações.

Se a agência administra saldos ou compra/consome milhas, este módulo passa a ter prioridade alta. Se atua somente como intermediária de fornecedores, F01–F03 têm melhor aderência inicial.

MVP: estender as contas e movimentações de F04 com lotes de quantidade/custo/validade, saldo disponível e reservado e vínculo de consumo à viagem. Iniciar com registro manual auditável, sem prometer sincronização automática.

Aceite:

- Saldo resulta das movimentações e não de um campo editável sem histórico.
- Repetir a mesma confirmação de emissão não debita milhas duas vezes.
- Reservas e consumo concorrentes não excedem saldo disponível.
- Cancelamento registra reversão e eventual perda, preservando a operação original.
- Custo e rentabilidade são rastreáveis aos lotes consumidos.

Dependências: definir custódia/titularidade, política de reserva, custo por lote, responsabilidades e vínculo com fornecedores. Compra de milhas, transferências, bônus e alertas de validade podem ser entregas seguintes.

### F06 — Simulador de acúmulo e metas de viagem — prioridade alta

Problema: nossa calculadora responde quanto custa uma emissão; não estima o patrimônio futuro do cliente.

MVP: gasto mensal, pontos por dólar, câmbio informado com data, período, bônus hipotético por programa e meta de milhas por passageiro/destino. Mostrar pontos mensais, total, meta alcançada e relatório comercial de cenários. Reaproveitar cartões de F04 opcionalmente, sem bloquear uso avulso.

Aceite:

- Cenário de R$ 10.000, câmbio 5, pontuação 2 e 12 meses resulta em 4.000/mês e 48.000 no período.
- Bônus hipotético de 100% resulta em 96.000 no programa selecionado; cenários de programas são alternativas, não saldos simultaneamente disponíveis.
- Câmbio zero/negativo e prazo inválido não produzem divisão inválida ou resultado enganoso.
- Projeção não altera saldo real; relatório identifica pressupostos, data e cenário.
- Meta distingue quantidade de passageiros e milhas por pessoa; não promete disponibilidade de passagem.

Dependência: nova lógica de acúmulo separada do cálculo atual de custo/lucro da emissão.

### F07 — Agenda e atas de atendimento — prioridade média

MVP: compromisso por cliente/responsável com início, duração, objetivo e link; calendário e visão do dia; ata com decisões e próximos passos, podendo criar tarefas F01. Não prometer integração com agenda externa na primeira entrega.

Aceite: data/hora consistentes no fuso da agência; atas consultáveis pela equipe após recarregar; tarefas geradas com vínculo e sem duplicação; cancelamento preserva histórico e não exclui a ata silenciosamente.

### F08 — Próxima ação comercial e follow-up — prioridade alta

MVP: acrescentar ação, data e responsável ao prospecto/cliente; filtros de atrasados/hoje/próximos dias e resumo no dashboard. Manter etapas de CRM existentes e vínculo opcional com cotação. Quadro de leads só se a operação precisar de uma visão própria por pessoa.

Evidência local: `src/components/cliente/FunilBadge.tsx:1` já define etapas por cliente, e o backend tem `domain/CustomerStatus.java:3` com prospecto. Portanto a feature é acompanhamento da próxima ação, não reconstrução do CRM.

Aceite: prospecto pode ter follow-up sem cotação; conclusão registra histórico; reprogramação evita alertas da data anterior; vendedor vê apenas o escopo permitido.

### F09 — Indicações e créditos de relacionamento — prioridade média

MVP: vínculo indicador/indicado, origem, estado da indicação e eventual crédito. Definir com a agência se crédito nasce no cadastro, venda aprovada ou pagamento confirmado antes de automatizar. Conectar resgate ao financeiro apenas por operação explícita.

Aceite: crédito não duplica; resgate e estorno têm histórico; cancelamento segue regra definida; crédito de relacionamento não é confundido com cupom, comissão de vendedor ou desconto já concedido.

### F10 — Biblioteca de materiais e plano ampliado de viagem — prioridade baixa

MVP opcional: modelos e links próprios da agência para apresentação/roteiros; etapas de viagem para hotel, transfer e atividades com data, anexo e observações. Reaproveitar itinerário e anexos já entregues. Produzir materiais próprios, sem transcrever a mentoria da referência.

Aceite: materiais/etapas respeitam agência e vínculos existentes; relatório não duplica trechos ou anexos; criação de etapa não registra gasto financeiro automaticamente.

### F11 — Histórico persistido e exportação consolidada — base transversal

MVP: histórico de alterações relevantes com ator, entidade, data e ação nos novos módulos; exportação seletiva por cliente/período. O Hub já tem exportação administrativa e CSV financeiro; avaliar a diferença de conteúdo antes de criar outro exportador.

Aceite: histórico não depende de localStorage; exportação respeita permissões e omite campos sensíveis; ações de negócio podem ser rastreadas sem guardar senhas/tokens. A auditoria pode ser entregue junto aos módulos novos, sem transformar toda leitura de página em evento obrigatório.

## Ordem de entrega revisada

| Onda | Entregas | Resultado esperado |
|---|---|---|
| 1 — Carteira e diagnóstico | F04 perfil de milhas + F06 acúmulo | Conhecer saldos, cartões/clubes e explicar potencial do cliente |
| 2 — Execução do atendimento | F01 checklist/rotinas + F08 follow-up | Organizar obrigações recorrentes e próximas ações comerciais |
| 3 — Formalização e resultado | F02 contratos + F03 economia | Formalizar serviço e demonstrar resultado por cliente |
| 4 — Relacionamento | F07 agenda/atas + F09 indicações | Registrar decisões e desenvolver relacionamento |
| Condicional | F05 estoque por lotes/reservas | Antecipar se compra/custódia/consumo de milhas fizer parte da operação |
| Complementar | F10 materiais/etapas + F11 exportação | Melhorar entrega ao cliente; auditoria/persistência acompanha todas as ondas |

IA estratégica não foi observada nas telas disponíveis e não entra como diferença confirmada. Pode ser avaliada depois de haver dados confiáveis e casos concretos de decisão. A IA de importação existente atende outro problema.

## Cuidados de implementação encontrados

- Tabelas do milheiro persistem no navegador (`src/lib/tabelas-milhas.ts:157`), e timeline também é local (`src/contexts/timeline-context.tsx:29`). Recursos compartilhados pela equipe precisam de persistência no backend.
- Viagem cadastrada não equivale a emissão integrada na companhia; importação lê documentos e não é busca aérea em tempo real (`docs/flight-imports.md:3`).
- Frequência recorrente é armazenada, mas geração automática de títulos não foi localizada. Não criar cobrança recorrente sem agenda e deduplicação definidas.
- Há representação de fornecedor no CRM e entidade própria de fornecedor nas vendas. Rever os vínculos antes de conectar aquisição de milhas.
- Algumas observações do backlog estão desatualizadas em relação ao código. O inventário não tomou itens históricos como prova de ausência.

## Pontos que continuam sem validação funcional

- Persistência após salvar, efeitos financeiros de contratos/indicações e regras de reversão da referência.
- Como o saldo é recalculado após entrada/saída; custo por lote, concorrência e vínculo com emissão não foram demonstrados.
- Conteúdo final dos PDFs/Excel, fechamento de viagem e geração de contratos; os botões foram observados, sem emissão de documentos reais.
- Perfis de outro membro do time, restrições de acesso e isolamento entre contas.
- Serviços de outros planos ou não acessíveis à conta fornecida.

Essas limitações não impedem o backlog comparativo: telas e campos de entrada foram suficientes para identificar as diferenças de produto. Validar regras internas exigiria uma conta de demonstração e dados de teste, em uma etapa própria. Este documento entrega análise e definição de features; não implementa nem publica as propostas.
