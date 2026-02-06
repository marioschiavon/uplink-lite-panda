

# Plano: Notificacao de Pagamento Falho e Acesso ao Portal Stripe

## Problema Identificado

Quando um pagamento falha no Stripe (cartao recusado, saldo insuficiente, etc.), o sistema:
- Atualiza o status para `past_due` no banco de dados
- **NAO** envia email avisando o cliente
- **NAO** mostra alerta especifico na pagina de Assinaturas
- O cliente nao sabe que precisa atualizar o metodo de pagamento

## Mudancas Necessarias

### 1. Email de Notificacao de Pagamento Falho

**Arquivo:** `supabase/functions/stripe-webhook/index.ts`

No bloco `invoice.payment_failed` (linhas 607-616), adicionar:
- Buscar dados da subscription e email do cliente
- Buscar nome da sessao associada
- Enviar email via Resend com:
  - Titulo: "Problema com seu pagamento"
  - Motivo da falha (cartao recusado, etc.)
  - Link direto para a pagina de assinaturas
  - Instrucoes para atualizar o metodo de pagamento no portal Stripe
  - Aviso de que a sessao pode ser desconectada se nao regularizar

### 2. Badge e Alerta para Status `past_due` na UI

**Arquivo:** `src/pages/Subscriptions.tsx`

Adicionar tratamento visual especifico para o status `past_due`:
- Novo badge vermelho/laranja: "Pagamento Pendente"
- Alerta destacado com icone de aviso explicando a situacao
- Botao "Atualizar Pagamento" que abre o portal Stripe diretamente
- Mensagem clara: "Seu ultimo pagamento nao foi processado. Atualize seu metodo de pagamento para evitar a desconexao da sessao."

### 3. Garantir Acesso ao Portal Stripe

**Confirmacao:** O acesso ao portal Stripe ja funciona corretamente atraves da Edge Function `create-stripe-portal`. O cliente pode:
- Alterar metodo de pagamento (cartao de credito)
- Ver historico de cobracas
- Cancelar assinatura
- Reverter cancelamento

O botao "Gerenciar Assinatura" ja esta disponivel para todos os status que possuem `stripe_customer_id`. Nenhuma alteracao necessaria neste ponto.

---

## Secao Tecnica

### Arquivo 1: `supabase/functions/stripe-webhook/index.ts`

**Bloco atual (linhas 607-616):**
```typescript
case 'invoice.payment_failed': {
  const invoice = event.data.object as Stripe.Invoice;
  
  await supabaseAdmin.from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', invoice.subscription as string);

  console.log('Pagamento falhou para subscription:', invoice.subscription);
  break;
}
```

**Bloco atualizado:**
Apos o update do status, adicionar:
- Busca dos dados da subscription (`payer_email`, `session_id`, `amount`)
- Busca do nome da sessao
- Envio de email via Resend com template informando o problema
- Template inclui: nome da sessao, valor, motivo, link para portal e link para pagina de assinaturas

### Arquivo 2: `src/pages/Subscriptions.tsx`

**Funcao `getStatusBadge`:** Adicionar case para `past_due`:
```text
case "past_due":
  Badge laranja/vermelho com icone AlertTriangle
  Texto: "Pagamento Pendente"
```

**Secao de conteudo do card:** Adicionar bloco condicional para `past_due`:
```text
if (status === "past_due")
  Alert vermelho com:
  - Icone de alerta
  - Texto explicativo sobre falha no pagamento
  - Botao "Atualizar Pagamento" -> abre portal Stripe
  - Botao "Gerenciar no Portal" -> abre portal Stripe
```

### Arquivo 3: Traducoes (opcional)

**Arquivos:** `src/i18n/locales/pt-BR.json` e `en.json`

Novas chaves para status `past_due`:
- "Pagamento Pendente" / "Payment Pending"
- Mensagem explicativa sobre falha
- Labels dos botoes

### Template do Email de Pagamento Falho

```text
Assunto: Problema com seu Pagamento - Uplink Lite

Conteudo:
- Header vermelho/laranja com icone de alerta
- Badge: "Pagamento Nao Processado"
- Texto: "Nao conseguimos processar o pagamento da sua assinatura"
- Card com detalhes (sessao, valor, status)
- Bloco de alerta: "O que fazer agora" com instrucoes
- Bloco informativo: prazo para regularizar antes da desconexao
- Botao principal: "Atualizar Metodo de Pagamento" -> link para /subscriptions
- Footer com suporte
```

### Fluxo Completo Apos Implementacao

```text
Stripe tenta cobrar o cartao
        |
   Pagamento falha
        |
        v
invoice.payment_failed chega no webhook
        |
        +-> Atualiza status para "past_due"
        |
        +-> Busca email e dados da sessao
        |
        +-> Envia email de notificacao
        |
        v
Cliente recebe email
        |
        +-> Clica no link do email
        |
        v
Pagina de Assinaturas
        |
        +-> Ve alerta vermelho "Pagamento Pendente"
        |
        +-> Clica "Atualizar Pagamento"
        |
        v
Portal Stripe
        |
        +-> Atualiza cartao de credito
        |
        v
Stripe tenta cobrar novamente
        |
   Pagamento aprovado
        |
        v
customer.subscription.updated -> status "active"
```

### Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/stripe-webhook/index.ts` | Adicionar envio de email no `invoice.payment_failed` |
| `src/pages/Subscriptions.tsx` | Adicionar badge e alerta para status `past_due` |
| `src/i18n/locales/pt-BR.json` | Traducoes para status de pagamento pendente |
| `src/i18n/locales/en.json` | Traducoes para status de pagamento pendente |

