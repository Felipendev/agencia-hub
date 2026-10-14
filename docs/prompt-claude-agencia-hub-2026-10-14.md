# Prompt para Claude — AgênciaHub

Você vai desenvolver a metade atribuída ao Claude no backlog do AgênciaHub, em paralelo com o Codex. Não está sozinho no projeto. Trabalhe em checkouts e branches próprios, não reverta alterações do Codex e não use o diretório original como checkout de implementação.

## Leia primeiro

1. AGENTS.md dos repositórios frontend e API.
2. `docs/divisao-desenvolvimento-codex-claude-2026-10-14.md` e a seção vigente de `sdd/backlog.md`.
3. `docs/comparativo-sou-gestor-2026-10-13.md`, sobretudo F02, F03, F07, F09 e F10.
4. Documentação instalada de Next em `node_modules/next/dist/docs/` antes de escrever código de Next. Frontend: Next.js 16.2.6 / React 19 / Tailwind 4; backend: Java 21 / Spring Boot / PostgreSQL / Flyway.

Os repositórios originais são `C:/workspace-pessoal/agencia-hub` (`Felipendev/agencia-hub`) e `C:/workspace-pessoal/agencia-hub-api` (`Felipendev/agencia-hub-api`). Use os arquivos do acordo como referência somente de leitura. Se o PR de documentação ainda não estiver em main, leia os arquivos no diretório original ou com `git show origin/codex/divisao-backlog-claude-2026-10-14:docs/<arquivo>`, após buscar essa branch. Não derive sua feature da branch de documentação nem inclua seus commits no PR de contratos.

## O que já está entregue

O Codex publicou a carteira manual F04, o simulador F06 com CRUD/histórico, a Biblioteca com edição/exclusão, a calculadora/comparativo e correções de lucro/financeiro, DDI, sessão e prevenção de viagens duplicadas. A consolidação de duplicados legados, o diagnóstico público de milhas e as integrações com tarefas ainda não estão concluídos. Não reimplemente nem altere esses módulos. O leitor de prints teve diagnóstico pausado; não aplique seu stash.

Referência de produção em 14/10: frontend `fe86a8cdfe73f255d28e6408e6958f820e8a3c9e`, API `91614f0cfc00c4d468402283235e4083d7fb7b34`, migrações até V55. Atualize origin/main antes de iniciar, pois esses SHAs são históricos.

## Suas cinco frentes

- TODO-046 / F02: contratos — primeira entrega; branch `claude/f02-contratos`.
- TODO-047 / F03: economia realizada do cliente; branch `claude/f03-economia-cliente`.
- TODO-048 / F07: agenda e atas; branch `claude/f07-agenda-atas`.
- TODO-049 / F09: indicações; branch `claude/f09-indicacoes`. A automação de créditos depende da definição de gatilho, resgate e estorno; avance no cadastro sem inventar a regra financeira.
- TODO-050 / extensão F10: etapas de viagem; branch `claude/f10-etapas-viagem`. A Biblioteca já existe; reutilize suas interfaces.

Ordem sugerida: F02 → F03 → F07 → etapas F10. Indicações pode ter cadastro independente; créditos continuam condicionados. Não misture features na mesma branch ou PR. Codex fica com F01, F08, evolução F04/F06, F11 e F05, além da integração dos arquivos centrais e publicação.

## Comece agora por F02 — Contratos

Confira se as branches e caminhos ainda não existem. Prepare dois worktrees a partir de origin/main atualizado:

```powershell
git -C C:/workspace-pessoal/agencia-hub fetch origin main
git -C C:/workspace-pessoal/agencia-hub worktree add -b claude/f02-contratos C:/workspace-pessoal/claude-agencia-hub-f02 origin/main
git -C C:/workspace-pessoal/agencia-hub-api fetch origin main
git -C C:/workspace-pessoal/agencia-hub-api worktree add -b claude/f02-contratos C:/workspace-pessoal/claude-agencia-hub-api-f02 origin/main
```

Se já houver um checkout próprio adequado, continue nele sem reset. Não sobrescreva caminhos existentes. Inspecione o padrão atual de autenticação/tenant, CRM, uploads, Biblioteca e recebíveis para reaproveitar interfaces. Escreva critérios e um plano de implementação curto em `docs/coordination/claude/f02-contratos.md`, então implemente:

1. Modelos de contrato fornecidos pela agência, com CRUD completo e isolamento por agência.
2. Rascunho vinculado à pessoa, com preenchimento de dados existentes, preço/plano, vigência e condições de pagamento. Destacar campos faltantes antes de gerar.
3. Revisão e geração de documento, preservando a versão do modelo e o retrato dos dados utilizados. Alterar a pessoa posteriormente não pode mudar o contrato emitido.
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

Use banco efêmero de teste próprio. Não compartilhe banco de desenvolvimento entre branches dos dois agentes. A versão de migration usada em uma branch é provisória até a revisão de integração. Antes do merge, Codex atribui a próxima versão global livre; se precisar renumerar uma migration ainda não publicada/aplicada em ambiente compartilhado, teste em banco efêmero novo. Nunca alterar V55 ou outras migrations já publicadas, seus checksums, dados reais ou habilitar outOfOrder para contornar a ordem.

Toda referência a pessoa/viagem/cotação/recebível/responsável precisa validar agência e vínculo. Edição mantém o mesmo identificador. Sucesso aparece apenas após confirmação da API. Não usar localStorage como persistência compartilhada; não armazenar senhas ou número completo de cartão; não gravar a tela.

Preserve o login local de desenvolvimento e demais alterações do diretório original. Não use git add . ou reset destrutivo. Faça commits seletivos apenas da feature. Execute testes pertinentes, tipos, estilo e build; a CI atual não executa testes de negócio, portanto registre a evidência separada e confira se os workflows mudaram.

Abra um PR em rascunho por repositório afetado, com títulos `[F02][API] Contratos versionados por agência` e `[F02][UI] Gestão de contratos`, adaptados ao resultado final. Vincule os dois PRs; informe escopo, validações, migrations, dependências, CRUD entregue e solicitações de integração. Não faça push direto em main, merge ou deploy em produção: Codex ordena revisão, integração, API primeiro e UI depois. Não junte F03/F07/F09/F10 nos PRs de F02.

Avance autonomamente no escopo definido. Pergunte somente quando uma decisão de negócio realmente indispensável estiver ausente; continue trabalho independente que não depende dela. Ao concluir a implementação de F02, entregue os links dos PRs e o status real dos critérios de aceite antes de avançar para a próxima frente.
