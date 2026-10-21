# Prompt para Claude — AgênciaHub

**Estado vigente em 21/10/2026:** as cinco frentes atribuídas ao Claude têm código entregue: F02/F03/F07 publicados; F10/V62 e F09/cadastro V63 em PRs, revisados e complementados pelo Codex, ainda não publicados. F10 API #66 e82a06ddab449a1855d0ac2d2c3473a73bf6846a / UI #59 57fdf27cd94d885bd404beb9a6582f75f7ccf37b. F09 API #67 58cd19c231778f6c287fc86aef55fdde0446397e / UI #60 50be3bb52397197fb6fbc8e536471ee0f019e326. Não alterar esses heads durante a integração final.

Codex concluiu navegação, avisos, descarte/privacidade e correções de idempotência/versão. F09 também reutiliza o prospecto já criado se só o vínculo falhar e preserva o contexto de Milhas nos links. Validação local conjunta: 61 testes API e 173 UI aprovados, banco novo e upgrade V62→V63. F10 corrigiu o alvo do seu teste de upgrade para V62, evitando falha quando surgir V63. Detalhes, limitações e branches locais de validação em docs/f09-integracao-2026-10-21.md.

Bloqueio atual: Railway mantém novos builds pausados; produção preservada em V61. Codex valida/publica F10 API #66/V62 antes da UI #59. Só depois atualiza F09 com main, conserva os dois módulos nos conflitos centrais, repete gates/testes no head integrado, valida prévia e publica API #67/V63 antes da UI #60. A CI vermelha de V63 enquanto faltar V62 não deve ser contornada. Não usar placeholders, repair ou outOfOrder.

Nenhuma nova migration autorizada ao Claude além da V63 existente. Créditos F09 continuam fora do escopo: aguardam gatilho, valor, limite, resgate e estorno definidos pela agência. Não iniciar SQL ou automação financeira por suposição. Para qualquer extensão nova, combinar dono, escopo e reserva antes de desenvolver. Codex segue a publicação e depois F08, ainda sem migration reservada.

Os trechos abaixo preservam contexto e regras; instruções antigas para iniciar F02/F07/F10/F09 são históricas e cedem a esta atualização.

**Diretriz nova do usuário: Viagens e Milhas são produtos diferentes.** A pessoa e seus contatos são compartilhados; perfil/carteira, cartões, clubes, acúmulo e simulador pertencem à área própria de Milhas. Solicitação, cotação, reserva e economia de uma viagem pertencem a Viagens, inclusive quando a passagem é emitida com milhas. Leia `docs/dominios-viagens-milhas-2026-10-14.md` antes de especificar F02. Para novos contratos/modelos, identificar explicitamente o produto (`TRAVEL` ou `MILES`) em UI/API/persistência: a mesma pessoa pode ter os dois, com vigência/cancelamento/recebíveis independentes. Não deduzir produto pelo cliente ou pela unidade de emissão. Codex publicou a navegação e as páginas separadas (TODO-051, PRs API #60/interface #53); não refaça carteira/CRM.

## Leia primeiro

1. AGENTS.md dos repositórios frontend e API.
2. `docs/divisao-desenvolvimento-codex-claude-2026-10-14.md` e a seção vigente de `sdd/backlog.md`.
3. `docs/comparativo-sou-gestor-2026-10-13.md`, sobretudo F02, F03, F07, F09 e F10.
4. Documentação instalada de Next em `node_modules/next/dist/docs/` antes de escrever código de Next. Frontend: Next.js 16.2.6 / React 19 / Tailwind 4; backend: Java 21 / Spring Boot / PostgreSQL / Flyway.

Os repositórios originais são `C:/workspace-pessoal/agencia-hub` (`Felipendev/agencia-hub`) e `C:/workspace-pessoal/agencia-hub-api` (`Felipendev/agencia-hub-api`). Use os arquivos do acordo como referência somente de leitura. Se o PR de documentação ainda não estiver em main, leia os arquivos no diretório original ou com `git show origin/codex/divisao-backlog-claude-2026-10-14:docs/<arquivo>`, após buscar essa branch. Não derive sua feature da branch de documentação nem inclua seus commits no PR de contratos.

## O que já está entregue

O Codex publicou a carteira manual F04, o simulador F06 com CRUD/histórico, a Biblioteca com edição/exclusão, a calculadora/comparativo e correções de lucro/financeiro, DDI, sessão e prevenção de viagens duplicadas. A consolidação de duplicados legados, o diagnóstico público de milhas e as integrações com tarefas ainda não estão concluídos. Não reimplemente nem altere esses módulos. O leitor de prints teve diagnóstico pausado; não aplique seu stash.

Referência de produção em 14/10: frontend `27ad5aaccd7a55291c78353b64b5a6d55adf95c5`, API `6ca4dce21530625b9aed9d89042191901960772f`, migrações até V55. Atualize origin/main antes de iniciar, pois esses SHAs são históricos.

## Suas cinco frentes

- TODO-046 / F02: contratos — concluído e publicado; branch `claude/f02-contratos`.
- TODO-047 / F03: economia realizada do cliente — concluída e publicada, API #62/UI #55.
- TODO-048 / F07: agenda e atas — concluída e publicada, API #65/UI #58; branch `claude/f07-agenda-atas`.
- TODO-049 / F09: indicações; branch `claude/f09-indicacoes`. A automação de créditos depende da definição de gatilho, resgate e estorno; avance no cadastro sem inventar a regra financeira.
- TODO-050 / extensão F10: etapas de viagem; branch `claude/f10-etapas-viagem`. A Biblioteca já existe; reutilize suas interfaces.

Ordem restante: etapas F10/V62. Indicações pode ter cadastro independente; créditos continuam condicionados. F07 identifica o produto TRAVEL/MILES explicitamente; mesmas pessoas, contextos de atendimento separados. Entregar CRUD aplicável, responsáveis e fuso, preservando histórico no cancelamento. Não prometer integração externa ou tarefas de F01 antes do contrato real existir. Não misture features na mesma branch ou PR. Codex fica com F01, F08, evolução F04/F06, F11 e F05, além da integração dos arquivos centrais e publicação.

## F02 — Contratos (escopo já entregue; referência histórica)

Confira se as branches e caminhos ainda não existem. Prepare dois worktrees a partir de origin/main atualizado:

```powershell
git -C C:/workspace-pessoal/agencia-hub fetch origin main
git -C C:/workspace-pessoal/agencia-hub worktree add -b claude/f02-contratos C:/workspace-pessoal/claude-agencia-hub-f02 origin/main
git -C C:/workspace-pessoal/agencia-hub-api fetch origin main
git -C C:/workspace-pessoal/agencia-hub-api worktree add -b claude/f02-contratos C:/workspace-pessoal/claude-agencia-hub-api-f02 origin/main
```

Se já houver um checkout próprio adequado, continue nele sem reset. Não sobrescreva caminhos existentes. Inspecione o padrão atual de autenticação/tenant, CRM, uploads, Biblioteca e recebíveis para reaproveitar interfaces. Escreva critérios e um plano de implementação curto em `docs/coordination/claude/f02-contratos.md`, então implemente:

1. Modelos de contrato fornecidos pela agência, com CRUD completo, isolamento por agência e produto explícito Viagens/Milhas.
2. Rascunho vinculado à pessoa, com preenchimento de dados existentes, preço/plano, vigência e condições de pagamento. Destacar campos faltantes antes de gerar.
3. Revisão e geração de documento, preservando produto, versão do modelo e retrato dos dados utilizados. Alterar a pessoa posteriormente não pode mudar o contrato emitido. Cancelar o contrato de um produto não cancela o outro nem exclui a pessoa.
4. Estados rascunho/enviado/assinado/cancelado, com transições auditadas. Assinado requer evidência anexada; não alegar assinatura eletrônica integrada.
5. Edição/exclusão de modelos e rascunhos quando aplicável; contratos emitidos devem usar versão/cancelamento para preservar histórico, com explicação na UI.
6. Vínculo opcional e explícito a recebíveis existentes. Não gerar outra venda/receita nem cobrança recorrente automaticamente ao salvar/assinar.
7. Testes de persistência, CRUD, transições, geração, anexos, permissões, agência e falhas sem confirmação falsa de sucesso.

Não invente cláusulas legais nem contrate serviços de assinatura. O conteúdo-base é fornecido pela agência; upload/evidência de documento assinado atende esta etapa. Use as convenções visuais do Hub e módulos próprios de contratos na UI/API/persistência.

## Limites para trabalhar independentemente

Você é dono de UI, API, tabelas, serviços, auditoria e testes dos seus módulos novos. Leia e consuma os APIs já existentes; não reconstrua CRM, financeiro, autenticação ou carteira. Não edite diretamente menus globais, página principal da pessoa/viagem, contexts/types globais, handlers/configurações centrais ou backlog global simultaneamente ao Codex.

Se precisar de uma entrada de menu ou alteração compartilhada, descreva em `docs/coordination/requests/claude-f02-contratos.md` a rota, contrato e integração desejados. Codex integra em PR pequeno ou atribui a mudança a um único dono. Rotas próprias e serviços independentes permitem iniciar e testar antes dessa integração. A entrega não fica marcada como concluída enquanto a navegação necessária ou algum CRUD aplicável faltar.

F01 ainda será implementado pelo Codex. Entregue agenda/atas sem depender dele; somente adicione criação de tarefas quando o contrato real estiver disponibilizado e revisado. Cada domínio seu precisa de auditoria própria; o exportador consolidado F11 será integrado pelo Codex depois.

## Migrações, testes e PRs

Use banco efêmero de teste próprio. Não compartilhe banco entre agentes. Leia `docs/migrations-reservadas-2026-10-15.md` antes de criar SQL: produção está em V57, F03 usa V58, sua F07 tem V59 reservada; V60 é F01/Codex e V61 é simulações por cliente/Codex. Não usar números provisórios, repetir números ou ocupar reservas alheias. Se precisar de mais migrations, solicitar ajuste da reserva antes de executá-las. Ordem de merge/publicação obrigatória: V58 → V59 → V60 → V61; desenvolvimento paralelo não autoriza publicar fora da ordem. Nunca alterar migrations publicadas, checksums, dados reais ou habilitar outOfOrder/ignorar validação. Testar banco novo e atualização da base anterior; Codex valida prévia e publica API antes da UI.

Toda referência a pessoa/viagem/cotação/recebível/responsável precisa validar agência e vínculo. Edição mantém o mesmo identificador. Sucesso aparece apenas após confirmação da API. Não usar localStorage como persistência compartilhada; não armazenar senhas ou número completo de cartão; não gravar a tela.

Preserve o login local de desenvolvimento e demais alterações do diretório original. Não use git add . ou reset destrutivo. Faça commits seletivos apenas da feature. Execute testes pertinentes, tipos, estilo e build; a CI atual não executa testes de negócio, portanto registre a evidência separada e confira se os workflows mudaram.

Abra um PR em rascunho por repositório afetado, com títulos `[F02][API] Contratos versionados por agência` e `[F02][UI] Gestão de contratos`, adaptados ao resultado final. Vincule os dois PRs; informe escopo, validações, migrations, dependências, CRUD entregue e solicitações de integração. Não faça push direto em main, merge ou deploy em produção: Codex ordena revisão, integração, API primeiro e UI depois. Não junte F03/F07/F09/F10 nos PRs de F02.

Avance autonomamente no escopo definido. Pergunte somente quando uma decisão de negócio realmente indispensável estiver ausente; continue trabalho independente que não depende dela. Ao concluir a implementação de F02, entregue os links dos PRs e o status real dos critérios de aceite antes de avançar para a próxima frente.
