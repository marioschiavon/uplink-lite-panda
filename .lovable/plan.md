
## Plano: Corrigir Erro de Sessao Duplicada no Checkout

### Problema Identificado

O erro `duplicate key value violates unique constraint "sessions_name_org_unique"` ocorre porque:

1. Na pagina **Sessions.tsx**, ao criar nova sessao, o usuario e redirecionado para `/checkout?session_name=teste123` sem o `session_id`
2. O usuario clica em "Assinar Agora"
3. O **Checkout.tsx** tenta criar uma nova sessao com esse nome
4. Se a sessao ja existe (ex: tentativa anterior com status `pending_payment`), o banco retorna erro de constraint unica
5. O usuario fica preso sem conseguir prosseguir ao checkout

### Fluxos Atuais

| Origem | Parametros | Sessao no DB |
|--------|------------|--------------|
| Sessions.tsx (nova) | `?session_name=xxx` | NAO existe |
| Subscriptions.tsx (reativar) | `?session_id=123&session_name=xxx` | JA existe |
| Retry apos falha | `?session_name=xxx` | PODE existir |

### Solucao

Modificar o `Checkout.tsx` para:

1. Se `session_id` foi passado na URL, usar a sessao existente
2. Se apenas `session_name` foi passado, verificar se ja existe sessao com esse nome e status `pending_payment`
3. Se existir, reutilizar a sessao existente
4. Se nao existir, criar nova sessao

---

### Parte 1: Atualizar Checkout.tsx

**Logica modificada no `handleSubscribe`:**

```typescript
const handleSubscribe = async () => {
  // 1. Verificar se session_id foi passado (sessao ja existe)
  const existingSessionId = searchParams.get('session_id');
  
  if (existingSessionId) {
    // Usar sessao existente diretamente
    proceedToStripeCheckout(existingSessionId);
    return;
  }
  
  // 2. Verificar se sessao com mesmo nome ja existe
  const { data: existingSession } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('name', sessionName)
    .eq('organization_id', orgId)
    .maybeSingle();
  
  if (existingSession) {
    if (existingSession.status === 'pending_payment') {
      // Reutilizar sessao pendente
      proceedToStripeCheckout(existingSession.id);
      return;
    }
    // Sessao existe com outro status - erro
    toast.error('Ja existe uma sessao com este nome');
    return;
  }
  
  // 3. Criar nova sessao
  const { data: newSession } = await supabase
    .from('sessions')
    .insert({ ... })
    .select()
    .single();
  
  proceedToStripeCheckout(newSession.id);
};
```

---

### Parte 2: Atualizar Sessions.tsx

Tambem precisamos passar o `session_id` quando a sessao ja foi criada:

```typescript
// Se a sessao ja existe (status pending_payment), passar o ID
navigate(`/checkout?session_id=${session.id}&session_name=${encodeURIComponent(session.name)}`);
```

---

### Parte 3: Adicionar Traducoes

Adicionar novas chaves de erro em `pt-BR.json` e `en.json`:

```json
{
  "checkout": {
    "sessionAlreadyExists": "Ja existe uma sessao ativa com este nome",
    "sessionReused": "Continuando com sessao existente..."
  }
}
```

---

### Parte 4: Tratar Caso de Sessao com Assinatura Ativa

Se o usuario tentar criar sessao com nome que ja tem assinatura ativa, mostrar mensagem apropriada:

```typescript
if (existingSession.status === 'active') {
  toast.error(t('checkout.sessionAlreadyActive'));
  navigate('/sessions');
  return;
}
```

---

### Resumo das Mudancas

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Checkout.tsx` | Verificar sessao existente antes de criar nova |
| `src/pages/Sessions.tsx` | Incluir `session_id` na navegacao quando aplicavel |
| `src/i18n/locales/pt-BR.json` | Adicionar traducoes de erro |
| `src/i18n/locales/en.json` | Adicionar traducoes de erro |

---

### Beneficios

1. **Elimina erro de constraint** - Usuario nunca vera o erro de duplicidade
2. **Permite retry** - Se pagamento falhar, usuario pode tentar novamente
3. **Mantem consistencia** - Reutiliza sessao pendente ao inves de criar multiplas
4. **Melhor UX** - Usuario entende o que esta acontecendo
