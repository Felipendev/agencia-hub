# 📋 Guia de Integração do Timeline

Este guia mostra como integrar o sistema de Timeline nas páginas de detalhes.

---

## 🎯 Integração na Página de Cliente

**Arquivo**: `src/app/(app)/clientes/[id]/page.tsx`

### Passo 1: Importar componentes
```tsx
import { TimelineView } from "@/components/timeline/TimelineView";
import { useTimeline } from "@/contexts/timeline-context";
```

### Passo 2: Adicionar eventos automáticos no DataContext

**Arquivo**: `src/contexts/data-context.tsx`

```tsx
import { useTimeline } from "@/contexts/timeline-context";

// Dentro do DataProvider:
const timeline = useTimeline();

// No addCliente:
const addCliente = useCallback(async (c: Omit<Cliente, "id" | "createdAt">) => {
  // ... código existente ...
  
  timeline.addEvent({
    type: "cliente_criado",
    entityType: "cliente",
    entityId: novo.id,
    title: "Cliente criado",
    description: `Cliente "${novo.nome}" foi adicionado ao sistema`,
  });
  
  return novo;
}, [timeline]);

// No updateCliente:
const updateCliente = useCallback((id: string, patch: Partial<Cliente>) => {
  // ... código existente ...
  
  timeline.addEvent({
    type: "cliente_atualizado",
    entityType: "cliente",
    entityId: id,
    title: "Cliente atualizado",
    description: `Informações do cliente foram atualizadas`,
  });
}, [timeline]);
```

### Passo 3: Adicionar na página de detalhes

```tsx
// Na página de detalhes do cliente:
<Card>
  <TimelineView entityType="cliente" entityId={cliente.id} />
</Card>
```

---

## 🎯 Integração na Página de Cotação

**Arquivo**: `src/app/(app)/cotacoes/[id]/page.tsx`

### Adicionar eventos de mudança de status

```tsx
import { useTimeline } from "@/contexts/timeline-context";

// Dentro do componente:
const timeline = useTimeline();

function aplicarStatus(novo: CotacaoStatus) {
  const anterior = cotacao.status;
  updateCotacao(id, { status: novo });
  setStatusEdit(novo);
  
  timeline.addEvent({
    type: "cotacao_status_mudou",
    entityType: "cotacao",
    entityId: id,
    title: "Status alterado",
    description: `Status mudou de "${COTACAO_STATUS_LABELS[anterior]}" para "${COTACAO_STATUS_LABELS[novo]}"`,
    metadata: { statusAnterior: anterior, statusNovo: novo },
  });
  
  toast.success(`Status alterado para "${COTACAO_STATUS_LABELS[novo]}"`);
}

function saveCampos() {
  // ... código existente ...
  
  timeline.addEvent({
    type: "cotacao_atualizada",
    entityType: "cotacao",
    entityId: id,
    title: "Cotação atualizada",
    description: `Valor: ${formatBRL(v)}, Validade: ${formatDateBR(validadeEdit)}`,
  });
  
  toast.success("Cotação atualizada com sucesso!");
}
```

### Adicionar Timeline na página

```tsx
// Adicionar após o card de edição:
<Card>
  <TimelineView entityType="cotacao" entityId={cotacao.id} />
</Card>
```

---

## 🎯 Eventos Automáticos no DataContext

### addCotacao

```tsx
const addCotacao = useCallback(
  async (c: Omit<Cotacao, "id" | "createdAt" | "updatedAt">) => {
    // ... código existente ...
    
    timeline.addEvent({
      type: "cotacao_criada",
      entityType: "cotacao",
      entityId: novo.id,
      title: "Cotação criada",
      description: `Nova cotação "${novo.titulo}" para ${novo.destino}`,
    });
    
    return novo;
  },
  [timeline]
);
```

### addAtendimento

```tsx
const addAtendimento = useCallback((a: Omit<Atendimento, "id">) => {
  const novo: Atendimento = { ...a, id: generateId() };
  
  timeline.addEvent({
    type: "atendimento_criado",
    entityType: "atendimento",
    entityId: novo.id,
    title: "Atendimento criado",
    description: `Novo atendimento "${novo.titulo}"`,
  });
  
  setData((d) => ({
    ...d,
    atendimentos: [novo, ...d.atendimentos],
  }));
  return novo;
}, [timeline]);
```

### addLancamento

```tsx
const addLancamento = useCallback(
  (l: Omit<LancamentoFinanceiro, "id">) => {
    const novo: LancamentoFinanceiro = { ...l, id: generateId() };
    
    timeline.addEvent({
      type: "lancamento_criado",
      entityType: "lancamento",
      entityId: novo.id,
      title: "Lançamento registrado",
      description: `${l.tipo === "entrada" ? "Entrada" : "Saída"}: ${l.descricao} - ${formatBRL(l.valor)}`,
    });
    
    setData((d) => ({
      ...d,
      lancamentos: [novo, ...d.lancamentos],
    }));
    return novo;
  },
  [timeline]
);
```

---

## 🎨 Customização de Ícones

Para adicionar ícones específicos por tipo de evento, edite `TimelineView.tsx`:

```tsx
const iconMap = {
  cliente_criado: UserPlusIcon,
  cliente_atualizado: UserIcon,
  cotacao_criada: DocumentPlusIcon,
  cotacao_status_mudou: ArrowRightIcon,
  cotacao_atualizada: DocumentIcon,
  atendimento_criado: BriefcaseIcon,
  atendimento_atualizado: BriefcaseIcon,
  lancamento_criado: WalletIcon,
  nota_adicionada: ChatIcon,
};

// No TimelineItem:
const Icon = iconMap[event.type] || ClockIcon;
```

---

## 📝 Exemplo Completo de Integração

### Cliente Detalhes (Exemplo Completo)

```tsx
"use client";

import { useParams } from "next/navigation";
import { useData } from "@/contexts/data-context";
import { TimelineView } from "@/components/timeline/TimelineView";
import { Card, CardTitle } from "@/components/ui/card";

export default function ClienteDetalhePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { clientes, isReady } = useData();
  
  const cliente = clientes.find((c) => c.id === id);
  
  if (!isReady) {
    return <p>Carregando...</p>;
  }
  
  if (!cliente) {
    return <p>Cliente não encontrado</p>;
  }
  
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{cliente.nome}</h1>
      
      {/* Dados do cliente */}
      <Card>
        <CardTitle>Informações</CardTitle>
        {/* ... campos do cliente ... */}
      </Card>
      
      {/* Timeline */}
      <Card>
        <TimelineView entityType="cliente" entityId={cliente.id} />
      </Card>
    </div>
  );
}
```

---

## ✅ Checklist de Integração

### DataContext
- [ ] Importar `useTimeline`
- [ ] Adicionar eventos em `addCliente`
- [ ] Adicionar eventos em `updateCliente`
- [ ] Adicionar eventos em `addCotacao`
- [ ] Adicionar eventos em `updateCotacao`
- [ ] Adicionar eventos em `addAtendimento`
- [ ] Adicionar eventos em `addLancamento`

### Páginas de Detalhes
- [ ] Importar `TimelineView`
- [ ] Adicionar `<TimelineView />` na página de cliente
- [ ] Adicionar `<TimelineView />` na página de cotação
- [ ] Adicionar eventos de mudança de status
- [ ] Adicionar eventos de atualização

### Testes
- [ ] Criar cliente e verificar evento
- [ ] Atualizar cliente e verificar evento
- [ ] Criar cotação e verificar evento
- [ ] Mudar status e verificar evento
- [ ] Adicionar nota manual
- [ ] Verificar persistência (recarregar página)

---

## 🎯 Resultado Final

Após a integração completa, você terá:

✅ Timeline automático em todas as entidades
✅ Registro de todas as ações importantes
✅ Notas manuais adicionáveis
✅ Histórico completo de mudanças
✅ Contexto para toda a equipe
✅ Auditoria de ações

---

**Tempo estimado de integração**: 1-2 horas
