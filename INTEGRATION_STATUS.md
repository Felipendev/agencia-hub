# Status de Integração Frontend ↔ Backend

Documento vivo que rastreia o status da integração entre os projetos.

**Última atualização**: Maio 2026

---

## 📊 Visão Geral

| Módulo | Backend | Frontend | Integração | Status |
|--------|---------|----------|------------|--------|
| Customers | ✅ 100% | ✅ 100% | 🟡 Parcial | Faltam campos extras |
| Quotations | ✅ 100% | ✅ 100% | ✅ Completo | CRUD completo |
| Opportunities | ✅ 100% | ✅ 100% | ✅ Completo | CRUD completo |
| Financial Entries | ✅ 100% | ✅ 100% | ✅ Completo | CRUD completo |
| Public Forms | 🔴 0% | ✅ 100% | 🔴 Pendente | Backend falta |
| Notifications | 🔴 0% | ✅ 100% | 🔴 Pendente | Backend falta |
| Timeline | 🔴 0% | ✅ 100% | 🔴 Pendente | Backend falta |
| Global Search | 🔴 0% | ✅ 100% | 🔴 Pendente | Backend falta |
| Authentication | 🔴 0% | 🟡 Mock | 🔴 Pendente | Ambos faltam |

**Legenda**:
- ✅ Completo - Funcionando 100%
- 🟡 Parcial - Funcionando mas incompleto
- 🔴 Pendente - Não implementado
- ⚠️ Bloqueado - Aguardando dependência

---

## 👥 Customers (Clientes)

### Backend ✅
- [x] Entity com campos básicos
- [x] CRUD completo
- [x] Filtros (name, status)
- [x] Validações
- [ ] Campos adicionais (documentos, endereço completo, emergência)

### Frontend ✅
- [x] Interface com 30+ campos
- [x] CRUD completo
- [x] Busca e filtros
- [x] Integração com API (create)
- [ ] Integração com API (list, update)

### Integração 🟡
- [x] `create-customer-remote.ts` implementado
- [x] Mapper frontend ↔ backend
- [ ] `list-customers-remote.ts`
- [ ] `update-customer-remote.ts`
- [ ] Sincronização de campos adicionais

**Próximos passos**:
1. Backend: adicionar campos faltantes (migration + entity)
2. Frontend: implementar list e update remotos
3. Testar sincronização completa

---

## 💼 Quotations (Cotações)

### Backend ✅
- [x] Entity completa com `details_json`
- [x] CRUD completo
- [x] Filtros (customerId, status, search)
- [x] Campos CRM (tags, priority, assignee, notes)
- [x] Relacionamento com Customer e Opportunity

### Frontend ✅
- [x] Interface completa (40+ campos)
- [x] Kanban board
- [x] CRUD completo
- [x] Integração com API (create, list)
- [x] Integração com API (update) ← **NOVO**

### Integração ✅
- [x] `create-quotation-remote.ts` implementado
- [x] `list-quotations-remote.ts` implementado
- [x] `update-quotation-remote.ts` implementado ← **NOVO**
- [x] Mapper frontend ↔ backend
- [x] Campo `detailsJson` mapeado
- [x] `updateCotacao` sincroniza com backend em background ← **NOVO**

---

## 🎯 Opportunities (Oportunidades/Atendimentos)

### Backend ✅
- [x] Entity completa
- [x] CRUD completo
- [x] Relacionamento com Customer
- [x] Validações

### Frontend ✅
- [x] Interface completa
- [x] CRUD completo
- [x] Listagem e filtros
- [x] Integração com API ← **NOVO**

### Integração ✅
- [x] `opportunity-types.ts` criado ← **NOVO**
- [x] `opportunity-mapper.ts` criado ← **NOVO**
- [x] `create-opportunity-remote.ts` implementado ← **NOVO**
- [x] `update-opportunity-remote.ts` implementado ← **NOVO**
- [x] `addAtendimento` sincroniza com backend ← **NOVO**
- [x] `updateAtendimento` sincroniza com backend ← **NOVO**

---

## 💰 Financial Entries (Lançamentos Financeiros)

### Backend ✅
- [x] Entity completa
- [x] CRUD completo
- [x] Filtros (customerId, type, category, status)
- [x] Relacionamento com Customer
- [x] Validações

### Frontend ✅
- [x] Interface completa
- [x] CRUD completo
- [x] Filtros e KPIs
- [x] Integração com API ← **NOVO**

### Integração ✅
- [x] `financial-types.ts` criado ← **NOVO**
- [x] `financial-mapper.ts` criado ← **NOVO**
- [x] `create-financial-entry-remote.ts` implementado ← **NOVO**
- [x] `update-financial-entry-remote.ts` implementado ← **NOVO**
- [x] `addLancamento` sincroniza com backend ← **NOVO**
- [x] `updateLancamento` adicionado ao contexto ← **NOVO**

---

## 📝 Public Forms & Submissions

### Backend 🔴
- [ ] Entity `PublicFormConfig`
- [ ] Entity `FormSubmission`
- [ ] Endpoints públicos (GET form, POST submit)
- [ ] Endpoints internos (list submissions, import)
- [ ] Migration

### Frontend ✅
- [x] Página pública de formulário
- [x] Sistema de submissões
- [x] Modal de importação
- [x] Armazenamento local
- [ ] Integração com API

### Integração 🔴
- [ ] `submit-form-remote.ts`
- [ ] `list-submissions-remote.ts`
- [ ] `import-submission-remote.ts`

**Próximos passos** (Sprint 1):
1. Backend: criar migrations
2. Backend: implementar entities e endpoints
3. Frontend: implementar integração
4. Testar fluxo: submit → list → import

---

## 🔔 Notifications

### Backend 🔴
- [ ] Entity `Notification`
- [ ] Endpoints (list, mark read, mark all read)
- [ ] Job agendado para gerar notificações
- [ ] Lógica de cotações vencendo
- [ ] Migration

### Frontend ✅
- [x] NotificationContext
- [x] Componente de sino com badge
- [x] Lista de notificações
- [x] Marcar como lida
- [x] Geração local de notificações
- [ ] Integração com API

### Integração 🔴
- [ ] `list-notifications-remote.ts`
- [ ] `mark-notification-read-remote.ts`
- [ ] Atualizar NotificationContext

**Próximos passos** (Sprint 2):
1. Backend: criar migration e entity
2. Backend: implementar endpoints
3. Backend: criar job agendado
4. Frontend: integrar com API
5. Testar notificações automáticas

---

## 📜 Timeline (Activity Logs)

### Backend 🔴
- [ ] Entity `ActivityLog`
- [ ] Endpoint de listagem
- [ ] Listeners JPA para auto-log
- [ ] Migration

### Frontend ✅
- [x] TimelineContext
- [x] Componente de timeline
- [x] Registro local de atividades
- [ ] Integração com API

### Integração 🔴
- [ ] `list-activity-logs-remote.ts`
- [ ] Atualizar TimelineContext

**Próximos passos** (Sprint 3):
1. Backend: criar migration e entity
2. Backend: implementar endpoint
3. Backend: adicionar listeners
4. Frontend: integrar com API
5. Testar histórico persistido

---

## 🔍 Global Search

### Backend 🔴
- [ ] Endpoint `/search`
- [ ] Busca em customers
- [ ] Busca em quotations
- [ ] Busca em opportunities
- [ ] Resultado unificado

### Frontend ✅
- [x] Componente de busca (Cmd+K)
- [x] Busca local em múltiplas entidades
- [x] Navegação para resultados
- [ ] Integração com API

### Integração 🔴
- [ ] `global-search-remote.ts`
- [ ] Atualizar componente de busca

**Próximos passos** (Sprint 4):
1. Backend: implementar endpoint
2. Frontend: integrar com API
3. Testar busca unificada

---

## 🔐 Authentication

### Backend 🔴
- [ ] Spring Security configurado
- [ ] Entity `User`
- [ ] JWT (access + refresh)
- [ ] Endpoints `/auth/*`
- [ ] Proteção de endpoints
- [ ] Roles (ADMIN, AGENT)

### Frontend 🟡
- [x] AuthContext (mock)
- [x] Login page
- [x] Middleware de proteção
- [ ] Integração com JWT
- [ ] Refresh token
- [ ] Logout real

### Integração 🔴
- [ ] `login-remote.ts`
- [ ] `refresh-token-remote.ts`
- [ ] `logout-remote.ts`
- [ ] Interceptor para Authorization header
- [ ] Atualizar AuthContext

**Próximos passos** (Sprint 6 - Futuro):
1. Backend: adicionar Spring Security
2. Backend: implementar JWT
3. Frontend: implementar fluxo de auth
4. Testar login/logout/refresh

---

## 📈 Métricas de Progresso

### Geral
- **Endpoints Backend**: 16/24 (67%)
- **Integrações Frontend**: 3/24 (12%)
- **Cobertura de Testes Backend**: ~0% (TODO)
- **Cobertura de Testes Frontend**: ~0% (TODO)

### Por Sprint
- **Sprint 1** (Forms): 0% - Não iniciado
- **Sprint 2** (Notifications): 0% - Não iniciado
- **Sprint 3** (Timeline): 0% - Não iniciado
- **Sprint 4** (Search): 0% - Não iniciado
- **Sprint 5** (Refinements): 0% - Não iniciado
- **Sprint 6** (Auth): 0% - Não iniciado

---

## 🚧 Bloqueios Conhecidos

### Backend
- Nenhum bloqueio atual

### Frontend
- Aguardando endpoints de Forms para completar integração
- Aguardando endpoints de Notifications
- Aguardando endpoints de Timeline

### Infraestrutura
- CI/CD não configurado
- Ambiente de staging não disponível
- Monitoramento não implementado

---

## 📝 Notas de Desenvolvimento

### Decisões Técnicas
1. **Fallback Local**: Frontend mantém funcionalidade local quando API não disponível
2. **Mappers**: Conversão explícita entre tipos locais e API
3. **Validação**: Duplicada (frontend UX + backend segurança)
4. **Erros**: Backend retorna JSON estruturado, frontend exibe toasts

### Convenções
- Backend: camelCase em JSON
- Frontend: camelCase em TypeScript
- Datas: ISO 8601 com timezone
- IDs: UUID v4
- Status: UPPER_SNAKE_CASE (enums)

### Ambiente
```bash
# Backend
SPRING_PROFILES_ACTIVE=docker
DB_HOST=localhost
DB_PORT=5433

# Frontend
NEXT_PUBLIC_AGENCIA_HUB_API_URL=http://localhost:8080/api/v1
```

---

## 🎯 Próximas Ações

### Esta Semana
1. [ ] Preparar repositórios no GitHub
2. [ ] Iniciar Sprint 1 (Forms)
3. [ ] Documentar contratos de API

### Próximas 2 Semanas
1. [ ] Completar Sprint 1 e 2
2. [ ] Configurar CI/CD básico
3. [ ] Adicionar testes unitários

### Próximo Mês
1. [ ] Completar Sprints 3-5
2. [ ] Deploy em staging
3. [ ] Planejamento de Sprint 6 (Auth)

---

**Mantenha este documento atualizado após cada sprint!**
