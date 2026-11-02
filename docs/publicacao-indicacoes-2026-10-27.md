# Publicação F09 — cadastro e acompanhamento de indicações

Retomada em 27/10/2026, após publicar F10/V62. Produtos Viagens e Milhas explícitos, CRUD aplicável por ID, estados e histórico; sem créditos ou efeitos financeiros.

## API

- PR #67 atualizado com main/V62: head `f009b93a70fe2b2ac1477cbfbcc12bfdb97e146a`; merge `7ef4ce81ce240abfed0bccad77872e90ea2386d6`.
- Os três conflitos centrais preservam as proteções de F09 e F10. A árvore funcional integrada é idêntica à validação conjunta anterior. Gate de migrations aprovado contra main/V62; nenhuma migration publicada alterada.
- Repetição real no head integrado: 61 testes JUnit, zero falhas/erros/ignorados, Spring/HTTP e PostgreSQL embarcado. Inclui banco novo, V61→V62 e V62→V63, CRUD, idempotência, versões, permissões, isolamento, privacidade e descarte da agência. Log local f09-release-tests-2026-10-27.log no worktree API F09. CI GitHub aprovada: run 40604874753/job 122541755965.
- Prévia `agencia-hub-api-pr-67`, ambiente `d132a983-30ff-4a8d-9bed-61059fd4e21b`, estava vazia. Serviços/volume foram restaurados apenas nesse ambiente; DB_HOST referencia `${{Postgres.PGHOST}}` local. Branch explicitamente claude/f09-indicacoes, CI obrigatória. Nenhuma configuração de produção foi alterada para corrigir a prévia.
- A sincronização conectou primeiro main/V62; a seleção da branch e o pedido manual resultaram em dois builds do mesmo head F09. Não foram reenviados depois disso. Deploy revisado conferido: `57b20f5a-893e-4b81-8a30-c4c610b687d6`, commit f009b93, V62→V63 aplicada e aplicação iniciada, OpenAPI HTTP 200.
- Produção Railway `f3abd48b-2cb6-4d34-87e0-73aec7aa5439`: commit de merge confirmado; V62→V63 aplicada com sucesso; aplicação iniciada; OpenAPI HTTP 200, indicações sem sessão HTTP 403.

## Interface

- PR #60 atualizado com main/F10: head `e1b95314e76f411d90c4c40c5ab13ed20bc30375`; merge `082026434f8d2e31fa0cbbb0ac9c8324872661b6`.
- Repetição no head integrado: 173 testes/45 arquivos aprovados, tipos aprovados; lint zero erros e dois avisos antigos de cotações. CI GitHub e prévia Vercel aprovadas: run 40605102511/job 122542529739.
- Primeiro build de produção `dpl_8pn7ekjieaTWhXTM5zh2JGNUqQrA` falhou no resolvedor de fontes Google do Turbopack (`next/font/google queries have exactly one entry`). Nenhum código foi alterado para ocultar a falha; a versão anterior continuou atendendo o domínio.
- Repetição exata do mesmo commit: `dpl_GN4Z6tZQRGwjKGvuVg5zRH9dApJH`, READY, SHA de merge confirmado e alias www.agenciashub.com.br aplicado. Entrega publicada por completo, API antes da interface.

## Limites

Nenhum cadastro real de negócio foi criado em produção para o smoke. Testes de CRUD/isolamento usam banco efêmero; capturas visuais anteriores usam dados fictícios. O smoke de produção confirma deploy, migração, inicialização, disponibilidade e proteção sem sessão.

Créditos, recompensas, cupons, comissões, resgates e estornos por indicação não foram implementados: dependem de regras de negócio. Histórico que impede excluir diretamente é preservado; pedidos de privacidade com dados ainda vinculados continuam pendentes para revisão, sem promessa de anonimização parcial completa.

Conector Railway continua exigindo reautenticação; publicação acompanhada pela sessão autenticada do navegador. Rotação dos segredos recomendada no incidente do provedor não executada nesta entrega. Evidência: coordination/evidencias-publicacao-2026-10-27/f09-api-producao.png.
