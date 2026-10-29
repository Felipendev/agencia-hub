# Técnica
DataProvider separa o estado por usuário e agência autenticados, sem desmontar por renovação do token. O contexto remoto começa vazio e só aceita o cache da mesma combinação de usuário e agência. Cache legado sem escopo é ignorado; nenhum registro do backend é apagado por isso. A chave existente do localStorage é preservada. Respostas de uma sessão encerrada não alteram a sessão seguinte; isso não cancela gravações que já chegaram ao servidor.

Callbacks propagam erros e aplicam o retorno confirmado da API. Exclusão exige sessão e ID válidos. Edição de cotação recusa resposta nula antes de alterar o estado. Sincronização exige token atual e filtro válido. Atualização de pessoa exige resposta com o mesmo ID e nome válido; campos sem suporte não são aplicados apenas em memória.

O modo de demonstração exige NODE_ENV=development e NEXT_PUBLIC_ALLOW_LOCAL_DATA=true. Sem API configurada, produção recusa operações em vez de gerar registros locais. O cache é dispensável: falha de armazenamento não desfaz uma gravação confirmada no servidor. AuthProvider e login não são alterados.

Vitest e Testing Library exercitam o provider real; clientes HTTP usam fetch simulado para conferir os contratos e erros. Promessas adiadas verificam que não existe sucesso antecipado. A CI passa a executar npm test, sem dependências novas ou acesso a produção.
