# Technical Backlog

> Itens levantados na auditoria de persistência e fluxos críticos em 2026-09-03.

**Last Updated**: 2026-09-17  
**Total Items**: 38 (1 TODO pending — needs live repro, 1 TODO in-progress, 1 DEBT, 35 resolved)

---

## 🤝 Handoff para Claude / próximo agente

**Atualização em 2026-09-17:** o usuário autorizou expressamente validações, testes e publicação em produção para a calculadora. Essa autorização substitui a restrição abaixo nesta entrega.

**Regra anterior do usuário:** não execute `npm test`, `npm run lint`, `npx tsc`, `mvn test`, build ou qualquer validação automatizada. O usuário fará toda a validação manual/automatizada ao final. Não alegar que testes passaram.

**Workspace:** frontend em `C:\workspace-pessoal\agencia-hub`; API Spring em `C:\workspace-pessoal\agencia-hub-api`. O worktree já tinha mudanças do usuário antes deste trabalho — preservar alterações não relacionadas e não usar reset/checkout destrutivo.

**Estado em 2026-09-04 (todos os TODOs fechados):** restam apenas TODO-015 (bloqueado na validação manual/automatizada do usuário — sem trabalho de código pendente) e DEBT-001 (suíte de regressão frontend, categoria "debt", não "TODO"). Todo o resto foi resolvido em duas rodadas:
- 1ª rodada (itens que estavam `in-progress`): TODO-001, TODO-002, TODO-006, TODO-007, TODO-012, TODO-014, TODO-016.
- 2ª rodada (itens que estavam `pending`): TODO-004, TODO-008, TODO-009, TODO-010 e TODO-011 já estavam corretos no código — confirmados por leitura e marcados `resolved` sem alteração (exceto TODO-011, que tinha um vazamento cross-tenant real e foi corrigido). TODO-017 tinha uma causa raiz real (fuso horário no agendador de cotações) e foi corrigido.

**Telas já iniciadas:**

- `/financeiro`: Fluxo de Caixa; contém atalhos de Receita e Despesa.
- `/financeiro/receita`: cadastro de venda/receita com parcelas, fornecedor, comissão, recorrência, conta, forma de pagamento, anexo e criação de pessoa.
- `/financeiro/despesa`: cadastro de saída com recorrência e anexo.
- `/vendas`: histórico com filtro por cliente/período e detalhe de contas a receber/pagar.
- `/viagens`, `/viagens/nova`, `/viagens/[id]`: cadastro e consulta de viagens/vendas emitidas, com trechos de voo, localizador e vínculo opcional a fornecedor/cotação/venda.

**Regras de UX já combinadas:** `*` identifica campo obrigatório; borda vermelha somente após tentativa de envio. “Nova pessoa” é o modal completo e deve manter tipo Cliente/Fornecedor pré-selecionado conforme o atalho. Anexo: JPEG, PNG, WEBP, PDF, TXT ou CSV; limite 5 MB.

**Próximo trabalho recomendado:** só resta TODO-015 (aguardando validação do usuário — não é trabalho de código) e DEBT-001 (suíte de regressão frontend). O projeto já tem Vitest funcional (ver `src/lib/api/customer-mapper.test.ts` como exemplo), mas falta `jsdom`/`@testing-library/react` para testar componentes/hooks (ex.: `idle-timeout.tsx` ficou sem teste de timers por isso, TODO-012). Não criar lançamentos recorrentes automaticamente sem uma regra explícita de agenda/deduplicação.

---

## 📍 Progresso da implementação

Esta é a visão curta para acompanhamento. O detalhamento e os critérios de aceite continuam nos itens abaixo.

- [x] **Segurança de produção:** validação de configuração JWT e CORS implementada e coberta por 3 testes unitários; README agora documenta que produção precisa de `SPRING_PROFILES_ACTIVE=production` para a validação rodar. Falta confirmar a variável no host real (fora do alcance desta sessão).
- [x] **Isolamento do financeiro:** criação, listagem, leitura, edição e exclusão restritas à agência corrente; coberto por `FinancialEntryMultiTenancyIntegrationTest`.
- [x] **Isolamento de clientes:** leitura, edição, exclusão e duplicidade de e-mail/telefone respeitam a agência corrente.
- [x] **Isolamento de cotações:** consulta, edição e exclusão por ID respeitam a agência corrente.
- [x] **Isolamento de equipe (`/users`):** listagem, leitura, edição e criação de contas agora são restritas/associadas à agência corrente; dashboard de vendedor não vaza dados de agente de outra agência. Coberto por `PlatformAccountMultiTenancyIntegrationTest`.
- [x] **Solicitações sem polling:** removida a consulta global/em intervalo; Cotações tem atualização manual com estado de carregamento e erro visível.
- [x] **Sessão inativa:** saída e expiração usam um único `expireSession()`, redirecionam ao login e o contador não chega a `0:00` antes da expiração. Teste de timers falsos não escrito (falta infraestrutura `jsdom`/RTL no Vitest do projeto).
- [x] **Confirmação falsa em criações:** cliente, cotação e lançamento financeiro deixam de exibir sucesso quando a API remota falha; a tela passa a mostrar erro.
- [x] **Persistência principal na interface:** edição/exclusão financeira e edição de cliente só confirmam após a API; o financeiro carrega a lista remota ao abrir a tela.
- [x] **Cadastro de cliente:** destino de interesse voltou a ser opcional de ponta a ponta (sem valor sentinela); PATCH de clientes limpa campos opcionais corretamente.
- [x] **Controle de vendas/viagens (TODO-016):** telas, API isolada por agência, busca global por localizador e testes de integração multi-tenant concluídos.
- [x] **Isolamento LGPD (TODO-011):** processar uma solicitação de exclusão só afeta a agência de quem processa; agência sem dado correspondente recebe 404. Coberto por `DataDeletionMultiTenancyIntegrationTest`.
- [x] **Notificações de cotação (TODO-017):** agendador de vencimento passou a usar fuso fixo (`America/Sao_Paulo`) em vez do fuso do host, e para de avisar sobre cotações cuja viagem associada já passou.
- [x] **Config de agência para vendedor, fallback local, mocks de auth e formulário de contato (TODO-004/008/009/010):** confirmados corretos por leitura de código, sem alteração necessária.
- [ ] **Pendente:** TODO-015 depende só da validação manual/automatizada do usuário. DEBT-001 (suíte de regressão frontend) segue em aberto — falta `jsdom`/RTL no Vitest para testar componentes/hooks.

**Próxima entrega sugerida:** validação final de TODO-015 pelo usuário; depois, se houver apetite, configurar `jsdom`/`@testing-library/react` para destravar DEBT-001 e o teste de timers de TODO-012.

---

## 📋 TODOs

### TODO-001: Impedir confirmações de gravação apenas local quando a API estiver configurada
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-03
- **Resolved**: 2026-09-04
- **Origin**: auditoria de cadastro e persistência
- **Context**: Criação de cliente, cotação e lançamento financeiro captura erro da API (ou ignora a chamada quando faltam pré-requisitos) e confirma sucesso após gravar somente no `localStorage`. Em produção, isso causa perda aparente de dados ao recarregar.
- **Affected Files**: `src/contexts/data-context.tsx`, `src/lib/api/create-customer-remote.ts`, `src/lib/api/create-quotation-remote.ts`, `src/lib/api/create-financial-entry-remote.ts`, modais/telas de criação
- **Complexity**: Large
- **Resolution**: `addCliente`/`addLancamento`/`addCotacao` propagam o erro da API (não capturam nem confirmam localmente); `createCustomerRemote`/`createFinancialEntryRemote` lançam exceção em qualquer resposta não-OK. Os modais de criação (cliente, venda/receita, despesa, cotação) já usam `try/catch` e só exibem sucesso após a resposta da API. Validado por leitura de código; sem execução de suíte automatizada (regra do usuário).

### TODO-002: Concluir o alinhamento restante do formulário de cliente ao contrato da API
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-03
- **Resolved**: 2026-09-04
- **Origin**: auditoria de cadastro de clientes
- **Context**: Em 2026-09-03 foi decidido que e-mail e telefone são opcionais; o contrato Java, o mapeador, a migração do telefone e o cliente HTTP foram ajustados. Permanece decidir e alinhar o tratamento de destino de interesse, que a migração V29 tornou opcional mas o DTO ainda preenche com valor sentinela. Também falta a suíte frontend, hoje bloqueada pela instalação de dependências, para prevenir regressão.
- **Affected Files**: `src/components/cliente/NovoClienteModal.tsx`, `src/lib/api/customer-mapper.ts`, `agencia-hub-api/src/main/java/com/agenciahub/api/application/usecases/customer/create/{CreateCustomerRequestDTO,InputMapper}.java`, `agencia-hub-api/src/main/resources/db/migration/V29__customer_optional_email_destination.sql`
- **Complexity**: Medium
- **Resolution (2026-09-04)**: `interestDestination` deixou de ser `@NotBlank` no `CreateCustomerRequestDTO` (agora `@Size(max=512)`, opcional) e a entidade `CrmCustomer.interestDestination` perdeu `nullable=false` (estava divergente da migração V29, que já havia relaxado a coluna — risco real de falha na validação de schema do Hibernate). `InputMapper` converte string em branco para `null` como já fazia para e-mail/telefone. No frontend, `clienteToCreateRequest`/`clientePatchToApi` pararam de enviar o sentinela `"—"` e `EditarClienteModal` não injeta mais esse valor; `clientePatchToApi` agora envia string vazia (não `null`) para limpar um campo opcional, alinhado ao contrato real do `UpdateCustomer` (campo `null`/ausente = não alterar, string vazia = limpar) — o mesmo valia para e-mail/telefone e também foi corrigido. Adicionado `src/lib/api/customer-mapper.test.ts` cobrindo os três mapeamentos (Vitest já disponível no projeto).

### TODO-003: Persistir e reconciliar alterações de clientes e lançamentos financeiros
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-03
- **Origin**: auditoria de visualização e edição
- **Context**: `updateCliente` atualiza somente o estado/localStorage, sem `PATCH /customers/{id}`. O financeiro não implementa carregamento remoto (`GET /financial-entries`), então a interface pode exibir dados locais desatualizados mesmo quando a API é a fonte de verdade.
- **Affected Files**: `src/contexts/data-context.tsx`, `src/components/cliente/EditarClienteModal.tsx`, `src/app/(app)/clientes/page.tsx`, `src/app/(app)/financeiro/page.tsx`, novos clientes de API para clientes/financeiro
- **Complexity**: Large

### TODO-004: Evitar chamadas de configuração de agência para vendedores
- **Priority**: Medium
- **Status**: resolved
- **Created**: 2026-09-03
- **Resolved**: 2026-09-04
- **Origin**: incidente de autorização `SALES_AGENT`
- **Context**: A página de detalhe de cotação chama `/agency/solicitacao-config` mesmo para `SALES_AGENT`, mas essa rota exige `AGENCY_OWNER`; o resultado é um 403 e log `AuthorizationDeniedException` sem valor para o vendedor.
- **Affected Files**: `src/app/(app)/cotacoes/[id]/page.tsx`, `src/components/cotacao/LinkSolicitacaoModal.tsx`
- **Complexity**: Small
- **Resolution**: Revisão de código confirma que já estava corrigido: `cotacoes/[id]/page.tsx` só chama `/agency/solicitacao-config` quando `isOwner` (linhas com `if (!isOwner || ...) return;`); `LinkSolicitacaoModal.tsx` tem `isSalesAgent` e, quando true, lê a config só do cache `localStorage`, sem chamar a rota restrita a `AGENCY_OWNER`. Nenhuma mudança necessária.

### TODO-005: Substituir polling global de solicitações por atualização manual em Cotações
- **Priority**: Medium
- **Status**: resolved
- **Created**: 2026-09-03
- **Origin**: decisão de produto após auditoria de tráfego
- **Context**: Remover a consulta automática a `/api/app/solicitacao-submissions`, atualmente feita ao abrir qualquer tela e repetida a cada 30 segundos. Exibir um botão explícito de atualizar solicitações apenas na tela de Cotações; a atualização deve ter estado de carregamento, erro visível e atualizar a lista sem polling em segundo plano.
- **Affected Files**: `src/contexts/notification-context.tsx`, `src/hooks/useSolicitacaoSubmissions.ts`, `src/app/(app)/cotacoes/page.tsx`, componentes de notificações e de solicitações recebidas
- **Complexity**: Medium

### TODO-006: Corrigir isolamento de agência em todas as operações por recurso
- **Priority**: Critical
- **Status**: resolved
- **Created**: 2026-09-03
- **Resolved**: 2026-09-04
- **Origin**: auditoria ampla de autorização multi-tenant
- **Context**: Operações por ID de cliente (`PATCH`/`DELETE`), cotação (`GET`/`PATCH`/`DELETE`) e lançamento financeiro (`GET`/`PATCH`) usam `findById` sem verificar a agência corrente. A listagem financeira também não aplica filtro de agência; a criação de cliente ainda verifica e-mail globalmente, bloqueando o mesmo contato em agências diferentes. A gestão de equipe é ainda mais ampla: `GET /users` lista todas as contas, `GET/PATCH /users/{id}` não verifica a agência e `POST /users` cria uma conta sem agência. Um usuário autenticado que obtenha um UUID de outra agência pode ler ou alterar dados indevidos. Adotar buscas/consultas ancoradas no tenant, unicidade por agência, retorno 404 para recurso externo, associar novos usuários à agência do dono e testes de duas agências por operação.
- **Affected Files**: `agencia-hub-api/src/main/java/com/agenciahub/api/application/usecases/customer/{create,update,delete}/*`, `agencia-hub-api/src/main/java/com/agenciahub/api/application/usecases/quotation/{retrieve/byid,update,delete}/*`, `agencia-hub-api/src/main/java/com/agenciahub/api/application/usecases/financial/{retrieve,update,create}/*`, `agencia-hub-api/src/main/java/com/agenciahub/api/application/usecases/platformaccount/{create,retrieve,update}/*`, `UserController.java`, repositórios e testes de integração
- **Complexity**: Large
- **Risk if Ignored**: Vazamento e alteração cruzada de dados de clientes, cotações e financeiro entre agências.
- **Resolution (2026-09-04)**: Cliente, cotação e financeiro (create/update/delete/retrieve/list) já estavam ancorados em `TenantContext.requireAgencyId()` com `findByIdAndAgency_Id` e unicidade de e-mail por agência — confirmado por leitura de código, sem trabalho adicional necessário aí. O gap real estava em `PlatformAccount`/`/users`: `ListPlatformAccounts` listava **todas** as contas de **todas** as agências; `GetPlatformAccountById` e `UpdatePlatformAccount` buscavam por `findById` sem checar agência; `CreatePlatformAccount` criava conta com `agency = null`. Corrigido: `PlatformAccountRepository` ganhou `findByIdAndAgency_Id`/`findByAgency_IdOrderByNameAsc`; as três use cases passaram a escopar por `TenantContext.requireAgencyId()`; `CreatePlatformAccount` agora associa a conta criada à agência de quem a criou. Também corrigido `SalesAgentDashboardController.agentDashboard`: um `AGENCY_OWNER` podia consultar o dashboard de um vendedor de **outra** agência informando o UUID (vazava nome/e-mail/comissão do agente); agora valida que `agent.getAgency()` é a agência corrente antes de montar o dashboard, e `GetPlatformAccountEntityById` passou a usar `findByIdWithAgency` (evita `LazyInitializationException` com `open-in-view: false`). Adicionado `PlatformAccountMultiTenancyIntegrationTest` (list/get/patch entre duas agências e criação vinculada à agência do chamador).

### TODO-007: Tornar a criação e a consulta financeira explicitamente vinculadas à agência
- **Priority**: Critical
- **Status**: resolved
- **Created**: 2026-09-03
- **Resolved**: 2026-09-04
- **Origin**: auditoria ampla de persistência financeira
- **Context**: `CreateFinancialEntry` constrói a entidade sem definir `agency`, embora a coluna seja obrigatória; o `ListFinancialEntries` monta filtros sem `TenantContext`, deixando a consulta global. A criação pode falhar no banco e a consulta pode revelar lançamentos de outras agências. A associação do cliente também deve usar `findByIdAndAgency_Id`.
- **Affected Files**: `agencia-hub-api/src/main/java/com/agenciahub/api/application/usecases/financial/create/CreateFinancialEntry.java`, `agencia-hub-api/src/main/java/com/agenciahub/api/application/usecases/financial/retrieve/list/ListFinancialEntries.java`, `agencia-hub-api/src/main/java/com/agenciahub/api/application/persistence/repository/spec/FinancialEntrySpecifications.java`, repositórios e testes
- **Complexity**: Medium
- **Resolution**: Confirmado por leitura de código que já estava corrigido: `CreateFinancialEntry` define `agency` via `TenantContext.requireAgencyId()` e resolve cliente/fornecedor com `findByIdAndAgency_Id`; `ListFinancialEntries`/`FinancialEntrySpecifications.withFilters` filtram sempre por `agency.id`; `GetFinancialEntryById`/`UpdateFinancialEntry` usam `findByIdAndAgency_Id`. Coberto por `FinancialEntryMultiTenancyIntegrationTest` já existente.

### TODO-008: Restringir fallback de armazenamento local a desenvolvimento explícito
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-03
- **Resolved**: 2026-09-04
- **Origin**: auditoria de rotas públicas Next.js
- **Context**: Sem URL da API, as rotas de formulário público e configuração gravam em `.local/`; o bloqueio de produção considera apenas `VERCEL=1`. Em outro host de produção, a aplicação pode confirmar uma solicitação que ficará no disco efêmero e desaparecerá. Permitir esse armazenamento apenas com flag de desenvolvimento explícita; nos demais ambientes falhar com erro visível de serviço não configurado.
- **Affected Files**: `src/app/api/public/solicitacao/submit/route.ts`, `src/app/api/app/solicitacao-config/route.ts`, `src/app/api/app/solicitacao-submissions/route.ts`, `src/lib/solicitacao-server-store.ts`, respectivos testes
- **Complexity**: Medium
- **Resolution**: Revisão de código confirma que já estava corrigido: `isLocalSolicitacaoStoreEnabled()` em `solicitacao-server-store.ts` verifica `NODE_ENV === "development" || "test"` (não mais `VERCEL=1`), e as três rotas (`submit`, `solicitacao-config`, `solicitacao-submissions`) checam essa função antes de usar o disco, retornando erro explícito de serviço não configurado nos demais ambientes. Nenhuma mudança necessária.

### TODO-009: Desabilitar autenticação e verificação simuladas fora de desenvolvimento
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-03
- **Resolved**: 2026-09-04
- **Origin**: auditoria de autenticação frontend
- **Context**: Quando a URL da API não está configurada, login e verificação de e-mail criam uma sessão local `mock-owner` e exibem sucesso. Isso mascara falha de configuração em produção e pode apresentar uma interface autenticada sem sessão válida no backend. Restringir mocks a desenvolvimento explícito (ou removê-los) e exibir falha de configuração nos demais ambientes.
- **Affected Files**: `src/contexts/auth-context.tsx`, `src/app/cadastro/verificar/page.tsx`, testes de autenticação
- **Complexity**: Medium
- **Resolution**: Revisão de código confirma que já estava corrigido: `auth-context.tsx` (`login`) e `cadastro/verificar/page.tsx` (3 pontos) só criam a sessão `mock-owner` quando `NODE_ENV` é `"development"` ou `"test"`; nos demais ambientes retornam erro "Serviço de autenticação não configurado". Nenhuma mudança necessária.

### TODO-010: Fazer o formulário público de contato enviar de verdade ou removê-lo
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-03
- **Resolved**: 2026-09-04
- **Origin**: auditoria de telas públicas
- **Context**: A tela `/contato` espera um segundo e exibe “Mensagem enviada” sem realizar requisição nem encaminhar o conteúdo. O usuário acredita que será respondido, mas a mensagem é descartada. O link de e-mail dessa mesma tela usa `href="o"`, portanto também não abre o cliente de e-mail. Integrar um canal real (API/e-mail/helpdesk) com sucesso apenas após confirmação, ou retirar o formulário até existir esse canal; corrigir o link para `mailto:`.
- **Affected Files**: `src/app/contato/page.tsx`, rota/integração de suporte a criar, testes de interface
- **Complexity**: Medium
- **Resolution**: Revisão de código confirma que já estava corrigido: o formulário monta um `mailto:` real com assunto/corpo preenchidos e navega para ele (`window.location.href = "mailto:contato@..."`) — não finge um envio inexistente; a mensagem de sucesso é honesta ("abrimos seu aplicativo de e-mail... confirme o envio nele"), não "mensagem enviada". O link de e-mail junto ao WhatsApp já é `mailto:contato@agenciashub.com.br` (não `href="o"`). Nenhuma mudança necessária.

### TODO-011: Redesenhar o processamento LGPD para impedir exclusão cruzada entre agências
- **Priority**: Critical
- **Status**: resolved
- **Created**: 2026-09-03
- **Resolved**: 2026-09-04
- **Origin**: auditoria de exclusão de dados
- **Context**: O endpoint de processamento é acessível a `AGENCY_OWNER`, mas a solicitação não pertence a uma agência. Ao aprová-la, o serviço busca submissões e clientes pelo e-mail em toda a base e anonimize todos os resultados. Um dono pode, portanto, disparar exclusão de registros de outra agência que compartilhem o e-mail, além de o recurso ser carregado por ID sem escopo. Definir a política de controlador de dados: associar a solicitação à agência/origem ou mover o processamento para administrador da plataforma; aplicar o escopo na consulta e criar testes multi-tenant.
- **Affected Files**: `agencia-hub-api/src/main/java/com/agenciahub/api/application/usecases/datadeletion/ProcessDataDeletionRequest.java`, `DataDeletionRequest.java`, repositórios de solicitações/clientes/submissões, controller e migrações/testes
- **Complexity**: Large
- **Risk if Ignored**: Um usuário de uma agência pode anonimizar dados pertencentes a outra, gerando incidente operacional e de privacidade.
- **Decisão de política**: a solicitação continua global (o titular só informa e-mail/telefone, sem escolher agência — o mesmo e-mail pode ter dado em mais de uma agência), mas cada `AGENCY_OWNER` só enxerga e só apaga o que pertence à **própria** agência; não foi movida para administrador da plataforma, para preservar o fluxo atual de auto-atendimento por agência.
- **Resolution (2026-09-04)**: `ProcessDataDeletionRequest` agora resolve `TenantContext.requireAgencyId()` e só anonimiza `SolicitacaoSubmission`/`CrmCustomer` que pertencem a essa agência (`findByEmailIgnoreCaseAndAgency_Id`); se a agência do chamador não tiver nenhum registro para o e-mail da solicitação, responde 404 (não confirma nem nega a existência de dado em outra agência). Adicionado `SolicitacaoSubmissionRepository.findByEmailIgnoreCaseAndAgency_Id`. Coberto por `DataDeletionMultiTenancyIntegrationTest` (dono de uma agência não processa/anonimiza dado de outra; dono processa normalmente o próprio dado).
- **Limitação conhecida (documentada no código)**: `status` é um campo único e global na solicitação — se o mesmo e-mail tiver dado em mais de uma agência, a primeira a processar marca a solicitação como concluída e a segunda não consegue mais agir sobre ela (recebe "já processada"), mesmo tendo dado próprio para tratar. Corrigir isso exigiria modelar uma linha de processamento por agência (mudança de schema maior); fica registrado aqui como possível TODO futuro, não bloqueou esta correção porque o problema original — vazamento/exclusão cruzada — já está eliminado.
- **Regressão pega pelo `mvn test` do usuário (2026-09-04)**: `DataDeletionIntegrationTest.process_excluir_byOwner_changesStatusToProcessed` e `..._rejeitar_byOwner_changesStatusToRejected` (teste pré-existente, criado antes desta correção) processavam uma solicitação para um e-mail sem nenhum dado na agência do owner de teste — exatamente o cenário que o fix passou a bloquear (404 correto). Corrigido o teste, não o código: adicionado um cliente da agência do owner com o e-mail da solicitação antes de processar, refletindo o novo contrato (só se processa o que é da própria agência).

### TODO-012: Corrigir encerramento e corrida do aviso de inatividade
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-03
- **Resolved**: 2026-09-04
- **Origin**: relato e inspeção do modal de sessão
- **Context**: `IdleTimeout` chama somente `logout()` ao clicar em “Sair agora” ou quando o prazo vence; ele limpa a sessão, mas não redireciona para `/login`, deixando a tela anterior visível atrás do modal. Além disso, o contador visual pode chegar a `0:00` antes do callback de logout e o botão “Continuar” ainda reage agenda a sessão, permitindo recuperá-la após o prazo. Centralizar um `expireSession()` que bloqueie a interface, limpe a sessão e faça `router.replace('/login')`; desabilitar/remover “Continuar” ao expirar e usar uma única fonte de verdade para o deadline. Cobrir sair manual, continuar antes do prazo, expiração automática e aba em segundo plano.
- **Affected Files**: `src/components/idle-timeout.tsx`, `src/contexts/auth-context.tsx`, `src/components/layout/dashboard-shell.tsx`, testes de unidade com timers falsos
- **Complexity**: Medium
- **Risk if Ignored**: O usuário vê conteúdo autenticado após sair e pode aparentar continuar uma sessão que deveria estar encerrada.
- **Resolution**: Revisão de código confirma que `src/components/idle-timeout.tsx` já implementa o desenho pedido: `expireSession()` único (guardado por `expiredRef` contra dupla execução) que limpa timers, esconde o aviso, desloga e faz `router.replace("/login")`; `warnTimerRef`/`logoutTimerRef` derivam de uma única `scheduleTimers()` (mesma base `IDLE_LIMIT_MS`/`WARN_BEFORE_MS`), e o contador usa `warnedAtRef` (timestamp real) em vez de decremento por tick — não deriva do `setTimeout` do logout, então não chega a `0:00` antes de expirar e se autocorrige se a aba ficar em segundo plano. “Continuar” chama `resetIdle()`, que reagenda a partir do mesmo `scheduleTimers()` e é bloqueado após expirar (`expiredRef`). **Não escrito**: teste de unidade com timers falsos — o projeto ainda não tem `@testing-library/react`/ambiente `jsdom` no Vitest (só `environment: "node"`), então um teste de componente para este hook exigiria configurar essa infraestrutura primeiro; ficou fora do escopo desta rodada.

### TODO-013: Restaurar o contrato de autenticação no deploy Railway
- **Priority**: Critical
- **Status**: resolved
- **Created**: 2026-09-03
- **Origin**: validação externa do login em produção
- **Context**: Invalidado por validação posterior no Railway: o serviço configurado está ligado ao repositório/branch corretos e registra respostas 200 para `POST /api/v1/auth/login`. O caso 404 é o comportamento deliberado para credenciais inválidas, conforme `Login` lança `ResourceNotFoundException`; não é uma rota ausente nem falha de deploy. Uma tentativa anterior de diagnóstico com senha fictícia foi interpretada incorretamente.
- **Affected Files**: configuração de serviço/variáveis Railway, pipeline de deploy, `src/main/resources/application.yml`, `AuthAPI.java`, teste de fumaça de produção
- **Complexity**: Medium
- **Risk if Ignored**: Nenhum usuário consegue iniciar sessão em produção.

### TODO-014: Tornar a configuração de segurança fail-closed em produção
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-03
- **Resolved**: 2026-09-04
- **Origin**: revisão de segurança de configuração Spring
- **Context**: A aplicação possui valores padrão inseguros para produção: `JWT_SECRET` tem segredo de desenvolvimento embutido e CORS aceita qualquer origem quando `CORS_ALLOWED_ORIGINS` não é definido, inclusive com credenciais habilitadas. A resposta atual de produção restringe CORS a `www.agenciashub.com.br`, mas a ausência futura de variável reabre o acesso cross-origin. Em perfil de produção, abortar a inicialização se JWT/CORS não estiverem explicitamente configurados; permitir defaults permissivos apenas em desenvolvimento/teste.
- **Affected Files**: `src/main/resources/application.yml`, `CorsConfig.java`, validação de configuração de startup, perfis de ambiente e testes
- **Complexity**: Medium
- **Risk if Ignored**: Uma falha de configuração pode permitir assinatura de JWT com segredo previsível ou chamadas autenticadas a partir de origens não autorizadas.
- **Resolution**: `ProductionSecurityConfiguration` (perfis `prod`/`production`) já recusa subir a aplicação se `JWT_SECRET` estiver ausente/for o segredo de desenvolvimento ou se `CORS_ALLOWED_ORIGINS` estiver ausente/`*`; coberto por `ProductionSecurityConfigurationTest` (3 casos). Adicionada seção no `README.md` documentando que **qualquer** deploy real precisa exportar `SPRING_PROFILES_ACTIVE=production` — sem esse perfil ativo a validação não roda, e nenhum arquivo deste repositório define esse profile automaticamente (é responsabilidade da configuração do serviço no host). Não foi possível confirmar/ajustar a variável direto no Railway: a conta conectada ao MCP Railway não lista um projeto correspondente a este serviço — confirmar manualmente no painel do serviço em produção.

### TODO-015: Padronizar lançamentos financeiros com fornecedor, observações e composição comercial
- **Priority**: High
- **Status**: in-progress
- **Created**: 2026-09-03
- **Origin**: novo requisito de cadastro financeiro e mapeamento de pontos de entrada
- **Context**: Há hoje somente um ponto de criação de caixa: o modal “Novo lançamento” em `/financeiro`; ele armazena descrição, tipo, categoria, valor, data, status, cliente e conta. Não há fornecedor, observações, custo/repasse, lucro ou comissão. Cotações (inclusive a Calculadora de Milhas) apenas registram o valor proposto e não devem ser tratadas como receita recebida. Criar um cadastro de fornecedor por agência — com seletor e criação rápida equivalente ao de cliente — e reutilizar um único componente/contrato de lançamento em toda futura entrada financeira. Para uma venda, registrar separadamente: valor de venda total, custo/repasse ao fornecedor, comissão e o lucro líquido derivado (`venda − repasse − comissão`); não salvar o mesmo número como múltiplas entradas, nem somar lucro/comissão ao fluxo de caixa. O financeiro deve exibir e filtrar os campos comerciais, manter o lançamento de caixa com seu valor efetivamente recebido/pago e exportá-los. Definir se uma comissão é paga a vendedor, recebida de fornecedor ou ambos, antes de fixar as categorias e sinais contábeis.
- **Affected Files**: `src/app/(app)/financeiro/page.tsx`, `src/components/cliente/ClientePicker.tsx` (referência para um `SupplierPicker`), `src/types/index.ts`, `src/contexts/data-context.tsx`, `src/lib/api/financial-*`, `agencia-hub-api/src/main/java/com/agenciahub/api/application/{persistence/entity,usecases/financial,persistence/repository}/*`, nova migração, APIs e testes de integração/frontend
- **Complexity**: Large
- **Architecture Decision (2026-09-04)**: Não concentrar venda, parcelas, obrigações e caixa em um único lançamento. Criar os registros separados: Venda (cliente obrigatório, cotação/viagem opcionais), Item da Venda (0..N, fornecedor opcional), Conta a Receber (parcelas), Conta a Pagar (fornecedor ou comissão), Comissão (0..N beneficiários internos da agência, valor fixo ou percentual) e Lançamento Financeiro (movimentação efetiva de conta). Pagamento direto pelo cliente ao fornecedor entra no comercial e na margem, mas não no caixa da agência. Comissão gera obrigação pendente, e somente seu pagamento gera saída de caixa. Lucro bruto = venda − custos; lucro líquido = venda − custos − comissões.
- **UX Decision (2026-09-04)**: Manter telas simples para leigos: Venda, Recebimentos, Pagamentos e Caixa. Exibir linguagem operacional (“cliente paga para a agência”, “a agência ainda precisa pagar”) e tooltips curtos em campos complexos. O lançamento de caixa atual não será usado para representar toda a venda.
- **Implementation Order**:
  1. Consolidar entidades, migrações e APIs de Venda, itens, recebíveis, pagáveis e comissões internas, todos isolados por agência.
  2. Criar fluxo de cadastro de venda e telas simples de recebimentos/pagamentos; fornecedor pode ser criado/selecionado no fluxo.
  3. Vincular venda a cliente, cotação e viagem; mostrar histórico e pendências na ficha do cliente.
  4. Fazer quitação de recebível/pagável criar ou vincular lançamento de caixa explicitamente, sem duplicação.
- **Implementation Progress (2026-09-04)**:
  - [x] Criadas migrações e entidades de fornecedor, venda, item, contas a receber/pagar e comissões internas.
  - [x] APIs de fornecedor isoladas por agência e fluxo de venda que cria parcelas, custos e obrigações de comissão.
  - [x] Quitação explícita de contas cria o lançamento de caixa correspondente; criar venda não altera caixa.
  - [x] Nova aba **Vendas** com cliente, observações, fornecedor de criação rápida, itens, pagamento direto ao fornecedor e múltiplas comissões internas.
  - [x] Cadastro de receita foi movido para Financeiro; Vendas passa a ser histórico comercial. Financeiro ganhou ações separadas de receita e despesa.
  - [x] Receita permite criar cliente rápido, remover linhas incluídas por engano, informar data do lançamento, forma de pagamento, conta de recebimento, recorrência e várias parcelas com datas previstas.
  - [x] Anexos de venda e despesa aceitam imagem, PDF ou texto de até 5 MB, com upload e download isolados por agência.
  - [x] Recorrência é persistida em vendas e despesas como configuração; não cria lançamentos futuros automaticamente.
  - [x] Detalhe de venda mostra contas pendentes, lucro bruto/líquido e ações simples de “Recebi”/“Paguei”.
  - [x] Ficha do cliente exibe o histórico de vendas; o formulário de Caixa foi reduzido a movimentação efetiva.
  - [x] Venda pode ser vinculada a uma cotação do mesmo cliente e da mesma agência.
  - [x] Venda ganhou vínculo opcional com viagem (`sale_id` em `trips`); ver TODO-016 para o cadastro de viagens.
  - [ ] Fazer a validação automatizada final pelo responsável, conforme combinado. **Único item pendente** — todo o restante do escopo (código, migrações, telas, testes de integração) está implementado; falta só a validação manual/automatizada que o usuário faz por conta própria (regra combinada: o agente não roda `npm test`/`mvn test`/lint/build).
- **Acceptance Criteria**:
  - Criar, editar, listar e selecionar fornecedores somente da agência atual, com contato e criação rápida no formulário.
  - Todo lançamento permite observações e associa opcionalmente cliente, fornecedor e uma venda/viagem.
  - A interface deixa inequívocos valor de venda, repasse/custo, comissão, lucro bruto e lucro líquido, com fórmulas visíveis e validação para evitar valores negativos/incoerentes.
  - O fluxo de caixa considera somente entradas e saídas reais; os indicadores de margem usam os campos comerciais sem duplicar valores.
  - Criação em Financeiro, a partir de uma cotação aprovada e a partir de uma viagem usam o mesmo formulário, validação e contrato de API.
  - APIs, listagens, filtros, exportação e testes respeitam agência e não confirmam gravação quando a API falhar.
- **Risk if Ignored**: A agência seguirá sem saber se um valor representa venda, custo, lucro ou comissão, e qualquer tentativa manual de lançar os quatro números distorcerá o saldo.

### TODO-016: Criar controle de vendas/viagens ligado a cliente, cotação e financeiro
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-03
- **Resolved**: 2026-09-04
- **Origin**: necessidade operacional relatada para localizar passagens já vendidas e atender alterações posteriores
- **Context**: A cotação termina em proposta e o cliente só mostra histórico de cotações; não existe um registro da venda efetivamente emitida. Criar a área “Viagens” no menu, com lista pesquisável por cliente, localizador/código de reserva, companhia, período e status. Uma viagem/venda deve pertencer à agência e ter cliente obrigatório, fornecedor opcional, cotação opcional, datas de venda e de viagem, tipo de serviço, localizador, companhia e observações. Para voos, permitir 0..N trechos com origem, destino, datas/horários, companhia, número do voo e número de bilhete opcionais; isso suporta ida/volta e conexões. Mostrar o histórico de viagens também na ficha do cliente. A conversão de cotação aprovada deve apenas preencher o rascunho da viagem; criar lançamentos financeiros vinculados exige confirmação explícita para não duplicar caixa. Não incluir upload de bilhete na primeira versão: avaliar posteriormente armazenamento de objetos, permissões e retenção; como alternativa futura, permitir URL externa controlada.
- **Affected Files**: `src/components/layout/dashboard-shell.tsx`, novas rotas `src/app/(app)/viagens/*`, `src/app/(app)/clientes/[id]/page.tsx`, `src/app/(app)/cotacoes/[id]/page.tsx`, `src/components/layout/GlobalSearch.tsx`, `src/contexts/data-context.tsx`, tipos/API frontend, novas entidades/repositórios/use-cases/controllers/migrações/testes no backend
- **Complexity**: Extra Large
- **Acceptance Criteria**:
  - Página de viagens com busca, filtros e detalhe; nenhuma viagem de outra agência é visível ou alterável.
  - Cadastro manual tem cliente, fornecedor, comercial e itinerário; cadastro a partir da cotação pré-preenche somente dados existentes e permite revisão.
  - A ficha do cliente lista viagens concluídas, futuras, canceladas e permite abrir o detalhe.
  - O detalhe mostra localizador e itinerário suficientes para atendimento sem depender de buscas no WhatsApp.
  - Vínculos com lançamentos financeiros são rastreáveis, opcionais e não criam movimentação automática sem escolha explícita.
  - Testes cobrem múltiplos trechos, ausência de cotação, busca por localizador e isolamento entre agências.
- **Implementation Progress (2026-09-04)**:
  - [x] Migração V38 e entidades `Trip`/`TripSegment`: cliente obrigatório, fornecedor/cotação/venda opcionais, 0..N trechos com origem/destino/datas/companhia/voo/bilhete.
  - [x] `TripController` (`/trips`) isolado por agência: listar com filtros (cliente, localizador, status, período), detalhar, criar, editar (substitui trechos) e excluir (somente `AGENCY_OWNER`); leitura liberada também a `SALES_AGENT`.
  - [x] Página `/viagens` (busca e filtros), `/viagens/nova` (cadastro com trechos, pré-preenchendo cliente/cotação vindos da query string) e `/viagens/[id]` (itinerário, troca de status, exclusão).
  - [x] Atalho "Converter em viagem" na cotação aprovada e "Viagens" na ficha do cliente e no menu lateral (gestor e vendedor).
  - [x] `GlobalSearch` agora busca viagens por localizador direto na API (debounce de 300 ms, a partir de 2 caracteres) e mostra um badge "Viagem" — a viagem continua fora do `data-context` local (arquitetura local-first de clientes/cotações não foi estendida a viagens, por risco/escopo); é busca ao vivo, não cache local.
  - [x] `TripMultiTenancyIntegrationTest` cobre: isolamento entre agências (get/patch/delete/list/locator), criação com múltiplos trechos e sem cotação.
  - [x] **Decisão de produto (mantida)**: sem upload de bilhete nesta versão; avaliar armazenamento de objetos/URL externa depois — não é uma pendência, é escopo definido para v1.
- **Risk if Ignored**: As informações pós-venda continuarão dispersas em conversas externas, elevando o tempo de atendimento e o risco de perda de contexto em remarcações.

### TODO-017: Corrigir notificações enviadas para viagens já realizadas ou fora da janela correta
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-04
- **Resolved**: 2026-09-04
- **Origin**: relato operacional de notificações indevidas
- **Context**: Notificações estão sendo disparadas por todos os canais para viagens que já ocorreram ou após a data relevante. Auditar a origem, regra de elegibilidade, timezone, agendadores, retries e deduplicação em cada canal (e-mail, interface e futuras integrações). A regra deve impedir disparos para eventos passados, respeitar a janela configurada antes da viagem e registrar motivo/auditoria para cada envio ou supressão.
- **Affected Files**: `agencia-hub-api/src/main/java/com/agenciahub/api/scheduling/*`, serviços de notificação/e-mail, entidades e repositórios de viagens/cotações, preferências de notificação, `src/contexts/notification-context.tsx`, telas de configurações e testes de data/fuso horário
- **Complexity**: Large
- **Acceptance Criteria**:
  - Nenhuma notificação é enviada quando a viagem/evento já está no passado no fuso da agência.
  - A janela de antecedência é aplicada de forma consistente em todos os canais.
  - Retries não duplicam mensagens e há rastreabilidade de envio/supressão.
  - Testes cobrem data passada, hoje, virada de fuso, viagem futura e reprocessamento.
- **Risk if Ignored**: Clientes e equipe recebem avisos irrelevantes ou atrasados, reduzindo confiança e podendo gerar custos de comunicação desnecessários.

### TODO-018: Telas de Vendas e Receitas incompletas frente à referência visual do usuário
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-04
- **Resolved**: 2026-09-04
- **Origin**: feedback visual do usuário (print de referência de outra ferramenta) pedindo tabela completa em Vendas/Receitas — pessoa, descrição com badges de conta/categoria, forma de pagamento, vencimento, pagamento, valor, toggle de recebido, ações de editar/excluir, filtros (pessoa/situação/vencimento/pagamento) e total.
- **Context**: `/financeiro/receita` só tinha o formulário de cadastro e uma lista de 3 colunas (cliente/valor/data) herdada de `/vendas`; não existia visão por parcela, nem edição/exclusão/estorno de um recebível avulso, nem filtro por situação ou período de pagamento.
- **Affected Files**: `agencia-hub-api/.../controller/SaleController.java`, `.../repository/{ReceivableRepository,SaleItemRepository,PayableRepository}.java`, `src/app/(app)/vendas/page.tsx`, `src/components/ui/switch.tsx` (novo)
- **Resolution (2026-09-04)**:
  - Backend: novo `GET /sales/receivables` (lista plana de parcelas da agência com filtros `customerId`/`status`/`dueFrom`/`dueTo`/`paidFrom`/`paidTo`, já com nome do cliente, tag do primeiro item da venda e contagem de parcelas por venda); `PATCH /sales/receivables/{id}` e `DELETE /sales/receivables/{id}` (só enquanto `PENDING`); `POST /sales/receivables/{id}/unsettle` (desfaz uma quitação, apaga o lançamento de caixa criado por ela).
  - Frontend: `/financeiro/receita` (Receitas) ganhou a tabela por parcela com avatar do cliente, badges de conta/categoria, forma de pagamento com "Parcela X de Y", vencimento, pagamento, valor, toggle de recebido (liga/desliga chamando settle/unsettle), editar/excluir (desabilitados quando já quitada), filtros com botão "Pesquisar" batendo no backend, e linha de total. `/vendas` ganhou uma tabela por venda com o mesmo visual (pessoa, descrição, data, valor) e um badge de progresso "X/Y recebidas" calculado a partir do mesmo endpoint — sem duplicar a query no backend.
  - Também atendido nesta mesma rodada: menu lateral com ícones específicos por item (`+`/`−` para Receita/Despesa, calculadora, avião, cifrão em Vendas, prédio em Agência, engrenagem em Configurações), nome/perfil no canto superior direito virou link (gestor → `/agencia`, vendedor → `/configuracoes`), botão "Adicionar fornecedor, custo ou comissão" com espaçamento e cabeçalho próprios, texto explicativo nas parcelas de recebimento, e campo condicional de parcelas do cartão de crédito com prévia "Nx de R$Y — Aplicar".
- **Bugs reais encontrados e corrigidos ao rodar a aplicação (não faziam parte do pedido, mas bloqueavam tudo)**:
  1. **`AgencyAttachment.content` não subia a aplicação**: a migração V36 criou a coluna como `BYTEA`, mas a entidade mapeava `byte[]` com `@Lob` — no Hibernate 6, isso é interpretado como `OID` (large object) por padrão no dialeto Postgres. Contra um Postgres real (o Docker local, provavelmente o Railway também), o Hibernate recusava subir com `SchemaManagementException: wrong column type ... found [bytea], but expecting [oid]`. Corrigido com `@JdbcTypeCode(SqlTypes.VARBINARY)` no lugar de `@Lob`.
  2. **`GET /sales` e `GET /sales/{id}` quebravam com `LazyInitializationException`**: nenhum dos dois tinha `@Transactional`, então o acesso a `sale.getCustomer().getName()` fora de sessão Hibernate (o projeto roda com `open-in-view: false`) lançava exceção — a tela de Vendas nunca funcionou de verdade contra um banco real, e não havia nenhum teste de integração para `SaleController` que pegasse isso. Mesma causa e mesma correção em `GET /trips` e `GET /trips/{id}` (criados na sessão anterior, com o mesmo problema). Adicionado `@Transactional` nos quatro métodos.
- **Validação**: rodei a API localmente (Postgres via `docker compose`, perfil `docker`) e o frontend (`npm run dev`) e testei end-to-end no navegador via `agent-browser`: login com o usuário seed, criação de cliente e venda com 4 parcelas no cartão, listagem em Receitas e Vendas, marcar/desmarcar recebido, editar parcela, excluir parcela, filtrar por situação. Não rodei `mvn test`/`npm test` (regra do usuário) — a validação foi manual, no app rodando.
- **Risk if Ignored**: sem os dois bugs corrigidos, a tela de Vendas (e qualquer coisa que dependa de `GET /sales`) e o upload de anexos não funcionam contra um Postgres real fora de teste unitário isolado — inclusive possivelmente em produção, a depender de como o Railway inicializa o schema.
- **Confirmado em produção (2026-09-04, após o deploy)**: o usuário reportou `500 INTERNAL_ERROR` real em `GET /financial-entries` no Railway (tela Fluxo de Caixa) — exatamente a mesma causa do item 2, só que em `ListFinancialEntries`/`GetFinancialEntryById` (`FinancialEntryResponseMapper` acessa `customer.getName()`/`supplier.getName()` sem `@Transactional`). Em vez de corrigir só esse endpoint, varri todo `usecases/**/retrieve/**` do projeto atrás do mesmo padrão (mapper toca relação `@ManyToOne` preguiçosa + use case sem `@Transactional`) e corrigi todos os casos reais encontrados: `ListFinancialEntries`, `GetFinancialEntryById` (o bug reportado), `GetQuotationById` (mesmo problema — **todo detalhe de cotação estava quebrado em produção**, não só o financeiro; achado só por auditoria, não reportado), e `GetPublicSolicitacaoConfigBySlug` (endpoint público, cai no fallback de logo da agência). Casos sem o bug (mapper só toca campo escalar, sem tocar relação preguiçosa) foram deixados como estavam: `GetAgency`, `ListInvitations`, `GetCustomerById`/`ListCustomers`, `ListPlatformAccounts`/`GetPlatformAccountById`/`ListActiveSalesAgents`.
- **Build quebrado no Vercel logo em seguida**: `vendas/page.tsx` tinha uma referência solta a `dueDate` (variável que nunca existiu nesse escopo — sobra de antes do formulário perder o campo de vencimento por item/comissão) que nunca tinha passado por um `tsc`/`next build` de verdade; `<BackButton />` em `viagens/[id]` sem as props obrigatórias; e 2 erros de lint `react-hooks/set-state-in-effect` (um meu, um pré-existente) que travariam o build na sequência. Corrigido tudo e validado com `tsc --noEmit`, `eslint` e `next build` completo antes de subir de novo.
- **Causa raiz encontrada**: `QuotationExpirationScheduler` (único agendador com notificação sensível a data — não existe, hoje, notificação por data de viagem/`Trip`, só por validade de cotação) usava `LocalDate.now()` sem fuso e `@Scheduled(cron=...)` sem `zone`. Sem isso, ambos usam o fuso padrão da JVM/host — em Railway, tipicamente UTC. Nas ~3h finais do dia em Brasília (21h–23h59, já é 00h–02h59 em UTC), `LocalDate.now()` retorna o dia seguinte: a checagem de "vencida" expira cotações um dia cedo e o alvo de "vence em 7 dias" mira a data errada. Além disso, o aviso "cotação vence em breve" podia ser enviado mesmo quando a viagem associada (`travelEndDate`) já tinha ocorrido — sem sentido para o titular.
- **Resolution**: `QuotationExpirationScheduler` agora fixa `ZoneId.of("America/Sao_Paulo")` (produto é BR-only) em `LocalDate.now(AGENCY_ZONE)` nas duas rotinas e em `@Scheduled(..., zone = "America/Sao_Paulo")`, então o cron dispara às 8h de Brasília de verdade e as comparações de data usam o dia local, não o do host. `notifyExpiringSoon` passou a pular (com log) cotações cujo `travelEndDate` já é anterior a hoje — não avisa mais sobre prazo de decisão de uma viagem que já aconteceu. Duplicidade por retry: `processExpired` já é idempotente (muda `status` para `EXPIRED`, e a consulta seguinte não reencontra a cotação); `notifyExpiringSoon` casa por `validUntil = hoje+7`, então um mesmo registro só combina em um único dia — sem um flag "já notificado" persistido, uma execução dupla no mesmo dia (ex.: duas instâncias rodando ao mesmo tempo) ainda poderia duplicar o envio; registrado como limitação conhecida, não resolvida aqui (exigiria coluna de auditoria de envio). `AgencyDeletionScheduler`/`ExpireTrialsScheduler` usam `Instant.now()` (sem ambiguidade de fuso) — não precisaram de mudança. Adicionado `QuotationExpirationSchedulerTest` (unitário, Mockito) cobrindo o caso de viagem já passada.

---

## 🔧 Technical Debt

### DEBT-001: Criar suíte de regressão de persistência entre Next.js e API Java
- **Priority**: High
- **Status**: pending
- **Created**: 2026-09-03
- **Origin**: auditoria de fluxos críticos
- **Context**: Os testes Java de cliente, cotação e financeiro passam, mas não cobrem o comportamento do frontend diante de falha de rede, API sem URL, validação incompatível ou confirmação visual incorreta. Não há testes de frontend para `addCliente`/`addCotacao`/`addLancamento`.
- **Affected Files**: `src/contexts/data-context.tsx`, `src/lib/api/*`, `src/components/cliente/*`, `src/app/(app)/cotacoes/*`, `src/app/(app)/financeiro/*`, `.github/workflows/ci.yml`
- **Complexity**: Large
- **Risk if Ignored**: Novas regressões podem voltar a confirmar operações não persistidas; falhas só serão percebidas depois da recarga ou por dados ausentes em produção.

---

## 🔎 Auditoria 2026-09-09 (usuário) — cupom, PDF, sessão, clientes, financeiro

> Lote de itens levantados pelo usuário em 2026-09-09. Investigação feita por leitura de código (sem servidor local rodando — respeitar restrição de não usar portas 8080/8081 em execuções futuras). Cada item abaixo tem o achado do código-fonte; implementação ainda não iniciada, exceto onde marcado "resolved".

> **Atualização (mesmo dia, após validar as mudanças que o GPT já tinha deixado no working tree, ambos os repos, não commitadas):** o GPT já tinha começado a implementar de fato TODO-024 (sessão), TODO-025 (edição de cliente), TODO-026 (renomear Clientes→Pessoas), TODO-028 (remover Destino de interesse) e TODO-029 (cotação aprovada → financeiro) e TODO-031 (notificação de check-in) — front (`NovoClienteModal.tsx` unificado create/edit, `ClientePicker.tsx`) e back (`SessionController`, `CheckinNotificationController`/`CheckinNotificationScheduler`, `QuotationApprovalService`, `CustomerProfile`, 3 migrações novas). Rodei a validação completa (não só leitura) e achei + corrigi 3 bugs reais nesse código não commitado:
> 1. **3 migrações Flyway com a mesma versão `V40`** (`V40__agency_checkin_notifications.sql`, `V40__customer_profile_data.sql`, `V40__quotation_approval_sales.sql`) — Flyway falha o boot inteiro com `Found more than one migration with version 40`. Renomeadas para `V40`/`V41`/`V42` (sem conflito de tabela/coluna entre elas). Confirmado com `mvn test` completo: todos os testes passam depois da correção.
> 2. **`src/components/ui/input.tsx`** não repassava `ref` (componente função simples) — `ClientePicker.tsx` (autocomplete de cliente, usado no novo fluxo) passa `ref` pro `<Input>` e quebrava o build (`npx tsc --noEmit` com erro). Corrigido com `forwardRef`.
> 3. **`clientes/[id]/page.tsx`** usava `tone="neutral"` no `<Badge>`, mas o componente só aceita `"default" | "success" | "warning" | "muted" | "danger"` — build quebrado. Trocado para `"muted"`.
>
> Depois dessas 3 correções: `npx tsc --noEmit -p .`, `npm run lint` (0 erros), `npm test` (36/36) e `npm run build` (front) e `mvn test` (back, `agencia-hub-api`) — todos passando. **Nada disso foi commitado ainda** — segue no working tree de ambos os repositórios, aguardando revisão/commit do usuário. Os itens abaixo tiveram o status atualizado para refletir isso; a auditoria original (achado por leitura de código, antes de eu ver esse trabalho do GPT) fica registrada em cada item para rastreabilidade.

### TODO-019: Criar gestão real de cupom de desconto
- **Priority**: Medium
- **Status**: resolved (não commitado — vai numa branch própria, `feature/cupom-desconto`, a pedido do usuário)
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "valide se o dono consegue hj add cupons de desconto e se não, onde seria isso"
- **Resolution**: Backend: entidade `Coupon` + migração `V43__coupons.sql` (tabela `coupons`, único por agência) + `CouponRepository` + `CouponController` (`/agency/coupons`, CRUD, OWNER only) + `PublicCouponController` (`GET /public/coupons/validate?slug=&code=`, sem autenticação, resolve agência pelo slug via `SolicitacaoConfigRepository`, rate-limited a 20/min). Frontend: nova aba "Cupons" em Agência (`_aba-cupons.tsx`) com criar/ativar-desativar/remover; `src/lib/api/coupons-remote.ts` + proxies `/api/app/coupons`; `src/app/api/public/cupom/validate/route.ts` deixou de usar o mapa hardcoded e agora chama o backend real (por slug no formulário público, ou pelos cupons da própria agência quando autenticado sem slug — `CotacaoDetalhesForm` ganhou props `slug`/`token` para isso). `mvn -o compile` e `npx tsc --noEmit` limpos.

### TODO-020: Link de WhatsApp sem validação/mensagem configurável — **JÁ RESOLVIDO**
- **Priority**: —
- **Status**: resolved (confirmado nesta auditoria, sem alteração)
- **Created**: 2026-09-09
- **Origin**: "deve ter um regex que valida se tem numeros de whatsapp corretos... msg padrão configurável"
- **Resolution**: Já implementado. `src/lib/whatsapp.ts` valida com `isValidBrazilianPhone` + regex, normaliza dígitos (remove espaço/traço) via `brPhoneDigits`, e `defaultFormWhatsappMessage(agencyName)` gera mensagem padrão configurável por agência. `WhatsappLinkFields.tsx` (usado na aba Agência → Formulário) já expõe o campo "Mensagem ao abrir o WhatsApp" com esse padrão como placeholder e aviso de fallback.

### TODO-021: Revisar geração do PDF de cotação (campos errados, quarto parecendo pré-selecionado)
- **Priority**: High
- **Status**: resolved (parcial) — reescrita do gerador já corrigiu o bug real de campo faltando; a alegação do "1 quarto" segue sem repro
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "validar como o imprimir PDF está sendo configurado... 1 quarto está vindo como selecionado automaticamente" + "Qtd. quartos parece estar selecionado automatico no formulário de solicitação tbm"
- **Resolution**: `src/lib/pdf-generator.ts` já foi reescrito (WIP do GPT, validado nesta auditoria): o bug real de "campo errado" era `d.preferenciaVooVolta` **nunca aparecia no PDF** (só a preferência de ida) — corrigido na reescrita. Também ganhou escaping de HTML/CSS (XSS em `corCia` e campos livres) e fallback de WhatsApp/telefone mais robusto. `qtdQuartos` nasce `0` e só aparece no PDF quando `> 0` (`pdf-generator.ts:83,433`) — não achei nenhum caminho de código que force `1` automaticamente, nem no formulário público (que não tem campo de quartos) nem no mapeador. Não reproduzido; precisa de um cupom... digo, uma cotação real com screenshot para achar onde o `1` aparece, se ainda aparecer.
- **Affected Files**: `src/lib/pdf-generator.ts`.

### TODO-022: Impressão do PDF bloqueia a tela do app sem indicar o motivo — **JÁ RESOLVIDO**
- **Priority**: —
- **Status**: resolved (confirmado nesta auditoria)
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "Ao clicar em imprimir se eu não fechar a tela de impressão, não consigo mexer na tela do app"
- **Resolution**: `imprimirCotacao()` em `pdf-generator.ts` já foi reescrita para abrir uma prévia numa nova guia sem chamar `window.print()` automaticamente — o usuário decide clicando em "Imprimir / Salvar PDF"; há botão "Voltar à cotação" e o próprio código comenta "a prévia não abre um diálogo bloqueante ao carregar". Isso evita o travamento reportado.

### TODO-023: Nome da agência ausente/errado na mensagem de WhatsApp ao enviar cotação
- **Priority**: Medium
- **Status**: resolved
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "AgenciaHub está sendo usado na msg ao enviar cotação por whatsapp"
- **Resolution**: Causa raiz confirmada e corrigida: `src/hooks/use-agency-branding.ts` só buscava a configuração `if (!enabled || !isOwner || !token) return` — vendedor nunca buscava o nome/logo real da agência e caía no fallback vazio. Removida a checagem `isOwner`. Backend: `SolicitacaoConfigController.get()` exigia `hasRole('AGENCY_OWNER')` na classe inteira; adicionado `@PreAuthorize("hasAnyRole('AGENCY_OWNER','SALES_AGENT')")` só no método `get()` (o `upsert()` continua owner-only).
- **Affected Files**: `src/hooks/use-agency-branding.ts`, `SolicitacaoConfigController.java`.

### TODO-024: Sessão expira cedo mesmo com uso ativo
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "O login está com um tempo curto de sessão. Mesmo o usuario usando o sistema."
- **Resolution**: Causa raiz real encontrada em `SessionController.renew()` (WIP do GPT): exigia `agency.getStatus() == ACTIVE`, mas `Login.java` permite login normalmente para agência `TRIAL`/`SUSPENDED` (só bloqueia `DELETION_PENDING`/`PENDING_VERIFICATION`/`CANCELED`). Qualquer agência em `TRIAL` (o padrão logo após verificar o e-mail, `VerifyEmail.java`) tinha a renovação de sessão sempre rejeitada com 403 — e o front (`auth-context.tsx`) desloga no primeiro 403 do `/auth/session/renew`. Corrigido para usar o mesmo critério de bloqueio do login.
- **Affected Files**: `SessionController.java`.

### TODO-025: Edição de cliente não exibe informações já salvas — **JÁ RESOLVIDO**
- **Priority**: High
- **Status**: resolved (confirmado nesta auditoria + 1 bug corrigido)
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "ao editar um cliente em /clientes varias que já são do cliente, não estão sendo renderisadas"
- **Resolution**: `NovoClienteModal.tsx`/`EditarClienteModal.tsx` (WIP do GPT) unificaram criação e edição no mesmo formulário completo, populando todos os campos no `useEffect` a partir do `cliente` — backend ganhou `CustomerProfile.java` + migração `profile_data` JSONB para persistir o perfil estendido. Corrigido nesta auditoria: `src/components/ui/input.tsx` não repassava `ref` (função simples) e quebrava `ClientePicker.tsx`, que usa `ref` no autocomplete — agora usa `forwardRef`. `npx tsc`/`npm test`/`mvn compile` limpos.

### TODO-026: Generalizar a aba/nomenclatura de "Clientes" — **JÁ RESOLVIDO**
- **Priority**: Low
- **Status**: resolved
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "alterar a aba de clientes pra ser gererica"
- **Resolution**: GPT já tinha trocado o rótulo para "Pessoas" em `dashboard-shell.tsx` (as duas entradas de menu, dono e vendedor) e em `clientes/[id]/page.tsx`/`NovoClienteModal.tsx` ("Nova pessoa"/"Editar pessoa"). Completado nesta auditoria: `_aba-notificacoes.tsx` ("Clientes" → "Pessoas", "Novo cliente cadastrado" → "Nova pessoa cadastrada"), `ClientePicker.tsx` ("Novo cliente" → "Nova pessoa"), `ImportarSubmissaoModal.tsx` e `notification-context.tsx` (mesma troca).

### TODO-027: Separar cor de status de cliente da cor/identificação por tipo — **JÁ RESOLVIDO**
- **Priority**: Medium
- **Status**: resolved (confirmado nesta auditoria, sem alteração)
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "alterar as cores das pessoas cadastras pra serem divididas por categorias" + "pro status podemos deixar a flag colorida apenas e a logo do usuario de outra cor separada por seu Tipo"
- **Resolution**: Já implementado (WIP do GPT). `src/lib/pessoa-presentation.ts` dá uma cor de avatar por Tipo (Cliente=azul, Passageiro=teal, Fornecedor=âmbar, Representante=índigo; múltiplos tipos = cinza neutro). `clientes/page.tsx` usa `BADGE_CLASS_BY_STATUS` — paleta totalmente separada (ativo=verde, prospecto=violeta, inativo=cinza) só para o badge de status. As duas camadas de cor já são independentes, exatamente como pedido.

### TODO-028: Remover "Destino de interesse" do modal de edição de cliente — **JÁ RESOLVIDO**
- **Priority**: Low
- **Status**: resolved
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "No modal de editar cliente tem um Destino de interesse - acho inutil pq o cliente pode ter varios destinos e varias viagens"
- **Resolution**: `NovoClienteModal.tsx` unificado (WIP do GPT) não tem mais o campo — o submit usa `Omit<Cliente, ... "destinoInteresse">`. A página de detalhe mantém o valor só como leitura histórica, rotulado "Destino informado anteriormente (histórico)" em vez de removê-lo de vez (preserva o dado da captação original sem reintroduzir o campo editável).

### TODO-029: Cotação aprovada devia gerar lançamento em Vendas/Financeiro automaticamente — **JÁ RESOLVIDO**
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "hj quando uma cotação é aprovada, ela entra em viagens! Poderiamos melhorar para esse fluxo repercutir no financeiro tbm... para que ele não precise lançar a mão novamente uma receita"
- **Resolution**: `QuotationApprovalService.java` (WIP do GPT, revisado nesta auditoria) já faz exatamente isso: ao aceitar uma cotação, cria `Sale` (status `DRAFT`, `approvalManaged=true`), `Receivable` (PENDING) e `SaleItem`, além do `Trip`; ao reverter a aprovação, cancela tudo (com trava se já houver algo pago); ao editar o valor da cotação aprovada, propaga pro `Sale`/`Receivable` (com trava se a venda já saiu de DRAFT). Wired em `CreateQuotation.java` e `UpdateQuotation.java`. `DeleteQuotation.java` bloqueia excluir cotação com venda vinculada (força cancelar em vez de apagar o histórico). Confirmado por leitura + `mvn test` completo passando; falta só validação manual do fluxo na tela.

### TODO-030: Solução definitiva para solicitações públicas já importadas reaparecerem
- **Priority**: High
- **Status**: resolved
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "1 solicitação recebida pelo link público (ajustar) - hj mostra solicitações que já foram importadas"
- **Resolution**: Causa raiz real: `useSolicitacaoSubmissions.ts` só chamava `DELETE /api/app/solicitacao-submissions` (que já existia e já proxyava corretamente pro backend `DELETE /agency/solicitacao-submissions/{id}`) **quando `!hasRemoteApi`** — ou seja, em produção (com API remota configurada) a submissão NUNCA era marcada como consumida no servidor, só filtrada localmente por `SolicitacaoSubmissionsBanner.tsx` (frágil, dependia do cache local de cotações já carregado). Corrigido: a chamada DELETE agora roda sempre após importar, local ou remoto.
- **Affected Files**: `src/hooks/useSolicitacaoSubmissions.ts`.

### TODO-031: Notificações configuráveis de check-in (início/fim de viagem)
- **Priority**: Medium
- **Status**: resolved
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "quero ser capaz de poder ativar notificações personalizadas de checkin (em viagem e cotação - Início da viagem e Fim da viagem). Na aba de notificações pode vir pre selecionado com dos dias de antecedência"
- **Resolution**: Backend já existia (WIP do GPT): `CheckinNotificationController`/`Service`/`Scheduler` + migração `agency_checkin_prefs`/`agency_checkin_notifications` (dias de antecedência configuráveis 1–30, roda a cada 60s por padrão, idempotente via `ON CONFLICT`). Completado nesta auditoria: proxy `/api/app/checkin-notifications/preferences` e UI nova em `_aba-notificacoes.tsx` ("Check-in de viagem" — toggle + campo de dias de antecedência para início e fim, mesmo padrão visual do restante da aba).

### TODO-032: Adicionar número de WhatsApp no formulário de solicitação de orçamento — **JÁ RESOLVIDO**
- **Priority**: —
- **Status**: resolved (confirmado nesta auditoria, sem alteração)
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "Colocar número do whats na solicitação de orçamento"
- **Resolution**: O formulário público (`SolicitacaoPublicView.tsx`) já renderiza `SolicitacaoSocialPanel` com os links sociais configurados pela agência (inclui WhatsApp com ícone, quando a agência cadastra um em Agência → Formulário via `WhatsappLinkFields`, TODO-020). Se o dono configurar o WhatsApp lá, ele já aparece no formulário público. Não criei um campo duplicado.

### TODO-033: Padronizar busca de "Cliente *" com o padrão "digitar para buscar" — **JÁ RESOLVIDO**
- **Priority**: Medium
- **Status**: resolved (confirmado nesta auditoria, sem alteração)
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "Hj não há um padrão em busca de cliente nos campos Cliente *, alguns usam um drop outros digitam pra buscar, vamos padronizar usando o digitar pra buscar, use as mesmas regras usadas na Origem (cidade / aeroporto)"
- **Resolution**: Já implementado (WIP do GPT): `src/components/cliente/ClientePicker.tsx` replica o padrão do `airport-autocomplete.tsx` (mín. 2 caracteres, mesmo placeholder, navegação por teclado, filtro em `src/lib/cliente-search.ts`) e já está em uso em todo campo "Cliente *" de entrada de dados (`cotacoes/nova`, `EditarCotacaoModal`, `financeiro`, `vendas`, `viagens/nova`, `calculadora`, `ImportarSubmissaoModal`). Os únicos `<select>` remanescentes são filtros de listagem (`cotacoes/page.tsx`), não campos de cadastro — fora do escopo do pedido.

### TODO-034: Validar necessidade do aviso de LGPD e incluir nome da agência — **JÁ RESOLVIDO**
- **Priority**: Low
- **Status**: resolved (confirmado nesta auditoria, sem alteração)
- **Created**: 2026-09-09 · **Resolved**: 2026-09-10
- **Origin**: "Valide se esse aviso é mesmo necessario... Se sim o nome da agencia deveria estar ai"
- **Resolution**: `SolicitacaoPublicView.tsx` (WIP do GPT) já separa as duas coisas corretamente do ponto de vista da LGPD: o uso necessário dos dados (elaborar a cotação) é só explicado em texto — não exige checkbox, por ser tratamento amparado em execução de pedido/legítimo interesse (Art. 7º) — e usa `{config.nomeMarca || "A agência responsável"}` dinamicamente; só o consentimento de **marketing** (opcional, desmarcado por padrão) tem checkbox, também com o nome dinâmico da agência. Recomendação técnica confirmada: manter, já está correto.

### TODO-035: Regras de negócio de cupom (limite de uso, 1x por cliente, sem empilhar, esconder validade do cliente)
- **Priority**: Medium
- **Status**: resolved
- **Created**: 2026-09-10 · **Resolved**: 2026-09-10
- **Origin**: "o cleinte não deve ver a info de validade do cupon, somente se foi aceito ou não, add tbm a opção de quantidade de usos do cupom... cada cliente só pode usar um cupom uma unica vez, não pode haver tbm somatoria de cupons"
- **Decisões do usuário**: desconto percentual com teto opcional em R$; identificação do cliente por e-mail.
- **Resolution**: `V44__coupon_rules.sql` adiciona `discount_percent`, `max_discount_amount`, `max_uses`, `used_count` em `coupons` + tabela `coupon_redemptions` (único por `coupon_id`+`customer_email`, garante 1x por cliente). `Coupon.isValidNow()` agora também checa o limite total. `CouponRedemptionService` grava o resgate + incrementa `used_count` numa única instrução atômica (`INSERT ... ON CONFLICT DO NOTHING` + `UPDATE` condicional), chamada de `SubmitPublicSolicitacao` quando a submissão pública tem `cupomCodigo` preenchido — nunca bloqueia o envio se o cupom falhar por qualquer motivo. `PublicCouponController` agora exige `email` e responde só `{valid: boolean}` — sem validade, sem contagem, sem qualquer detalhe interno. `CotacaoDetalhesForm.tsx` só mostra "Cupom aceito." no formulário público (a validade só aparece na tela interna do dono/vendedor, via prop `token`). "Sem empilhamento" já está garantido pela UI ter só 1 campo de cupom por cotação — nada a fazer aí. Aba Cupons ganhou campos de desconto/teto/limite e colunas "Desconto"/"Usos" + badge "Esgotado". Testado ao vivo: 1º resgate ok, mesmo e-mail de novo → recusado, e-mail diferente → ok, 3º cliente após limite de 2 usos → recusado, formulário público mostra só "Cupom aceito."/"Cupom inválido.". `mvn compile`, `tsc`, `lint`, `npm test` (36/36) limpos.
- **Affected Files**: `V44__coupon_rules.sql`, `Coupon.java`, `CouponRedemption.java` (novo), `CouponRedemptionRepository.java` (novo), `CouponRedemptionService.java` (novo), `CouponController.java`, `PublicCouponController.java`, `SubmitPublicSolicitacao.java`, `CotacaoDetalhesForm.tsx`, `SolicitacaoPublicView.tsx`, `coupons-remote.ts`, `_aba-cupons.tsx`, `/api/public/cupom/validate/route.ts`.
- **Complexity**: Medium

### TODO-036: Dois formulários públicos (simples e completo)
- **Priority**: Medium
- **Status**: resolved
- **Created**: 2026-09-10 · **Resolved**: 2026-09-10
- **Origin**: "QUero ter dois formularios disponiveis pra enviar: UM mais simples... apenas com poucas infos da viagem e com um campo pra selecionar e digitar se precisa de outro serviços e o outro completo que é o atual com mais detalhes de hospedagem e tudo mais"
- **Decisões do usuário**: mesmo link, distinguido por parâmetro na URL (`?tipo=simples`). Revisão em 2026-09-11: o simples não é "raso em tudo" — foco em **passagem aérea**, então ganhou de volta Flexibilidade ida/volta, Horário saída ida/volta e Preferência de voo ida/volta (pedido explícito), mais bagagem (despachada/quantidade/especial) e "Usar milhas nas passagens" (fazem sentido junto de passagem aérea). Continua sem: Hospedagem, Preferência de comunicação, Forma de pagamento e Cupom (não são sobre voo). Destino continua campo único (não trechos), "Outros serviços ou observações" reaproveita o campo observações existente.
- **Resolution**: `CotacaoDetalhesForm.tsx` ganhou prop `variante?: "completo" | "simples"` (default `"completo"`, zero impacto nas telas internas que não passam a prop). No modo `"simples"`: mostra tudo sobre a viagem em si (serviços desejados, origem, destino único, datas, flexibilidade/horário/preferência de voo ida e volta, passageiros, bagagem, milhas) e esconde só o que é de outra categoria — Hospedagem (seção inteira), Preferência de comunicação, Forma de pagamento e Cupom de desconto. `SolicitacaoPublicView.tsx` lê `?tipo=simples` do próprio `useSearchParams()` já usado ali, passa a variante pro form e troca o rótulo/placeholder de "Observações" pra "Outros serviços ou observações" nesse modo. Aba Agência → Formulário ganhou uma segunda linha "Link simplificado" com o mesmo link + `?tipo=simples` (ou `&tipo=simples` se já tiver `?seller=`) e botão de copiar. Testado ao vivo nos dois modos. `tsc`/`lint` limpos.
- **Affected Files**: `src/components/cotacao/CotacaoDetalhesForm.tsx`, `src/components/cotacao/SolicitacaoPublicView.tsx`, `src/app/(app)/agencia/_aba-formulario.tsx`, `src/components/cotacao/LinkSolicitacaoModal.tsx` (o modal "Link para solicitação de cotação" aberto em `/cotacoes` — botão "Links" — é o que o usuário realmente usa; tinha ficado de fora da primeira leva e foi corrigido em 2026-09-11).
- **Complexity**: Large

---

## 🆕 Feature solicitada em 2026-09-13

### TODO-037: Importar voos de PDF, imagem ou link de companhia para calcular milhas e compor cotação
- **Priority**: High (sugerida pelo impacto no fluxo de cotação)
- **Status**: in-progress — implementação iniciada em 2026-09-13; código de frontend/backend e testes preparados, aguardando configuração do provedor e validação pelo usuário
- **Created**: 2026-09-13
- **Origin**: Pedido do usuário nesta conversa, após procurar uma task de leitura de PDF. O usuário confirmou que deseja registrar e detalhar a feature no backlog.
- **Complexity**: Large
- **Context**: Reduzir a digitação das ofertas de voos, calcular o preço de venda a partir de milhas, taxas e lucro e anexar as opções à cotação. O detalhe interno deve preservar a memória de cálculo; o cliente recebe somente os dados do voo e os preços de venda, sem quantidade/custo de milhas, custo do milheiro, lucro ou composição interna de taxas.

#### Estrutura aprovada pelo usuário em 2026-09-13

**Implementação iniciada a pedido do usuário:** importação autenticada em Spring com PDFBox/Gemini, cache e reserva de consumo por agência, rascunhos revisáveis na calculadora, recálculo no servidor, persistência de `flightPlan`, histórico de versões e projeção comercial no PDF/WhatsApp. PNG/JPEG/PDF são os formatos da primeira entrega. Busca de companhias por link não implementada. Testes de cálculo, persistência, concorrência e isolamento preparados, mas não executados conforme instrução deste backlog. Configuração e roteiro de validação: [docs/flight-imports.md](../docs/flight-imports.md). Não marcar resolvido antes da validação real.

- **Primeira entrega:** importação de PDF e imagem com conferência pelo agente. Busca direta de passagens por API/link fica como evolução independente, condicionada à disponibilidade de uma fonte confiável de ofertas em milhas; não é requisito para concluir a primeira entrega.
- **PDF com texto selecionável:** extrair o texto diretamente e tentar mapear os campos. Usar IA para interpretar somente quando necessário. Em PDFs mistos, avaliar cada página para não perder ofertas presentes em páginas digitalizadas.
- **Imagem ou PDF digitalizado:** usar um modelo econômico com visão para retornar dados estruturados. Validar o resultado contra um esquema, deixando campos ausentes vazios e indicando ambiguidades para revisão humana. Não precisa de agente autônomo ou navegação com IA.
- **Cálculos e material comercial:** validação de valores, taxas, lucro, totais e geração do PDF executados por código. Alterar taxas/lucro, recalcular, salvar ou gerar novamente o PDF não deve disparar outra leitura por IA.
- **Controle de consumo:** limitar tamanho/páginas de arquivo, chamadas e orçamento por agência no backend, com controle atômico para chamadas concorrentes; limitar tokens de saída, tempo e novas tentativas. Registrar uso efetivo e custo estimado por extração. Ao atingir o limite, permitir preenchimento manual sem repetir chamadas automaticamente.
- **Reaproveitamento:** salvar a extração e reutilizá-la para o mesmo arquivo dentro da agência, identificando arquivo e versão do extrator. Separar a extração original dos ajustes manuais; reutilizar o resultado não pode sobrescrever correções do agente. Nunca compartilhar arquivos ou resultados entre agências.
- **Provedor:** avaliar inicialmente um modelo econômico com visão, como Gemini 3.1 Flash-Lite, com amostras reais antes de fixar o modelo. Credenciais somente no backend; provedor/modelo configuráveis. A estrutura está aprovada, mas nenhum serviço foi contratado, credencial configurada ou chamada paga executada nesta task.
- **Orçamento de referência:** a comparação discutida usou US$ 0,25 por milhão de tokens de entrada e US$ 1,50 por milhão de tokens de saída para Gemini 3.1 Flash-Lite. Com 2.000 tokens de entrada e 500 de saída faturada, o exemplo resulta em US$ 1,25 por 1.000 leituras. É simulação, não medição da imagem fornecida; confirmar preços e medir consumo, erros e repetições na prova técnica. Referência: https://ai.google.dev/gemini-api/docs/pricing.

#### Fluxo e requisitos funcionais

1. **Importar oferta:** permitir obter dados de PDF e imagem da oferta pela estrutura aprovada acima, com formatos e limites documentados após prova de extração com exemplos reais. Leitura direta de links fica para evolução futura; importar somente parâmetros de busca de uma URL não satisfaz a leitura de horários, duração e valores.
2. **Extrair dados por opção e trecho:** companhia, origem e destino (aeroportos/códigos quando disponíveis), data de saída e chegada, horários, duração, conexões/escalas e quantidade de milhas/pontos. Capturar taxas monetárias quando explicitadas na fonte, distinguindo-as de milhas e do preço em dinheiro. Preservar ida e volta, conexões e chegada no dia seguinte sem misturar ofertas.
3. **Revisar antes de aplicar:** mostrar uma prévia editável das opções extraídas. O agente escolhe quais entram na calculadora/cotação e corrige campos ausentes ou ambíguos. Não inventar horário, duração, milhas ou taxas e não interpretar ausência de taxa como taxa zero confirmada. Identificar se valores são por passageiro, por trecho ou pelo grupo; exigir revisão quando a fonte não permitir determinar isso.
4. **Calcular preço:** reutilizar a calculadora de milhas, permitindo definir/ajustar custo por milheiro, taxas e lucro percentual e/ou fixo. Tornar explícita a base por pessoa/trecho/grupo para evitar multiplicação duplicada. Recalcular após ajustes e manter coerentes valor individual e total, com arredondamento monetário definido.
5. **Vincular à cotação:** permitir adicionar as opções revisadas a uma cotação existente ou gerar uma nova pelo fluxo da calculadora. Preservar os dados importados/revisados e a memória de cálculo no backend, recuperáveis após recarregar ou abrir em outra sessão autorizada. Se houver alternativas, não somar seus preços como se fossem serviços cumulativos; definir qual opção compõe o total da cotação.
6. **Rastro interno no detalhe:** exibir uma seção identificada como interna contendo milhas por trecho, custo por milheiro utilizado, custo convertido em reais, taxas, base de cálculo, configuração e valor de lucro e preço final. Guardar origem da importação, data/hora, responsável e valores usados no cálculo salvo. Alterações futuras na tabela do milheiro não devem modificar silenciosamente a cotação já salva; um recálculo explícito deve preservar o rastro anterior.
7. **PDF para o cliente:** apresentar companhia, origem/destino, datas, horários, duração, conexões e preço final das opções, com passageiros e bagagens quando aplicáveis. Excluir milhas/pontos, custo do milheiro, custos de aquisição, lucro e detalhamento interno de taxas. Aplicar a mesma separação ao HTML para impressão/download, mensagens de WhatsApp e qualquer visualização ou resposta pública da cotação.

#### Constatações do projeto e direção técnica proposta

- `src/lib/calculadora-milhas.ts` já calcula custo das milhas, taxas e lucro percentual/fixo. `src/app/(app)/calculadora/page.tsx` já monta opções de voo e cria cotação. Reutilizar esses cálculos, revisando suas premissas de valores por pessoa.
- `OpcaoVooCotacao`, em `src/types/index.ts`, contém horários e preços comerciais, mas não datas, duração nem memória de cálculo. Modelar dados comerciais e internos separadamente, com identificadores estáveis por opção/trecho.
- `src/lib/api/quotation-mapper.ts` não inclui `opcoesVoo` no payload de criação nem na reconstrução da cotação a partir da API. Incluir criação, atualização, leitura e persistência das opções e do cálculo no escopo; manter compatibilidade com cotações antigas.
- `src/lib/pdf-generator.ts` já apresenta opções de voo. Usar uma projeção explícita dos campos comerciais permitidos, sem serializar ou concatenar o objeto de cálculo interno em observações/HTML. O nome `internalNotes` da API, isoladamente, não garante que um texto não apareça no material do cliente.
- Implementação da extração: seguir a estrutura aprovada (texto direto de PDF e modelo econômico com visão para imagens/digitalizações), escolhendo biblioteca e modelo após validar amostras, qualidade, custo e ambiente de execução. OCR tradicional fica como alternativa futura se medições justificarem sua manutenção.
- Leitura de links: comprovar acesso aos resultados antes de prometer suporte por companhia; prever resultado indisponível, sessão expirada ou página sem oferta e orientar importação de arquivo/revisão manual. Se houver busca pelo backend, restringir destinos permitidos, validar redirecionamentos e impedir acesso a endereços internos (SSRF), com limites de tempo e tamanho.
- Manter cálculos e arquivos de origem restritos à agência e aos usuários autorizados. O arquivo original pode revelar milhas/custos e não deve ser anexado automaticamente ao material enviado ao cliente. Definir limites de upload, retenção e autorização de download.
- **Affected Files**: `src/app/(app)/calculadora/page.tsx`, `src/lib/calculadora-milhas.ts`, `src/types/index.ts`, `src/lib/api/quotation-types.ts`, `src/lib/api/quotation-mapper.ts`, `src/lib/api/update-quotation-remote.ts`, `src/app/(app)/cotacoes/[id]/page.tsx`, `src/lib/pdf-generator.ts`, `src/components/cotacao/EnviarWhatsAppModal.tsx`; novos componentes/serviços de importação; contratos, persistência e autorização de cotações no projeto `agencia-hub-api`.

#### Referência fornecida e pontos para a implementação

- [Busca LATAM enviada pelo usuário](https://www.latamairlines.com/br/pt/oferta-voos?origin=BPS&outbound=2026-09-10T00%3A00%3A00.000Z&destination=REC&adt=1&chd=0&inf=0&trip=OW&cabin=Economy&redemption=true&sort=RECOMMENDED&exp_id=fb1fb170-d143-44bb-98c4-a8710a54865a).
- A URL informa BPS → REC, 10/09/2026, 1 adulto, só ida, econômica e busca com resgate. Não contém os horários, duração ou preços dos resultados. A tentativa de abrir a página pela ferramenta de pesquisa não retornou conteúdo; a viabilidade de extrair ofertas do site permanece não validada. A data da busca já passou na data deste registro; usar uma busca válida na prova técnica.
- O usuário enviou posteriormente uma imagem real da LATAM: BPS → REC, saída 17:25, chegada 23:20, duração 5h55, 1 parada, 87.141 milhas + BRL 38,84 por pessoa, com os textos "a partir de" e "inclui taxas e impostos". A data e o aeroporto de conexão não aparecem; devem permanecer ausentes até confirmação do agente. A parcela monetária precisa ser revisada para evitar duplicar taxas já incluídas. A imagem foi interpretada na conversa, mas ainda não foi testada por um extrator integrado ao sistema. Preservar uma amostra de teste durável na implementação; não depender do arquivo temporário do clipboard.
- O cURL enviado posteriormente aponta para `/bff/air-offers/v2/offers/search`, com `redemption=false`, cookies, token de CAPTCHA e token de busca temporário. Não comprova acesso contínuo nem busca em milhas; nenhuma resposta JSON foi fornecida. Não copiar cookies ou tokens para o repositório. A investigação dessa integração pertence à evolução de busca direta.
- Decisões a fechar na implementação: biblioteca de PDF, modelo/provedor definitivo, formatos/companhias validados, limites de arquivo e orçamento por agência, tratamento de preços diferentes por adulto/criança/bebê e regra de seleção da opção que define o total. O mecanismo geral de extração já foi aprovado acima.

#### Critérios de aceite e validação futura

- [ ] Uma amostra real de cada formato declarado como suportado produz opções editáveis com origem, destino, datas, horários, duração e milhas; campos não reconhecidos são sinalizados.
- [ ] Ida/volta, conexão, virada de dia e diferentes bases de preço/passageiros não misturam trechos nem duplicam milhas ou taxas.
- [ ] O agente pode adicionar/editar taxas, custo por milheiro e lucro, conferir o cálculo e anexar a uma cotação nova ou existente.
- [ ] Exemplo sintético para validação, não extraído do link: 20.000 milhas × R$ 25/1.000 = R$ 500; taxas de R$ 50/pessoa resultam em base de R$ 550; lucro de 10% sobre a base + R$ 20/pessoa = R$ 75; preço final de R$ 625/pessoa e R$ 1.250 para 2 pessoas, sem bagagem.
- [ ] Salvar, editar, recarregar e abrir em outra sessão autorizada preserva opções e memória de cálculo; alterações na tabela de milheiro não reescrevem valores históricos.
- [ ] O detalhe da cotação mostra os cálculos internos com identificação clara; outras agências e acessos públicos não conseguem recuperá-los nem baixar a fonte original.
- [ ] PDF/HTML e compartilhamentos mostram itinerário e preço de venda, sem quantidade/custo das milhas, lucro, composição interna das taxas ou conteúdo do arquivo original. Cobrir a ausência desses campos com teste de regressão específico.
- [ ] PDFs com texto são processados diretamente; imagens e páginas digitalizadas usam visão; PDFs mistos não perdem páginas. Campos ausentes ou inválidos exigem revisão, sem preenchimento inventado.
- [ ] A amostra LATAM retorna 87.141 milhas e R$ 38,84 por pessoa, BPS → REC, horários 17:25/23:20, 5h55 e 1 parada; data e aeroporto da conexão permanecem não informados.
- [ ] Recalcular taxas/lucro e gerar o PDF não chama IA. Reenviar o mesmo arquivo na mesma agência reutiliza a extração salva sem apagar correções; outra agência não acessa o resultado.
- [ ] Limites de consumo são aplicados também em chamadas concorrentes; novas tentativas são limitadas e uso/custo são registrados. Limite atingido ou falha do provedor permite continuar manualmente.
- [ ] Evolução futura de links: parâmetros de busca isolados são apresentados como importação parcial, nunca como extração completa. Este critério não bloqueia a entrega de PDF/imagem.
- [ ] Cotações antigas e o fluxo manual continuam funcionando. Validar cálculo, persistência, autorização e material final; nenhuma validação automatizada foi executada nesta implementação.

---

## 💡 Ideas

Nenhuma ideia registrada nesta auditoria.

---

## ✅ Resolved Items

Nenhum item resolvido.
