# Validação visual F08

Inspeção em 27/10/2026 das telas reais FollowupBoard/FollowupEditor com dados fictícios e API simulada em um harness local. Desktop 1440×1000 e celular 390×844, sem rolagem horizontal. Formulário de edição, filtros e controles acessíveis. As imagens não representam dados ou CRUD em produção.

- lista-desktop.png: consulta e ações.
- lista-mobile.png: lista responsiva.
- edicao-mobile.png: edição pelo mesmo registro.

Testes HTTP/PostgreSQL verificam persistência, isolamento, versões e histórico. Revisão estática independente aprovou consistência entre especificação, código e testes. Revisão React: referências independentes em paralelo, respostas antigas descartadas, estado reiniciado por produto/sessão/pessoa, campos rotulados, confirmação após API, sem nova dependência de UI.
