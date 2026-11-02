# Publicação — cartões da carteira no simulador — 28/10/2026

TODO-054, subentrega da TODO-043/F04/F06. UI PR #63, branch codex/f06-cartoes-simulador, head 7c3a118938d7ed083f3a6534bf5346adf891e8ca, merge b3722b57b3056792de630e9fc524aab3ebcda89d. API permanece ef31e7b/V65; não houve migration, modificação no Railway ou escrita em dados de negócio de produção.

## Comportamento
Consulta opcional dos cartões ativos da pessoa selecionada no simulador; prévia de gasto mensal e pontos por dólar e ação explícita para copiar. Preserva câmbio/data/demais premissas, permite ajuste manual e só persiste ao salvar pelo CRUD existente do plano. Carteira tem link para seu CRUD próprio. Campos ausentes não viram zero; perfil arquivado não oferece cartões. Não sincroniza automaticamente alterações futuras de cartão sobre planos históricos.

Isolamento: sessão/pessoa reiniciam a consulta; AbortController e descarte explícito de respostas atrasadas. Falha não aparece como carteira vazia e permite tentar novamente sem apagar formulário. Nenhuma nova API, tabela, dependência ou credencial.

## Validação
- 216 testes/51 arquivos aprovados; 15 testes do componente novo e teste da página real cobrindo aplicação, edição pelo mesmo ID e reabertura.
- Componente novo: 100% linhas/instruções/funções/branches.
- TypeScript e ESLint dos arquivos alterados sem erros; build Next webpack aprovado.
- Revisão SDD estática independente aprovada, sem bloqueadores.
- Inspeção desktop 1440×1000 e celular 390×844 com dados fictícios; evidências em docs/coordination/evidencias-cartoes-simulador. Harness removido; nenhuma alteração de dado real usada na inspeção.
- CI do head: run40732596856/job122972580223 SUCCESS (tipos/lint/build). Dois avisos preexistentes de eslint-disable sem uso em arquivos de cotação; nenhum erro.
- Prévia dpl_5J31CFGFvXkvqbNUqM7CDYKSGFVd READY no head exato.

## Publicação
PR #63 integrado após gates e prévia aprovados. Deploy de produção dpl_DzZnLAqnQuQMP9FfGr3WUwrbtwPU READY, commit b3722b57b3056792de630e9fc524aab3ebcda89d e alias www.agenciashub.com.br confirmados pelo conector Vercel. HTTP do domínio e proteção do simulador conferidos. API OpenAPI 200 e carteira sem sessão 403; API continua saudável em V65.

TODO-043 continua em andamento: diagnóstico público com revisão autenticada e correção da identidade dos autores do módulo Milhas ainda pendentes. V56–V65 imutáveis; diagnóstico ainda sem nova migration reservada.

