# F03 — Economia realizada do cliente (TODO-047) — Claude

Branch `claude/f03-economia-cliente` nos dois repositórios, a partir de `origin/main` (frontend `27ad5aa`, API `6ca4dce`). Produto: **Viagens** (diretriz `dominios-viagens-milhas-2026-10-14.md`): a economia é o resultado de uma viagem; potencial de acúmulo de Milhas não entra no indicador.

## Conceitos

- **Economia realizada** = preço comparável em dinheiro − custo efetivo da viagem para o cliente. Não é lucro da agência (vendas/financeiro) nem estimativa de cotação.
- **Preço comparável**: valor em reais de uma alternativa equivalente que o cliente teria comprado, com **fonte** (tipo + descrição/link) e **data da pesquisa**. Evidência (print/PDF) opcional.
- **Equivalência**: rota, datas, passageiros, cabine/tarifa e bagagem do comparativo, registrados em texto, e quatro confirmações explícitas: mesma rota, mesmas datas, mesmos passageiros, condições de bagagem/tarifa equivalentes. Comparação não equivalente não gera número.
- **Custo efetivo**: linhas de custo pagas pelo cliente — valor pago à agência, pagamento direto a fornecedor, taxas de embarque, honorários/taxa de serviço, custo de aquisição de milhas, outros. Honorários e taxas são linhas próprias para não ficarem implícitos.
- **Milhas**: a pessoa informa se a emissão usou milhas: `NOT_USED`, `KNOWN` (exige linha de custo de aquisição com origem registrada) ou `UNKNOWN`. Com `UNKNOWN` a economia fica **indisponível**: o custo não é conhecido, e nenhum número é inventado.
- **Ajustes posteriores**: reembolso recebido (reduz o custo) e multa/taxa de cancelamento ou remarcação (aumenta), com data e descrição. Viagem com status `CANCELLED` não entra no total realizado e aparece como "viagem cancelada".
- **Metodologia**: texto obrigatório explicando como a comparação foi feita.

## Regras

1. Uma análise de economia por viagem (`trip_id` único), da mesma agência e da mesma pessoa da viagem.
2. Criar/editar/excluir: dono e vendedor (quem já acessa viagens). Editar mantém o ID e grava **versão** imutável com o retrato completo; o histórico mostra as versões. Exclusão remove a análise e fica registrada na auditoria.
3. Disponibilidade calculada pela API, com motivos: falta preço/fonte/data, falta confirmação de equivalência, sem custo, milhas com custo desconhecido, sem metodologia, viagem cancelada.
4. Valores em `NUMERIC(19,2)`, nunca negativos nas linhas; o resultado pode ser negativo ("sem economia"). Percentual = economia / preço comparável.
5. **Relatório por pessoa/período** (data de partida da viagem): soma só as análises disponíveis; lista as indisponíveis com o motivo. Nenhum total mistura estimativas.
6. **Relatório compartilhável** (somente dono): o gestor revisa a prévia, escolhe o que ocultar (nome da pessoa, localizadores, fontes/links, observações) e gera um **retrato imutável** com PDF. Pode excluir o retrato; não edita (gera outro). Não há link público nesta etapa.
7. Nada cria ou altera venda, recebível, lançamento financeiro, cotação ou viagem.
8. Isolamento por agência em todas as consultas; viagem/pessoa de outra agência → 404. `expectedVersion` (409 em conflito).
9. Auditoria própria (`trip_savings_audit`) com recurso, ação, autor (`nome <e-mail>`), data e detalhe sem senha/token.

## API (prefixo `/api/v1`)

| Método | Rota | Observação |
|---|---|---|
| GET | `/savings?customerId&from&to&availability` | análises com resultado calculado |
| GET/PUT/DELETE | `/trips/{tripId}/savings` | PUT cria (`expectedVersion` 0) ou edita (versão atual) |
| GET | `/trips/{tripId}/savings/versions/{v}` | retrato de versão |
| POST/GET/DELETE | `/trips/{tripId}/savings/evidence[/{id}]` | ≤ 5 MB; PDF/JPG/PNG/WEBP |
| GET | `/savings/report?customerId&from&to` | consolidado ao vivo |
| POST/GET/DELETE | `/savings/shared-reports[/{id}]` | retrato com ocultações; `/pdf`; só dono |

Persistência própria: `trip_savings`, `trip_savings_versions`, `trip_savings_evidence`, `trip_savings_reports`, `trip_savings_audit`. Migration provisória `V57__trip_savings.sql`: V56 está reservada provisoriamente pela F02 em outra branch, e o integrador define a numeração final.

## Interface

Rotas próprias: `/economia` (consolidado por pessoa/período, filtros, lista de indisponíveis), `/economia/viagens/[tripId]` (formulário da análise, versões, evidências, histórico), `/economia/relatorios` (prévia com ocultações, geração, PDF, exclusão). A integração com a página da viagem, o menu e o middleware fica registrada em `docs/coordination/requests/claude-f03-economia-cliente.md`.

## Critérios de aceite

- Comparação registra rota, datas, passageiros, condições e as quatro confirmações; sem elas, resultado indisponível.
- Custo com linhas explícitas de taxas e honorários; custo de milhas só com origem; desconhecido → indisponível.
- Sem base documentada, a UI mostra "indisponível" com o motivo, nunca um número.
- Reembolso e multa ajustam o resultado; viagem cancelada sai do total realizado.
- Edição pelo mesmo ID com versões; exclusão auditada; persistência após recarregar; sucesso só após a API.
- Relatório compartilhável permite revisar e ocultar dados pessoais antes de gerar; o retrato não muda depois.
- Isolamento entre agências, permissões (relatório só dono) e conflito de versão testados.
