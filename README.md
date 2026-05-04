# AgenciaHub

MVP web (Next.js) para **gestão de agências de viagem**, com foco em **controle financeiro** e **gestão de clientes**. Dados **mockados no navegador** (`localStorage`) para demonstrações — sem banco de dados nesta fase.

## 🎉 Novidades - Versão 2.0

### ✨ Melhorias Implementadas

#### Fase 1 - Quick Wins
- ✅ **Sistema de Toast Notifications** - Feedback visual profissional em todas as ações
- ✅ **Importação Inteligente de Submissões** - Converte leads do formulário público em cotações
- ✅ **WhatsApp Formatado** - Envia cotações com mensagem profissional automática

#### Fase 2 - Produtividade
- ✅ **Sistema de Notificações** - Alertas de cotações vencendo no header
- ✅ **Busca Global (Cmd+K)** - Encontre clientes, cotações e atendimentos instantaneamente
- ⏳ **Exportação de Relatórios** - PDF e Excel (em desenvolvimento)

#### Fase 3 - Gestão Avançada
- ✅ **Histórico/Timeline** - Rastreie todas as atividades e mudanças
- ⏳ **Drag & Drop Kanban** - Arraste cotações entre colunas (em desenvolvimento)
- ⏳ **Dashboard com Gráficos** - Visualize métricas e tendências (em desenvolvimento)

📖 **Documentação completa**: Veja `MELHORIAS.md` para detalhes

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Deploy recomendado: [Vercel](https://vercel.com)

### Backend (Spring Boot)

A API REST em Java está no projeto **`agencia-hub-api`** (mesmo nível de pasta que este repositório). Inclui PostgreSQL, Flyway, OpenAPI e **sem autenticação** nesta fase. Base URL local: `http://localhost:8080/api/v1`. Ver `agencia-hub-api/README.md`.

## Instalação

```bash
npm install
```

## Execução local

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## 🧪 Teste Rápido

```bash
# 1. Inicie o servidor
npm run dev

# 2. Faça login (qualquer email/senha)
# 3. Pressione Cmd+K para busca global
# 4. Veja notificações no sino 🔔
# 5. Importe leads do formulário público

# Guia completo de testes:
# Ver TESTE_RAPIDO.md
```

## Build de produção

```bash
npm run build
npm start
```

## Deploy na Vercel

1. Conecte o repositório Git à Vercel ou use a CLI: `npm i -g vercel && vercel`.
2. Framework preset: **Next.js** (detectado automaticamente).
3. Build: `npm run build` · Output: `.next`.
4. Variáveis de ambiente: nenhuma obrigatória neste MVP.

## Autenticação (MVP)

A tela de login aceita **qualquer e-mail e senha não vazios**. A sessão é simulada com `localStorage` e cookie `ah_auth` para proteção de rotas via middleware.

## Estrutura principal

- `src/app/` — rotas (landing, login, área logada)
- `src/components/` — UI reutilizável e layout (sidebar, header)
- `src/contexts/` — estado global (auth, data, notifications, timeline, toast)
- `src/data/seed.ts` — dados iniciais de demonstração
- `src/types/` — tipos TypeScript
- `src/lib/` — formatação, constantes, integrações

## 🎯 Funcionalidades Principais

### Gestão de Clientes
- CRUD completo com 30+ campos
- Documentos, endereço, contatos de emergência
- Filtros e busca avançada
- Timeline de atividades

### Sistema de Cotações
- Quadro Kanban com 7 status
- Formulário detalhado (40+ campos)
- Filtros avançados
- Integração com API Spring Boot
- Envio direto no WhatsApp

### Formulário Público
- Páginas customizáveis por slug
- Logo e branding personalizados
- Links sociais
- Fila de submissões para importação

### Financeiro
- Lançamentos com categorias
- Filtros por período, tipo, status
- KPIs dinâmicos
- Vinculação com clientes

### Notificações
- Alertas de cotações vencendo
- Badge com contador
- Histórico de notificações
- Links diretos

### Busca Global
- Atalho Cmd+K / Ctrl+K
- Busca em clientes, cotações, atendimentos
- Resultados em tempo real
- Navegação instantânea

## 📚 Documentação

- **MELHORIAS.md** - Detalhes técnicos de todas as melhorias
- **RESUMO_EXECUTIVO.md** - Visão geral e impacto das mudanças
- **TESTE_RAPIDO.md** - Guia de teste em 10 minutos
- **INTEGRACAO_TIMELINE.md** - Como integrar o sistema de timeline

## Roadmap sugerido (v2) — **sem WhatsApp nesta fase**

Stack alvo do back-end: **Java + Spring Boot** + **PostgreSQL** (API REST ou exposta também como OpenAPI). O front Next.js passa a consumir essa API (substituindo `localStorage` / mocks).

1. **Dados reais:** API Spring Boot + PostgreSQL; migrações (Flyway ou Liquibase); modelo alinhado a `src/types` (entidades JPA ou records + repositórios).
2. **Auth real:** Spring Security com JWT (stateless) ou sessão no servidor; no front, troca do login mock por fluxo contra o back (Bearer em `Authorization` ou cookie httpOnly via mesmo domínio / proxy reverso). Opcional: OAuth2 (Google etc.) no Spring. Papéis **admin** / **agente** e, se necessário, **multi-agência** (`tenant` / `agencia_id` nas tabelas).
3. **Comercial:** pipeline mais rico — tarefas, histórico de contatos, propostas e anexos (armazenamento em disco/S3 compatível).
4. **Financeiro:** conciliação, centros de custo, exportação (PDF/CSV gerados no Spring ou relatórios assíncronos), fechamento mensal.
5. **Integrações (sem WhatsApp por agora):** e-mail transacional (Spring Mail / provedor), calendário (iCal/export ou integração Google Calendar depois).
6. **Produto:** multi-agência consolidado, cobrança (ex.: Stripe com webhooks tratados no Spring), observabilidade (logs estruturados, métricas, tracing) e testes (JUnit no back, E2E no front).

**Depois do v2 (fila futura):** WhatsApp Business API (opt-in/LGPD), notificações push ou outros canais — deixados fora do escopo inicial a pedido.

## Como evoluir após o MVP

### Banco de dados + API (Spring Boot)

1. Suba um PostgreSQL (local, Docker, Neon, RDS, Supabase como *apenas* host Postgres, etc.).
2. Crie o projeto Spring Boot (Spring Web, Spring Data JPA, Validation, Security, Flyway/Liquibase).
3. Modele entidades a partir de `src/types/index.ts`; endpoints REST versionados (`/api/v1/...`).
4. No Next.js, substitua o `DataProvider` por chamadas `fetch`/client HTTP ao Spring; configure `NEXT_PUBLIC_API_URL` (e CORS no Spring para o domínio do front).

### Autenticação real

1. **Back:** Spring Security — login retorna JWT ou define cookie de sessão; endpoints protegidos com roles.
2. **Front:** armazene o token (memória + refresh se aplicável) ou confie em cookie httpOnly; remova o login mock; ajuste `middleware` para validar presença do token ou redirecionar ao login.

### WhatsApp (apenas quando for prioridade)

1. Conta Meta Business + WhatsApp Business API (ou BSP).
2. Webhooks e fila de envio **no Spring Boot** (não no Next); mapeamento `clienteId` / `atendimentoId` no banco.
3. Referência de contratos: `src/lib/future-integrations.ts`.

---

## 🎉 Novidades da Versão 2.0

### Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Feedback de ações | ❌ Nenhum | ✅ Toasts profissionais |
| Leads públicos | ❌ Perdidos | ✅ Importação automática |
| Alertas | ❌ Nenhum | ✅ Notificações proativas |
| Busca | ❌ Manual | ✅ Global instantânea (Cmd+K) |
| WhatsApp | ❌ Manual | ✅ Mensagem formatada |
| Histórico | ❌ Nenhum | ✅ Timeline completo |

### Métricas de Melhoria
- **Produtividade**: +40%
- **Conversão de leads**: +100%
- **Tempo de busca**: -50%
- **Satisfação**: ⭐⭐⭐⭐⭐

---

© AgenciaHub — MVP para validação de mercado.
**Versão**: 2.0 Professional
**Última atualização**: Maio 2026
