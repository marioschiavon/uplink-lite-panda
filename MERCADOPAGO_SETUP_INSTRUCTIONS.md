# 🚀 Guia Completo de Configuração - Mercado Pago

## ✅ Status da Implementação

### Já Implementado:
- ✅ **Landing Page** atualizada com preço R$ 69,90
- ✅ **Página de Checkout** (`/checkout`) criada
- ✅ **Edge Functions** criadas:
  - `create-subscription` - Cria assinaturas no Mercado Pago
  - `mercadopago-webhook` - Processa notificações do Mercado Pago
- ✅ **Secrets configurados**:
  - `MERCADOPAGO_PUBLIC_KEY`
  - `MERCADOPAGO_ACCESS_TOKEN`
- ✅ **Rotas atualizadas** no App.tsx
- ✅ **Botões redirecionam** para `/checkout`

---

## 📋 Próximos Passos (OBRIGATÓRIOS)

### **Passo 1: Executar Migration do Banco de Dados** ⚠️ CRÍTICO

A migration SQL **DEVE ser executada** para o sistema funcionar. Sem ela, você verá erros.

1. **Abra o SQL Editor do Supabase**:
   ```
   https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/sql/new
   ```

2. **Copie todo o conteúdo do arquivo** `MERCADOPAGO_MIGRATION.sql`

3. **Cole no editor SQL e execute**

4. **Aguarde a confirmação** "Success. No rows returned"

5. **Verifique se funcionou**:
   Execute este query no SQL Editor:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name = 'subscriptions';
   ```
   
   Deve retornar 1 linha com o nome "subscriptions".

---

### **Passo 2: Configurar Webhook no Mercado Pago** ⚠️ OBRIGATÓRIO

O webhook é essencial para receber notificações de pagamento e ativar as assinaturas.

#### **2.1 - Obter URL do Webhook**

A URL do webhook é:
```
https://kfsvpbujmetlendgwnrs.supabase.co/functions/v1/mercadopago-webhook
```

#### **2.2 - Configurar no Painel do Mercado Pago**

1. **Acesse**: https://www.mercadopago.com.br/developers/panel/app

2. **Selecione sua aplicação** ou crie uma nova

3. **Vá em "Webhooks"** no menu lateral

4. **Clique em "Configurar notificações"**

5. **Configure assim**:
   - **URL de produção**: `https://kfsvpbujmetlendgwnrs.supabase.co/functions/v1/mercadopago-webhook`
   - **Eventos**: Selecione `subscription_preapproval`
   - **Modo**: Produção

6. **Salve a configuração**

7. **Teste o webhook**:
   - O Mercado Pago oferece um botão "Enviar teste"
   - Após enviar, verifique os logs da edge function

---

### **Passo 3: Verificar Logs das Edge Functions**

Para debugar e garantir que tudo está funcionando:

#### **3.1 - Logs da função create-subscription**
```
https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/functions/create-subscription/logs
```

O que procurar:
- ✅ "Authenticated user: [ID]"
- ✅ "Creating subscription for organization: [Nome]"
- ✅ "Subscription created in MP: [ID]"
- ✅ "Subscription saved to database"

#### **3.2 - Logs da função mercadopago-webhook**
```
https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/functions/mercadopago-webhook/logs
```

O que procurar:
- ✅ "Webhook recebido do Mercado Pago"
- ✅ "Assinatura autorizada - ativando acesso"
- ✅ "Organization atualizada - status: active"
- ✅ "Webhook processado com sucesso"

---

## 🧪 Como Testar o Sistema

### **Teste 1: Criar Assinatura**

1. Faça login na aplicação
2. Acesse a landing page (raiz `/`)
3. Clique em "Começar agora" ou "Contratar agora"
4. Você será redirecionado para `/checkout`
5. Clique em "Assinar agora"
6. Você será redirecionado para o Mercado Pago
7. **Use um cartão de teste** (no modo sandbox):
   - Visa: `4509 9535 6623 3704`
   - CVV: qualquer 3 dígitos
   - Validade: qualquer data futura
   - Nome: qualquer nome

### **Teste 2: Verificar Assinatura no Banco**

Execute no SQL Editor:
```sql
SELECT 
  s.id,
  s.status,
  s.preapproval_id,
  s.amount,
  o.name as organization_name,
  o.subscription_status
FROM public.subscriptions s
JOIN public.organizations o ON o.id = s.organization_id
ORDER BY s.created_at DESC
LIMIT 5;
```

Você deve ver:
- `status`: "pending" inicialmente, depois "active" após webhook
- `preapproval_id`: ID da assinatura no Mercado Pago
- `amount`: 69.90
- `subscription_status`: "active" na organization

### **Teste 3: Verificar Webhook Funcionando**

1. Acesse o painel do Mercado Pago
2. Vá em "Webhooks" > "Histórico"
3. Verifique se há chamadas recentes
4. Status deve ser **200 OK**

---

## 🔐 Ambiente de Testes (Sandbox)

Para testar sem cobranças reais:

### **Ativar Modo Sandbox no Mercado Pago**

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Clique em "Credenciais de teste" (não "Credenciais de produção")
3. **Copie o Access Token de teste**
4. **Atualize o secret no Supabase**:
   - Vá em: https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/settings/functions
   - Edite `MERCADOPAGO_ACCESS_TOKEN`
   - Cole o token de **teste**

### **Cartões de Teste**

Use estes cartões para testar pagamentos:

| Cartão | Número | CVV | Validade | Resultado |
|--------|--------|-----|----------|-----------|
| Visa Aprovado | 4509 9535 6623 3704 | 123 | 11/25 | ✅ Aprovado |
| Mastercard Aprovado | 5031 4332 1540 6351 | 123 | 11/25 | ✅ Aprovado |
| Amex Recusado | 3711 803032 57522 | 1234 | 11/25 | ❌ Recusado |

---

## 🚨 Troubleshooting

### **Erro: "Property 'subscription_status' does not exist"**

**Causa**: A migration do banco não foi executada.

**Solução**:
1. Execute o arquivo `MERCADOPAGO_MIGRATION.sql` no SQL Editor
2. Aguarde alguns segundos
3. A aplicação irá regenerar os tipos automaticamente
4. Recarregue a página

---

### **Erro: "Erro ao criar assinatura no Mercado Pago"**

**Causa**: Credenciais inválidas ou expiradas.

**Solução**:
1. Verifique se o token está correto:
   - Acesse: https://www.mercadopago.com.br/developers/panel/app
   - Copie novamente o Access Token
2. Atualize o secret:
   - https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/settings/functions
   - Edite `MERCADOPAGO_ACCESS_TOKEN`
3. Verifique os logs da edge function

---

### **Webhook não está sendo chamado**

**Causa**: Webhook não configurado no Mercado Pago ou URL incorreta.

**Solução**:
1. Verifique a URL no painel MP:
   ```
   https://kfsvpbujmetlendgwnrs.supabase.co/functions/v1/mercadopago-webhook
   ```
2. Certifique-se de que o evento `subscription_preapproval` está selecionado
3. Teste manualmente com o botão "Enviar teste" no painel MP
4. Verifique os logs: https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/functions/mercadopago-webhook/logs

---

### **Assinatura criada mas status não muda para "active"**

**Causa**: Webhook não está processando corretamente.

**Solução**:
1. Verifique logs do webhook
2. Simule um pagamento de teste
3. Execute este query para verificar:
   ```sql
   SELECT * FROM public.subscriptions 
   WHERE status = 'pending' 
   ORDER BY created_at DESC;
   ```
4. Manualmente ative uma assinatura (apenas para testes):
   ```sql
   UPDATE public.subscriptions 
   SET status = 'active' 
   WHERE preapproval_id = 'SEU_PREAPPROVAL_ID';
   
   UPDATE public.organizations 
   SET subscription_status = 'active',
       subscription_expires_at = NOW() + INTERVAL '30 days'
   WHERE id = 'SUA_ORGANIZATION_ID';
   ```

---

## 📊 Monitoramento

### **Queries Úteis**

#### Ver todas assinaturas:
```sql
SELECT 
  s.id,
  s.status,
  s.preapproval_id,
  s.payer_email,
  s.amount,
  s.created_at,
  o.name as org_name,
  o.subscription_status as org_status
FROM public.subscriptions s
JOIN public.organizations o ON o.id = s.organization_id
ORDER BY s.created_at DESC;
```

#### Ver organizações com assinatura ativa:
```sql
SELECT 
  o.name,
  o.subscription_status,
  o.subscription_expires_at,
  s.amount,
  s.next_payment_date
FROM public.organizations o
LEFT JOIN public.subscriptions s ON s.organization_id = o.id
WHERE o.subscription_status = 'active'
ORDER BY o.subscription_expires_at ASC;
```

#### Ver assinaturas vencidas ou prestes a vencer:
```sql
SELECT 
  o.name,
  o.subscription_expires_at,
  s.next_payment_date,
  s.status
FROM public.organizations o
JOIN public.subscriptions s ON s.organization_id = o.id
WHERE o.subscription_status = 'active'
  AND o.subscription_expires_at < NOW() + INTERVAL '7 days'
ORDER BY o.subscription_expires_at ASC;
```

---

## 🎯 Fluxo Completo de Funcionamento

```
1. Usuário clica "Contratar agora" na Landing Page
   ↓
2. Redireciona para /checkout
   ↓
3. Usuário clica "Assinar agora"
   ↓
4. Edge Function create-subscription:
   - Verifica autenticação
   - Busca organização do usuário
   - Cria assinatura no Mercado Pago
   - Salva no banco com status "pending"
   - Retorna init_point (URL de pagamento)
   ↓
5. Redireciona para Mercado Pago
   ↓
6. Usuário preenche dados e confirma pagamento
   ↓
7. Mercado Pago processa pagamento
   ↓
8. Mercado Pago envia webhook para nossa Edge Function
   ↓
9. Edge Function mercadopago-webhook:
   - Recebe notificação
   - Busca detalhes da assinatura no MP
   - Atualiza status no banco: "active"
   - Atualiza organization.subscription_status: "active"
   ↓
10. Mercado Pago redireciona usuário de volta para /dashboard
    ↓
11. Dashboard verifica subscription_status
    ↓
12. ✅ Acesso liberado!
```

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs das Edge Functions**
2. **Execute os queries de monitoramento**
3. **Teste em modo sandbox primeiro**
4. **Verifique a configuração do webhook no Mercado Pago**

---

## ✅ Checklist Final

Antes de ir para produção:

- [ ] Migration SQL executada com sucesso
- [ ] Webhook configurado no Mercado Pago
- [ ] Testado fluxo completo em sandbox
- [ ] Logs das edge functions verificados
- [ ] Queries de monitoramento executados e funcionando
- [ ] Credenciais de **produção** configuradas (não teste)
- [ ] Webhook funcionando em produção
- [ ] Primeiro pagamento teste real concluído

---

**🎉 Após completar todos os passos, seu sistema de assinaturas estará 100% funcional!**
