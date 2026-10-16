# Publicação em produção — 13/10/2026

Publicação autorizada pelo usuário e concluída no domínio https://www.agenciashub.com.br.

## Versões publicadas

- Correções do site: `a38574141b61c02227b1478d6c343871b01afb4b`, Vercel `dpl_B88ZqwfoxA5UeGmRRWv4tKZHo6gr`, READY.
- API: `ee5238ed8c0101857053524aa973f231e225368d`, Railway `29624cdd-fa7c-4e4b-8a86-d60134528c3a`, SUCCESS.
- Calculadora de voos e Biblioteca: `db9f02457a7d8f6fe8691335da66e06e4dc14892`, Vercel `dpl_DJuxcNaTGZkFZqFCKWMF4tMH77rU`, READY, associado ao domínio oficial.
- Ajuste final de acesso às páginas: `eb3248a84e33fa72162ba3f59045cdeecb07e9d0`, Vercel `dpl_72zZcDy2khMjw3JpsnR7i851mYMU`, READY, versão final associada ao domínio oficial.

## Verificações

- 53 testes do frontend e 33 testes da API aprovados.
- Verificação de estilo e compilação de produção aprovadas em cópias isoladas das versões publicadas.
- GitHub Actions da API e do frontend concluídos com sucesso.
- Railway confirmou a aplicação das migrações V50 e V51 e a inicialização da API.
- Página pública de login retornou HTTP 200.
- No cadastro em produção, a edição do DDI para 351 preservou o telefone 912345678; nenhum cadastro foi enviado.
- A API recusou acesso anônimo à Biblioteca (HTTP 403) e aceitou a origem oficial nas verificações CORS.
- Biblioteca, Viagens, Vendas e Calculadora redirecionaram requisições sem sessão para o login (HTTP 307), após conferência em produção.

Os fluxos completos de aprovação, lucro, financeiro, viagens e Biblioteca foram verificados por testes de integração com PostgreSQL e dados fictícios. Não foi utilizada uma conta autenticada de produção para alterar registros de clientes.

As alterações locais de login de desenvolvimento foram excluídas das duas publicações.

Descrição funcional: [implementações das demandas](implementacoes-demandas-2026-10-13.md).
