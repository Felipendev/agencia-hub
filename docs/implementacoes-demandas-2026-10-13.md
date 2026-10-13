# Demandas da agência — implementação de 13/10/2026

As alterações foram implementadas no frontend e na API, com validação em uma cópia isolada da versão destinada à produção. A publicação é realizada em duas etapas: correções operacionais, seguidas das telas da calculadora e da biblioteca.

## Financeiro e vendas

A aprovação de uma cotação com voos utiliza somente a opção principal para preencher o custo do fornecedor. O valor vendido permanece separado do custo; lucro não é lançado como uma segunda receita.

Exemplo validado: custo R$ 1.162,99, lucro fixo R$ 170,00, venda R$ 1.332,99. A aprovação gera uma receita prevista de R$ 1.332,99 e uma despesa prevista de R$ 1.162,99. A venda exibe lucro de R$ 170,00. Receber/pagar confirma os mesmos lançamentos, sem duplicá-los. Os estornos restauram a previsão. Cancelar a aprovação cancela as previsões; valores quitados exigem estorno antes.

Lançamentos vinculados são geridos pela tela Vendas, protegendo a associação entre as parcelas e o caixa. Custos desconhecidos aparecem como lucro não informado na lista de vendas.

## Viagens

A aprovação cria ou atualiza a viagem vinculada com as datas da opção escolhida. A visualização inicial passa a ser Todas, com botão para limpar filtros. Preferências anteriormente salvas continuam disponíveis. Cotações em elaboração continuam sendo cotações: aparecem como viagem após aprovação.

O exemplo enviado contém partida em 25/10/2025. Em outubro de 2026 essa data pertence às viagens passadas, portanto o filtro Próximas não a mostra.

## Telefones e sessão

O campo de telefone permite editar o DDI e colar números completos, inclusive +351, +1 e +44. Contatos brasileiros antigos permanecem compatíveis. A mudança cobre pessoas, emergência, WhatsApp, cotações, formulário público, agência, cadastro e convites. A API preserva os prefixos internacionais.

A tolerância de inatividade passou para 8 horas, com aviso nos últimos 5 minutos. O limite absoluto padrão da sessão da API passou para 7 dias, mantendo a renovação autenticada e a expiração dos tokens. Configurações de ambiente que sobrescrevam `JWT_MAX_SESSION_MS` ou `JWT_EXPIRATION_MS` precisam ser conferidas na publicação.

## Calculadora de voos

Novo nome no menu e na página. O comparativo aceita milhas, companhia aérea, consolidadora e pesquisa/preço do cliente; permite nomear companhias e empresa vendedora e adicionar condições de pagamento/observações. Mostra preço final e lucro DU/RAV do grupo. Apenas a opção principal define o total da cotação. Dados internos de custo e lucro permanecem fora da apresentação comercial.

## Biblioteca

Nova aba compartilhada por agência: categorias, busca, links, upload/download de arquivos, edição de título/categoria, modelos editáveis e exclusão. Arquivos: PDF, imagens, Word, Excel e texto, até 5 MB. Os materiais são armazenados na API e isolados entre agências.

Atalhos oficiais incluídos: bagagens LATAM, GOL e Azul e Portal Consular. O modelo editável de NF organiza os dados e pode ser baixado como texto; a emissão fiscal continua no serviço utilizado pela agência. Contratos existentes, certificado de CNPJ e formulários podem ser adicionados à biblioteca.

## Atualização

Publicar a API e o frontend juntos. As migrações V50 e V51 criam a biblioteca e recuperam custos, previsões e viagens de cotações aprovadas elegíveis. V51 não modifica valores ou datas de caixa já quitados; apenas completa os dados de custo associados à receita. Não cria pagamento retroativo para vendas já recebidas. Registros com vários itens ou intervenções manuais não são arbitrariamente reconstruídos.

## Validação

- Frontend: 53 testes aprovados, incluindo digitação de DDI, WhatsApp internacional, cálculo e prazo de sessão.
- API: 33 testes aprovados, cobrindo cálculo, aprovação, financeiro, arquivos, modelos, isolamento entre agências e recuperação dos registros antigos.
- Compilação de produção e verificação de tipos.
- Conferência no navegador em ambiente local de testes, com dados fictícios; persistência e integração verificadas pelos testes HTTP com PostgreSQL embarcado.

Evidências: `evidencias-sou-gestor/calculadora-voos-implementada.png` e `evidencias-sou-gestor/biblioteca-implementada.png`.
