# Atividades — unificação em cotações (frontend)

**Quando executar:** depois que o backend estiver estável e alinhado ao contrato `/quotations` sem `opportunities` / `opportunityId`.

**Política:** não refatorar o front em paralelo ao back; usar esta lista como backlog único ao iniciar a fase frontend (seguindo `docs/architecture/*` e regras do projeto).

---

## 0. Git e `main` (antes de codar)

1. `git fetch origin main`
2. Com working tree limpo (commit ou `git stash push -u -m "..."` se houver WIP):
   - `git merge origin/main` **ou** `git pull --ff-only origin main` na branch de trabalho.
3. Se houver conflitos: resolver, rodar `npm run build` e testes, só então continuar.

_Nota:_ se o `main` avançar de novo enquanto o back ainda muda, repetir o passo 1–2 antes do merge final do PR do front.

---

## 1. Contrato e documentação de produto

Atualizar textos que ainda descrevem o modelo antigo (grep: `atendimento`, `Atendimento`, `opportunity`, `oportunidade`, `atendimentoId`):

- [ ] `README.md` — busca global, roadmap, exemplos de integração.
- [ ] `API_CONTRACT.md` — remover seção Opportunities; mapear só `Quotation` / DTOs atuais do Spring.
- [ ] `INTEGRATION_STATUS.md` — remover `addAtendimento` / `updateAtendimento`; marcar o que ficou só em cotações.
- [ ] `INTEGRACAO_TIMELINE.md`, `ESTRATEGIA_DESENVOLVIMENTO.md`, `MELHORIAS.md`, `CHANGELOG.md` — alinhar narrativa ao funil único.

---

## 2. Código-fonte (`src/`) — conferir após contrato final do back

Já pode existir WIP na branch (unificação parcial). Revalidar tudo contra a API real:

- [ ] **Tipos** — `Cotacao` sem `atendimentoId`; nenhum tipo `Atendimento` / status duplicado.
- [ ] **`data-context`** — sem `atendimentos` / `addAtendimento`; listagens e mutações de cotação batem com os endpoints finais.
- [ ] **`seed.ts`** — dados de demo só com cotações (sem entidade atendimento).
- [ ] **`lib/api/*`** — `quotation-types`, `quotation-mapper`, `create/update-quotation-remote` sem campos de oportunidade; arquivos `*opportunity*` removidos de forma consistente com imports.
- [ ] **Páginas** — `cotacoes/nova`, `cotacoes/[id]`, `clientes/[id]`, `dashboard`: fluxos e query params (`clienteId`, etc.) iguais ao back.
- [ ] **`/atendimentos`** — manter redirect para `/cotacoes` se quiser URL legada; middleware pode continuar protegendo o path.
- [ ] **Timeline** — eventos `atendimento_*` removidos ou mapeados para eventos de cotação, conforme decisão de produto.
- [ ] **`GlobalSearch` / `dashboard-shell`** — só entidades que existem no domínio (clientes + cotações, etc.).
- [ ] **`notification-context`** (se existir) — sem referências a atendimentos/oportunidades.

---

## 3. Qualidade e App Router

- [ ] `npm run build` e `npm run lint` (ou script equivalente) sem erros.
- [ ] Onde houver `useSearchParams()` em Server/client boundary, validar exigência de **`Suspense`** (regras Next.js App Router).
- [ ] Testes unitários (`*.test.ts`) — ex.: `cotacao-migrate.test.ts` — sem asserts em `atendimentoId`.

---

## 4. Critério de pronto (fase frontend)

- Nenhuma chamada REST a `/opportunities` (ou paths antigos equivalentes).
- UI e cópias falam só em **cotação** como funil operacional (exceto textos genéricos tipo “canais de atendimento” ao cliente = suporte).
- Documentação na raiz do repo reflete o contrato e o estado da integração.
