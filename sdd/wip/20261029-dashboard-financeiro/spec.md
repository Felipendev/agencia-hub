# Correção do dashboard financeiro

O dashboard deve consultar `/financial-entries` com a sessão do gestor ao entrar, sem depender de visitar o Fluxo de Caixa ou do cache de `DataProvider`. Exibir carregamento/erro/retry antes de valores monetários; zero só depois de sucesso com ausência real de lançamentos. Uma atualização manual ou retorno à página consulta novamente. Operacional permanece consultável quando financeiro falha.

Consulta própria em `useDashboardFinancial`, com chave da sessão/usuário/agência/token, cancelamento e descarte de respostas antigas, inclusive erros. Não escrever no cache compartilhado, banco ou vendas. Sem consulta sem sessão de gestor ou antes da hidratação. Cliente HTTP aceita AbortSignal opcional e usa no-store.

Manter regras financeiras: recebidos confirmados no gráfico, pendências separadas e cancelados excluídos. Janela de 12 meses, incluindo atual, sem transbordar rótulos nos dias 29–31. O gráfico não é uma soma automática das vendas comerciais. Sem migration e sem CRUD novo.

Gates: testes da página real com HTTP simulado para entrada direta, loading/falha/vazio, retry/refresh, remontagem, sessão, abort, datas e compatibilidade; tipos/lint/build; revisão independente de consistência e QA visual com fixtures. Branch/PR independente da main; sem merge/deploy de produção. Não retomar fornecedores ou criar V67 enquanto essa frente está pausada. Relatório e limites em docs/correcao-dashboard-financeiro-2026-10-29.md.

Implementação e validação local concluídas: 32 testes focados/266 suíte, tipos/build, lint src sem erros, revisão independente e visual QA desktop/mobile com fixtures. Hook/adapter100%linhas98,24%branches. PR draft e CI em preparação; integração/publicação pendentes.
