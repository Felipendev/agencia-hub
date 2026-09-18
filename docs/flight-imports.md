# Importação de voos e memória de cálculo (TODO-037)

Implementação em validação para produção. Frontend e backend devem ser atualizados juntos. A busca direta das companhias permanece fora desta entrega.

Revisão de código em 17/09/2026: ordem dos bloqueios de consumo/importação alinhada para evitar deadlock; cálculo do navegador em centavos para acompanhar o arredondamento do backend; validação de limites e precisão monetária; resumo com todos os trechos de ida/volta; datas e horários inválidos tratados como erro de entrada. Casos de regressão preparados, sem execução.

## Configuração

O backend `agencia-hub-api` usa Apache PDFBox 3.0.8 e aplica a migração Flyway `V48__flight_imports_and_quotation_plans.sql` ao iniciar. A migração adiciona o plano de voo à cotação, histórico de versões, cache de extrações e consumo mensal por agência.

Configure estas variáveis **somente no backend Spring**, pelo gerenciador de segredos da hospedagem ou ambiente local:

| Variável | Padrão | Uso |
| --- | --- | --- |
| `FLIGHT_IMPORT_API_KEY` | vazio | Credencial da API Gemini; nunca usar prefixo `NEXT_PUBLIC_` |
| `FLIGHT_IMPORT_MODEL` | `gemini-3.1-flash-lite` | Modelo com visão e saída JSON estruturada |
| `FLIGHT_IMPORT_MONTHLY_REQUESTS` | `1000` | Limite de tentativas por agência/mês UTC |
| `FLIGHT_IMPORT_MONTHLY_BUDGET_USD` | `5.00` | Limite para reservar novas leituras por agência/mês |
| `FLIGHT_IMPORT_RESERVATION_USD` | `0.10` | Reserva conservadora por tentativa (mínimo efetivo US$ 0,10) |
| `FLIGHT_IMPORT_INPUT_USD_PER_MILLION` | `0.25` | Preço de entrada usado na estimativa |
| `FLIGHT_IMPORT_OUTPUT_USD_PER_MILLION` | `1.50` | Preço de saída, incluindo raciocínio, usado na estimativa |

Confira os preços antes de ativar e atualize-os ao trocar de modelo: [preços Gemini](https://ai.google.dev/gemini-api/docs/pricing). O limite usa estimativas/reservas locais e não substitui os controles de faturamento do provedor. Consumo real depende da imagem/PDF e dos tokens faturados; configure uma reserva que cubra o modelo escolhido. Configure também a base da API conforme o padrão existente (`AGENCIA_HUB_API_URL` no Next e as configurações de API já usadas pelo frontend).

Sem credencial, o mapeamento direto dos PDFs reconhecidos e o preenchimento manual funcionam; documentos que precisam de IA apresentam uma mensagem de serviço não configurado. Não há tentativa automática de obter credencial nem de contornar CAPTCHA.

## Fluxo implementado

1. Acesse `/calculadora` para criar uma cotação, ou use **Adicionar voos / Editar na calculadora** no detalhe de uma cotação.
2. Envie PNG, JPEG ou PDF, até **4 MB**. PDFs têm limite de **5 páginas**; imagens de 20 milhões de pixels e 12.000 pixels por dimensão. WEBP não é aceito nesta versão.
3. Em PDF com texto, o PDFBox tenta mapear uma oferta única claramente identificada. Se não houver correspondência segura, o texto segue para interpretação pelo modelo. PDF digitalizado, misto ou contendo objetos gráficos segue inteiro ao modelo para não descartar ofertas visuais. O detector é conservador: um PDF com logotipo também pode seguir pela rota visual.
4. Cada oferta vira um rascunho editável. Campos ausentes permanecem vazios. Datas, horários, duração, aeroportos, paradas e milhas são opcionais; não inferimos a data pela data atual. A imagem LATAM fornecida não contém a data.
5. Valores da fonte por grupo ou de base desconhecida aparecem como referência, mas não são copiados como preços por pessoa. O agente precisa preencher valores por pessoa; categorias com preços distintos exigem revisão manual da composição nesta versão.
6. Confira o milheiro sugerido, parcela monetária da oferta, taxas adicionais, lucro percentual/fixo e malas. O custo do milheiro usado fica no rascunho: alterações na tabela não reprecificam planos salvos automaticamente.
7. Marque **Conferi...** em cada opção incluída e escolha qual define o total. Alterar os dados desmarca a revisão. Todos os cálculos são atualizados por código, sem nova chamada de IA.
8. Salve. Ao selecionar uma cotação existente, novas opções são adicionadas às já salvas; **Carregar opções salvas** substitui o rascunho para editar/remover opções existentes. As versões anteriores ficam no histórico.

O backend recalcula o preço a partir dos insumos e ignora os totais enviados pelo navegador. Cotações com plano de milhas usam BRL. O cálculo arredonda custo das milhas e lucro por pessoa em centavos; o total multiplica o preço por pessoa e soma as malas do grupo. Alternativas não são somadas. Na cotação existente, o total passa a ser o da opção principal escolhida; confira isso se a cotação incluir outros serviços.

Ao adicionar voos a uma cotação existente, as datas e o destino do cadastro original são preservados. Confira esses campos no detalhe da cotação se a oferta escolhida mudar o período ou o roteiro; o itinerário de cada opção fica registrado separadamente.

## Privacidade, cache e consumo

- `POST /flight-imports` exige autenticação e perfil de dono/vendedor. A agência vem da sessão validada pelo backend, nunca de um campo enviado pelo navegador.
- O arquivo original é usado durante a leitura e **não é armazenado no banco nem anexado ao cliente**. Guardamos hash, nome, versão do extrator, responsável, data, resultado e uso estimado. Esses registros permanecem vinculados à agência; sua exclusão elimina os registros por chave estrangeira.
- Hash + versão do extrator + agência identificam o cache. Reenvios concluídos reutilizam a leitura sem chamada paga. As correções manuais ficam no plano, separadas da extração original.
- Reservas de consumo usam transações e bloqueio no PostgreSQL para funcionar entre instâncias concorrentes. Uma tentativa conta para o limite de chamadas, mesmo se o processamento local falhar; cache concluído não conta novamente.
- Não há novas tentativas automáticas ao provedor. Uma tentativa em andamento impede duplicidade; depois de cinco minutos pode ser substituída por uma tentativa explícita com identificador próprio, impedindo que uma resposta antiga sobrescreva a nova. Reinícios/timeouts conservam a reserva quando a cobrança é incerta.
- A reserva é reconciliada com tokens de entrada/saída (incluindo raciocínio) em respostas válidas. Em falha após envio, conserva-se o valor reservado como estimativa conservadora. PDF mapeado diretamente tem custo de IA zero.
- `flightPlan` é dado da API autenticada da agência. Os geradores de HTML/PDF e WhatsApp usam uma seleção explícita de campos comerciais. Nunca publicar `flightPlan`, histórico ou a resposta bruta da importação em endpoints públicos.
- `GET /quotations/{id}/flight-history` retorna as últimas 50 versões da mesma agência. A nova gravação e seu histórico participam da transação da cotação.

## Validação preparada para o usuário

O usuário autorizou a execução das validações em 17/09/2026. Comandos de referência:

Frontend, em `C:\workspace-pessoal\agencia-hub`:

```powershell
npm test -- src/lib/flight-plan.test.ts
npx tsc --noEmit
npm run lint
npm run build
```

Backend, em `C:\workspace-pessoal\agencia-hub-api`:

```powershell
mvn test "-Dtest=QuotationFlightPlansTest,FlightDocumentReaderTest,FlightImportIntegrationTest,QuotationHttpIntegrationTest,QuotationMultiTenancyIntegrationTest"
```

Os testes de integração usam PostgreSQL embarcado e simulam a IA; não fazem chamadas pagas. Cobrem cache por agência, concorrência no limite de chamadas, autenticação, persistência/histórico e recálculo no servidor. Os testes de frontend cobrem a projeção comercial e a ausência de valores internos no HTML e WhatsApp.

Validação manual necessária: enviar a imagem real LATAM (87.141 milhas + R$ 38,84), PDF com texto, PDF misto e múltiplas ofertas; medir qualidade e consumo real do modelo. Com milheiro de R$ 25 e lucro de 10%, sem taxas adicionais/malas, esperar **R$ 2.439,11 por pessoa** após preencher a data e confirmar a revisão. Conferir PDF, atualizar a cotação, recarregar a página e consultar a versão anterior no histórico. Verificar também indisponibilidade do provedor, arquivo inválido, limite mensal e acesso por outra agência.

## Revisão de usabilidade em 17/09/2026

Leitura com indicador de atividade, tempo decorrido e cancelamento que aborta a espera HTTP e descarta respostas tardias. O processamento já enviado ao provedor pode terminar e ser cobrado. Ações de remoção em vermelho. Milhas e dados de itinerário opcionais; milheiro exigido somente quando existem milhas. Nome, passageiros (padrão 1), seleção principal, cliente e revisão continuam necessários. Sem milhas, o preço usa a parcela em dinheiro, taxas, lucro e malas. Valores preenchidos inválidos apresentam o campo responsável.

Migração V48 sucede a V47 já em produção. Criações idempotentes também acomodam bancos locais que receberam a antiga V45 experimental. O login livre local não faz parte da publicação.
