# Estratégia de Desenvolvimento Sincronizado - AgenciaHub

## 📋 Visão Geral

**Estratégia**: Frontend-first com Backend acompanhando as mudanças
**Status Atual**: MVP funcional com integração parcial

### Projetos
- **Frontend**: `agencia-hub` (Next.js 16 + TypeScript)
- **Backend**: `agencia-hub-api` (Spring Boot 3.4 + PostgreSQL)

---

## 🎯 Estado Atual da Integração

### ✅ Já Implementado no Backend

#### Entidades & Endpoints
- **Customers** (Clientes)
  - `GET /customers` - Listar com filtros (name, status)
  - `GET /customers/{id}` - Buscar por ID
  - `POST /customers` - Criar
  - `PATCH /customers/{id}` - Atualizar parcialmente

- **Quotations** (Cotações)
  - `GET /quotations` - Listar com filtros (customerId, status, search)
  - `GET /quotations/{id}` - Buscar por ID
  - `POST /quotations` - Criar
  - `PATCH /quotations/{id}` - Atualizar parcialmente
  - Campo `details_json` (JSON) para payload completo do formulário
  - Campos CRM: tags, priority, assignee, internal_notes

- **Opportunities** (Oportunidades/Atendimentos)
  - `GET /opportunities` - Listar
  - `GET /opportunities/{id}` - Buscar por ID
  - `POST /opportunities` - Criar
  - `PATCH /opportunities/{id}` - Atualizar

- **Financial Entries** (Lançamentos Financeiros)
  - `GET /financial-entries` - Listar com filtros
  - `GET /financial-entries/{id}` - Buscar por ID
  - `POST /financial-entries` - Criar
  - `PATCH /financial-entries/{id}` - Atualizar

#### Infraestrutura
- PostgreSQL com Flyway migrations
- OpenAPI/Swagger UI em `/api/v1/swagger-ui/index.html`
- CORS configurado
- Validação com Bean Validation
- Exception handling global

### ✅ Já Implementado no Frontend

#### Integração Remota
- `create-customer-remote.ts` - Criação de clientes
- `create-quotation-remote.ts` - Criação de cotações
- `list-quotations-remote.ts` - Listagem de cotações
- Mappers para conversão entre tipos locais e API

#### Features Locais (localStorage)
- Sistema de autenticação mock
- CRUD completo de clientes (30+ campos)
- Sistema de cotações com Kanban
- Formulário público com submissões
- Sistema de notificações
- Busca global (Cmd+K)
- Timeline de atividades
- Toast notifications
- Gestão financeira

---

## 🚧 Gap Analysis - O que falta

### Backend precisa implementar:

#### 1. **Formulário Público & Submissões** (PRIORIDADE ALTA)
```java
// Nova entidade: PublicFormConfig
- id, slug, title, description, logoUrl
- socialLinks (JSON)
- customFields (JSON)
- isActive, createdAt, updatedAt

// Nova entidade: FormSubmission
- id, formConfigId, submittedData (JSON)
- status (PENDING, IMPORTED, REJECTED)
- submittedAt, processedAt

// Endpoints públicos (sem auth):
GET  /public/forms/{slug}
POST /public/forms/{slug}/submit

// Endpoints internos:
GET  /form-submissions?status=PENDING
POST /form-submissions/{id}/import-to-quotation
```

#### 2. **Sistema de Notificações** (PRIORIDADE ALTA)
```java
// Nova entidade: Notification
- id, userId, type, title, message
- relatedEntityType, relatedEntityId
- isRead, createdAt

// Endpoints:
GET  /notifications?isRead=false
PATCH /notifications/{id}/mark-read
PATCH /notifications/mark-all-read
```

#### 3. **Timeline/Histórico** (PRIORIDADE MÉDIA)
```java
// Nova entidade: ActivityLog
- id, entityType, entityId, action
- userId, userName, changes (JSON)
- createdAt

// Endpoints:
GET /activity-logs?entityType=QUOTATION&entityId={id}
```

#### 4. **Busca Global** (PRIORIDADE MÉDIA)
```java
// Endpoint unificado:
GET /search?q={query}&types=CUSTOMER,QUOTATION,OPPORTUNITY
```

#### 5. **Melhorias em Customers** (PRIORIDADE BAIXA)
- Adicionar campos faltantes (documentos, endereço completo, contatos emergência)
- Endpoint de busca avançada

#### 6. **Autenticação Real** (PRIORIDADE FUTURA)
- Spring Security + JWT
- Endpoints: `/auth/login`, `/auth/refresh`, `/auth/logout`
- Roles: ADMIN, AGENT

---

## 📝 Plano de Desenvolvimento por Sprints

### Sprint 1: Formulário Público (1-2 dias)
**Objetivo**: Permitir que leads do formulário público sejam salvos no backend

**Backend**:
- [ ] Criar migrations V4 (form_configs, form_submissions)
- [ ] Criar entidades PublicFormConfig e FormSubmission
- [ ] Criar DTOs (request/response)
- [ ] Criar repositories
- [ ] Criar services
- [ ] Criar controllers (público + interno)
- [ ] Adicionar testes

**Frontend**:
- [ ] Criar `submit-form-remote.ts`
- [ ] Criar `list-submissions-remote.ts`
- [ ] Criar `import-submission-remote.ts`
- [ ] Atualizar componente `ImportarSubmissaoModal`
- [ ] Atualizar página de submissões

**Validação**:
- [ ] Submeter formulário público → salvar no PostgreSQL
- [ ] Listar submissões pendentes
- [ ] Importar submissão → criar cotação

---

### Sprint 2: Notificações (1 dia)
**Objetivo**: Alertas de cotações vencendo salvos no backend

**Backend**:
- [ ] Criar migration V5 (notifications)
- [ ] Criar entidade Notification
- [ ] Criar DTOs
- [ ] Criar repository
- [ ] Criar service (incluir lógica de geração automática)
- [ ] Criar controller
- [ ] Job agendado para verificar cotações vencendo

**Frontend**:
- [ ] Criar `list-notifications-remote.ts`
- [ ] Criar `mark-notification-read-remote.ts`
- [ ] Atualizar NotificationContext para usar API
- [ ] Manter fallback local se API não disponível

**Validação**:
- [ ] Cotação próxima do vencimento → notificação criada
- [ ] Notificações aparecem no sino
- [ ] Marcar como lida funciona

---

### Sprint 3: Timeline (1 dia)
**Objetivo**: Histórico de mudanças persistido

**Backend**:
- [ ] Criar migration V6 (activity_logs)
- [ ] Criar entidade ActivityLog
- [ ] Criar DTOs
- [ ] Criar repository
- [ ] Criar service
- [ ] Criar controller
- [ ] Adicionar listeners JPA para auto-log de mudanças

**Frontend**:
- [ ] Criar `list-activity-logs-remote.ts`
- [ ] Atualizar TimelineContext para usar API
- [ ] Manter fallback local se API não disponível

**Validação**:
- [ ] Editar cotação → log criado
- [ ] Timeline mostra histórico do backend

---

### Sprint 4: Busca Global (0.5 dia)
**Objetivo**: Busca unificada no backend

**Backend**:
- [ ] Criar endpoint `/search`
- [ ] Implementar busca em customers, quotations, opportunities
- [ ] Retornar resultados unificados com tipo

**Frontend**:
- [ ] Criar `global-search-remote.ts`
- [ ] Atualizar componente de busca (Cmd+K)
- [ ] Manter fallback local se API não disponível

**Validação**:
- [ ] Cmd+K → buscar no backend
- [ ] Resultados de múltiplas entidades

---

### Sprint 5: Melhorias & Refinamentos (1-2 dias)
**Objetivo**: Completar campos faltantes e otimizações

**Backend**:
- [ ] Adicionar campos faltantes em Customer
- [ ] Melhorar filtros e ordenação
- [ ] Adicionar paginação onde necessário
- [ ] Otimizar queries (N+1, índices)

**Frontend**:
- [ ] Atualizar mappers com novos campos
- [ ] Adicionar paginação nas listagens
- [ ] Melhorar tratamento de erros
- [ ] Adicionar loading states

---

### Sprint 6: Autenticação (2-3 dias) - FUTURO
**Objetivo**: Substituir auth mock por JWT real

**Backend**:
- [ ] Adicionar Spring Security
- [ ] Criar entidade User
- [ ] Implementar JWT (access + refresh tokens)
- [ ] Criar endpoints de auth
- [ ] Proteger endpoints existentes

**Frontend**:
- [ ] Implementar fluxo de login real
- [ ] Gerenciar tokens (storage + refresh)
- [ ] Atualizar middleware
- [ ] Adicionar interceptor para Authorization header

---

## 🔄 Workflow de Desenvolvimento

### 1. Feature Nova no Frontend

```mermaid
Frontend Feature → Identificar dados necessários → 
Backend API → Testar integração → Deploy
```

**Processo**:
1. Implementar feature no frontend com dados mock/local
2. Identificar quais dados precisam persistir
3. Criar issue/task para backend
4. Backend implementa endpoint
5. Frontend integra com endpoint
6. Testar integração
7. Manter fallback local (opcional)

### 2. Sincronização Diária

**Checklist**:
- [ ] Frontend: listar features novas/modificadas
- [ ] Backend: verificar endpoints necessários
- [ ] Criar tasks para gaps identificados
- [ ] Priorizar por impacto no usuário
- [ ] Implementar backend primeiro (se possível)
- [ ] Integrar frontend
- [ ] Testar end-to-end

### 3. Comunicação entre Projetos

**Documentação compartilhada**:
- `API_CONTRACT.md` - Contratos de API (request/response)
- `CHANGELOG.md` - Mudanças em cada projeto
- `INTEGRATION_STATUS.md` - Status da integração

---

## 🧪 Estratégia de Testes

### Backend
```bash
# Testes unitários
mvn test

# Testes de integração (com H2)
mvn verify

# Rodar local com PostgreSQL
docker compose up -d
export SPRING_PROFILES_ACTIVE=docker
mvn spring-boot:run
```

### Frontend
```bash
# Desenvolvimento local (mock)
npm run dev

# Com backend local
NEXT_PUBLIC_AGENCIA_HUB_API_URL=http://localhost:8080/api/v1 npm run dev

# Build de produção
npm run build
```

### Integração E2E
- Usar Swagger UI para testar endpoints: `http://localhost:8080/api/v1/swagger-ui/index.html`
- Testar fluxos completos: criar cliente → criar cotação → listar
- Validar mappers (frontend ↔ backend)

---

## 📦 Preparação para GitHub

### Estrutura de Repositórios

**Opção 1: Monorepo** (Recomendado para projetos pequenos)
```
agencia-hub/
├── frontend/          # Next.js
├── backend/           # Spring Boot
├── docs/              # Documentação compartilhada
├── .github/
│   └── workflows/     # CI/CD
└── README.md
```

**Opção 2: Repositórios Separados** (Recomendado para times maiores)
```
agencia-hub-frontend/  # Repositório 1
agencia-hub-api/       # Repositório 2
```

### Arquivos Essenciais

#### Backend (`agencia-hub-api`)
- [x] `.gitignore` (já existe)
- [x] `README.md` (já existe)
- [ ] `CONTRIBUTING.md`
- [ ] `LICENSE`
- [ ] `.github/workflows/backend-ci.yml`

#### Frontend (`agencia-hub`)
- [x] `.gitignore` (já existe)
- [x] `README.md` (já existe)
- [ ] `CONTRIBUTING.md`
- [ ] `LICENSE`
- [ ] `.github/workflows/frontend-ci.yml`

---

## 🚀 Próximos Passos Imediatos

### 1. Preparar para GitHub (HOJE)
- [ ] Revisar `.gitignore` em ambos projetos
- [ ] Adicionar LICENSE (MIT ou Apache 2.0)
- [ ] Criar repositórios no GitHub
- [ ] Fazer primeiro commit e push
- [ ] Configurar branch protection (main)

### 2. Documentar Contratos de API (HOJE)
- [ ] Criar `API_CONTRACT.md` com endpoints atuais
- [ ] Documentar tipos de request/response
- [ ] Adicionar exemplos de uso

### 3. Iniciar Sprint 1 (PRÓXIMA)
- [ ] Implementar formulário público no backend
- [ ] Integrar com frontend
- [ ] Testar fluxo completo

---

## 📊 Métricas de Sucesso

### Integração
- [ ] 100% dos endpoints documentados no Swagger
- [ ] 0 dados duplicados (local + remoto)
- [ ] < 200ms latência média nas APIs
- [ ] 100% cobertura de testes nos services

### Desenvolvimento
- [ ] Commits diários em ambos projetos
- [ ] PRs revisados em < 24h
- [ ] Deploy semanal em staging
- [ ] 0 breaking changes sem aviso

### Qualidade
- [ ] 0 erros 500 em produção
- [ ] < 5% taxa de erro nas APIs
- [ ] Logs estruturados em ambos projetos
- [ ] Monitoramento ativo (futuro)

---

## 🎯 Decisões Arquiteturais

### 1. Versionamento de API
- Usar `/api/v1` como prefixo
- Manter compatibilidade dentro da mesma versão
- Breaking changes → nova versão (`/api/v2`)

### 2. Tratamento de Erros
- Backend: retornar JSON estruturado com `message`, `status`, `timestamp`
- Frontend: exibir toasts com mensagens amigáveis
- Logs detalhados no backend

### 3. Autenticação (Futuro)
- JWT com refresh token
- Access token: 15min
- Refresh token: 7 dias
- HttpOnly cookies para web

### 4. Dados Sensíveis
- Nunca logar senhas ou tokens
- Usar variáveis de ambiente
- `.env` no `.gitignore`

---

## 📚 Recursos

### Backend
- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [Flyway](https://flywaydb.org/documentation/)

### Frontend
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Integração
- [REST API Best Practices](https://restfulapi.net/)
- [OpenAPI Specification](https://swagger.io/specification/)

---

**Última atualização**: Maio 2026
**Versão**: 1.0
**Responsável**: Equipe AgenciaHub
