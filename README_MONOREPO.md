# AgenciaHub

Sistema completo de gestão para agências de viagem - CRM, cotações e financeiro.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-green)](https://spring.io/projects/spring-boot)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Java](https://img.shields.io/badge/Java-17-orange)](https://openjdk.org/)

---

## 📦 Estrutura do Projeto

```
agencia-hub/
├── frontend/          # Next.js 16 + TypeScript + Tailwind CSS 4
├── backend/           # Spring Boot 3.4 + Java 17 + PostgreSQL
├── docs/              # Documentação compartilhada
├── .github/           # GitHub Actions (CI/CD)
├── LICENSE            # MIT License
└── README.md          # Este arquivo
```

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** 20+ e npm
- **Java** 17+
- **Maven** 3.8+
- **Docker** e Docker Compose (para PostgreSQL)
- **Git**

### 1. Clone o Repositório

```bash
git clone https://github.com/SEU_USUARIO/agencia-hub.git
cd agencia-hub
```

### 2. Backend (Spring Boot)

```bash
cd backend

# Subir PostgreSQL
docker compose up -d

# Verificar se está rodando
docker compose ps

# Rodar aplicação
export SPRING_PROFILES_ACTIVE=docker
mvn spring-boot:run
```

**Endpoints**:
- API Base: http://localhost:8080/api/v1
- Swagger UI: http://localhost:8080/api/v1/swagger-ui/index.html
- OpenAPI JSON: http://localhost:8080/api/v1/v3/api-docs

### 3. Frontend (Next.js)

```bash
cd frontend

# Instalar dependências
npm install

# Rodar em desenvolvimento
NEXT_PUBLIC_AGENCIA_HUB_API_URL=http://localhost:8080/api/v1 npm run dev
```

**Acesso**:
- Frontend: http://localhost:3000
- Login: qualquer email/senha (MVP)

---

## 📚 Documentação

### Essencial
- **[Estratégia de Desenvolvimento](./docs/ESTRATEGIA_DESENVOLVIMENTO.md)** - Plano completo, sprints e arquitetura
- **[Contratos de API](./docs/API_CONTRACT.md)** - Documentação de todos endpoints
- **[Status de Integração](./docs/INTEGRATION_STATUS.md)** - Progresso da integração frontend-backend

### Contribuição
- **[Como Contribuir](./docs/CONTRIBUTING.md)** - Guia para contribuidores
- **[Setup no GitHub](./docs/GITHUB_SETUP.md)** - Configuração de repositórios

### Projetos
- **[Frontend README](./frontend/README.md)** - Detalhes do Next.js
- **[Backend README](./backend/README.md)** - Detalhes do Spring Boot

---

## 🎯 Funcionalidades

### ✅ Implementado

#### Gestão de Clientes
- CRUD completo com 30+ campos
- Documentos, endereço, contatos de emergência
- Filtros e busca avançada
- Timeline de atividades

#### Sistema de Cotações
- Quadro Kanban com 7 status
- Formulário detalhado (40+ campos)
- Integração com API Spring Boot
- Envio direto no WhatsApp

#### Formulário Público
- Páginas customizáveis por slug
- Logo e branding personalizados
- Links sociais
- Fila de submissões

#### Financeiro
- Lançamentos com categorias
- Filtros por período, tipo, status
- KPIs dinâmicos
- Vinculação com clientes

#### Produtividade
- Notificações de cotações vencendo
- Busca global (Cmd+K / Ctrl+K)
- Toast notifications
- Histórico completo

### 🚧 Em Desenvolvimento

- [ ] Integração completa frontend-backend
- [ ] Autenticação JWT
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Dashboard com gráficos
- [ ] Drag & Drop no Kanban

---

## 🛠️ Stack Tecnológica

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript 5
- **Estilo**: Tailwind CSS 4
- **State**: React Context API
- **Validação**: Zod (planejado)

### Backend
- **Framework**: Spring Boot 3.4
- **Linguagem**: Java 17
- **Banco**: PostgreSQL 16
- **ORM**: Spring Data JPA + Hibernate
- **Migrations**: Flyway
- **Docs**: OpenAPI 3 (Swagger UI)
- **Build**: Maven

### DevOps
- **Containers**: Docker + Docker Compose
- **CI/CD**: GitHub Actions (planejado)
- **Deploy**: Vercel (frontend) + Railway/Render (backend)

---

## 📊 Status do Projeto

| Módulo | Backend | Frontend | Integração |
|--------|---------|----------|------------|
| Customers | ✅ | ✅ | 🟡 Parcial |
| Quotations | ✅ | ✅ | ✅ Completo |
| Opportunities | ✅ | ✅ | 🔴 Pendente |
| Financial | ✅ | ✅ | 🔴 Pendente |
| Public Forms | 🔴 | ✅ | 🔴 Pendente |
| Notifications | 🔴 | ✅ | 🔴 Pendente |
| Timeline | 🔴 | ✅ | 🔴 Pendente |
| Search | 🔴 | ✅ | 🔴 Pendente |
| Auth | 🔴 | 🟡 Mock | 🔴 Pendente |

**Legenda**: ✅ Completo | 🟡 Parcial | 🔴 Pendente

Ver [Status de Integração](./docs/INTEGRATION_STATUS.md) para detalhes.

---

## 🧪 Testes

### Backend

```bash
cd backend

# Testes unitários
mvn test

# Testes de integração
mvn verify

# Com cobertura
mvn test jacoco:report
# Relatório: target/site/jacoco/index.html
```

### Frontend

```bash
cd frontend

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build
```

---

## 🚀 Deploy

### Frontend (Vercel)

```bash
cd frontend

# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Produção
vercel --prod
```

**Variáveis de ambiente**:
- `NEXT_PUBLIC_AGENCIA_HUB_API_URL` - URL da API backend

### Backend (Railway/Render)

1. Conectar repositório
2. Configurar build:
   - Build command: `mvn clean package -DskipTests`
   - Start command: `java -jar target/agencia-hub-api-0.1.0-SNAPSHOT.jar`
3. Adicionar PostgreSQL addon
4. Configurar variáveis:
   - `SPRING_PROFILES_ACTIVE=prod`
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia o [Guia de Contribuição](./docs/CONTRIBUTING.md).

### Processo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

### Convenções de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova feature
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Tarefas gerais

---

## 📝 Roadmap

### Sprint 1: Formulário Público (1-2 dias)
- [ ] Backend: Criar entities e endpoints
- [ ] Frontend: Integrar com API
- [ ] Testar fluxo completo

### Sprint 2: Notificações (1 dia)
- [ ] Backend: Sistema de notificações
- [ ] Frontend: Integrar com API
- [ ] Job agendado para alertas

### Sprint 3: Timeline (1 dia)
- [ ] Backend: Activity logs
- [ ] Frontend: Integrar com API
- [ ] Auto-log de mudanças

### Sprint 4: Busca Global (0.5 dia)
- [ ] Backend: Endpoint unificado
- [ ] Frontend: Integrar com API

### Sprint 5: Melhorias (1-2 dias)
- [ ] Completar campos faltantes
- [ ] Adicionar paginação
- [ ] Melhorar performance

### Sprint 6: Autenticação (2-3 dias)
- [ ] Backend: Spring Security + JWT
- [ ] Frontend: Fluxo de login real
- [ ] Multi-usuário

Ver [Estratégia de Desenvolvimento](./docs/ESTRATEGIA_DESENVOLVIMENTO.md) para detalhes.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

## 👥 Autores

- **Equipe AgenciaHub** - *Desenvolvimento inicial*

---

## 🙏 Agradecimentos

- Next.js team pela excelente framework
- Spring Boot team pela robustez
- Comunidade open source

---

## 📞 Suporte

- 📧 Email: suporte@agenciahub.com (exemplo)
- 🐛 Issues: [GitHub Issues](../../issues)
- 💬 Discussions: [GitHub Discussions](../../discussions)

---

**Versão**: 2.0 Professional  
**Última atualização**: Maio 2026

---

<p align="center">
  Feito com ❤️ pela equipe AgenciaHub
</p>
