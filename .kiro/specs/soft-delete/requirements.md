# Documento de Requisitos — Soft Delete

## Introdução

Este documento especifica os requisitos para a funcionalidade de **Soft Delete** (exclusão lógica) de Cotações e Clientes no sistema AgenciaHub. O objetivo é permitir que o usuário remova registros da visualização principal (dashboard e listagens) sem perder os dados permanentemente, mantendo um histórico acessível através de uma seção dedicada ("Lixeira").

## Glossário

- **Sistema**: A aplicação AgenciaHub (API + Frontend)
- **API**: O backend Spring Boot (agencia-hub-api)
- **Frontend**: A aplicação Next.js (agencia-hub)
- **Cotação**: Registro de orçamento/proposta de viagem para um cliente (entidade `Quotation`)
- **Cliente**: Registro de pessoa física ou jurídica atendida pela agência (entidade `Customer`)
- **Soft_Delete**: Exclusão lógica onde o registro recebe um timestamp de exclusão (`deletedAt`) mas permanece no banco de dados
- **Lixeira**: Seção da interface onde itens excluídos logicamente podem ser visualizados e restaurados
- **Dashboard**: Painel principal do sistema que exibe métricas e listagens ativas
- **Usuário_Autenticado**: Pessoa com sessão ativa no sistema

## Requisitos

### Requisito 1: Campo de Exclusão Lógica nas Entidades

**User Story:** Como desenvolvedor, eu quero que as entidades Cotação e Cliente possuam um campo `deletedAt`, para que a exclusão lógica seja rastreável com data e hora.

#### Critérios de Aceitação

1. THE API SHALL armazenar um campo `deleted_at` do tipo `TIMESTAMP WITH TIME ZONE` (nullable) nas tabelas `quotations` e `customers`
2. WHEN uma Cotação ou Cliente é criado, THE API SHALL definir o campo `deleted_at` como `NULL`
3. THE API SHALL considerar um registro como "ativo" quando o campo `deleted_at` for `NULL`
4. THE API SHALL considerar um registro como "excluído" quando o campo `deleted_at` contiver um timestamp válido

### Requisito 2: Exclusão Lógica de Cotações

**User Story:** Como usuário autenticado, eu quero excluir logicamente uma cotação, para que ela não apareça mais nas listagens principais mas possa ser recuperada depois.

#### Critérios de Aceitação

1. WHEN o Usuário_Autenticado solicita a exclusão de uma Cotação, THE API SHALL definir o campo `deleted_at` com o timestamp atual (UTC)
2. WHEN o Usuário_Autenticado solicita a exclusão de uma Cotação, THE API SHALL retornar status HTTP 204 (No Content)
3. IF a Cotação solicitada para exclusão não existir, THEN THE API SHALL retornar status HTTP 404 com mensagem descritiva
4. IF a Cotação solicitada já estiver excluída logicamente, THEN THE API SHALL retornar status HTTP 404 com mensagem descritiva
5. WHEN uma Cotação é excluída logicamente, THE API SHALL preservar todos os dados originais do registro sem alteração

### Requisito 3: Exclusão Lógica de Clientes

**User Story:** Como usuário autenticado, eu quero excluir logicamente um cliente, para que ele não apareça mais nas listagens principais mas possa ser recuperado depois.

#### Critérios de Aceitação

1. WHEN o Usuário_Autenticado solicita a exclusão de um Cliente, THE API SHALL definir o campo `deleted_at` com o timestamp atual (UTC)
2. WHEN o Usuário_Autenticado solicita a exclusão de um Cliente, THE API SHALL retornar status HTTP 204 (No Content)
3. IF o Cliente solicitado para exclusão não existir, THEN THE API SHALL retornar status HTTP 404 com mensagem descritiva
4. IF o Cliente solicitado já estiver excluído logicamente, THEN THE API SHALL retornar status HTTP 404 com mensagem descritiva
5. WHEN um Cliente é excluído logicamente, THE API SHALL preservar todos os dados originais do registro sem alteração
6. WHEN um Cliente é excluído logicamente, THE API SHALL manter as Cotações associadas a esse Cliente inalteradas (sem exclusão em cascata)

### Requisito 4: Filtragem de Registros Excluídos nas Listagens

**User Story:** Como usuário autenticado, eu quero que registros excluídos não apareçam nas listagens e no dashboard, para que eu trabalhe apenas com dados ativos.

#### Critérios de Aceitação

1. THE API SHALL excluir registros com `deleted_at` preenchido de todas as consultas de listagem de Cotações
2. THE API SHALL excluir registros com `deleted_at` preenchido de todas as consultas de listagem de Clientes
3. THE API SHALL excluir registros com `deleted_at` preenchido das métricas do Dashboard do Vendedor
4. WHEN o Usuário_Autenticado busca Cotações por filtros (cliente, status, texto), THE API SHALL retornar apenas registros com `deleted_at` nulo
5. WHEN o Usuário_Autenticado busca Clientes por filtros (nome, status), THE API SHALL retornar apenas registros com `deleted_at` nulo
6. WHEN o Usuário_Autenticado acessa o detalhe de uma Cotação ativa pelo ID, THE API SHALL retornar os dados normalmente
7. WHEN o Usuário_Autenticado acessa o detalhe de um Cliente ativo pelo ID, THE API SHALL retornar os dados normalmente
8. IF o Usuário_Autenticado tenta acessar o detalhe de uma Cotação excluída pelo ID (fora da Lixeira), THEN THE API SHALL retornar status HTTP 404

### Requisito 5: Visualização da Lixeira

**User Story:** Como usuário autenticado, eu quero acessar uma seção "Lixeira" no sistema, para que eu possa visualizar o histórico de itens excluídos.

#### Critérios de Aceitação

1. THE API SHALL fornecer um endpoint dedicado para listar Cotações excluídas logicamente (onde `deleted_at` não é nulo)
2. THE API SHALL fornecer um endpoint dedicado para listar Clientes excluídos logicamente (onde `deleted_at` não é nulo)
3. WHEN o Usuário_Autenticado acessa a Lixeira, THE Frontend SHALL exibir os itens excluídos separados por tipo (Cotações e Clientes)
4. THE Frontend SHALL exibir a data de exclusão (`deleted_at`) de cada item na Lixeira
5. THE Frontend SHALL exibir as informações principais de cada item excluído (nome do cliente, título da cotação, destino)
6. THE Frontend SHALL ordenar os itens da Lixeira pela data de exclusão mais recente primeiro

### Requisito 6: Restauração de Registros Excluídos

**User Story:** Como usuário autenticado, eu quero restaurar um item da Lixeira, para que ele volte a aparecer nas listagens principais.

#### Critérios de Aceitação

1. WHEN o Usuário_Autenticado solicita a restauração de uma Cotação excluída, THE API SHALL definir o campo `deleted_at` como `NULL`
2. WHEN o Usuário_Autenticado solicita a restauração de um Cliente excluído, THE API SHALL definir o campo `deleted_at` como `NULL`
3. WHEN uma Cotação é restaurada, THE API SHALL retornar status HTTP 200 com os dados atualizados da Cotação
4. WHEN um Cliente é restaurado, THE API SHALL retornar status HTTP 200 com os dados atualizados do Cliente
5. IF o registro solicitado para restauração não existir ou não estiver excluído, THEN THE API SHALL retornar status HTTP 404 com mensagem descritiva
6. WHEN um registro é restaurado, THE API SHALL preservar todos os dados originais sem alteração

### Requisito 7: Interface de Exclusão no Frontend

**User Story:** Como usuário autenticado, eu quero ter um botão/ação de exclusão nas telas de cotações e clientes, para que eu possa remover itens facilmente.

#### Critérios de Aceitação

1. THE Frontend SHALL exibir uma ação de exclusão na listagem de Cotações para cada item
2. THE Frontend SHALL exibir uma ação de exclusão na listagem de Clientes para cada item
3. WHEN o Usuário_Autenticado clica na ação de exclusão, THE Frontend SHALL exibir um diálogo de confirmação antes de executar a operação
4. WHEN o Usuário_Autenticado confirma a exclusão, THE Frontend SHALL chamar o endpoint de soft delete da API
5. WHEN a exclusão é confirmada com sucesso, THE Frontend SHALL remover o item da listagem atual sem necessidade de recarregar a página
6. IF a chamada de exclusão falhar, THEN THE Frontend SHALL exibir uma mensagem de erro descritiva ao Usuário_Autenticado

### Requisito 8: Navegação para a Lixeira

**User Story:** Como usuário autenticado, eu quero acessar a Lixeira facilmente pela navegação do sistema, para que eu encontre itens excluídos quando necessário.

#### Critérios de Aceitação

1. THE Frontend SHALL incluir um link de acesso à Lixeira no menu de navegação lateral
2. WHEN o Usuário_Autenticado acessa a página da Lixeira, THE Frontend SHALL exibir abas ou seções para filtrar entre Cotações e Clientes excluídos
3. THE Frontend SHALL exibir um botão de restauração para cada item na Lixeira
4. WHEN o Usuário_Autenticado clica em restaurar um item, THE Frontend SHALL chamar o endpoint de restauração da API
5. WHEN a restauração é confirmada com sucesso, THE Frontend SHALL remover o item da Lixeira e exibir uma mensagem de sucesso
