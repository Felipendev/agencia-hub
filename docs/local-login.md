# Login livre local

Ativado a pedido do usuário em 17/09/2026 para testar a calculadora.

No frontend, `.env.local` contém `NEXT_PUBLIC_LOCAL_LOGIN=true`. O modo só funciona em `next dev`. Qualquer e-mail/senha (inclusive vazios) abre a mesma conta `sandbox@agencia-hub.invalid`, na agência de testes local. Os campos digitados não identificam contas reais.

A API deve iniciar com `SPRING_PROFILES_ACTIVE=local-login`, `SERVER_ADDRESS=127.0.0.1`, `PORT=8090` e `DB_PORT=5433`. O endpoint `POST /internal/local-login` existe somente nesse perfil, exclui `prod`/`production` e exige PostgreSQL local e conexão de loopback. Cria uma conta de dono e agência de testes no primeiro acesso; mantém seus dados nos acessos seguintes. A sessão usa JWT normal para importar e salvar cotações.

Para desativar, remova a variável do frontend e o perfil da API e reinicie ambos. O login normal mantém suas validações. A chave Gemini permanece somente no `.env.local` do backend e deve ser carregada no processo antes de iniciar o Spring.

Serviços iniciados localmente; suíte de testes não executada, conforme orientação do projeto.
