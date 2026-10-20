# F07 — integração e publicação de agenda e atas

PRs [API #65](https://github.com/Felipendev/agencia-hub-api/pull/65) e [UI #58](https://github.com/Felipendev/agencia-hub/pull/58), implementação Claude e revisão/integração Codex em 20/10/2026. Publicado em produção: API #65 e UI #58, V59; Railway SUCCESS e Vercel READY. O histórico abaixo registra a investigação e a recuperação da prévia; a seção final registra a publicação.

## Validação inicial e incidente histórico (resolvido)

Suíte inicial: 26 testes backend distintos aprovados: AgendaTest (6), AgendaIntegrationTest (4), AgendaLifecycleIntegrationTest (4), AgendaMigrationUpgradeTest (1), DataDeletionIntegrationTest (8), DataDeletionMultiTenancyIntegrationTest (2), AgencyDeletionSchedulerIntegrationTest (1). O teste de upgrade V58→V59 foi repetido e aprovado após corrigir a fixture de pessoa, sem alterar a migration. PostgreSQL efêmero e contexto Spring real.

Frontend: 127 testes aprovados; build/tipos aprovados; lint sem erros, dois avisos preexistentes de cotações. Visual local da integração em 1440×1000 e 390×844 com API interceptada e dados fictícios, sem overflow global. Atalho do perfil de Milhas abriu a agenda com os parâmetros de pessoa e produto corretos.

Heads revisados: API `3976ec26ebeda49d0df452d55aed1b995de64a7b`, UI `4293dda5b289bbc9859e1f2245cefdb4a02a9b11`. CI build dos dois aprovada; Vercel preview aprovado. Railway prévia #65 deploy `845c1341-a9be-4b81-b0a5-25cd4c1b4adb` construiu a imagem, mas falhou em execução com UnknownHostException de postgres-ado4.railway.internal. O Postgres dessa prévia não tem implantação; o status SUCCESS do Railway não comprova saúde. Sem merge/publicação.

## Resultado da revisão

Navegação Principal dono/vendedor, proteção de /agenda e subrotas, atalhos da pessoa com TRAVEL/MILES. CRUD por ID, estados, fuso, atas e versões preservados. Reenvio com chave compara todos os campos normalizados; mudança de estado confere versão antes de no-op. Eventos de compromissos excluídos entram no bloqueio de exclusão/anonimização parcial da pessoa. Descarte autorizado da agência remove eventos/atas/versões/compromissos antes das referências. Não cria tarefas nem sincroniza agendas externas.

V59 preservada sem renumerar/editar histórico publicado. Após API em produção com migração/saúde confirmadas, publicar UI. Depois atualizar F01 e validar V59→V60; por último simulações por cliente V60→V61. V62 reservada para extensão F10 do Claude, após V61. Percentual de cobertura não medido; sem alegação de CRUD autenticado em produção.

## Bloqueio da prévia e ação concreta

Ambiente **agencia-hub-api-pr-65**, ID f5fa4814-5dac-4aab-bdae-3197441e262a; serviço **Postgres**, ID d84006aa-dcc8-4e24-bdeb-a881298c0da1. Fonte e volume já existem, mas nenhuma implantação do banco foi criada. Reconectar a mesma imagem não gerou mudança. Foi preparada uma única alteração nesse ambiente: deploy.sleepApplication=false. O conector confirmou um campo não destrutivo, sem mudanças em produção, mas accept-deploy recusou: “Cancelled — the user did not approve this action. No changes were made.”

No painel Railway, abrir exatamente essa prévia e o serviço Postgres, revisar a alteração Sleep Application=false e clicar Deploy Changes. Não editar DB_HOST/senhas/schema, não remover volume/banco e não aplicar à produção. Após o banco iniciar, Codex valida a API da prévia e só então integra/publica API antes da UI. A prévia deve passar primeiro; não contornar com merge direto em produção.

Produção conferida durante o bloqueio: site e OpenAPI HTTP 200, ainda na versão anterior. A revisão adicional desativa repair automático por padrão, mantendo a validação de checksums. Suíte final: 29 testes aprovados, incluindo FlywayRepairConfigTest (2) e IsolatedSchemaStartupIntegrationTest (1). BUILD SUCCESS. Head API final d1f424a, aguardando CI desse commit. Nenhum merge/publicação realizado.

## Recuperação confirmada

Usuário aplicou o ajuste em 20/10. Postgres #65 deploy 3321d391-a0fc-4b0e-b74c-0bae7f0eba43 SUCCESS, pronto para conexões. API reiniciada no deploy 66cbc050-3670-4d8a-903d-a3e191c9f1a8: V59 aplicada em public, inicialização concluída, OpenAPI 200 e appointments anônimo 403. API #65 integrada em 3dca6dc4118e98caa0117f1d70d8693732f71ade; deploy de produção a45d66e4-f9e9-4dd3-b629-4fbfe4222609 em construção. UI #58 aguarda API em produção saudável. O bloqueio descrito acima está resolvido.

## Publicação confirmada

F07 publicado: API #65 merge 3dca6dc4118e98caa0117f1d70d8693732f71ade, Railway a45d66e4-f9e9-4dd3-b629-4fbfe4222609 SUCCESS. Logs confirmam public V58→V59, exatamente uma migration aplicada e AgenciaHubApplication iniciada. OpenAPI 200, appointments sem sessão 403.

UI #58 merge 615fda0b87deca86fccaeb643ab39f7c0de2e295; Vercel dpl_7PD97vqqxtqMYKbznUQLavC6UgJP READY para esse commit, alias www.agenciashub.com.br. Bloqueio da prévia resolvido; não há ação manual pendente de F07. V60/V61 continuam a sequência, com seus upgrades e prévias próprios.
