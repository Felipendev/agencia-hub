# Publicação — simulações de Milhas por cliente

Publicado em 20/10/2026, após Agenda/V59 e Checklists/V60, API antes da interface.

## Código e deploys

- API [PR #64](https://github.com/Felipendev/agencia-hub-api/pull/64): head revisado `22c7b4a364db86800aa44e9fb10d88a3fd32776a`; merge `a9932f8691518ef93dc3ee41328f64d3fe664bd4`.
- Railway produção `b603ff5f-acfd-4141-b7f6-cfa052b56bb4` SUCCESS: logs de 22:53:53 UTC confirmam uma migration V60→V61 em public; 22:53:56 UTC confirmam inicialização concluída.
- Interface [PR #57](https://github.com/Felipendev/agencia-hub/pull/57): head revisado `4d0147bda7d9977048638a5ba5dee9d77f7dd58d`; merge `a3b67c8a634939a6c77cca093da200b2674734d0`.
- Vercel `dpl_DBbTbgb8vrswnQ6vms4KJrmhhTm8` READY, commit exato confirmado e alias www.agenciashub.com.br associado.

## Validação

47 testes API aprovados em PostgreSQL efêmero: vínculo/CRUD/histórico/legado, upgrade V60→V61, regressões de checklists e agenda, privacidade, isolamento e descarte da agência. 144 testes frontend aprovados, build e tipos aprovados; lint zero erros, dois avisos preexistentes. CI e prévias aprovadas nos heads revisados. Prévia API `6214ef06-c409-48b3-a548-371673b08c4c` iniciou com V61, OpenAPI 200 e simulações sem sessão 403.

Produção: site e OpenAPI HTTP 200; rotas da API sem sessão recusadas com 403. Não foi executado CRUD autenticado com dados reais em produção. Evidências de comportamento vêm dos testes com banco efêmero e das telas locais com dados fictícios, documentadas em simulacoes-por-cliente-2026-10-20.md.

## Resultado e limites

Salvar novo plano exige pessoa autorizada da agência; calcular avulso continua disponível. Perfil de Milhas e simulador consultam os mesmos cenários. Edição mantém o ID; troca/associação legada exige confirmação e preserva versões, além de consulta e exclusão aplicáveis. Não cria carteira nem altera saldo, vendas ou Viagens. Privacidade/histórico e módulos Agenda/Checklists foram preservados na integração.

V59, V60 e V61 estão publicadas e imutáveis. Próxima reserva: V62 Claude/TODO-050/F10. Evolução completa F04/F06, diagnóstico público e integrações com tarefas continuam pendentes no backlog.
