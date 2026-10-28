# Evidências visuais — TODO-055
Inspeção local com componentes reais PublicDiagnostic, DiagnosticDirectory e DiagnosticDetail, campos e ClientePicker existentes. Dados inteiramente fictícios; API e provedores de sessão/CRM simulados no harness. O modal de criação de pessoa não foi exercitado. Harness removido antes do commit.

Desktop 1440×1000: fila, configuração do link e revisão comparando a carteira selecionada. Celular 390×844: contato internacional, cartões opcionais, consentimento e comprovante. Sem clipping ou rolagem horizontal. Evidências não representam leitura ou escrita de dados de negócio em produção. Persistência, transações e isolamento foram validados separadamente com HTTP/Spring/PostgreSQL nos testes de integração.

railway-producao-bloqueada.png: captura real do diagnóstico da segunda falha de produção (89fae589), antes do Maven. Mostra recomendação de suporte após repetição. Não é uma falha de migration; aplicação não iniciou nesse deploy.
