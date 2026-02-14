
# Adicionar evento de conversao Google Analytics no momento da compra

## Onde colocar

O melhor local e no `src/pages/Dashboard.tsx`, dentro do `useEffect` que ja detecta `payment=success` (linha 265-280). Esse e o ponto exato onde sabemos que o cliente completou o pagamento com sucesso no Stripe e foi redirecionado de volta.

Nao faz sentido colocar na pagina de Checkout porque la o pagamento ainda nao foi concluido -- o usuario esta sendo redirecionado para o Stripe. O evento de conversao so deve disparar apos o pagamento confirmado.

## Mudanca

### `src/pages/Dashboard.tsx`

Dentro do bloco `if (paymentSuccess)` (linha 269), adicionar a chamada ao `gtag` antes de limpar os parametros da URL:

```typescript
if (paymentSuccess) {
  // Disparar evento de conversao Google Analytics
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'conversion_event_purchase', {});
  }

  const helpDismissed = localStorage.getItem('connectionHelpDismissed');
  // ... resto do codigo existente
}
```

### `src/vite-env.d.ts`

Adicionar tipagem do `gtag` no `Window` para evitar erro de TypeScript:

```typescript
interface Window {
  gtag: (...args: any[]) => void;
}
```

## Secao tecnica

- O `gtag` ja esta carregado globalmente no `index.html` (Google tag G-EYWXEF6V50)
- A verificacao `typeof window.gtag === 'function'` previne erros caso o script do Google nao carregue (ex: bloqueador de ads)
- O evento dispara uma unica vez por compra, pois logo em seguida os parametros da URL sao limpos com `window.history.replaceState`
- Apenas 2 arquivos serao modificados: `Dashboard.tsx` e `vite-env.d.ts`
