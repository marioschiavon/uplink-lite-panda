

## Plano: Corrigir Sincronizacao de Subscription com Sessao

### Problema Identificado

O cliente pagou e a assinatura foi ativada, mas a sessao original foi deletada/recriada APOS o pagamento, resultando em:
- Sessao nova sem subscription vinculada
- Subscription no banco apontando para sessao inexistente
- Cliente ve "nao pago" apesar de ter pago

### Causa Raiz

1. O webhook Stripe atualiza a sessao usando o ID salvo nos **metadados** do checkout
2. Se a sessao for deletada apos o checkout ser criado, o webhook atualiza uma sessao que nao existe mais
3. Cliente volta e ve sessao "nova" sem pagamento

---

### Solucao em 2 Partes

#### Parte 1: Correcao Imediata (Manual no Banco)

Atualizar manualmente para associar a subscription existente a nova sessao:

```sql
-- Assumindo que a subscription ainda existe no Stripe
-- Precisamos encontrar e atualizar para a sessao atual

-- 1. Verificar se existe subscription da org no Stripe
SELECT * FROM subscriptions 
WHERE organization_id = 'a0b01c74-4996-4ab7-81ca-95b17cc91ff4';

-- 2. Se nao existir, inserir manualmente baseado nos logs do webhook
-- A subscription do Stripe e: sub_1SugHiQs5BDRSUmX4eiym1W1
```

#### Parte 2: Melhoria no Webhook (Prevencao)

Modificar `supabase/functions/stripe-webhook/index.ts` para:

1. **Validar se sessao existe** antes de atualizar
2. **Buscar por organization_id** como fallback se sessao nao existir
3. **Log de erro claro** quando sessao nao for encontrada

```typescript
// Antes de atualizar a sessao
const { data: sessionExists } = await supabaseAdmin
  .from('sessions')
  .select('id')
  .eq('id', sessionId)
  .maybeSingle();

if (!sessionExists) {
  console.error('⚠️ Sessao nao encontrada:', sessionId);
  
  // Buscar sessao mais recente da organizacao
  const { data: latestSession } = await supabaseAdmin
    .from('sessions')
    .select('id, name')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (latestSession) {
    sessionId = latestSession.id;
    console.log('⚠️ Usando sessao mais recente:', latestSession.name);
  }
}
```

---

### Parte 3: Prevenir Delecao de Sessao Pendente

Adicionar verificacao em Sessions.tsx para impedir delecao de sessao com checkout pendente:

```typescript
// Antes de deletar sessao, verificar se tem checkout em andamento
const handleDeleteSession = async (sessionId: string) => {
  const { data: session } = await supabase
    .from('sessions')
    .select('status, name')
    .eq('id', sessionId)
    .single();
    
  if (session?.status === 'pending_payment') {
    toast.warning('Esta sessao tem um pagamento pendente. Aguarde ou cancele no Stripe.');
    return;
  }
  
  // Continuar com delecao...
};
```

---

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/stripe-webhook/index.ts` | Adicionar fallback para buscar sessao por org_id |
| `src/pages/Sessions.tsx` | Bloquear delecao de sessao pending_payment |
| Banco de dados | Correcao manual para cliente afetado |

---

### Correcao Manual para o Cliente Atual

Executar no SQL Editor do Supabase:

```sql
-- Inserir subscription para a sessao atual
INSERT INTO subscriptions (
  session_id,
  organization_id,
  status,
  amount,
  stripe_subscription_id,
  stripe_customer_id,
  payment_provider,
  payer_email,
  start_date,
  plan_name
) VALUES (
  '0a2088c8-3a3c-4365-a1f5-7d8412561137',  -- Nova sessao bescz-app
  'a0b01c74-4996-4ab7-81ca-95b17cc91ff4',   -- Org ID
  'active',
  69.90,
  'sub_1SugHiQs5BDRSUmX4eiym1W1',            -- ID do Stripe
  (SELECT stripe_customer_id FROM subscriptions 
   WHERE stripe_subscription_id = 'sub_1SugHiQs5BDRSUmX4eiym1W1' LIMIT 1),
  'stripe',
  'contato@gti.app.br',
  NOW(),
  'api_session'
);

-- Atualizar sessao para nao exigir subscription
UPDATE sessions 
SET requires_subscription = false, status = 'connected'
WHERE id = '0a2088c8-3a3c-4365-a1f5-7d8412561137';
```

---

### Resumo

1. **Correcao imediata**: SQL manual para vincular subscription a nova sessao
2. **Prevencao futura**: Webhook busca sessao por org_id se sessao original nao existir
3. **UX melhoria**: Bloquear delecao de sessao com pagamento pendente

