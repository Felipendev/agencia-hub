# ✅ Checklist de Início - AgenciaHub

Use este checklist para começar o desenvolvimento de forma organizada.

---

## 📋 Fase 1: Preparação (30 min)

### Ambiente Local
- [ ] PostgreSQL rodando via Docker
  ```bash
  cd ~/agencia-hub-api
  docker compose up -d
  docker compose ps  # Verificar status
  ```

- [ ] Backend rodando
  ```bash
  cd ~/agencia-hub-api
  export SPRING_PROFILES_ACTIVE=docker
  mvn spring-boot:run
  ```
  - [ ] Acessar Swagger UI: http://localhost:8080/api/v1/swagger-ui/index.html
  - [ ] Testar endpoint: GET /customers

- [ ] Frontend rodando
  ```bash
  cd ~/agencia-hub
  npm install
  NEXT_PUBLIC_AGENCIA_HUB_API_URL=http://localhost:8080/api/v1 npm run dev
  ```
  - [ ] Acessar: http://localhost:3000
  - [ ] Fazer login (qualquer email/senha)
  - [ ] Criar um cliente de teste

### Documentação
- [ ] Ler `RESUMO_ANALISE.md` (este resume tudo)
- [ ] Ler `ESTRATEGIA_DESENVOLVIMENTO.md` (plano completo)
- [ ] Ler `API_CONTRACT.md` (endpoints disponíveis)
- [ ] Marcar `INTEGRATION_STATUS.md` como favorito (acompanhamento)

---

## 🐙 Fase 2: GitHub (1 hora)

### Decisão: Monorepo ou Repos Separados?

#### Opção A: Monorepo (Recomendado) ✅
**Vantagens**: Mais simples, um único lugar, histórico unificado

```bash
# 1. Criar estrutura
mkdir ~/agencia-hub-monorepo
cd ~/agencia-hub-monorepo

# 2. Mover projetos
mv ~/agencia-hub ./frontend
mv ~/agencia-hub-api ./backend

# 3. Criar pasta docs
mkdir docs

# 4. Mover documentação
mv frontend/ESTRATEGIA_DESENVOLVIMENTO.md docs/
mv frontend/API_CONTRACT.md docs/
mv frontend/INTEGRATION_STATUS.md docs/
mv frontend/GITHUB_SETUP.md docs/
mv frontend/RESUMO_ANALISE.md docs/
mv frontend/CHECKLIST_INICIO.md docs/
mv frontend/CONTRIBUTING.md docs/
mv frontend/LICENSE ./

# 5. Copiar README do monorepo
cp frontend/README_MONOREPO.md ./README.md

# 6. Criar .gitignore principal
cat > .gitignore << 'EOF'
# IDEs
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Temp
tmp/
temp/
EOF

# 7. Inicializar Git
git init
git add .
git commit -m "chore: initial commit - monorepo setup"

# 8. Criar repo no GitHub
# Acesse: https://github.com/new
# Nome: agencia-hub
# Descrição: Sistema de gestão para agências de viagem
# Público ou Privado
# NÃO inicialize com README

# 9. Conectar e push (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/agencia-hub.git
git branch -M main
git push -u origin main
```

- [ ] Estrutura de monorepo criada
- [ ] Documentação organizada em `docs/`
- [ ] Git inicializado
- [ ] Repositório criado no GitHub
- [ ] Primeiro commit feito
- [ ] Push realizado com sucesso

#### Opção B: Repositórios Separados
**Vantagens**: Melhor para times grandes, deploys independentes

```bash
# Frontend
cd ~/agencia-hub
git init
git add .
git commit -m "chore: initial commit - frontend"
# Criar repo: agencia-hub-frontend
git remote add origin https://github.com/SEU_USUARIO/agencia-hub-frontend.git
git branch -M main
git push -u origin main

# Backend
cd ~/agencia-hub-api
git init
git add .
git commit -m "chore: initial commit - backend"
# Criar repo: agencia-hub-api
git remote add origin https://github.com/SEU_USUARIO/agencia-hub-api.git
git branch -M main
git push -u origin main
```

- [ ] Repositório frontend criado e pushed
- [ ] Repositório backend criado e pushed

### Configurações no GitHub

- [ ] Adicionar descrição no repo
- [ ] Adicionar topics: `travel-agency`, `nextjs`, `spring-boot`, `typescript`, `java`, `postgresql`
- [ ] Configurar branch protection em `main` (Settings → Branches)
  - [ ] Require pull request reviews
  - [ ] Require status checks (quando CI estiver pronto)
- [ ] Habilitar Issues
- [ ] Habilitar Discussions (opcional)

---

## 📝 Fase 3: Planejamento (30 min)

### Criar Issues no GitHub

#### Issue #1: Sprint 1 - Formulário Público (Backend)
```markdown
**Objetivo**: Implementar backend para formulário público

**Tasks**:
- [ ] Criar migration V4__public_forms.sql
- [ ] Criar entity PublicFormConfig
- [ ] Criar entity FormSubmission
- [ ] Criar DTOs (request/response)
- [ ] Criar repositories
- [ ] Criar services
- [ ] Criar controllers (público + interno)
- [ ] Testar no Swagger UI

**Endpoints**:
- GET /public/forms/{slug}
- POST /public/forms/{slug}/submit
- GET /form-submissions?status=PENDING
- POST /form-submissions/{id}/import-to-quotation

**Estimativa**: 1 dia

Labels: `enhancement`, `backend`, `sprint-1`, `high-priority`
```

#### Issue #2: Sprint 1 - Formulário Público (Frontend)
```markdown
**Objetivo**: Integrar frontend com API de formulários

**Tasks**:
- [ ] Criar submit-form-remote.ts
- [ ] Criar list-submissions-remote.ts
- [ ] Criar import-submission-remote.ts
- [ ] Atualizar ImportarSubmissaoModal
- [ ] Atualizar página de submissões
- [ ] Testar fluxo completo

**Dependências**: Issue #1

**Estimativa**: 0.5 dia

Labels: `enhancement`, `frontend`, `sprint-1`, `high-priority`
```

#### Issue #3: Sprint 2 - Notificações (Backend)
```markdown
**Objetivo**: Sistema de notificações persistido

**Tasks**:
- [ ] Criar migration V5__notifications.sql
- [ ] Criar entity Notification
- [ ] Criar DTOs
- [ ] Criar repository
- [ ] Criar service
- [ ] Criar controller
- [ ] Criar job agendado para cotações vencendo
- [ ] Testar no Swagger UI

**Endpoints**:
- GET /notifications?isRead=false
- PATCH /notifications/{id}/mark-read
- PATCH /notifications/mark-all-read

**Estimativa**: 1 dia

Labels: `enhancement`, `backend`, `sprint-2`, `high-priority`
```

#### Issue #4: Sprint 2 - Notificações (Frontend)
```markdown
**Objetivo**: Integrar notificações com API

**Tasks**:
- [ ] Criar list-notifications-remote.ts
- [ ] Criar mark-notification-read-remote.ts
- [ ] Atualizar NotificationContext
- [ ] Manter fallback local
- [ ] Testar sincronização

**Dependências**: Issue #3

**Estimativa**: 0.5 dia

Labels: `enhancement`, `frontend`, `sprint-2`, `high-priority`
```

- [ ] Issues criadas no GitHub
- [ ] Labels configuradas
- [ ] Milestone "Sprint 1" criada
- [ ] Milestone "Sprint 2" criada

---

## 🚀 Fase 4: Desenvolvimento (Começar!)

### Sprint 1: Formulário Público

#### Backend (1 dia)

**1. Criar Migration**
```bash
cd backend
```

- [ ] Criar arquivo: `src/main/resources/db/migration/V4__public_forms.sql`
```sql
CREATE TABLE public_form_configs (
    id UUID NOT NULL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(512) NOT NULL,
    description TEXT,
    logo_url VARCHAR(1024),
    social_links JSON,
    custom_fields JSON,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE form_submissions (
    id UUID NOT NULL PRIMARY KEY,
    form_config_id UUID NOT NULL REFERENCES public_form_configs(id),
    submitted_data JSON NOT NULL,
    status VARCHAR(32) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_form_submissions_form_config_id ON form_submissions(form_config_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
```

**2. Criar Entities**

- [ ] `src/main/java/com/agenciahub/api/entity/PublicFormConfig.java`
- [ ] `src/main/java/com/agenciahub/api/entity/FormSubmission.java`

**3. Criar Domain Enums**

- [ ] `src/main/java/com/agenciahub/api/domain/FormSubmissionStatus.java`
  - PENDING, IMPORTED, REJECTED

**4. Criar DTOs**

- [ ] `src/main/java/com/agenciahub/api/dto/form/PublicFormConfigResponse.java`
- [ ] `src/main/java/com/agenciahub/api/dto/form/SubmitFormRequest.java`
- [ ] `src/main/java/com/agenciahub/api/dto/form/FormSubmissionResponse.java`

**5. Criar Repositories**

- [ ] `src/main/java/com/agenciahub/api/repository/PublicFormConfigRepository.java`
- [ ] `src/main/java/com/agenciahub/api/repository/FormSubmissionRepository.java`

**6. Criar Services**

- [ ] `src/main/java/com/agenciahub/api/service/PublicFormService.java`
- [ ] `src/main/java/com/agenciahub/api/service/FormSubmissionService.java`

**7. Criar Controllers**

- [ ] `src/main/java/com/agenciahub/api/controller/PublicFormController.java`
- [ ] `src/main/java/com/agenciahub/api/controller/FormSubmissionController.java`

**8. Testar**

- [ ] Rodar aplicação: `mvn spring-boot:run`
- [ ] Acessar Swagger UI
- [ ] Testar cada endpoint
- [ ] Verificar dados no PostgreSQL

#### Frontend (0.5 dia)

**1. Criar Integrações**

- [ ] `src/lib/api/form-types.ts` (tipos da API)
- [ ] `src/lib/api/submit-form-remote.ts`
- [ ] `src/lib/api/list-submissions-remote.ts`
- [ ] `src/lib/api/import-submission-remote.ts`

**2. Atualizar Componentes**

- [ ] Atualizar `src/components/cotacao/ImportarSubmissaoModal.tsx`
- [ ] Atualizar página de submissões (se existir)

**3. Testar**

- [ ] Submeter formulário público
- [ ] Verificar submissão no backend (Swagger ou DB)
- [ ] Listar submissões pendentes
- [ ] Importar submissão para cotação
- [ ] Verificar cotação criada

**4. Commit e PR**

```bash
# Backend
cd backend
git checkout -b feature/sprint-1-public-forms-backend
git add .
git commit -m "feat: implementa backend para formulário público"
git push origin feature/sprint-1-public-forms-backend
# Criar PR no GitHub

# Frontend
cd frontend
git checkout -b feature/sprint-1-public-forms-frontend
git add .
git commit -m "feat: integra formulário público com API"
git push origin feature/sprint-1-public-forms-frontend
# Criar PR no GitHub
```

- [ ] PR backend criado
- [ ] PR frontend criado
- [ ] PRs revisados e merged
- [ ] Issue #1 fechada
- [ ] Issue #2 fechada
- [ ] `INTEGRATION_STATUS.md` atualizado

---

## 📊 Fase 5: Acompanhamento

### Após cada Sprint

- [ ] Atualizar `INTEGRATION_STATUS.md`
- [ ] Fechar issues relacionadas
- [ ] Criar tag de versão (opcional)
  ```bash
  git tag -a v0.1.0 -m "Sprint 1 completa"
  git push origin v0.1.0
  ```
- [ ] Documentar mudanças em CHANGELOG.md (criar se não existir)
- [ ] Testar integração end-to-end
- [ ] Deploy em staging (quando disponível)

### Métricas

Acompanhe em `INTEGRATION_STATUS.md`:
- [ ] % de endpoints implementados
- [ ] % de integrações completas
- [ ] Issues abertas vs fechadas
- [ ] Tempo por sprint

---

## 🎯 Próximos Passos

### Hoje
- [ ] ✅ Completar Fase 1 (Preparação)
- [ ] ✅ Completar Fase 2 (GitHub)
- [ ] ✅ Completar Fase 3 (Planejamento)

### Amanhã
- [ ] 🚀 Iniciar Sprint 1 (Backend)
- [ ] 🚀 Completar Sprint 1 (Backend)

### Esta Semana
- [ ] ✅ Completar Sprint 1 (Frontend)
- [ ] ✅ Testar integração completa
- [ ] 🚀 Iniciar Sprint 2 (Notificações)

### Próximas 2 Semanas
- [ ] Completar Sprints 1-2
- [ ] Iniciar Sprint 3
- [ ] Configurar CI/CD básico

---

## 💡 Dicas

### Produtividade
- Use Swagger UI para testar backend antes de integrar
- Commit frequentemente (a cada feature pequena)
- Faça PRs mesmo trabalhando sozinho (histórico)
- Use branches descritivas: `feature/sprint-X-nome`

### Debug
- Backend: Logs no console do Spring Boot
- Frontend: React DevTools + Console
- Database: DBeaver ou pgAdmin
- API: Postman/Insomnia para testes manuais

### Quando Travar
1. Consulte a documentação criada
2. Verifique Swagger UI
3. Revise `API_CONTRACT.md`
4. Verifique logs de erro
5. Teste endpoint isoladamente

---

## ✅ Checklist Final

Antes de considerar uma sprint completa:

- [ ] Código funciona localmente
- [ ] Testes manuais passaram
- [ ] Documentação atualizada
- [ ] Commits com mensagens claras
- [ ] PR criado e revisado
- [ ] Issues fechadas
- [ ] `INTEGRATION_STATUS.md` atualizado

---

## 🎉 Pronto para Começar!

Você tem tudo que precisa:
- ✅ Ambiente configurado
- ✅ Documentação completa
- ✅ Plano de execução
- ✅ Issues criadas
- ✅ Checklist de acompanhamento

**Próximo passo**: Fase 1 - Preparação!

**Boa sorte!** 🚀

---

**Dúvidas?** Consulte:
- `RESUMO_ANALISE.md` - Visão geral
- `ESTRATEGIA_DESENVOLVIMENTO.md` - Plano detalhado
- `API_CONTRACT.md` - Endpoints
- `INTEGRATION_STATUS.md` - Status atual
