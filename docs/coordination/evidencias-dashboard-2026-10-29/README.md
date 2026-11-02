# Dashboard — evidências com dados fictícios

Página, hook, mapper e gráficos reais em harness local Next. Autenticação, dados operacionais e transporte HTTP substituídos por fixtures locais; nenhum token, CRM, API ou banco de produção utilizado. O harness reproduz a hidratação do DataProvider e foi mantido em `.local` ignorado.

Desktop padrão: totais/recebidos R$ 5.298,53, despesas fictícias R$ 850,00, saldo R$ 4.448,53, gráfico com recebimentos de setembro. `desktop.png` é página completa. Celular 390×844: `mobile.png`; erro sem valores financeiros em `erro-mobile.png`, preservando dados operacionais e botão de nova tentativa. DOM sem overflow horizontal: desktop 1275/1275, celular 390/390 (clientWidth/scrollWidth).

A nova tentativa foi acionada no cenário de falha persistente fictícia. Recuperação, estados de carregamento, cancelamento, isolamento e entradas inválidas foram conferidos pelos testes da página com HTTP simulado. Isso não constitui smoke autenticado em produção nem comprova os lançamentos reais da FELTRIX. Não há gravações financeiras neste fluxo.
