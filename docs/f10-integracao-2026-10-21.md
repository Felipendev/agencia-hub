# F10 — revisão e integração

Revisão Codex de API #66, implementação Claude, em 21/10/2026. V62 é a única migration nova; V1–V61 preservadas. Publicação exige CI e prévia do head final, seguida de saúde em produção antes da UI.

## Correções da revisão

- Reenvio de criação confere todos os campos normalizados, inclusive fornecedor, pessoas, notas, local, confirmação, fim e fuso.
- Mudança de status valida expectedVersion antes de devolver sucesso para o mesmo estado.
- Reagendamento preserva fuso anterior junto com início/fim anteriores.
- Descarte autorizado da agência remove eventos, vínculos e etapas antes de viagens, preservando outras agências.
- Auditoria inclui customerId no JSON de todos os eventos para manter rastreabilidade após excluir ou reatribuir viagem. Nenhuma migration adicional foi criada.

## Privacidade e integridade

A rotina LGPD existente anonimiza contatos; ela não exclui viagens automaticamente. Etapas, textos e auditoria são dados que exigem revisão: a solicitação permanece PENDING, com mensagem específica, sem falsa conclusão ou alteração parcial. A regra também considera eventos de viagens já excluídas. Exclusão comum de pessoa com esse histórico recebe 409 TRIP_STAGE_HISTORY_EXISTS; exclusão da viagem remove etapas/vínculos por cascata e conserva auditoria. A política futura de retenção/anonimização integral continua pendente, como nos módulos de contratos, economia e agenda.

## Validação

46 testes aprovados: TripStagesTest 4, TripStagesIntegrationTest 4, TripStagesLifecycleIntegrationTest 4, TripStagesMigrationUpgradeTest 1, DataDeletionIntegrationTest 8, DataDeletionMultiTenancyIntegrationTest 2, AgencyDeletionSchedulerIntegrationTest 1, AgendaLifecycleIntegrationTest 4, WorkIntegrationTest 10, SimulationCustomerIntegrationTest 8. PostgreSQL efêmero, Spring/HTTP reais. Testado banco novo e upgrade V61→V62 com preservação da viagem e ausência de preenchimento automático.

Gate scripts/check-migrations.sh origin/main aprovado. Revisão manual de validação, SQL parametrizado, permissões, isolamento, idempotência, concorrência, dados pessoais e ausência de efeitos financeiros concluída. JaCoCo: TripStageService 155 linhas cobertas/7 não cobertas; TripStages 42/1; TripStageHistory 2/0. Cobertura de branches do serviço 87/120; não se alega cobertura integral.

Evidências locais: f10-final-api-tests.log e target/surefire-reports (artefatos ignorados pelo Git). API testada localmente com PostgreSQL embarcado 14.15; a prévia Railway usa PostgreSQL 18, com inicialização a conferir no head revisado. Não houve teste autenticado com dados reais em produção.

## Interface integrada

Link Etapas da viagem no detalhe central, preservando Economia. Avisos ao excluir viagem/anexo/material da Biblioteca explicam remoção de etapas ou vínculos e preservação do histórico. Reagendamento exibe início e fim anteriores no fuso anterior. Ao trocar viagem/sessão, a página reinicia seu estado e não mostra etapas da viagem anterior. Falha de rede não afirma que nada foi salvo sem confirmação.

155 testes frontend aprovados (41 arquivos), incluindo regressão de troca de viagem, CRUD, conflito, vínculos, cancelamento e datas/fuso. Tipos e build local com Webpack aprovados; lint zero erros e dois avisos preexistentes de cotações. O build padrão Turbopack local recusou a junction de node_modules fora da raiz; nenhum ajuste dessa configuração foi incluído no produto. CI/Vercel devem confirmar o build padrão no head final.

Revisão manual React/UX aprovada: componentes existentes, controles acessíveis, formulário preservado em erro, sucesso após API, estado isolado por viagem/sessão. Navegação pelo novo link funcionou. Inspeção local desktop 1440×1000 e celular 390×844 com dados fictícios e fetch interceptado: overflow global zero; sem requisições de negócio à API real. Evidências: docs/coordination/evidencias-f10-integracao/viagem-desktop.png, etapas-desktop.png e etapas-mobile.png.

## Publicação ainda bloqueada em 21/10

Railway publica incidente em https://status.railway.com/ com novos builds pausados em todas as regiões; atualização consultada de 11:33 UTC (08:33 Fortaleza). A CI da API revisada passou, mas a prévia ainda executa o antigo def6452. Isso não valida o head revisado 575a2803d2adb0f8dfee7fae359ac76305495804. Não integrar/publicar enquanto faltar prévia saudável desse commit. Produção preservada: site e OpenAPI HTTP 200.

Retomada: após normalização do Railway, construir a prévia no head revisado, confirmar logs/inicialização/rotas e somente então integrar API #66. Confirmar V61→V62 e saúde em produção, depois integrar UI #59 e conferir Vercel READY no commit de merge. Não reaplicar configuração de schemas antigos, não editar migrations publicadas e não usar repair/outOfOrder.

V63 reservada ao Claude/F09 cadastro de indicações (uma migration, sem créditos automáticos). F08 ainda sem reserva. Nenhuma ação manual solicitada ao usuário neste incidente de provedor.
