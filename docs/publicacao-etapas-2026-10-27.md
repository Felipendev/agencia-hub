# Publicação F10 — etapas da viagem

Publicado em 27/10/2026, API antes da interface.

- API PR #66: head revisado `e82a06ddab449a1855d0ac2d2c3473a73bf6846a`; merge `882b3f34854deb557c4b954657337539c23006e4`.
- Prévia Railway `86f02d1a-8c00-4f65-a5ec-4818a6bd775b`: commit revisado confirmado, validação Flyway aprovada, schema public V62, aplicação iniciada e OpenAPI HTTP 200.
- Produção Railway `492b242c-d43f-4c8c-b0cb-a949ae861f68`: commit de merge confirmado, V61→V62 aplicada com sucesso e aplicação iniciada. OpenAPI HTTP 200; etapas sem sessão HTTP 403.
- UI PR #59: head `57fdf27cd94d885bd404beb9a6582f75f7ccf37b`; merge `8f6ade9d7c9c4e3a92e798c74500e38fd9df4f62`.
- Vercel `dpl_3La2peoMqamSq2nM3x1PR9qNBiaB`: READY no commit de merge, domínio www.agenciashub.com.br confirmado.

CI dos heads revisados aprovada. Validações originais: 46 testes API/155 UI; validação conjunta com F09 repetida após a integração: 61 testes API aprovados. Nenhuma migration publicada reescrita; V62 é a única adição F10. Revisão visual e testes de CRUD/isolamento documentados em f10-integracao-2026-10-21.md.

Nenhum cadastro de negócio foi criado em produção para testar. O smoke de produção confirma deploy, migração, inicialização, disponibilidade e proteção sem sessão; não equivale a um novo teste autenticado de todos os fluxos.

Captura: coordination/evidencias-publicacao-2026-10-27/f10-api-producao.png.

F09/V63 é a próxima publicação. F08 permanece sem migration reservada. O conector Railway ainda exige reautenticação; as operações desta publicação usaram a sessão autenticada do navegador. A rotação de segredos recomendada pelo provedor no incidente de 21/10 não foi executada nesta entrega.
