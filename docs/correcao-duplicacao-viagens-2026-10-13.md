# Correção de duplicação de viagens — 13/10/2026

## Comportamento corrigido

A aprovação da cotação já criava ou reutilizava uma viagem. A ação Converter em viagem ainda abria um cadastro novo, e o POST /trips aceitava uma segunda inclusão para a mesma conversão. Repetições também criavam outros registros.

A ação agora consulta as viagens vinculadas e abre o registro existente. Havendo vários registros legados, encaminha para a lista filtrada da cotação, em Todas, para revisão. Links antigos do cadastro fazem a mesma conferência antes de salvar.

POST e mudanças de vínculo/tipo pelo PATCH verificam a conversão existente com bloqueio transacional da cotação. A criação aceita Idempotency-Key: uma repetição da mesma operação retorna a viagem já criada, sem alterar seu conteúdo. Identificação repetida com dados diferentes é recusada com mensagem clara. Há proteção única por agência/identificação no banco, além da serialização transacional dos reenvios.

Uma reserva não é globalmente única: serviços diferentes, como voo e hotel, permanecem permitidos. Uma viagem inicial de aprovação ainda sem localizador é reutilizada para completar os dados, em vez de gerar uma segunda conversão.

A tela e o modal de cotação aguardam a API antes de confirmar sucesso. Reenvios simultâneos na interface são bloqueados. A lista de viagens também ignora respostas antigas de buscas sobrepostas.

## Dados existentes

Não foi realizada exclusão, consolidação ou alteração de datas de viagens reais. Duplicados anteriores continuam disponíveis para edição/revisão. A correção previne novas duplicações; consolidar registros antigos exige preservar venda, fornecedor, trechos, notas e anexos.

## Validação

- 67 testes do frontend aprovados; verificação de estilo sem erros, tipos e compilação de produção aprovados na cópia isolada.
- 45 testes selecionados da API aprovados (42 de regressão e 3 de conversão). Os 3 testes finais de conversão passaram na revisão final, com PostgreSQL de teste.
- Cenários: aprovação seguida de conversão/repetição mantém uma viagem; mudança de vínculo por PATCH recusa duplicação; reenvios simultâneos com a mesma chave retornam o mesmo ID; duas conversões concorrentes com chaves diferentes geram uma inclusão e um conflito; aprovação posterior reutiliza a viagem; outro tipo de serviço permanece permitido.
- Os testes não alteraram dados de clientes reais.

## Versões da publicação

- API: `dfe7a7268bc60c6509957f0f89dfed16f854669b`, migração V53.
- Frontend: `3089d828ca1bd9a800902b98aa9ee6386650beaf`.

Publicação confirmada em 14/10/2026 no domínio https://www.agenciashub.com.br. Vercel `dpl_2JhS1i3sUGXNS5hvuA3apiE4992a` READY e associado ao domínio; Railway `9e609eba-3da3-4fde-9566-0cf3c40b7eb5` SUCCESS. Verificações do GitHub de ambos os repositórios concluídas com sucesso. A prevenção está publicada; a consolidação dos registros duplicados anteriores continua pendente de revisão dos dados.
