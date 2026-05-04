# 🚀 Guia de Setup no GitHub

Este guia te ajuda a hospedar o AgenciaHub no GitHub em poucos passos.

## 📋 Pré-requisitos

- [ ] Git instalado
- [ ] Conta no GitHub
- [ ] Projetos funcionando localmente

## 🎯 Opção 1: Monorepo (Recomendado para início)

Um único repositório contendo frontend e backend.

### Estrutura Final
```
agencia-hub/
├── frontend/          # Projeto Next.js
├── backend/           # Projeto Spring Boot
├── docs/              # Documentação compartilhada
├── .gitignore
├── README.md
└── LICENSE
```

### Passos

#### 1. Criar estrutura de monorepo

```bash
# Criar novo diretório para o monorepo
mkdir agencia-hub-monorepo
cd agencia-hub-monorepo

# Mover projetos existentes
mv ~/agencia-hub ./frontend
mv ~/agencia-hub-api ./backend

# Criar pasta de docs
mkdir docs
```

#### 2. Mover documentação compartilhada

```bash
# Mover arquivos de documentação para docs/
mv frontend/ESTRATEGIA_DESENVOLVIMENTO.md docs/
mv frontend/API_CONTRACT.md docs/
mv frontend/CONTRIBUTING.md docs/
mv frontend/LICENSE ./

# Criar README principal
cat > README.md << 'EOF'
# AgenciaHub

Sistema completo de gestão para agências de viagem.

## 📦 Projetos

- **[Frontend](./frontend)** - Next.js 16 + TypeScript
- **[Backend](./backend)** - Spring Boot 3.4 + PostgreSQL

## 📚 Documentação

- [Estratégia de Desenvolvimento](./docs/ESTRATEGIA_DESENVOLVIMENTO.md)
- [Contratos de API](./docs/API_CONTRACT.md)
- [Como Contribuir](./docs/CONTRIBUTING.md)

## 🚀 Quick Start

### Backend
```bash
cd backend
docker compose up -d
export SPRING_PROFILES_ACTIVE=docker
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
NEXT_PUBLIC_AGENCIA_HUB_API_URL=http://localhost:8080/api/v1 npm run dev
```

Acesse:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api/v1
- Swagger UI: http://localhost:8080/api/v1/swagger-ui/index.html

## 📄 Licença

MIT - veja [LICENSE](./LICENSE)
EOF
```

#### 3. Criar .gitignore principal

```bash
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
```

#### 4. Inicializar Git e fazer primeiro commit

```bash
# Inicializar repositório
git init

# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "chore: initial commit - monorepo setup"
```

#### 5. Criar repositório no GitHub

1. Acesse https://github.com/new
2. Nome: `agencia-hub`
3. Descrição: `Sistema de gestão para agências de viagem`
4. Público ou Privado (sua escolha)
5. **NÃO** inicialize com README, .gitignore ou LICENSE
6. Clique em "Create repository"

#### 6. Conectar e fazer push

```bash
# Adicionar remote (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/agencia-hub.git

# Renomear branch para main (se necessário)
git branch -M main

# Push inicial
git push -u origin main
```

---

## 🎯 Opção 2: Repositórios Separados

Dois repositórios independentes (melhor para times maiores).

### Frontend

```bash
cd ~/agencia-hub

# Verificar se já tem .git
ls -la .git

# Se não tiver, inicializar
git init

# Adicionar arquivos
git add .
git commit -m "chore: initial commit - frontend"

# Criar repo no GitHub: agencia-hub-frontend
# Conectar e push
git remote add origin https://github.com/SEU_USUARIO/agencia-hub-frontend.git
git branch -M main
git push -u origin main
```

### Backend

```bash
cd ~/agencia-hub-api

# Verificar se já tem .git
ls -la .git

# Se não tiver, inicializar
git init

# Adicionar arquivos
git add .
git commit -m "chore: initial commit - backend"

# Criar repo no GitHub: agencia-hub-api
# Conectar e push
git remote add origin https://github.com/SEU_USUARIO/agencia-hub-api.git
git branch -M main
git push -u origin main
```

---

## 🔒 Configurações Recomendadas no GitHub

### 1. Branch Protection (main)

Settings → Branches → Add rule:
- Branch name pattern: `main`
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass (quando CI estiver configurado)
- ✅ Require branches to be up to date

### 2. Issues & Projects

Settings → Features:
- ✅ Issues
- ✅ Projects
- ✅ Discussions (opcional)

### 3. Topics (Tags)

Adicione topics para facilitar descoberta:
- `travel-agency`
- `nextjs`
- `spring-boot`
- `typescript`
- `java`
- `postgresql`
- `crm`

### 4. About

Adicione descrição e website:
- Description: "Sistema de gestão para agências de viagem - CRM, cotações e financeiro"
- Website: (URL do deploy quando disponível)

---

## 📝 Próximos Passos

### 1. Criar Issues Iniciais

Crie issues para as sprints planejadas:

```markdown
**Sprint 1: Formulário Público**
- [ ] Backend: Criar migrations
- [ ] Backend: Implementar endpoints
- [ ] Frontend: Integrar com API
- [ ] Testar fluxo completo

Labels: `enhancement`, `sprint-1`, `high-priority`
```

### 2. Configurar GitHub Actions (CI/CD)

#### Frontend (.github/workflows/frontend-ci.yml)
```yaml
name: Frontend CI

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'frontend/**'
  pull_request:
    branches: [ main ]
    paths:
      - 'frontend/**'

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Type check
      run: npm run type-check || npx tsc --noEmit
    
    - name: Build
      run: npm run build
```

#### Backend (.github/workflows/backend-ci.yml)
```yaml
name: Backend CI

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'backend/**'
  pull_request:
    branches: [ main ]
    paths:
      - 'backend/**'

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: maven
    
    - name: Build with Maven
      run: mvn -B package --file pom.xml
    
    - name: Run tests
      run: mvn test
```

### 3. Criar README.md nos subprojetos

Adicione links para a documentação principal:

**frontend/README.md**:
```markdown
# AgenciaHub Frontend

Ver [documentação principal](../README.md) para setup completo.

## Desenvolvimento

\`\`\`bash
npm install
npm run dev
\`\`\`

## Documentação

- [Estratégia de Desenvolvimento](../docs/ESTRATEGIA_DESENVOLVIMENTO.md)
- [Contratos de API](../docs/API_CONTRACT.md)
```

**backend/README.md**:
```markdown
# AgenciaHub API

Ver [documentação principal](../README.md) para setup completo.

## Desenvolvimento

\`\`\`bash
docker compose up -d
export SPRING_PROFILES_ACTIVE=docker
mvn spring-boot:run
\`\`\`

## Documentação

- [Estratégia de Desenvolvimento](../docs/ESTRATEGIA_DESENVOLVIMENTO.md)
- [Contratos de API](../docs/API_CONTRACT.md)
```

---

## ✅ Checklist Final

Antes de fazer o push inicial:

- [ ] `.gitignore` configurado em ambos projetos
- [ ] Arquivos sensíveis não commitados (.env, credentials, etc)
- [ ] README.md atualizado
- [ ] LICENSE adicionado
- [ ] CONTRIBUTING.md adicionado
- [ ] Documentação revisada
- [ ] Projetos compilam/rodam localmente

Após o push:

- [ ] Branch protection configurada
- [ ] Issues criadas para sprints
- [ ] Topics/tags adicionadas
- [ ] Descrição e about preenchidos
- [ ] CI/CD configurado (opcional)

---

## 🎉 Pronto!

Seu projeto está no GitHub! Agora você pode:

1. Compartilhar com colaboradores
2. Criar issues e milestones
3. Fazer PRs e code reviews
4. Configurar deploy automático
5. Adicionar badges no README

### Badges Sugeridos

```markdown
![Frontend CI](https://github.com/SEU_USUARIO/agencia-hub/workflows/Frontend%20CI/badge.svg)
![Backend CI](https://github.com/SEU_USUARIO/agencia-hub/workflows/Backend%20CI/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-green)
```

---

## 📞 Suporte

Problemas? Verifique:
- Git está instalado: `git --version`
- Autenticação GitHub configurada
- Permissões corretas no repositório

---

**Boa sorte com o projeto!** 🚀
