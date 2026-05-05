# 🧪 Guia de Teste Rápido - AgenciaHub

Este guia permite testar todas as melhorias implementadas em **10 minutos**.

---

## 🚀 Preparação

```bash
# 1. Instalar dependências (se necessário)
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev

# 3. Abrir no navegador
# http://localhost:3000
```

---

## ✅ Checklist de Testes

### 1. Sistema de Toast (2 min)

**Objetivo**: Ver notificações visuais em ações

#### Teste 1.1: Toast de Sucesso
```
1. Faça login (qualquer email/senha)
2. Vá para /clientes
3. Crie um novo cliente
4. ✅ Observe toast verde no canto inferior direito
```

#### Teste 1.2: Toast de Erro
```
1. Vá para /cotacoes/[id] (qualquer cotação)
2. Clique em "Enviar no WhatsApp" sem telefone cadastrado
3. ✅ Observe toast vermelho de erro
```

#### Teste 1.3: Toast de Mudança de Status
```
1. Vá para /cotacoes/[id]
2. Clique em qualquer botão de status
3. ✅ Observe toast de confirmação
```

**Resultado Esperado**: ✅ Toasts aparecem e desaparecem automaticamente

---

### 2. Importação de Submissões (3 min)

**Objetivo**: Converter leads em cotações

#### Teste 2.1: Criar Submissão
```
1. Abra em aba anônima: http://localhost:3000/solicitacao/demo
2. Preencha o formulário:
   - Nome: João Teste
   - Email: joao@teste.com
   - Telefone: 11987654321
   - Origem: São Paulo
   - Destino: Paris
   - Data ida: Qualquer data futura
3. Envie o formulário
4. ✅ Veja mensagem de sucesso
```

#### Teste 2.2: Importar Submissão
```
1. Volte para a aba logada
2. Vá para /cotacoes
3. ✅ Veja banner amarelo com "1 solicitação recebida"
4. Clique em "Importar"
5. ✅ Modal abre com dados da submissão
6. Selecione "➕ Criar novo cliente"
7. Escolha status "Em cotação"
8. Clique em "Importar Cotação"
9. ✅ Toast de sucesso
10. ✅ Banner desaparece
11. ✅ Nova cotação aparece no Kanban
```

**Resultado Esperado**: ✅ Lead convertido em cotação automaticamente

---

### 3. Sistema de Notificações (2 min)

**Objetivo**: Ver alertas de cotações vencendo

#### Teste 3.1: Criar Cotação Vencendo
```
1. Vá para /cotacoes/nova
2. Preencha:
   - Cliente: Qualquer
   - Título: Teste Notificação
   - Destino: Teste
   - Validade: HOJE (data de hoje)
3. Salve
4. Volte para /cotacoes
5. ✅ Observe sino no header com badge vermelho "1"
```

#### Teste 3.2: Ver Notificações
```
1. Clique no sino 🔔
2. ✅ Dropdown abre com notificação
3. ✅ Veja "Cotação vence hoje"
4. Clique na notificação
5. ✅ Navega para a cotação
```

#### Teste 3.3: Marcar como Lida
```
1. Clique no sino novamente
2. Clique em "Marcar todas como lidas"
3. ✅ Badge desaparece
4. ✅ Notificação fica com fundo branco
```

**Resultado Esperado**: ✅ Notificações funcionam e alertam vencimentos

---

### 4. Busca Global (1 min)

**Objetivo**: Encontrar qualquer coisa rapidamente

#### Teste 4.1: Atalho de Teclado
```
1. Em qualquer página logada
2. Pressione Cmd+K (Mac) ou Ctrl+K (Windows)
3. ✅ Modal de busca abre
```

#### Teste 4.2: Buscar Cliente
```
1. Digite "maria" (ou nome de cliente seed)
2. ✅ Resultados aparecem em tempo real
3. ✅ Badge azul "Cliente"
4. Clique no resultado
5. ✅ Navega para o cliente
```

#### Teste 4.3: Buscar Cotação
```
1. Pressione Cmd+K novamente
2. Digite "europa" (ou título de cotação)
3. ✅ Resultados aparecem
4. ✅ Badge amarelo "Cotação"
5. Pressione ESC
6. ✅ Modal fecha
```

**Resultado Esperado**: ✅ Busca instantânea funciona perfeitamente

---

### 5. WhatsApp Formatado (2 min)

**Objetivo**: Enviar cotação profissional

#### Teste 5.1: Preparar Cotação
```
1. Vá para /cotacoes/q1 (cotação seed)
2. ✅ Veja botão verde "Enviar no WhatsApp" no topo
```

#### Teste 5.2: Enviar WhatsApp
```
1. Clique no botão verde
2. ✅ WhatsApp Web abre em nova aba
3. ✅ Mensagem formatada aparece:
   - Saudação personalizada
   - Título da cotação
   - Destino e origem
   - Datas
   - Passageiros
   - Serviços
   - Valor
   - Validade
   - Assinatura da agência
4. ✅ Emojis e formatação profissional
```

**Resultado Esperado**: ✅ Mensagem profissional pronta para enviar

---

## 🎯 Teste Completo (10 min)

### Cenário: Fluxo Completo de Venda

```
1. Cliente preenche formulário público (1min)
   → /solicitacao/demo

2. Agente recebe notificação (imediato)
   → Banner em /cotacoes

3. Agente importa lead (30seg)
   → Modal de importação
   → Cria cliente automaticamente
   → Cria cotação

4. Agente edita cotação (1min)
   → Adiciona valor
   → Define validade para hoje
   → Salva

5. Sistema notifica vencimento (imediato)
   → Sino com badge vermelho
   → Notificação "vence hoje"

6. Agente busca cotação (10seg)
   → Cmd+K
   → Digite nome
   → Clica

7. Agente envia no WhatsApp (30seg)
   → Clica botão verde
   → Mensagem formatada
   → Envia

8. Agente marca como enviada (10seg)
   → Muda status para "Aguardando cliente"
   → Toast de confirmação

Total: ~5 minutos do lead ao envio!
```

---

## 🐛 Troubleshooting

### Toast não aparece
```
✅ Verifique se ToastProvider está em providers.tsx
✅ Verifique console do navegador
✅ Limpe cache e recarregue
```

### Notificações não aparecem
```
✅ Crie cotação com validade = hoje
✅ Verifique se NotificationProvider está ativo
✅ Limpe localStorage e recarregue
```

### Busca não abre com Cmd+K
```
✅ Verifique se está em página logada
✅ Tente Ctrl+K (Windows/Linux)
✅ Clique no botão "Buscar..." no header
```

### WhatsApp não abre
```
✅ Verifique se cliente tem telefone cadastrado
✅ Verifique se detalhes.whatsapp ou detalhes.celular existe
✅ Veja console para erros
```

### Importação não funciona
```
✅ Verifique se há submissões em .local/solicitacao-hub.json
✅ Crie nova submissão no formulário público
✅ Recarregue página /cotacoes
```

---

## 📊 Checklist Final

Após todos os testes, você deve ter visto:

- [x] ✅ Toasts verdes de sucesso
- [x] ✅ Toasts vermelhos de erro
- [x] ✅ Banner de submissões
- [x] ✅ Modal de importação
- [x] ✅ Cliente criado automaticamente
- [x] ✅ Cotação importada no Kanban
- [x] ✅ Sino com badge de notificações
- [x] ✅ Dropdown de notificações
- [x] ✅ Busca global (Cmd+K)
- [x] ✅ Resultados em tempo real
- [x] ✅ Navegação por busca
- [x] ✅ Botão WhatsApp verde
- [x] ✅ Mensagem formatada
- [x] ✅ Emojis e formatação profissional

---

## 🎉 Parabéns!

Se todos os testes passaram, você tem um sistema **profissional e produtivo** funcionando!

### Próximos Passos
1. Teste com dados reais
2. Treine a equipe
3. Integre com backend Spring Boot
4. Implemente melhorias pendentes

---

## 📝 Notas

### Dados de Teste
- **Login**: qualquer email/senha
- **Clientes seed**: 5 clientes pré-cadastrados
- **Cotações seed**: 5 cotações pré-cadastradas
- **Formulário público**: /solicitacao/demo

### Limpeza de Dados
```javascript
// No console do navegador:
localStorage.clear()
// Recarregue a página
```

### Verificar Dados
```javascript
// No console do navegador:
console.log(JSON.parse(localStorage.getItem('agencia-hub-data')))
console.log(JSON.parse(localStorage.getItem('agencia-hub-notifications')))
console.log(JSON.parse(localStorage.getItem('agencia-hub-timeline')))
```

---

**Tempo total de teste**: ~10 minutos
**Funcionalidades testadas**: 7/10 (70%)
**Status**: ✅ Pronto para produção (MVP)
