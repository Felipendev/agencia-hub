# Tarefas: importação de voos, clientes, viagens e acesso do vendedor

Data: 18/09/2026. Status: planejadas; nenhuma implementação autorizada nesta rodada.
Frontend: `C:/workspace-pessoal/agencia-hub`. Backend: `C:/workspace-pessoal/agencia-hub-api`.

## Orientação ao executor

Implementar as tarefas abaixo preservando as alterações existentes nos dois repositórios, incluindo login local e caixa de entrada de solicitações públicas. Não fazer reset do workspace nem publicar/deployar automaticamente. Ler AGENTS.md e a documentação relevante em node_modules/next/dist/docs antes de escrever código Next. Os caminhos abaixo são relativos ao repositório indicado.

Diagnóstico feito por leitura de código e das quatro capturas fornecidas. Não houve acesso à conta real do vendedor, consulta ao banco de produção ou reprodução com a imagem original enviada ao extrator. As capturas são evidência da interface, não a imagem de oferta que originou a extração. Não afirmar que o OCR falhou sem obter uma reprodução. Registrar evidências de execução e limitações ao concluir cada tarefa.

Ordem sugerida: T01 + T03 para desbloquear criação; T02; T05; T06; T04. Cada tarefa deve resultar em uma alteração revisável com testes proporcionais. Não enfraquecer validações financeiras ou isolamento entre agências para fazer a interface passar.

## T01 — Desbloquear conclusão de cotação após importar imagem (P1)

Evidência: `src/app/(app)/calculadora/page.tsx`, estado `principal` inicializado com string vazia; `imported()` adiciona opções mas não seleciona a principal. `src/lib/flight-plan.ts`, `buildFlightPlan()`, lança exatamente “Escolha a opção que define o total da cotação.” antes das outras validações. `src/components/cotacao/FlightOptionForm.tsx` mantém dois controles independentes: revisão de dados e rádio “Usar no total da cotação”. A captura mostra revisão marcada; isso não preenche o rádio. Remover/desmarcar uma opção pode deixar a seleção vazia ou inválida. O erro observado é de montagem do plano no frontend, anterior ao POST da cotação.

Implementar:

- Manter seleção válida quando existe exatamente uma opção incluída: selecioná-la automaticamente, inclusive após importação/substituição do rascunho vazio.
- Com várias opções, preservar escolha válida e apresentar seleção de principal clara junto ao resumo/preço final; se nenhuma foi escolhida, orientar e focar o controle correto antes de salvar. Não escolher silenciosamente a mais cara/barata.
- Reconciliar seleção ao remover ou excluir a principal; jamais salvar ID de opção ausente/excluída. Manter a revisão explícita e sua invalidação quando dados/preços mudam.
- Erros devem identificar opção/trecho/campo; rolar/focar onde corrigir. Não apagar valores já revisados ao falhar.
- Revisar mensagem de sucesso de ImportarVoos: `onImport()` pode rejeitar repetição/limite e mesmo assim o componente anuncia opções adicionadas. Fazer o resultado da inserção refletir a operação real.

### Padrão obrigatório de campos e validação

Aplicar este padrão em toda a calculadora/importação de voos e usá-lo como referência para os formulários que forem tocados nas tarefas desta rodada:

- Todo campo obrigatório mostra `*` em vermelho ao lado do rótulo, inclusive controles de rádio, checkbox e seletores. Não usar “(obrigatório)” dentro do texto do rótulo; trocar `Nome da opção (obrigatório)` por `Nome da opção *`.
- Ao submeter, cada campo obrigatório sem valor recebe borda/estado vermelho, foco no primeiro erro e mensagem específica logo abaixo: por exemplo, `Nome é obrigatório`, `Selecione um cliente` e `Escolha uma opção principal`.
- Campos opcionais não recebem asterisco. Avisos de qualidade, dados “a confirmar” e revisão comercial não devem se passar por obrigatoriedade.
- A validação do navegador, a validação visível e a regra de domínio precisam concordar. Não permitir que uma validação global genérica esconda quais campos precisam de correção.
- Corrigir a inconsistência atual: alguns asteriscos estão pretos e outros campos obrigatórios não têm indicador. Usar token/classe de erro compartilhada, com contraste e acessibilidade; não codificar cores diferentes por tela.
- Validar durante a correção após o primeiro envio e limpar o erro apenas quando o campo se tornar válido. Preservar o rascunho e não bloquear a leitura/edição dos demais campos.

### Decisão de texto e comportamento da opção que define o preço

O controle atual `Usar no total da cotação` é um rádio porque podem existir várias alternativas de voo. Elas são cenários apresentados ao cliente; seus preços não são somados. A opção marcada fornece o preço total inicial da cotação e os dados principais usados no resumo comercial. Sem essa escolha, o sistema não sabe qual preço gravar.

Substituir o rótulo por `Opção principal da cotação *` e incluir, imediatamente abaixo, o texto: `Define o valor total desta cotação. As outras opções são alternativas e não são somadas.` No resumo final, apresentar `Preço da cotação: R$ … — definido pela opção “…”` e permitir selecionar outra opção antes de criar. Para uma única opção incluída, manter seleção automática e mostrar a mesma explicação em estado não ambíguo. Não chamar a escolha de “melhor opção”, pois ela pode ser a preferida pelo cliente, não necessariamente a mais barata.

Arquivos: calculadora/page.tsx, FlightOptionForm.tsx, ImportarVoos.tsx, lib/flight-plan.ts e testes existentes.

Aceite/testes: uma oferta importada + cliente + revisão válida permite criar e reabrir cotação; duas ofertas exigem/mostram uma principal válida e o total corresponde só a ela; remover/desmarcar principal não deixa referência órfã; importação repetida não duplica nem anuncia sucesso falso; edição invalida revisão; erros de API preservam rascunho; teste com resultado de extração simulado e um fluxo real se houver arquivo de oferta disponível. Exercitar cada campo obrigatório vazio, confirmar asterisco vermelho, borda vermelha, foco e mensagem específica; confirmar que opcionais não recebem indicação. A data 30/11/2020 na captura não comprova erro de extração: comparar com o original antes de criar correção para datas.

## T02 — Editar e exibir duração em horas e minutos (P2)

Evidência: FlightOptionForm.tsx expõe diretamente durationMinutes como número. FlightPlanDetails.tsx e lib/whatsapp-message.ts exibem minutos; lib/pdf-generator.ts já converte para horas/minutos.

Implementar campos rotulados “Horas” e “Minutos” e formatador compartilhado de duração. Manter `durationMinutes` inteiro/null no contrato e armazenamento; converter apenas na interface. Não usar input de horário do dia: durações podem exceder 24 horas. Minutos entre 0 e 59, soma válida entre 1 e 10080 quando preenchida; ambos vazios significam não informado. Preservar dados importados ao editar e invalidar revisão quando duração mudar. Padronizar detalhes, WhatsApp e PDF, sem renderizar “null min”.

Aceite/testes: 1000 → 16 h 40 min; 355 → 5 h 55 min; 60 → 1 h 00 min; 1500 → 25 h 00 min; null → não informado. Edição e reabertura preservam o total em minutos. Validar limites, limpeza e valores fracionários/negativos.

## T03 — Clientes disponíveis ao abrir criação de cotação (P1)

Evidência: Calculator e NovaCotacaoPage recebem `clientes` de useData sem buscar clientes remotos ao entrar. DataProvider começa com dados locais; `isReady` significa armazenamento inicializado, não clientes carregados do servidor. `syncClientesFromApi()` existe, mas captura falhas sem propagá-las. ClientePicker exige dois caracteres; `filterClientesForPicker()` retorna vazio abaixo desse mínimo. Portanto há dois problemas distintos: clicar não mostra sugestões por desenho atual; mesmo digitando, uma sessão sem cache pode não ter os clientes cadastrados.

Implementar carregamento explícito com estados de carregando/erro/vazio e tentar novamente nas telas calculadora e nova cotação; revisar também o filtro de clientes de Viagens. Centralizar o carregamento reutilizável, evitando chamadas duplicadas e respostas atrasadas de outra sessão/agência. Ao focar campo vazio mostrar sugestões limitadas (ex.: primeiros 20 por nome), mantendo busca por nome/e-mail/telefone e limite de resultados. Usar dados atuais da agência; não depender de visitar Pessoas primeiro. Preservar seleção por URL e seleção de cliente recém-criado. Propagar erros em vez de anunciar inexistência de clientes após uma falha de rede.

Arquivos: src/contexts/data-context.tsx; lib/api/list-customers-remote.ts; components/cliente/ClientePicker.tsx; lib/cliente-search.ts; calculadora/page.tsx; cotacoes/nova/page.tsx; viagens/page.tsx.

Aceite/testes: navegador sem localStorage acessa diretamente calculadora/nova cotação e vê clientes reais; clique mostra sugestões; busca com acentos/telefone funciona; teclado/Enter/Escape/seleção por mouse continuam funcionando; API 401/500 mostra erro, não lista vazia definitiva; troca entre duas contas não mostra clientes da sessão anterior; novo cliente fica selecionado após criação. Atualizar testes que hoje exigem lista vazia com busca vazia.

## T04 — Viagens por proximidade, mês e ordenação escolhida (P2)

Evidência: TripController.list usa `findAllByAgency_IdOrderByTravelStartDateDesc` (e variante por cliente). O frontend viagens/page.tsx renderiza a resposta sem reordenar. A ordem atual é data de início decrescente, não inserção: fevereiro/2027 precede setembro/2026. `from` e `to` comparam ambos travelStartDate e deixam passar viagens sem data, apesar do rótulo “Viagem — fim” sugerir outra coisa.

Implementar visão padrão “Próximas viagens”, por início crescente, agrupada por mês/ano, mostrando o mês corrente antes dos seguintes. Dar destaque separado a viagens em andamento (início <= hoje <= fim). Oferecer visão de todas, próximas, em andamento e passadas, além de ordenação por início crescente/decrescente e cadastro mais recente; não criar calendário completo como requisito. Manter cliente/localizador/status; incluir tipo de serviço e atalhos este mês/próximo mês. Separar “Sem data” de viagens datadas. Persistir preferência por usuário/agência, não persistir dados como fonte de verdade.

Definir filtros de período como “Partida de / Partida até”, inclusivos, para manter semântica atual de partida; excluir sem data quando houver período explícito. Usar datas civis sem conversão UTC que altere dia/mês; desempate determinístico por id. Ordenação por cadastro exige suportar createdAt no backend/DTO ou aplicar ordenação no servidor; hoje TripSummary não o retorna. Validar campos permitidos de sort no backend. Datas e status devem permanecer critérios distintos; não reescrever status financeiros/comerciais automaticamente.

Arquivos: frontend viagens/page.tsx; backend application/controller/TripController.java, persistence/repository/TripRepository.java, entity/Trip.java; testes de viagens.

Aceite/testes: com relógio fixado em 18/09/2026, futuras de setembro aparecem antes de outubro/dezembro/janeiro; virada de ano agrupa corretamente; viagem em andamento aparece no bloco apropriado; passadas e sem data têm grupos próprios; filtros combinados e limites inclusivos funcionam; preferência sobrevive ao refresh; desempate estável; estados vazio/erro/loading e leitura em tela pequena.

## T05 — CRUD operacional compartilhado entre todos os membros da agência (P1)

Causa confirmada no caminho de criação: cotacoes/nova/page.tsx carrega equipe, mas o Select “Responsável” usa `value={o.name}` e salva apenas `responsavel`. Não envia `vendedorId`. O mapper usa vendedorId para sellerId; texto responsavel/assignee não concede atribuição. Calculator também não envia vendedorId. Backend CreateQuotation só autoatribui quando o autor autenticado é SALES_AGENT. ListQuotations filtra vendedor real por seller.id = caller.id. Logo uma cotação criada pelo gestor com nome do vendedor em “Responsável” pode ficar sem seller_id e desaparecer da lista desse vendedor. A conta e os registros específicos da captura ainda não foram consultados.

### Decisão de produto confirmada pelo usuário

Qualquer membro autenticado e ativo da agência, dono ou vendedor, pode criar, listar, consultar, atualizar e excluir cotações, pessoas e viagens da própria agência, independentemente de autoria ou vendedor atribuído. A calculadora de milhas e seus recursos operacionais também são compartilhados. Esta decisão substitui integralmente a proposta anterior de carteira restrita por vendedor. Não pedir confirmação novamente para aplicar esse compartilhamento.

| Domínio | Dono e vendedor da mesma agência | Limite |
| --- | --- | --- |
| Cotações e opções/planos de voo | CRUD de todos os registros, inclusive sem vendedor | Agência e regras de integridade |
| Pessoas/clientes | CRUD de todos os registros e uso nos seletores | Agência e regras de integridade |
| Viagens e itinerários | CRUD de todos os registros | Agência e regras de integridade |
| Calculadora de milhas | Usar, importar, calcular e gerenciar resultados/planos persistidos compartilhados | Agência; rascunho não salvo pode continuar local |
| Financeiro, lançamentos e comissões | Permissões específicas de cada domínio/papel | Não herdar automaticamente o CRUD operacional |

### T05.1 — Inventariar e centralizar a política de acesso

- Inventariar endpoints, guards, consultas de repositório, filtros de frontend e botões para cada operação da matriz. Registrar a situação antes/depois e testes associados, incluindo busca, contagens, anexos e exportações operacionais existentes.
- Autorizar no backend por associação ativa à agência e papel operacional habilitado, usando tenant autenticado; nunca confiar em agencyId/callerId enviados pelo navegador. Manter negação entre agências em todas as operações e vínculos relacionados.
- Remover filtros obrigatórios por criador/seller dos recursos compartilhados. Um filtro opcional de responsável pode existir, mas o padrão é toda a agência e o filtro não é autorização.
- Corrigir ListQuotations e a documentação QuotationAPI, que hoje explicitam restrição de SALES_AGENT por seller. GetQuotationById/UpdateQuotation já usarem agência é compatível com a nova regra: não introduzir restrição por vendedor nesses caminhos.
- Revisar exclusões restritas ao dono: TripController.delete contém @PreAuthorize exclusivo de AGENCY_OWNER e precisa ser alinhado. Verificar também regras globais de segurança e exclusões de pessoas/cotações; não presumir que liberar o menu libera a API.

### T05.2 — Separar atribuição, autoria e acesso

- Criador identifica quem criou; responsável identifica quem atende; vendedor/referral identifica atribuição comercial quando aplicável. Nenhum desses campos limita visibilidade ou CRUD operacional na agência.
- Corrigir o seletor por nome para identidade estável por UUID quando ele representar um membro, preservando rótulo humano. Não equiparar silenciosamente responsável operacional a beneficiário de comissão.
- Criar pelo gestor, pelo vendedor, pela calculadora ou pelo link público deve preservar a atribuição aplicável sem tornar o registro privado. Editar um registro de outro membro não troca automaticamente criador, vendedor ou beneficiário.
- Qualquer restrição específica para mudar beneficiário/comissão deve seguir a política financeira existente, separada da edição operacional. Não conceder alteração financeira via sellerId/unsetSeller ou campos equivalentes apenas porque o CRUD da cotação foi compartilhado.
- Reatribuir responsável/vendedor não muda quem pode abrir a cotação. Registros sem seller_id ficam imediatamente acessíveis a toda a agência após corrigir a política; não exigem backfill para aparecer.
- Para legado com nomes ambíguos, apresentar pendências de atribuição quando necessário; não inferir UUID por nome nem recalcular comissões automaticamente.

### T05.3 — Alinhar UI, carregamento e calculadora

- Dono e vendedor recebem listagens, seletores e ações operacionais equivalentes, respeitando os filtros escolhidos. Revisar Pessoas, Viagens, nova cotação, detalhe e calculadora; remover condições de UI baseadas no dono que bloqueiem CRUD autorizado.
- Carregar clientes/cotações do servidor ao entrar, inclusive com navegador limpo, e permitir ao vendedor selecionar uma cotação criada por outro membro para atualizar seus voos. Coordenar com T03 para não duplicar a lógica de carregamento.
- Escopar cache/dados persistidos à agência e limpar contexto de sessão ao trocar conta; ignorar respostas atrasadas de outra sessão. Não usar localStorage como mecanismo de autorização.
- Inventariar configurações/tabelas de milhas persistidas: configurações operacionais da agência precisam ser recuperáveis pelos membros, enquanto rascunhos ainda não salvos podem permanecer locais. Se hoje só houver armazenamento local para configurações que devem ser compartilhadas, incluir persistência na API e migração explícita/revisável, sem sobrescrever tabelas de outros membros automaticamente.
- Revisar importação pública como entrada para cotações compartilhadas: indicação de vendedor é atribuição, não motivo para ocultar solicitação operacional da equipe. Preservar o ciclo de vida já implementado e testar que membros diferentes não convertem a mesma solicitação duas vezes.

### T05.4 — Preservar a fronteira financeira e integridade

- Antes de alterar permissões, documentar a matriz financeira vigente: leitura de saldos/valores, tipos de lançamento, comissões, inclusão, edição, baixa e exclusão. Preservar diferenças existentes entre gestor e vendedor; esta tarefa não autoriza unificá-las nem inventar novas concessões.
- Preço comercial, cálculo de milhas e edição do orçamento pertencem ao fluxo operacional compartilhado. Saldos, contas financeiras, lançamentos e dados privados de comissões não devem ser expostos como efeito da abertura de cotações/viagens/pessoas. Revisar DTOs, anexos e links relacionados, não apenas telas.
- Verificar efeitos indiretos: aprovar/reverter cotação e editar valor podem sincronizar venda/recebível; excluir pessoa pode remover cotações ou desvincular financeiro. Manter automações comerciais válidas executadas pelo servidor, com invariantes financeiras, sem conceder ao vendedor CRUD financeiro arbitrário. Se uma operação violar uma trava financeira, bloquear com mensagem clara e transação sem alterações parciais.
- CRUD compartilhado não significa exclusão irrestrita de histórico: preservar bloqueios de venda/pagamento/vínculos válidos para dono e vendedor conforme regras do domínio. Não introduzir cascade destrutivo para contornar restrições.
- Registrar ator real e agência nas alterações compartilhadas, usando auditoria existente ou acrescentando cobertura onde faltar. Evitar sobrescrita silenciosa de edição concorrente: detectar versão desatualizada ou aplicar o mecanismo de concorrência já usado no domínio e apresentar conflito recuperável.

### T05.5 — Matriz de testes e aceite obrigatório

Criar fixtures com agência X (gestor, vendedor A e vendedor B), agência Y (outro membro), e registros criados por cada papel, atribuídos a A/B e sem atribuição. Exercitar API com identidades reais e UI em sessões independentes.

1. Gestor cria cotação; A e B listam, consultam e editam. A cria; gestor e B fazem o mesmo. Cotação sem seller aparece para todos da agência.
2. Para pessoas e viagens, repetir criar→listar→consultar→atualizar→excluir entre membros diferentes, usando registros sem vínculos que impeçam exclusão. Testar exclusões bloqueadas por integridade separadamente.
3. Vendedor usa cliente criado pelo gestor, importa voo, salva cotação e atualiza plano de cotação criada por B. Reatribuição/renomeação não altera visibilidade e edição não muda autoria/comissão implicitamente.
4. Membro de Y não lista, consulta, altera, exclui nem vincula IDs de X, incluindo plano/importação/anexo e relação com cliente/viagem/cotação. Mesma proteção para sessão inválida ou membro sem acesso ativo.
5. Listagem e detalhe seguem a mesma política; filtros opcionais afetam resultados, não privilégios. Todos os botões autorizados funcionam no login real de vendedor.
6. Endpoint/campo financeiro vedado ao vendedor continua vedado, inclusive por requisição direta e por payload operacional manipulado. Gestor conserva seus acessos e opções de lançamento específicos. Verificar automações de aprovação, recebíveis, pagamentos e comissões sem concessão acidental de privilégios.
7. Duas edições concorrentes não causam perda silenciosa; operação que falha por integridade não deixa atualização parcial. Auditoria identifica o membro que executou a alteração, não o criador original.
8. Navegador limpo e troca entre agências funcionam sem dados residuais; contagens e filtros correspondem à carteira compartilhada retornada pela API. Dupla conversão de solicitação pública continua impedida.

Arquivos frontend: cotacoes/nova/page.tsx, cotacoes/page.tsx, cotacoes/[id]/page.tsx, calculadora/page.tsx, páginas/componentes de pessoas e viagens, contexts/data-context.tsx, lib/api/quotation-mapper.ts, quotation-types.ts, users-remote.ts e tabelas de milhas. Backend: segurança global, controllers/docs/usecases/repositórios de quotation/customer/trip, serviços/endpoints de voos e solicitações públicas, DTOs com dados financeiros relacionados. Inspecionar políticas financeiras para garantir preservação, sem refatoração ampla desse domínio.

Entrega: inventário antes/depois, implementação por subtarefa, testes positivos intragência e negativos entre agências/financeiro, evidências de sessões distintas e riscos de migração identificados. Nenhuma alteração direta em produção nem reatribuição em lote implícita.

## T06 — Corrigir “Ver como Vendedor” para não simular permissões falsamente (P1)

Evidência confirmada: dashboard-shell.tsx mantém `viewAsSeller` apenas em estado local e altera `groups` entre OWNER_GROUPS/SELLER_GROUPS. Não troca token, conta ou escopo de dados. O rótulo de papel permanece derivado de accountKind real. Por isso o gestor continua vendo dados de gestor. Esse botão não prova o que o vendedor vê.

Escopo recomendado imediato: renomear para “Prévia do menu do vendedor”, com aviso visível “Sua sessão e seus dados continuam como gestor”, inclusive ao navegar; saída clara da prévia. Não chamar esse modo de teste de permissões. O aceite de T05 usa login real independente.

Alinhamento com a decisão de T05: cotações, pessoas, viagens e calculadora devem mostrar a mesma carteira operacional para os dois papéis. O problema da prévia continua relevante sobretudo para permissões e opções financeiras distintas; não usar igualdade da lista operacional como prova de equivalência das permissões financeiras.

Se for desejada prévia fiel de um vendedor específico, tratar como fase adicional explícita: seleção de vendedor da mesma agência, escopo imposto pelo backend com mesma política da conta real, modo somente leitura, indicação permanente de ator/conta observada, auditoria e restauração do contexto ao sair. Não falsificar accountKind no frontend nem compartilhar o token do vendedor. Não implementar impersonação completa como parte automática desta tarefa.

Arquivos: components/layout/dashboard-shell.tsx e testes de navegação; auth-context/data-context somente se necessário para garantir que a prévia de menu não altere identidade.

Aceite/testes: gestor entende que é prévia de menu; token/usuário não são modificados; sair restaura menu; prévia nunca serve como evidência de acesso real; login de vendedor real é comparado com os dados esperados de T05.

## Modelo e entrega

Terra com raciocínio médio é uma escolha razoável para executar T01–T04 e a correção de rótulo da T06 com estes critérios. T05 merece revisão mais cuidadosa por envolver autorização e correção de legado: aumentar raciocínio ou reservar revisão por um modelo mais forte antes de publicar. Não é necessário criar outra tarefa do aplicativo; trocar o modelo nesta conversa mantém o contexto.

Ao concluir, informar tarefas entregues, comandos/testes realmente executados, comportamentos verificados com duas sessões, limitações e necessidade de deploy/migração. Não declarar o caso específico de produção resolvido sem verificá-lo.
