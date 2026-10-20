<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- Do not create screen recordings unless the user explicitly asks for one.
- Prefer focused validation evidence such as command output, logs, or concise screenshots when they directly support the fix.
- Keep effort centered on diagnosing and solving the reported issue.

## Requisito de produto — CRUD completo

- Toda funcionalidade que gerencia registros editáveis deve entregar criação, listagem/consulta, edição e exclusão de ponta a ponta: interface, API e persistência.
- Duplicar um registro ou salvar suas alterações como um novo cenário não substitui a edição do registro existente.
- Os critérios de aceite devem incluir persistência após recarregar, permissões, isolamento entre agências e mensagens de sucesso somente após confirmação da API.
- Quando exclusão ou alteração direta não fizer sentido por integridade financeira ou histórico, implementar a operação de domínio apropriada (cancelar, arquivar, estornar ou versionar) e documentar o motivo no backlog e na interface.
- Não marcar uma feature como concluída enquanto faltar uma operação aplicável do CRUD.

## Coordenação de migrations

- Ler `docs/migrations-reservadas-2026-10-15.md` antes de criar migrations na API. Não usar números provisórios ou reservas alheias.
- V58 publicada (F03); V59 Claude/F07; V60 Codex/F01; V61 Codex/simulações por cliente. Publicação nessa ordem, API antes da UI, com migrations e inicialização validadas. F01 permanece em rascunho até V59 integrada.
