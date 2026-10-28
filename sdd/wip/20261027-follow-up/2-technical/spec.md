# Implementação F08

V64 cria commercial_followups e commercial_followup_events. UUID, agency/customer/responsible FKs; produto TRAVEL/MILES; due_on DATE; estados OPEN/DONE/CANCELLED; versão; chave de criação única por agência com payload normalizado; deleted_at lógico. Auditoria com customer_id independente e snapshot JSON antes/depois. Índices de agência/produto/prazo e histórico. Sem backfill de pessoas/tarefas.

Spring/JdbcTemplate, transações e queries parametrizadas. Controller /follow-ups restrito a AGENCY_OWNER/SALES_AGENT; TenantContext em todas as queries. Bloquear pessoa na criação para coordenar exclusão; bloquear follow-up na edição/transição/exclusão. Referências validadas dentro da agência; responsável ativo. Versão conferida antes de no-op. Produtos/pessoa imutáveis. Reenvio compara payload completo, inclusive após edição; reenvio após exclusão conflita.

GET /follow-ups exige product; retorna today, counts (abertas por prazo no escopo de pessoa/responsável), items filtrados por bucket/state. GET /{id}; POST com Idempotency-Key; PATCH /{id}; POST /{id}/state; DELETE /{id}?expectedVersion; GET /{id}/history. Filtros e paginação não inventam totais: inicialmente lista completa do escopo, sem truncamento silencioso.

UI compartilhada FollowupBoard sob /viagens/follow-ups e /milhas/follow-ups. Reutilizar componentes do produto, ClientePicker e /work/members. Atalhos nas fichas de pessoa, navegação para dono/vendedor e middleware existente de Viagens/Milhas. Formulários acessíveis e estado por produto/pessoa/sessão. Resumo clicável e lista compacta, sem novos tokens ou dependências.

Integrar bloqueio de histórico em DeleteCustomer e ProcessDataDeletionRequest, erros de FK claros e descarte em AgencyDeletionScheduler. Preservar demais módulos. Testar regressões F01/F07/F09/F10.
