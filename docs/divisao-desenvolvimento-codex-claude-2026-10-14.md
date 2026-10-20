# Divisão de desenvolvimento — Codex e Claude

Atualizado em 20/10/2026. F02/F03/F07 do Claude publicados. Codex integrou F07/V59 (API #65/UI #58), F01/V60 (API #63/UI #56) e simulações por cliente/V61 (API #64/UI #57), API antes da UI, migrations sequenciais e deploys confirmados. Claude segue etapas F10/TODO-050 com V62 reservada; Codex segue F08, ainda sem reserva. Demais frentes mantêm seus donos. Referências: registros de publicação de agenda, checklists e simulações por cliente, e migrations-reservadas-2026-10-15.md.

**Atualização de acompanhamento:** TODO-052 registra o vínculo das simulações de acúmulo ao cliente, sob Codex, como subentrega da evolução F06/TODO-043 em PRs próprios (`codex/f06-simulacoes-cliente`). Calcular pode ser avulso; salvar novo plano exige pessoa da mesma agência. Cenários legados só recebem vínculo por revisão explícita. Não muda a divisão das cinco frentes de cada agente. Integrações de contratos concluídas em TODO-046. A decisão futura de retenção/anonimização permanece explícita: pedidos com contratos ficam pendentes para revisão, sem confirmação parcial.

**Orientação posterior do usuário — dois produtos:** Viagens e Milhas terão áreas e fluxos próprios, compartilhando a identidade da pessoa. Carteira/perfil e simulador ficam em Milhas. Uma passagem emitida com milhas continua em Viagens. Antes de desenvolver F02, F01, F07, F08, F09 ou F11, ler `dominios-viagens-milhas-2026-10-14.md`: contratos/tarefas/atendimentos que servem aos dois mundos devem identificar explicitamente `TRAVEL` ou `MILES`, com ciclos de vida e indicadores próprios. A separação estrutural foi publicada pelo Codex (TODO-051, PRs API #60/interface #53), antes das integrações seguintes; não muda as cinco frentes do Claude.

## Base disponível e entregas concluídas

Frontend: `C:/workspace-pessoal/agencia-hub`, repositório `Felipendev/agencia-hub`, Next.js 16.2.6 / React 19 / Tailwind 4. API: `C:/workspace-pessoal/agencia-hub-api`, repositório `Felipendev/agencia-hub-api`, Spring Boot / Java 21 / PostgreSQL / Flyway.

Na data deste acordo, produção contém frontend `27ad5aaccd7a55291c78353b64b5a6d55adf95c5` e API `6ca4dce21530625b9aed9d89042191901960772f`, com migrações até V55. São referências históricas; novas branches partem do `origin/main` atualizado.

| Entrega realizada pelo Codex | Estado e limites |
|---|---|
| Correções de lucro/financeiro e vínculo cotação → viagem | Publicadas. Não reconstruir o fluxo comercial em outro módulo. |
| Calculadora de voos, comparativo de preços, DDI editável e sessão ampliada | Publicados; manutenção permanece com Codex. |
| F06 — Simulador de acúmulo, TODO-038 | CRUD completo publicado, edição pelo mesmo ID, histórico, duplicação separada e exclusão. |
| F04 — Carteira manual, TODO-040 | Publicada: perfil, contas, cartões, clubes, vencimentos, movimentos, estorno e histórico. Diagnóstico público e integração F01 ainda faltam. |
| Parte de F10 — Biblioteca | CRUD publicado, incluindo edição/exclusão dos links próprios da agência e substituição de arquivo. A extensão de etapas de viagem ainda falta. |
| TODO-039 — Prevenção de viagens duplicadas | Publicada. Consolidação dos registros legados ainda depende de revisão dos vínculos; não apagar automaticamente. |

O leitor de prints voltou a funcionar nos testes disponíveis. O diagnóstico adicional foi pausado a pedido do usuário; não alegar uma nova correção ou publicar o stash de diagnóstico junto a outra feature. Login exclusivo de desenvolvimento também permanece fora das entregas.

## Divisão das dez frentes e estado atual

A divisão é de cinco frentes para cada agente. O esforço não é uma estimativa de horas: estoque e créditos de indicação têm decisões de negócio pendentes, uma em cada fluxo.

| ID | Dono | Frente | Começo e critério principal | Branch nos dois repositórios |
|---|---|---|---|---|
| TODO-041 | Codex | F01 — Checklists e rotinas | Publicada em 20/10, API #63/UI #56, V60. Modelos, tarefas avulsas e execuções por período; responsável, prazo, conclusão/cancelamento auditados; criação a partir de modelo sem repetição de efeito. | `codex/f01-checklists` |
| TODO-042 | Codex | F08 — Follow-up comercial | Próxima ação, data e responsável por pessoa/prospecto, filtros de atrasados/hoje/próximos; concluir/reprogramar mantém histórico. | `codex/f08-follow-up` |
| TODO-043 | Codex | Evolução F04 e conexão F06 | Diagnóstico público com revisão autenticada, plano → tarefas após F01, uso opcional de cartões no simulador. Nunca sobrescrever carteira com telefone/e-mail enviados por visitante. | `codex/f04-diagnostico-integracoes` |
| TODO-044 | Codex | F11 — Exportação consolidada | Histórico e exportação seletiva por pessoa/período, aproveitando o que existe. Cada dono implementa a auditoria do próprio módulo; Codex integra as exportações. | `codex/f11-historico-exportacao` |
| TODO-045 | Codex | F05 — Lotes e reservas | Condicionada: definir custódia, titularidade, custo, reservas e cancelamentos antes de debitar/reservar milhas reais. | `codex/f05-lotes-reservas` |
| TODO-046 | Claude | F02 — Contratos | Concluída e publicada em 15/10 (API #61/UI #54). Modelos da agência, preenchimento/revisão, documento versionado, evidência de assinatura e cancelamento. CRUD de modelos/rascunhos e preservação de documentos emitidos. | `claude/f02-contratos` |
| TODO-047 | Claude | F03 — Economia do cliente | Concluída e publicada, API #62/UI #55, V58. Comparação documentada, CRUD/versões e relatório revisado. | `claude/f03-economia-cliente` |
| TODO-048 | Claude | F07 — Agenda e atas | Publicada em 20/10, API #65/UI #58, V59. Compromissos, responsáveis e atas consultáveis, edição/cancelamento apropriados e fuso consistente. Conexão com tarefas fica para um PR de integração após F01. | `claude/f07-agenda-atas` |
| TODO-049 | Claude | F09 — Indicações | Cadastro e acompanhamento indicador/indicado, origem e estado. Créditos/resgate financeiro condicionados à definição do gatilho e regras de estorno. | `claude/f09-indicacoes` |
| TODO-050 | Claude | Extensão F10 — Etapas de viagem | Hotel, transfer e atividades com datas, observações e anexos, reutilizando vínculos existentes. Sem duplicar trechos, anexos ou criar despesas automaticamente. | `claude/f10-etapas-viagem` |

F01 e vínculo de simulações publicados. Ordem restante Codex: F08 → evolução F04/F06 → F11; F05 quando houver regra definida. Ordem restante Claude: etapas F10/V62; cadastro de indicações pode avançar sem automatizar créditos. Agenda e etapas não dependem de F01 para seu CRUD; conexões com tarefas aguardam contrato real. Publicação obedece às reservas de migrations.

## Donos dos arquivos e módulos

| Responsável | Área própria |
|---|---|
| Codex | Carteira, simulador, tarefas/rotinas, follow-up, estoque/reservas, exportador consolidado e manutenção de Biblioteca, autenticação, calculadora, cotações/viagens/financeiro existentes. |
| Claude | Novos módulos de contratos, economia, agenda/atas, indicações e etapas de viagem, incluindo UI, API, persistência, validação e testes dessas áreas. |
| Cada agente | Auditoria e documentação de seus próprios módulos; alterações e testes dentro da branch da feature. |
| Codex, como integrador | Backlog global, entradas de menu, página principal da pessoa/viagem, contratos entre módulos, numeração final das migrações e ordenação de merges/publicações. |

Para Claude, preferir rotas próprias `/contratos`, `/economia`, `/agenda`, `/indicacoes` e `/viagens/[id]/etapas`, com componentes/utilitários próprios e serviços/controllers/tabelas do respectivo domínio. Os nomes são propostas de organização; confirme as rotas existentes antes de criar. Bibliotecas UI, CRM e APIs já publicados podem ser consumidos e lidos sem reconstrução.

Arquivos compartilhados incluem `src/components/layout/dashboard-shell.tsx`, `src/app/(app)/clientes/[id]/page.tsx`, `src/app/(app)/viagens/[id]/page.tsx`, contexts globais, `src/types/index.ts`, autenticação, handlers gerais, configuração de segurança/deploy, entidades/controllers centrais de CRM/viagem/financeiro e `sdd/backlog.md`. Não são proibidos para sempre: uma necessidade deve ser descrita em `docs/coordination/requests/<agente>-<feature>.md`, com o contrato/entrada pretendidos. Codex prepara um PR de integração pequeno, ou atribui explicitamente a alteração a um único dono. Não editar silenciosamente o mesmo arquivo em duas branches.

Claude registra progresso em `docs/coordination/claude/<feature>.md`; Codex usa `docs/coordination/codex/<feature>.md` e consolida o backlog. Nunca reverter o trabalho do outro agente para resolver conflito.

## Worktrees e branches independentes

Cada feature tem um checkout próprio em cada repositório. Não trabalhar os dois agentes no diretório original nem usar a mesma branch para módulos diferentes. Preserve as alterações locais existentes. Antes de criar um caminho ou branch, confira se já existe e reutilize apenas se pertence à própria tarefa e está adequada; não resetar ou sobrescrever um checkout de outro trabalho.

Exemplo para o início do Claude, em PowerShell, após confirmar que caminhos/branches ainda não existem:

```powershell
git -C C:/workspace-pessoal/agencia-hub fetch origin main
git -C C:/workspace-pessoal/agencia-hub worktree add -b claude/f02-contratos C:/workspace-pessoal/claude-agencia-hub-f02 origin/main
git -C C:/workspace-pessoal/agencia-hub-api fetch origin main
git -C C:/workspace-pessoal/agencia-hub-api worktree add -b claude/f02-contratos C:/workspace-pessoal/claude-agencia-hub-api-f02 origin/main
```

Codex usa o equivalente com `codex/f01-checklists` e caminhos próprios `codex-agencia-hub-f01` / `codex-agencia-hub-api-f01`. Os comandos são preparação para cada agente; este acordo não afirma que esses checkouts já foram criados.

Proteger alterações locais de desenvolvimento: `src/app/login/login-form.tsx`, `src/contexts/auth-context.tsx`, `src/lib/local-login.ts`, `docs/local-login.md` e `LocalLoginController.java` da API. Não usar `git add .`, reset destrutivo ou transportar todos os arquivos não rastreados. Selecionar apenas arquivos da feature no commit. O backend tem um stash de diagnóstico do leitor de prints que não pertence às novas tarefas.

## Migrações sem colisões nem dependência de ordem de desenvolvimento

Não reservar V56–V79 para um agente e V80–V99 para outro: se a faixa alta entrar primeiro, uma migração baixa posterior pode não ser aplicada pelo Flyway na configuração normal.

Não usar números provisórios nem repetir números entre agentes, mesmo em branches isoladas. Antes de escrever SQL, registrar a reserva no documento `migrations-reservadas-2026-10-15.md`. Reservas iniciais: V58 F03/Claude com integração Codex; V59 F07/Claude; V60 F01/Codex; V61 vínculo de simulações ao cliente/Codex. Demais features aguardam reserva explícita. Esta regra substitui a orientação anterior de numeração provisória.

Ordem obrigatória de integração e publicação: V58 → V59 → V60 → V61. Desenvolvimento pode ser paralelo; o merge de uma versão espera as anteriores, com branch atualizada e teste de atualização do banco. Se uma feature precisar de mais migrations, o integrador revisa as reservas antes de qualquer execução; ninguém toma um número reservado. Não renumerar migrations já executadas, habilitar `outOfOrder`, reparar checksums para esconder alterações ou recriar bancos com dados reais. Prévia que já executou uma numeração experimental usa novo esquema isolado validado, preservando o anterior. Ver protocolo e situação dos ambientes no documento de reservas.

## Contratos entre módulos

- IDs e valores de agência são resolvidos pela sessão autorizada, nunca confiados apenas ao corpo. Toda referência a pessoa, viagem, cotação, responsável ou recebível deve validar agência e vínculo apropriado.
- Contratos, economia, agenda, indicações e etapas têm persistência e auditoria próprias. Consumir os IDs e APIs existentes; não refatorar CRM/financeiro/carteira para iniciar um módulo.
- Vínculo contrato → recebível é opcional e explícito. Não criar segunda venda/receita ao salvar/assinar um contrato.
- F01 está publicado; consultar o contrato efetivo em docs/f01-checklists-2026-10-20.md e na API antes de implementar integrações de tarefas. Agenda/atas não criam tarefas automaticamente; essa conexão exige PR próprio e testes de idempotência, permissões e separação de produtos.
- Auditoria de cada domínio inclui recurso, ação, autor e data, sem senha/token. F11 consolida dados já disponibilizados, sem assumir controle das escritas dos módulos de Claude.
- Alteração de contrato compartilhado exige um PR próprio, compatibilidade ou versão nova, atualização dos consumidores e testes. Não mudar simultaneamente o mesmo contrato em duas features.

## PRs, revisão e publicação

Uma feature por branch e PR em cada repositório afetado, com título `[F02][API] ...` / `[F02][UI] ...`, por exemplo. Se uma feature for grande, dividir em partes realmente revisáveis com dependências explícitas; não juntar vários módulos em um PR. O PR de UI referencia o PR de API e vice-versa.

Claude abre PRs inicialmente em rascunho e entrega commits, links, critérios de aceite, testes executados, migrações, dependências e mudanças compartilhadas solicitadas. Não faz push direto em `main`, merge de feature alheia ou publicação concorrente em produção. Codex revisa a integração e ordena os merges, respeitando as regras de revisão do repositório. A autorização anterior de publicação continua válida; o fluxo atual passa por PRs isolados.

Para mudanças aditivas, publicar API compatível primeiro e UI depois. Preview de UI deve usar a API da feature em ambiente de teste quando disponível; se esse ambiente não existir, registrar validação local e não alegar um teste completo apontando UI nova para uma API antiga. Nunca aplicar migrations de branches de dois agentes no mesmo banco de desenvolvimento compartilhado.

A CI atual valida tipos/estilo/build do frontend e compile/migrations/package do backend, mas não executa os testes de negócio automaticamente. Cada PR precisa registrar os testes adequados executados separadamente; CI verde sozinha não prova CRUD, concorrência ou isolamento. Conferir o workflow novamente antes de usar esta observação, pois ele pode mudar.

## Critérios de conclusão comuns

CRUD completo onde aplicável, mantendo o ID na edição; persistência após recarregar e consulta por membro autorizado; isolamento por agência e permissões; sucesso somente após API; erro recuperável sem perda desnecessária do rascunho. Histórico financeiro/documentos emitidos/movimentações usam cancelamento, arquivamento, estorno ou versões, com motivo explicado na UI e no backlog.

Cobrir fluxos e falhas importantes, repetição/concorrência quando há efeito de negócio, limites de anexos, datas/fuso e ausência de dados. Tipos, estilo, build e testes pertinentes devem passar. Não armazenar senhas de programas ou número completo de cartão; não criar gravações de tela. Não marcar como entregue um item que só tem botão, mock, armazenamento local ou CRUD incompleto.

Os trechos de setembro do backlog são históricos. As antigas proibições de testes e caminhos inexistentes não representam a autorização atual. Ler AGENTS.md de ambos os repositórios e a documentação instalada do Next antes de escrever código. Não depender de `../milhas-hub`, ausente neste workspace.

## Primeiro passo de cada agente

Codex: F01 e TODO-052 publicados após F07. Próxima frente: F08, ainda sem migration reservada; registrar reserva antes de criar SQL.

Claude: partir de origin/main atualizada, iniciar TODO-050/F10 na branch `claude/f10-etapas-viagem`, com V62 reservada para um arquivo. F07 está publicado; não alterar V59/V60/V61. Entregar API/UI em PRs isolados. O prompt vigente está em `prompt-claude-agencia-hub-2026-10-14.md`.
