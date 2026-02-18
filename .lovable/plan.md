

# Tracking SPA e evento purchase padrao GA4 via GTM

## 1. Page views em SPA

Em uma SPA com React Router, o GTM nao detecta trocas de pagina automaticamente porque nao ha reload do HTML. A solucao e:

**No codigo**: Criar um componente que escuta mudancas de rota via `useLocation()` e faz `dataLayer.push` com um evento customizado a cada navegacao.

**No GTM**: Criar um trigger do tipo **Custom Event** com o nome do evento (ex: `virtualPageview`) e associar a uma tag do GA4 do tipo **GA4 Event** com nome `page_view`.

### Componente `RouteChangeTracker`

Sera criado em `src/components/RouteChangeTracker.tsx` e adicionado dentro do `<BrowserRouter>` no `App.tsx`. Ele faz:

```typescript
useEffect(() => {
  window.dataLayer?.push({
    event: 'virtualPageview',
    page_path: location.pathname + location.search,
    page_title: document.title
  });
}, [location]);
```

### Configuracao no GTM (manual, fora do codigo)

1. **Variavel**: Criar variavel Data Layer chamada `page_path`
2. **Trigger**: Custom Event com nome `virtualPageview`
3. **Tag**: GA4 Event > nome `page_view`, parametro `page_location` = `{{page_path}}`

---

## 2. Evento purchase padrao GA4

O GA4 tem um formato padrao de e-commerce para o evento `purchase`. O dataLayer push deve incluir informacoes do produto/transacao.

### Dados disponiveis no momento da compra

No `Dashboard.tsx`, quando `payment=success`, temos acesso a:
- `searchParams.get('session')` -- nome da sessao comprada
- Preco via `useRegionalPricing()`

### Formato do dataLayer push (padrao GA4 e-commerce)

```typescript
window.dataLayer?.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: sessionName || 'unknown',
    value: parseFloat(pricing.amount.replace(',', '.')),
    currency: pricing.currency,
    items: [{
      item_id: 'whatsapp_session',
      item_name: `Sessao WhatsApp - ${sessionName}`,
      item_category: 'subscription',
      price: parseFloat(pricing.amount.replace(',', '.')),
      quantity: 1
    }]
  }
});
```

### Configuracao no GTM (manual, fora do codigo)

1. **Trigger**: Custom Event com nome `purchase`
2. **Tag**: GA4 Event > nome `purchase`, habilitar "Use Data Layer" para e-commerce

---

## Mudancas no codigo

### Arquivos a criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/RouteChangeTracker.tsx` | Componente que dispara `virtualPageview` a cada troca de rota |

### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `index.html` | Substituir gtag.js pelo GTM (head + noscript no body) |
| `src/App.tsx` | Adicionar `<RouteChangeTracker />` dentro do `<BrowserRouter>` |
| `src/pages/Dashboard.tsx` | Trocar `window.gtag()` por `dataLayer.push` com formato e-commerce GA4 padrao, incluindo `ecommerce.items` |
| `src/vite-env.d.ts` | Atualizar tipagem Window: remover `gtag`, adicionar `dataLayer` |

### Ordem de implementacao

1. Atualizar `index.html` (GTM head + noscript body)
2. Atualizar `vite-env.d.ts` (tipagem dataLayer)
3. Criar `RouteChangeTracker.tsx`
4. Atualizar `App.tsx` (adicionar tracker)
5. Atualizar `Dashboard.tsx` (purchase e-commerce padrao)

