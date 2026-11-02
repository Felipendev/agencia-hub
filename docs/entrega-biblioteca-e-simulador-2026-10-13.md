# Biblioteca e primeira proposta — 13/10/2026

Atualização de 14/10/2026: a lacuna de edição do simulador foi resolvida com CRUD completo e histórico por versão. A entrega inicial abaixo é histórica; detalhes e validação da edição estão em `crud-simulador-acumulo-2026-10-14.md`.

Publicado em produção em https://www.agenciashub.com.br.

- Frontend: `3d4afb212b1329c9d78d85459413131554490e6b`; Vercel `dpl_DVey4hQbDQLrZERyXeCh4tmNQuTx`, READY e associado ao domínio oficial.
- API: `2c4f142b079319fe476991e6080b586904968ba8`; Railway `eb6460f1-62a9-4a15-b0cc-4be480923b03`, SUCCESS; migração V52 aplicada.
- GitHub Actions dos dois repositórios: sucesso.
- Produção: login HTTP 200; Biblioteca e Simulador exigem login (HTTP 307); API recusa consultas anônimas (HTTP 403), com CORS permitido para o domínio oficial.

## Biblioteca

Os atalhos oficiais deixam de ser links fixos da página e passam a ser materiais da própria agência. Título, categoria e URL podem ser editados; a exclusão é persistente. A inicialização ocorre uma única vez e não recria links excluídos nem duplica links previamente cadastrados com a mesma URL.

Materiais próprios mantêm os controles de edição/exclusão. A edição de um arquivo permite trocar o documento, preservando o identificador do material. Sem selecionar outro arquivo, apenas título e categoria são alterados. A interface confirma o sucesso depois da resposta da API e mantém o material na lista se a exclusão falhar.

## F06 — Simulador de acúmulo e metas

Primeira proposta entregue nesta etapa. Nova página /simulador-acumulo, no menu operacional para gestor e vendedor, com login obrigatório.

Premissas: gasto mensal, pontos por dólar, câmbio e data informados, prazo, destino, passageiros e meta individual. Até dez programas com bônus hipotético independente. A projeção não altera saldos nem promete bônus/disponibilidade de passagens.

Simulações são persistidas por agência, com autor e data da criação. A equipe pode consultar um cenário, baixar seu relatório ou excluí-lo. Alterações são salvas como novas simulações para preservar as anteriores. O relatório HTML inclui todas as premissas e pode ser aberto no navegador para impressão/PDF.

Aceite de referência validado: R$ 10.000 mensais, 2 pontos por dólar, câmbio R$ 5 e 12 meses geram 4.000 pontos/mês e 48.000 no período. Um bônus hipotético de 100% gera 96.000 naquele programa. Dois passageiros com meta individual de 40.000 exigem 80.000 no grupo. Cenários alternativos nunca são somados.

## Validação

- 59 testes do frontend aprovados, incluindo edição e exclusão da Biblioteca, falha de exclusão, cálculo, limites e proteção do relatório contra HTML inserido no título.
- 37 testes selecionados da API aprovados em uma cópia isolada, incluindo migrações, persistência, substituição de arquivo, exclusão dos atalhos sem reaparecimento e isolamento entre agências.
- Verificação de estilo, tipos e compilação de produção aprovadas.
- Conferência visual do simulador no navegador local: cenário de 96.000 e bloqueio de câmbio zero. Essa conferência não usou conta nem dados reais de produção; os fluxos persistidos foram validados por HTTP com PostgreSQL nos testes de integração.

## Próximas propostas

F04 (perfil/carteira de milhas), F01 (checklists/rotinas), F08 (follow-up) e as demais propostas permanecem no backlog comparativo. Esta etapa inicia as propostas com F06; não declara todos os módulos planejados como implementados.
