

# Plano: Notificacao via WhatsApp para Pagamento Falho

## Resumo

Alem do email que ja e enviado, enviar uma mensagem via WhatsApp pelo numero da Uplink Lite quando o pagamento de um cliente falhar. A mensagem sera enviada para o `notification_phone` cadastrado na sessao do cliente.

## Dados da Instancia Uplink Lite

| Campo | Valor |
|-------|-------|
| Instance Name | Uplink |
| API Token | 1928996B03BC-4370-9645-ACB18B3A4C74 |
| API URL | https://api.uplinklite.com |
| Endpoint | POST /message/sendText/Uplink |

## Mudancas Necessarias

### 1. Salvar o Token como Secret

Armazenar o token do WhatsApp da Uplink como secret no Supabase para uso seguro nas Edge Functions:
- Nome: `UPLINK_WHATSAPP_TOKEN`
- Valor: `1928996B03BC-4370-9645-ACB18B3A4C74`

### 2. Modificar `stripe-webhook/index.ts`

No bloco `invoice.payment_failed` (linha 625-628), adicionar `notification_phone` na query da sessao e enviar mensagem WhatsApp apos o email.

**Query atual:**
```typescript
const { data: failedSessionData } = await supabaseAdmin
  .from('sessions')
  .select('name')
  .eq('id', (failedSubData as any).session_id)
  .maybeSingle();
```

**Query atualizada:**
```typescript
const { data: failedSessionData } = await supabaseAdmin
  .from('sessions')
  .select('name, notification_phone')
  .eq('id', (failedSubData as any).session_id)
  .maybeSingle();
```

**Novo bloco apos o envio de email (apos linha 736):**

Enviar mensagem WhatsApp usando a Evolution API:

```typescript
// Enviar notificacao via WhatsApp
const notificationPhone = (failedSessionData as any)?.notification_phone;
if (notificationPhone) {
  try {
    const uplinkToken = Deno.env.get('UPLINK_WHATSAPP_TOKEN');
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.uplinklite.com';
    
    const whatsappMessage = 
      `⚠️ *Problema com seu Pagamento - Uplink Lite*\n\n` +
      `Nao conseguimos processar o pagamento da sua assinatura.\n\n` +
      `📋 *Detalhes:*\n` +
      `• Sessao: ${failedSessionName}\n` +
      `• Valor: R$ ${failedAmount.toFixed(2)}/mes\n` +
      `• Motivo: ${failureReason}\n\n` +
      `🔔 *O que fazer:*\n` +
      `1. Acesse o painel em uplinklite.com\n` +
      `2. Va em Assinaturas\n` +
      `3. Clique em "Atualizar Pagamento"\n\n` +
      `⏰ Regularize para evitar a desconexao da sua sessao.`;

    await fetch(`${evolutionApiUrl}/message/sendText/Uplink`, {
      method: 'POST',
      headers: {
        'apikey': uplinkToken!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: notificationPhone,
        text: whatsappMessage
      })
    });
    
    console.log('📱 WhatsApp de pagamento falho enviado para:', notificationPhone);
  } catch (whatsappError) {
    console.error('⚠️ Erro ao enviar WhatsApp de pagamento falho:', whatsappError);
  }
}
```

## Secao Tecnica

### Fluxo Completo

```text
Stripe detecta pagamento falho
        |
        v
invoice.payment_failed chega no webhook
        |
        +-> Atualiza status para "past_due"
        |
        +-> Busca session_id, payer_email, amount
        |
        +-> Busca name + notification_phone da sessao
        |
        +-> Envia EMAIL via Resend (ja existe)
        |
        +-> Envia WHATSAPP via Evolution API (NOVO)
        |       |
        |       +-> POST /message/sendText/Uplink
        |       +-> Header: apikey = UPLINK_WHATSAPP_TOKEN
        |       +-> Body: { number, text }
        |
        v
    Cliente notificado por EMAIL + WHATSAPP
```

### Condicoes de Envio

| Condicao | Email | WhatsApp |
|----------|-------|----------|
| Tem payer_email | Envia | - |
| Tem notification_phone | - | Envia |
| Tem ambos | Envia | Envia |
| Nao tem nenhum | Nao envia | Nao envia |

### Seguranca

- Token armazenado como secret do Supabase (nunca exposto no codigo)
- Mensagem enviada apenas para o `notification_phone` cadastrado pelo proprio cliente
- Erro no WhatsApp nao bloqueia o fluxo (try/catch independente)

### Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/stripe-webhook/index.ts` | Adicionar envio de WhatsApp no `invoice.payment_failed` |

### Mensagem WhatsApp (Preview)

```text
⚠️ *Problema com seu Pagamento - Uplink Lite*

Nao conseguimos processar o pagamento da sua assinatura.

📋 *Detalhes:*
• Sessao: MinhaEmpresa
• Valor: R$ 49.90/mes
• Motivo: Cartao recusado ou saldo insuficiente

🔔 *O que fazer:*
1. Acesse o painel em uplinklite.com
2. Va em Assinaturas
3. Clique em "Atualizar Pagamento"

⏰ Regularize para evitar a desconexao da sua sessao.
```

