# Requisitos
A agência pode consultar explicitamente os cartões ativos da carteira da pessoa selecionada no simulador e conferir gasto mensal e pontos por dólar antes de copiar. Funciona sem carteira e sem cliente para cálculo manual. Perfil arquivado não oferece cartões. Campos ausentes/inválidos impedem aplicar; zero informado é válido. Não obter câmbio automaticamente nem alterar demais premissas.

Usar no cálculo altera somente o formulário local. As premissas continuam editáveis e persistem somente ao salvar o plano, usando seu CRUD/versionamento existente (edição pelo mesmo ID e exclusão disponíveis). Carteira conserva seu próprio CRUD e link de acesso. Nenhum novo cadastro ou cópia de cartão é criado, e não há movimentação de saldo. Não exige nova operação de exclusão para o ato de preencher o formulário.

Troca de pessoa/sessão elimina dados consultados e respostas atrasadas não reaparecem. Falha de consulta não aparece como carteira vazia, permite tentar novamente e não apaga o cálculo. Mensagem de cópia não afirma persistência. Excluir cartão futuramente não reescreve planos salvos, que são cenários com premissas próprias.
