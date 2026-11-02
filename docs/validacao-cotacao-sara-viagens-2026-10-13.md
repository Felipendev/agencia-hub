# Validação — cotação aprovada ausente de Viagens

Caso indicado pelo usuário: Sara Moraes Dourado, cotação de 12/10.

## Evidências reproduzidas

1. Teste da tela de detalhe: clicar Aprovado chama a gravação assíncrona, mas exibe sucesso enquanto essa gravação ainda está pendente. Uma falha posterior da API pode, portanto, deixar uma confirmação enganosa. O contexto de dados tenta reverter o estado local quando a requisição falha; a mensagem de sucesso já exibida não é corrigida pela tela.
2. Teste de Viagens: Todas mostra viagens futuras, passadas e sem data. Quando a preferência salva é Próximas, viagens de 2025 e sem data ficam ocultas. Limpar filtros volta a exibi-las.
3. Testes HTTP da API publicada: aprovação confirmada cria viagem vinculada, com data do voo principal; reaplicar a aprovação não duplica o registro. A recuperação de um registro legado de voo calculado também passou no teste.

Os três testes de interface e os três testes da API executados nesta validação passaram. O teste de confirmação antecipada é diagnóstico: ele documenta o comportamento defeituoso atual, e não um critério de aceite para manter esse comportamento.

## Conferência autenticada em produção

O usuário entrou na conta em um navegador próprio desta validação. Foram feitas apenas consultas GET da API e alterações dos filtros na tela.

- Cotação `5b841498-00e4-4093-b955-485e5884108e`, criada em 12/10/2026: `ACCEPTED`, título Cotação BPS → BEL, total R$ 1.332,99.
- Voo principal: partida 25/10/2025. Campos gerais da cotação: início/fim 01/11/2020, divergentes do voo principal.
- Viagem `f250a2d6-ee94-4aaa-b31b-562a6eb5a3ce`: vinculada à cotação e à venda `4950fa68-4dd9-41e8-983d-d401496403e1`, partida 25/10/2020, término 26/10/2020, localizador HFQXMI.
- Viagem `2e89084d-7c3f-44c0-9452-a095afea5784`: vinculada à mesma cotação, sem vínculo com venda, mesmas datas e mesmo localizador.
- Ambas têm status armazenado UPCOMING, exibido como Futura, apesar das datas passadas.
- Na tela Viagens, Todas exibe as duas linhas da Sara. Selecionar Próximas remove ambas da lista. Limpar filtros torna as duas linhas visíveis novamente.

**Conclusão do caso:** a cotação está efetivamente aprovada e existem duas viagens vinculadas. O desaparecimento em Próximas foi reproduzido em produção e corresponde às datas de 2020 armazenadas nos registros. Há inconsistência entre os anos da viagem, do voo principal e dos campos gerais da cotação, além de dois registros para o mesmo localizador. Não se confirmou falta de criação da viagem neste caso.

Não foram alteradas datas, estado da cotação, vínculos comerciais nem excluída uma viagem. O ano pretendido deve ser confirmado antes de corrigir os dados; a aparente duplicação precisa de revisão dos vínculos antes de excluir ou consolidar um registro.

## Hipótese anterior à consulta

As imagens anteriores associam Sara a uma venda de R$ 1.332,99 em 12/10/2026. Outra imagem mostra um voo em 25/10/2025 com o mesmo total. Essa coincidência é uma hipótese de vínculo; não comprova que seja a mesma cotação nem que sua viagem exista no banco.

Essa hipótese foi substituída pela conferência autenticada acima. Nenhuma cotação real foi aprovada, revertida ou alterada durante os testes; os testes HTTP usaram PostgreSQL de teste e dados fictícios.
