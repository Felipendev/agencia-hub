# Diagnóstico público de Milhas — TODO-055 — validação/publicação em andamento

## Escopo entregue no código
Fila própria de Milhas e formulário público com consentimento versionado, contas/cartões/clubes declarados, contato internacional e revisão autenticada. A agência gerencia link por configuração versionada, pausa e revogação. Cadastro público não escreve em CRM/carteira; incorporação escolhe pessoa e registros, confere versão do perfil e é transacional/idempotente. Histórico preserva original e revisões; CRUD interno inclui edição pelo mesmo ID e arquivamento/reativação por motivo. Comprovante mostra somente a seleção aplicada, sem sugerir alteração dos contatos do CRM. Novo autor da carteira usa ID estável da sessão; históricos antigos não foram reescritos.

## Referências exatas
- Reserva V66: registro central, commit8a3acc7, antes de escrever SQL.
- API PR70 head a6d69839b458ce7ebe64260980fd2d0de85253d8; CI40750808852/job123036654086 SUCCESS.
- UI PR64 head ed199706344d17c506357ee1debdbec2c9e9a9e9; CI40752771478/job123043566632 SUCCESS. Head anterior b0c644c também validado; último ajuste preserva estado arquivado/incorporado em reenvio.
- Prévia UI dpl_9hvMqyGyuTqEht6GWYVnfN8572jh READY no head ed19970.
- Prévia API ambiente cdabbeee-9552-4dab-b51a-00ad5aca81ae, deploy9603271c-6b3e-422b-a789-3b7c6ea0dc70, commit exato confirmado no Railway; ACTIVE no head exato; schema vazio recebeu65migrations atéV66, Started AgenciaHubApplication confirmado às19:10:42UTC. HTTP OpenAPI200, rota protegida403, token público inexistente404 e inválido400.

## Validação concluída
35 testes distintos da API: diagnóstico11, upgrade1, carteira6, diretório3, LGPD8, isolamentoLGPD2, descarte1, rate-limit3. Banco novo e upgradeV65→V66 preservando carteira/versionamento anteriores, sem criar link nem envio automaticamente. Gate de migrations preservou histórico e sequência.

234 testes UI em55arquivos; 18 focados nos quatro componentes novos. Cobertura medida no head b0c644c, antes do último ajuste de reenvio:98,64%linhas/92,04%branches. O head final ed19970 acrescentou o teste de reenvio de registro arquivado/incorporado; suíte completa, tipos/lint e build da CI aprovados. Inspeção desktop/celular com componentes reais e dados fictícios, evidências em docs/coordination/evidencias-diagnostico-milhas. Harness removido; nenhum registro real foi alterado em produção.

Revisão SDD estática independente identificou corrida incorporação×LGPD antes do lock da pessoa. Corrigida com rechecagem após FOR UPDATE e teste concorrente real: incorporação não commitada, guard inicial negativo, liberação do commit, recusa após lock e solicitação PENDING/CRM preservado. Revisão final aprovada, inclusive comprovante parcial. Falha simulada no meio da incorporação prova rollback de perfil, itens, histórico e comprovante. Descarte da agência remove diagnósticos e movimentações antes das pessoas, preservando outra agência.

## Limites explícitos
Não sincroniza programas, consulta CPF ou armazena credenciais/número completo de cartão. Vencimentos continuam no CRUD interno após revisão da conta. Arquivamento preserva declaração e versões; não estorna incorporação. Pedidos LGPD com diagnóstico/histórico continuam pendentes para revisão, inclusive e-mail original/intermediário sem CRM — não há confirmação parcial de anonimização. Nenhum link público é ativado por migration. V66 deve ser publicada e confirmada antes da UI; nenhum ajuste de schema/pool ou variável de produção foi preparado.

## Publicação
A prévia demorou na criação do contêiner durante o incidente oficial Railway Z1JDWW1W, mas iniciou sem mudança de configuração. V66 e startup confirmados; validação HTTP aprovada. O incidente global não foi declarado encerrado por esta verificação.

API70 integrada no merge3a30bafbc2d62bc1d050c6409a7800986ecc7e8e após CI e prévia aprovadas. Primeiro deploy de produção a7a9ce63-b3de-4248-955f-bf156093b5ae falhou no daemon de build do Railway (frontend grpc server closed unexpectedly), antes de iniciar a aplicação. Uma única repetição foi acionada por Deploy latest commit, após conferir origin/main e o link do commit nos Details do Railway: deploy89fae589-3021-4ada-b6c0-5f8422512c4f, mesmo3a30baf, também FAILED durante build (00:51), sem startup. Diagnóstico da plataforma concluído: Infrastructure Error; o build parou antes do Maven, correlacionado à falha gRPC do primeiro deploy. A recomendação exibida é repetir uma vez e procurar suporte se falhar novamente; a única repetição já foi feita. Não houve envio de mensagem ao suporte nem alteração de configuração. Evidência: docs/coordination/evidencias-diagnostico-milhas/railway-producao-bloqueada.png.

Produção continua no deploy6ad7fb73-f08f-4a74-b632-2491c6495c0b/V65. API OpenAPI HTTP200 e site HTTP200 após a segunda falha; isso confirma disponibilidade básica, não valida a feature nova. A URL pública nova ainda não é atendida pelo código antigo (resposta genérica500), portanto não divulgar link nem publicar a UI64. UpgradeV65→V66/startup/saúde seguem pendentes antes da UI64, que permanece draft no head ed19970. V66 está integrada e não pode ser reutilizada/editada. Nenhuma variável/schema/pool alterado. TODO-043/TODO-055 e D4 continuam em andamento até confirmação dos dois deploys.

Retomada: conferir que main ainda aponta para3a30baf, aguardar recuperação do serviço de build do Railway e executar novo deploy somente com causa resolvida; confirmar V65→V66 e Started AgenciaHubApplication, HTTP direto das rotas novas e serviço ACTIVE. Só então integrar UI64 com expected_head_sha ed199706344d17c506357ee1debdbec2c9e9a9e9, conferir Vercel READY no merge exato/domínio principal e concluir o backlog/arquivo SDD.

Observação de validação: o OpenAPI legado da API responde200 com paths vazios por packages-to-scan antigo; não foi usado como prova do contrato novo. Rotas do diagnóstico foram verificadas diretamente na prévia (403autenticada,404token inexistente e400token inválido), além dos35testes HTTP/SQL locais. Corrigir a configuração geral de documentação é melhoria separada; não alterada nesta entrega.


Para suporte Railway, caso necessário: projeto c6790a54-5605-49eb-ad41-a06bed88f154; serviço aebba146-4ff5-4825-8eca-c0c1a4f8cc4b; ambiente produção edfb4c02-fc63-45a1-b320-4fa9ff043882; commit3a30baf; builds a7a9ce63 e89fae589; segundo diagnóstico Infrastructure Error antes do Maven. Solicitar verificação do serviço de build. Não incluir variáveis, credenciais ou dados de clientes.
