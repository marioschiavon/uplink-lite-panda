
## Plano: Adicionar Campo de Cupom de Desconto no Checkout Stripe

### Resumo

Adicionar suporte a cupons de desconto no checkout. A Stripe oferece uma opcao nativa chamada `allow_promotion_codes` que exibe automaticamente um campo para inserir codigos promocionais diretamente na pagina de checkout hospedada pela Stripe.

---

### Analise da Situacao Atual

**Fluxo atual:**
1. Usuario acessa `/checkout?session_name=MinhaSession`
2. Frontend cria sessao no Supabase
3. Chama edge function `create-stripe-checkout`
4. Redireciona para checkout hospedado da Stripe
5. Usuario paga e retorna ao dashboard

**Edge function atual (`create-stripe-checkout`):**
```typescript
const checkoutSession = await stripe.checkout.sessions.create({
  customer: customer.id,
  mode: 'subscription',
  line_items: [{
    price: 'price_1SVWEfQs5BDRSUmXT5cPQTuh',
    quantity: 1,
  }],
  // ... outras opcoes
});
```

---

### Solucao Recomendada: `allow_promotion_codes`

A Stripe oferece um parametro nativo que adiciona automaticamente um campo de cupom no checkout:

```typescript
const checkoutSession = await stripe.checkout.sessions.create({
  // ... opcoes existentes
  allow_promotion_codes: true,  // Adicionar esta linha
});
```

**Vantagens:**
- Campo de cupom aparece APENAS no checkout da Stripe (nao no seu site)
- Validacao automatica de cupons pela Stripe
- Suporte a codigos promocionais e cupons
- Sem necessidade de UI adicional no frontend
- Descontos aplicados corretamente na assinatura

---

### Implementacao

**Arquivo a modificar:** `supabase/functions/create-stripe-checkout/index.ts`

**Mudanca necessaria (1 linha):**

```typescript
// 6. Criar Checkout Session
const checkoutSession = await stripe.checkout.sessions.create({
  customer: customer.id,
  mode: 'subscription',
  line_items: [
    {
      price: 'price_1SVWEfQs5BDRSUmXT5cPQTuh',
      quantity: 1,
    },
  ],
  allow_promotion_codes: true,  // <-- ADICIONAR ESTA LINHA
  subscription_data: {
    description: `Uplink - Sessao ${sessionData.name}`,
    metadata: {
      session_id: session_id,
      session_name: sessionData.name,
      organization_id: sessionData.organization_id,
    }
  },
  // ... resto das opcoes
});
```

---

### Configuracao de Cupons no Stripe Dashboard

Para os cupons funcionarem, voce precisa cria-los no Stripe Dashboard:

1. Acesse [Stripe Dashboard > Products > Coupons](https://dashboard.stripe.com/coupons)
2. Clique em **"+ New coupon"**
3. Configure:
   - **Nome**: "Black Friday 2024"
   - **Tipo**: Porcentagem (ex: 20%) ou Valor fixo (ex: R$10)
   - **Duracao**: Uma vez, X meses, ou para sempre
   - **Codigo**: "BLACKFRIDAY20" (codigo que cliente digita)
4. Salve o cupom

**Tipos de desconto disponiveis:**
- **percent_off**: Desconto em porcentagem (ex: 20% off)
- **amount_off**: Desconto em valor fixo (ex: R$10 off)
- **Duracao**: once (primeira cobranca), repeating (X meses), forever

---

### Experiencia do Usuario

Com `allow_promotion_codes: true`:

1. Usuario clica em "Assinar Agora" no seu site
2. E redirecionado para o checkout da Stripe
3. Na pagina de checkout da Stripe, aparece um link "Add promotion code"
4. Usuario clica e insere o codigo (ex: "BLACKFRIDAY20")
5. Stripe valida e aplica o desconto automaticamente
6. Preco atualizado e mostrado antes de pagar

---

### Visual do Campo de Cupom (Stripe Hosted)

```text
+------------------------------------------+
|  Uplink - Sessao API WhatsApp            |
|------------------------------------------|
|  R$ 69,90/mes                            |
|                                          |
|  [+ Add promotion code]  <-- Link clicavel
|                                          |
|  Subtotal: R$ 69,90                      |
|  Desconto: -R$ 13,98  (BLACKFRIDAY20)   |
|  Total: R$ 55,92/mes                     |
|                                          |
|  [====== Pagar Agora ======]             |
+------------------------------------------+
```

---

### Alternativa: Campo de Cupom no Seu Site

Se voce preferir ter o campo de cupom NO SEU SITE (antes de ir para Stripe):

**Opcao B - Campo pre-checkout:**

1. Adicionar input de cupom em `Checkout.tsx`
2. Enviar codigo para edge function
3. Edge function valida cupom na Stripe
4. Aplica com `discounts: [{ promotion_code: 'promo_xxx' }]`

**Desvantagens da Opcao B:**
- Mais complexo de implementar
- Precisa validar cupom manualmente
- Mais pontos de falha

**Recomendacao:** Usar `allow_promotion_codes: true` (Opcao A) por ser mais simples e nativo.

---

### Resumo das Mudancas

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/create-stripe-checkout/index.ts` | Adicionar `allow_promotion_codes: true` |

**Esforco:** Minimo (1 linha de codigo)

**Resultado:** Campo de cupom aparece automaticamente no checkout da Stripe
