# Documento de Requisitos — Onboarding de Agência, Convite de Vendedor e Autenticação por E-mail

## Introdução

Este documento especifica os requisitos para transformar a plataforma AgenciaHub de single-tenant (uma única agência com seed fixo) para multi-tenant, onde múltiplas agências podem se cadastrar de forma independente. Inclui o fluxo completo de cadastro de agência, verificação de e-mail por código, convite e cadastro de vendedores vinculados a uma agência, recuperação de senha e alteração de senha. Após esta implementação, cada agência terá seus dados isolados e seus próprios vendedores.

## Glossário

- **Sistema**: O backend AgenciaHub API (Spring Boot) e o frontend AgenciaHub (Next.js) operando em conjunto.
- **Agência**: Entidade organizacional que representa uma agência de viagens. Toda operação no sistema pertence a uma agência.
- **Proprietário**: Usuário com role OWNER que administra uma agência. Criado durante o cadastro da agência.
- **Vendedor**: Usuário com role SELLER vinculado a exatamente uma agência. Só existe no contexto de uma agência.
- **Código_de_Verificação**: Código numérico de 6 dígitos enviado por e-mail para validar a identidade do usuário.
- **Token_de_Convite**: Token único e temporário gerado para permitir que um vendedor se cadastre vinculado a uma agência específica.
- **Serviço_de_Email**: Componente responsável por enviar e-mails transacionais (verificação, convite, recuperação de senha).
- **Token_de_Redefinição**: Token único e temporário gerado para permitir a redefinição de senha de um usuário.
- **Página_de_Cadastro**: Interface pública onde uma nova agência pode se registrar no sistema.
- **Página_de_Login**: Interface pública onde usuários autenticam-se com e-mail e senha.
- **Termos_de_Uso**: Documento legal que rege a relação entre a plataforma (FELTRIX LTDA - ME, CNPJ 43.984.680/0001-38) e a agência contratante, incluindo licenciamento SaaS, proteção de dados (LGPD), SLA, propriedade intelectual e limitações de responsabilidade.
- **Aceite_de_Termos**: Registro do consentimento do Proprietário aos Termos_de_Uso e Política de Privacidade, incluindo versão do documento e timestamp.
- **Status_da_Assinatura**: Estado do ciclo de vida da assinatura da Agência. Valores possíveis: TRIAL, ACTIVE, PAST_DUE, CANCELED, SUSPENDED.
- **Status_da_Agência**: Estado operacional da Agência na plataforma. Valores possíveis: PENDING_VERIFICATION, ACTIVE, TRIAL, SUSPENDED, CANCELED.
- **Período_Trial**: Período gratuito de 10 dias concedido a toda nova Agência após a verificação de e-mail.
- **Página_de_Edição_Agência**: Interface autenticada onde o Proprietário pode alterar os dados cadastrais da Agência.

## Requisitos

### Requisito 1: Cadastro de Agência

**User Story:** Como dono de uma agência de viagens, eu quero me cadastrar na plataforma com os dados da minha agência, para que eu possa gerenciar meus clientes, cotações e vendedores de forma independente.

#### Critérios de Aceitação

1. WHEN o Proprietário acessa a Página_de_Cadastro e submete nome da agência, nome do proprietário, e-mail e senha, THE Sistema SHALL criar uma nova Agência e um usuário Proprietário vinculado a ela com status "pendente de verificação".
2. WHEN o cadastro é submetido com sucesso, THE Serviço_de_Email SHALL enviar um Código_de_Verificação de 6 dígitos para o e-mail informado dentro de 30 segundos.
3. WHEN o Proprietário informa o Código_de_Verificação correto dentro do prazo de validade, THE Sistema SHALL ativar a conta do Proprietário e a Agência, permitindo o login.
4. IF o e-mail informado já estiver cadastrado no Sistema, THEN THE Sistema SHALL rejeitar o cadastro e informar que o e-mail já está em uso.
5. IF o Código_de_Verificação informado estiver incorreto ou expirado, THEN THE Sistema SHALL rejeitar a verificação e permitir o reenvio de um novo código.
6. THE Sistema SHALL exigir que a senha tenha no mínimo 8 caracteres.
7. WHEN o Proprietário solicita reenvio do Código_de_Verificação, THE Serviço_de_Email SHALL gerar um novo código, invalidar o anterior e enviá-lo ao e-mail cadastrado.
8. THE Sistema SHALL limitar o reenvio de Código_de_Verificação a 5 tentativas por hora por e-mail.

### Requisito 2: Entidade Agência e Multi-Tenancy

**User Story:** Como plataforma, eu quero que cada agência tenha seus dados completamente isolados, para que múltiplas agências possam operar no sistema sem ver dados umas das outras.

#### Critérios de Aceitação

1. THE Sistema SHALL associar cada Vendedor, Cliente, Oportunidade, Cotação e Entrada Financeira a exatamente uma Agência.
2. THE Sistema SHALL filtrar todas as consultas de dados pelo identificador da Agência do usuário autenticado.
3. WHEN um usuário autenticado faz uma requisição, THE Sistema SHALL retornar apenas dados pertencentes à Agência do usuário.
4. IF um usuário tentar acessar um recurso de outra Agência, THEN THE Sistema SHALL retornar erro 403 (Forbidden).
5. THE Sistema SHALL garantir que um Vendedor pertence a exatamente uma Agência e não pode ser transferido entre agências.

### Requisito 3: Convite de Vendedor por Link

**User Story:** Como proprietário de uma agência, eu quero convidar vendedores para se cadastrarem na minha agência via link enviado por WhatsApp ou e-mail, para que eles possam criar suas próprias credenciais de acesso.

#### Critérios de Aceitação

1. WHEN o Proprietário solicita o envio de um convite informando o e-mail do vendedor, THE Sistema SHALL gerar um Token_de_Convite único vinculado à Agência e ao e-mail do vendedor.
2. WHEN o Token_de_Convite é gerado, THE Serviço_de_Email SHALL enviar um e-mail ao vendedor contendo o link de cadastro com o token.
3. WHEN o Token_de_Convite é gerado, THE Sistema SHALL disponibilizar o link de convite para o Proprietário copiar e compartilhar via WhatsApp ou outro canal.
4. WHEN o vendedor acessa o link de convite com um Token_de_Convite válido, THE Sistema SHALL exibir o formulário de cadastro pré-preenchido com o e-mail e vinculado à Agência correspondente.
5. WHEN o vendedor completa o cadastro via convite informando nome e senha, THE Sistema SHALL criar o Vendedor vinculado à Agência do convite e enviar um Código_de_Verificação por e-mail.
6. WHEN o vendedor informa o Código_de_Verificação correto, THE Sistema SHALL ativar a conta do Vendedor.
7. IF o Token_de_Convite estiver expirado (mais de 72 horas desde a criação), THEN THE Sistema SHALL rejeitar o cadastro e informar que o convite expirou.
8. IF o Token_de_Convite já tiver sido utilizado, THEN THE Sistema SHALL rejeitar o cadastro e informar que o convite já foi usado.
9. THE Sistema SHALL permitir que o Proprietário visualize a lista de convites pendentes e seus status (pendente, aceito, expirado).
10. THE Sistema SHALL permitir que o Proprietário revogue um convite pendente.

### Requisito 4: Cadastro Direto de Vendedor pelo Proprietário

**User Story:** Como proprietário de uma agência, eu quero cadastrar vendedores diretamente no sistema informando seus dados, para manter o fluxo existente do MVP onde o proprietário gerencia a equipe.

#### Critérios de Aceitação

1. WHEN o Proprietário submete os dados de um novo vendedor (nome, e-mail, senha, comissão), THE Sistema SHALL criar o Vendedor vinculado à Agência do Proprietário com status ativo.
2. WHEN o Proprietário cadastra um vendedor diretamente, THE Sistema SHALL criar a conta sem exigir verificação de e-mail (a verificação é responsabilidade do proprietário).
3. IF o e-mail do vendedor já estiver cadastrado no Sistema, THEN THE Sistema SHALL rejeitar o cadastro e informar que o e-mail já está em uso.

### Requisito 5: Autenticação e Login

**User Story:** Como usuário (proprietário ou vendedor), eu quero fazer login com meu e-mail e senha, para acessar o painel da minha agência.

#### Critérios de Aceitação

1. WHEN um usuário submete e-mail e senha válidos na Página_de_Login, THE Sistema SHALL autenticar o usuário e retornar um token JWT contendo o identificador do usuário, role e identificador da Agência.
2. IF o e-mail ou senha estiverem incorretos, THEN THE Sistema SHALL retornar erro genérico "Credenciais inválidas" sem indicar qual campo está errado.
3. IF a conta do usuário não estiver verificada, THEN THE Sistema SHALL rejeitar o login e informar que a verificação de e-mail é necessária.
4. IF a conta do usuário estiver inativa, THEN THE Sistema SHALL rejeitar o login e informar que a conta está desativada.
5. THE Sistema SHALL incluir o identificador da Agência no payload do token JWT para uso no filtro de multi-tenancy.

### Requisito 6: Recuperação de Senha

**User Story:** Como usuário, eu quero recuperar minha senha caso a esqueça, para que eu possa voltar a acessar o sistema sem depender de suporte.

#### Critérios de Aceitação

1. WHEN um usuário solicita recuperação de senha informando seu e-mail, THE Serviço_de_Email SHALL enviar um Código_de_Verificação de 6 dígitos para o e-mail dentro de 30 segundos.
2. WHEN o usuário informa o Código_de_Verificação correto e uma nova senha, THE Sistema SHALL atualizar a senha do usuário e invalidar todas as sessões anteriores.
3. IF o e-mail informado não estiver cadastrado, THEN THE Sistema SHALL responder com sucesso genérico sem revelar se o e-mail existe no sistema.
4. IF o Código_de_Verificação estiver incorreto ou expirado (mais de 15 minutos), THEN THE Sistema SHALL rejeitar a redefinição e permitir nova solicitação.
5. THE Sistema SHALL limitar solicitações de recuperação de senha a 5 por hora por e-mail.
6. THE Sistema SHALL exigir que a nova senha tenha no mínimo 8 caracteres.

### Requisito 7: Alteração de Senha

**User Story:** Como usuário autenticado, eu quero alterar minha senha, para manter minha conta segura.

#### Critérios de Aceitação

1. WHEN um usuário autenticado submete a senha atual e uma nova senha, THE Sistema SHALL validar a senha atual e atualizar para a nova senha.
2. IF a senha atual informada estiver incorreta, THEN THE Sistema SHALL rejeitar a alteração e informar que a senha atual está incorreta.
3. THE Sistema SHALL exigir que a nova senha tenha no mínimo 8 caracteres.
4. WHEN a senha é alterada com sucesso, THE Sistema SHALL invalidar todos os tokens JWT emitidos anteriormente para o usuário.

### Requisito 8: Verificação de E-mail (Código)

**User Story:** Como plataforma, eu quero validar que o e-mail informado pertence ao usuário, para garantir a autenticidade das contas e permitir comunicação confiável.

#### Critérios de Aceitação

1. THE Sistema SHALL gerar Código_de_Verificação como número aleatório de 6 dígitos.
2. THE Sistema SHALL armazenar o Código_de_Verificação com hash seguro (não em texto plano).
3. THE Sistema SHALL definir validade de 15 minutos para cada Código_de_Verificação.
4. WHEN um novo Código_de_Verificação é gerado para o mesmo e-mail, THE Sistema SHALL invalidar todos os códigos anteriores para aquele e-mail.
5. THE Sistema SHALL limitar tentativas de validação de código a 5 por código gerado.
6. IF o número máximo de tentativas for atingido, THEN THE Sistema SHALL invalidar o código e exigir geração de um novo.

### Requisito 9: Páginas Públicas (Login e Cadastro)

**User Story:** Como visitante, eu quero acessar as páginas de login e cadastro sem autenticação, para poder entrar no sistema ou criar uma nova conta.

#### Critérios de Aceitação

1. THE Sistema SHALL disponibilizar a Página_de_Login em rota pública acessível sem autenticação.
2. THE Sistema SHALL disponibilizar a Página_de_Cadastro em rota pública acessível sem autenticação.
3. THE Sistema SHALL disponibilizar a página de cadastro via convite em rota pública acessível sem autenticação.
4. THE Sistema SHALL disponibilizar a página de recuperação de senha em rota pública acessível sem autenticação.
5. WHEN um usuário já autenticado acessa a Página_de_Login, THE Sistema SHALL redirecionar para o painel (dashboard).
6. THE Página_de_Cadastro SHALL exibir campos para: nome da agência, nome do proprietário, e-mail e senha.
7. THE Página_de_Login SHALL exibir link para a Página_de_Cadastro e para recuperação de senha.

### Requisito 10: Migração de Dados Existentes

**User Story:** Como plataforma, eu quero migrar os dados existentes (usuário seed e dados associados) para o novo modelo multi-tenant, para que o sistema continue funcionando após a implementação.

#### Critérios de Aceitação

1. WHEN a migração é executada, THE Sistema SHALL criar uma Agência padrão e vincular o usuário seed (admin@agenciahub.com) a ela como Proprietário.
2. WHEN a migração é executada, THE Sistema SHALL vincular todos os registros existentes (clientes, oportunidades, cotações, entradas financeiras) à Agência padrão.
3. THE Sistema SHALL marcar o usuário seed como "verificado" para que continue podendo fazer login sem necessidade de verificação.
4. THE Sistema SHALL executar a migração de forma idempotente, sem duplicar dados caso seja executada mais de uma vez.

### Requisito 11: Aceite de Termos de Uso e Política de Privacidade

**User Story:** Como plataforma operada pela FELTRIX LTDA - ME (CNPJ 43.984.680/0001-38), eu quero que todo proprietário aceite os Termos de Uso e a Política de Privacidade durante o cadastro, para garantir conformidade com a LGPD e formalizar a relação contratual B2B.

#### Critérios de Aceitação

1. THE Página_de_Cadastro SHALL exibir checkbox obrigatório com o texto "Li e aceito os Termos de Uso e a Política de Privacidade" com links para os documentos completos.
2. WHEN o Proprietário submete o cadastro sem marcar o checkbox de aceite, THE Sistema SHALL rejeitar o cadastro e informar que o aceite dos Termos_de_Uso é obrigatório.
3. WHEN o Proprietário submete o cadastro com o checkbox marcado, THE Sistema SHALL registrar o Aceite_de_Termos contendo: identificador do usuário, versão do documento aceito, timestamp (data e hora) do aceite e endereço IP de origem.
4. THE Sistema SHALL armazenar o histórico de todas as versões de Termos_de_Uso aceitas por cada Proprietário.
5. WHEN uma nova versão dos Termos_de_Uso é publicada, THE Sistema SHALL solicitar novo aceite ao Proprietário no próximo login.
6. IF o Proprietário não aceitar a nova versão dos Termos_de_Uso, THEN THE Sistema SHALL restringir o acesso até que o aceite seja realizado.
7. THE Sistema SHALL disponibilizar os Termos_de_Uso e a Política de Privacidade em páginas públicas acessíveis sem autenticação.

### Requisito 12: Confirmação de Senha no Cadastro

**User Story:** Como visitante que está se cadastrando, eu quero confirmar minha senha digitando-a duas vezes, para evitar erros de digitação que me impediriam de acessar o sistema.

#### Critérios de Aceitação

1. THE Página_de_Cadastro SHALL exibir campo "Confirmar senha" além do campo "Senha".
2. WHEN o Proprietário submete o cadastro com os campos "Senha" e "Confirmar senha" diferentes, THE Sistema SHALL rejeitar o cadastro e informar que as senhas não coincidem.
3. WHEN o vendedor acessa o formulário de cadastro via convite, THE Sistema SHALL exibir campo "Confirmar senha" além do campo "Senha".
4. WHEN o vendedor submete o cadastro via convite com os campos "Senha" e "Confirmar senha" diferentes, THE Sistema SHALL rejeitar o cadastro e informar que as senhas não coincidem.
5. THE Sistema SHALL validar a correspondência das senhas no lado do cliente (frontend) antes de submeter ao servidor.
6. THE Sistema SHALL validar a correspondência das senhas no lado do servidor como segunda camada de proteção.

### Requisito 13: Campo de Telefone/Celular no Cadastro

**User Story:** Como proprietário de uma agência de viagens, eu quero informar meu telefone pessoal e o telefone comercial da agência durante o cadastro, para que a plataforma possa me contatar via WhatsApp, que é o canal principal de comunicação das agências.

#### Critérios de Aceitação

1. THE Página_de_Cadastro SHALL exibir campo obrigatório "Telefone/WhatsApp do proprietário" com máscara de telefone brasileiro.
2. THE Página_de_Cadastro SHALL exibir campo opcional "Telefone comercial da agência" com máscara de telefone brasileiro.
3. THE Sistema SHALL aceitar números de telefone nos formatos celular (11 dígitos) e fixo (10 dígitos) com DDD.
4. WHEN o Proprietário submete o cadastro com telefone em formato inválido, THE Sistema SHALL rejeitar o cadastro e informar o formato esperado.
5. THE Sistema SHALL armazenar os números de telefone em formato padronizado (apenas dígitos com código do país +55).
6. WHEN o Proprietário cadastra um vendedor diretamente, THE Sistema SHALL permitir informar o telefone/WhatsApp do vendedor como campo opcional.

### Requisito 14: Regra de Trial para Novas Agências

**User Story:** Como plataforma, eu quero que toda nova agência inicie com um período trial gratuito de 10 dias, para que o proprietário possa avaliar o sistema antes de contratar um plano pago.

#### Critérios de Aceitação

1. WHEN a Agência é ativada após verificação de e-mail, THE Sistema SHALL atribuir Status_da_Assinatura TRIAL com data de expiração de 10 dias a partir da ativação.
2. WHILE a Agência possui Status_da_Assinatura TRIAL e o Período_Trial não expirou, THE Sistema SHALL permitir acesso completo a todas as funcionalidades da plataforma.
3. WHEN o Período_Trial expira sem contratação de plano pago, THE Sistema SHALL alterar o Status_da_Assinatura para SUSPENDED e restringir o acesso às funcionalidades.
4. WHILE a Agência possui Status_da_Assinatura SUSPENDED, THE Sistema SHALL permitir apenas acesso à página de contratação de plano e exportação de dados.
5. WHEN a Agência contrata um plano pago, THE Sistema SHALL alterar o Status_da_Assinatura para ACTIVE independentemente do status anterior.
6. WHEN o pagamento de uma Agência com Status_da_Assinatura ACTIVE falha, THE Sistema SHALL alterar o Status_da_Assinatura para PAST_DUE e manter acesso por 7 dias adicionais.
7. IF a Agência permanecer com Status_da_Assinatura PAST_DUE por mais de 7 dias, THEN THE Sistema SHALL alterar o Status_da_Assinatura para SUSPENDED.
8. WHEN o Proprietário solicita cancelamento, THE Sistema SHALL alterar o Status_da_Assinatura para CANCELED e manter os dados acessíveis para exportação por 30 dias.
9. THE Sistema SHALL exibir no painel do Proprietário os dias restantes do Período_Trial quando Status_da_Assinatura for TRIAL.

### Requisito 15: Permissões por Role (OWNER e SELLER)

**User Story:** Como proprietário de uma agência, eu quero que os vendedores tenham acesso restrito a funcionalidades específicas, para proteger dados sensíveis e manter o controle administrativo da agência.

#### Critérios de Aceitação

1. THE Sistema SHALL conceder ao Proprietário (OWNER) acesso completo a todas as funcionalidades da Agência.
2. THE Sistema SHALL restringir o Vendedor (SELLER) de acessar o módulo financeiro da Agência.
3. THE Sistema SHALL restringir o Vendedor (SELLER) de exportar a base de clientes da Agência.
4. THE Sistema SHALL restringir o Vendedor (SELLER) de cadastrar, editar ou remover outros vendedores.
5. THE Sistema SHALL restringir o Vendedor (SELLER) de excluir cotações criadas por outros vendedores.
6. THE Sistema SHALL permitir que o Vendedor (SELLER) visualize e gerencie apenas seus próprios clientes, cotações e oportunidades.
7. THE Sistema SHALL permitir que o Vendedor (SELLER) crie novas cotações e oportunidades vinculadas a seus clientes.
8. THE Sistema SHALL permitir que o Proprietário (OWNER) visualize dados de todos os vendedores da Agência.
9. IF um Vendedor tentar acessar funcionalidade restrita ao Proprietário, THEN THE Sistema SHALL retornar erro 403 (Forbidden) e exibir mensagem informando permissão insuficiente.
10. THE Sistema SHALL validar permissões tanto no frontend (ocultando elementos de interface) quanto no backend (rejeitando requisições não autorizadas).

### Requisito 16: Status Detalhado da Agência

**User Story:** Como plataforma, eu quero gerenciar o ciclo de vida completo de uma agência com status detalhados, para controlar o acesso e acompanhar a situação de cada agência cadastrada.

#### Critérios de Aceitação

1. THE Sistema SHALL atribuir Status_da_Agência PENDING_VERIFICATION quando uma nova Agência é criada e aguarda verificação de e-mail.
2. WHEN o Proprietário verifica o e-mail com sucesso e o Período_Trial é iniciado, THE Sistema SHALL alterar o Status_da_Agência para TRIAL.
3. WHEN a Agência contrata um plano pago, THE Sistema SHALL alterar o Status_da_Agência para ACTIVE.
4. WHEN o Status_da_Assinatura é alterado para SUSPENDED, THE Sistema SHALL alterar o Status_da_Agência para SUSPENDED.
5. WHEN o Proprietário solicita cancelamento definitivo, THE Sistema SHALL alterar o Status_da_Agência para CANCELED.
6. WHILE a Agência possui Status_da_Agência PENDING_VERIFICATION, THE Sistema SHALL impedir o login de qualquer usuário vinculado à Agência.
7. WHILE a Agência possui Status_da_Agência CANCELED, THE Sistema SHALL impedir o login e manter dados disponíveis para exportação por 30 dias.
8. THE Sistema SHALL registrar timestamp e motivo de cada transição de Status_da_Agência em log de auditoria.

### Requisito 17: Edição de Dados da Agência

**User Story:** Como proprietário de uma agência, eu quero poder alterar os dados cadastrais da minha agência, para manter as informações atualizadas conforme a empresa evolui.

#### Critérios de Aceitação

1. THE Sistema SHALL permitir que o Proprietário edite os seguintes dados da Agência: nome da agência, telefone comercial, logotipo, dados fiscais (CNPJ/CPF), endereço e e-mail comercial.
2. WHEN o Proprietário submete alterações nos dados da Agência, THE Sistema SHALL validar os campos obrigatórios e formatos antes de salvar.
3. WHEN o Proprietário altera o logotipo da Agência, THE Sistema SHALL aceitar imagens nos formatos PNG, JPG ou SVG com tamanho máximo de 2MB.
4. WHEN o Proprietário altera o CNPJ da Agência, THE Sistema SHALL validar o formato e dígitos verificadores do CNPJ.
5. THE Sistema SHALL restringir a edição de dados da Agência exclusivamente ao Proprietário (OWNER).
6. IF um Vendedor tentar editar dados da Agência, THEN THE Sistema SHALL retornar erro 403 (Forbidden).
7. THE Sistema SHALL registrar em log de auditoria todas as alterações realizadas nos dados da Agência, incluindo valor anterior, valor novo, timestamp e identificador do usuário que realizou a alteração.
8. WHEN o Proprietário altera o e-mail comercial da Agência, THE Sistema SHALL enviar um Código_de_Verificação para o novo e-mail antes de efetivar a alteração.
