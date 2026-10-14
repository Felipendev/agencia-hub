# CRUD do simulador de acúmulo — 14/10/2026

TODO-038 / F06: edição de simulações existentes, separada da duplicação.

## Comportamento entregue

- Criar, listar, consultar, editar e excluir simulações da agência.
- Editar preserva o identificador; o servidor recalcula a projeção e registra uma nova versão com premissas, autor e data.
- Histórico permite consultar, baixar o relatório e preparar uma cópia de qualquer versão.
- Duplicar somente cria outro registro ao confirmar o salvamento da cópia.
- Uma versão desatualizada recebe HTTP 409; a interface conserva o rascunho e informa o conflito.
- Repetir a mesma atualização após perda da resposta não cria outra versão.
- Exclusão remove o cenário e suas versões. São projeções editáveis, sem lançamento financeiro ou alteração de saldo real; a confirmação explica a exclusão do histórico.
- Gestor e vendedor da mesma agência mantêm as permissões existentes. Consulta, histórico, edição e exclusão de outra agência retornam 404.
- Mensagens de sucesso dependem da confirmação da API.

## Validação

70 testes frontend e 48 testes selecionados da API aprovados em cópias isoladas da entrega. Os testes cobrem edição pelo mesmo ID, recálculo, consulta persistida, histórico, repetição de requisição, conflito simultâneo, exclusão das versões e isolamento entre agências. Estilo sem erros e compilação de produção aprovados; permanecem dois avisos antigos de diretivas de estilo sem uso.

## Publicação

Publicado em https://www.agenciashub.com.br/simulador-acumulo.

- Frontend `ceb3d9a9a8025e017eef33df7edfa9785269c134`: Vercel `dpl_4zEtnsqHmALQ6LAyK139k6AKtxww`, READY, domínio oficial associado.
- API `d243e8bd8d9120e1c5464754d362db05bb6281f7`: Railway `77448d48-c3c3-4c41-84b6-9ad2679e1d71`, SUCCESS.
- Migração aditiva V54 aplicada com sucesso às 19:37:56 UTC. A nova API preserva compatibilidade com os campos já utilizados pela tela anterior.
- GitHub Actions dos dois commits: sucesso.

## Conferência em produção

Criado pela interface um cenário fictício, recarregado e editado de R$ 10.000 para R$ 20.000 mensais. O identificador permaneceu `fda3646a-e678-47bc-b61a-4ba79eec59d2`, a versão passou de 1 para 2, a lista continuou com um registro e os pontos passaram de 48.000 para 96.000. Após recarregar, a API e o painel de histórico mostraram ambas as versões com premissas, autor e data.

Duplicar a versão 1 criou outro identificador (`82830d17-4637-4071-bae1-877c6d125425`), mantendo o cenário original na versão 2. Ambos foram excluídos pela interface, com confirmação. Depois de recarregar, a lista retornou ao estado inicial de zero registros; consulta individual e histórico de ambos retornaram 404. Nenhum registro real foi alterado.

As alterações de diagnóstico do leitor de prints foram guardadas e não integram esta entrega, conforme a orientação do usuário para retomar a implementação anterior.
