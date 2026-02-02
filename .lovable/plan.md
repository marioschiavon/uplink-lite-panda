

# Plano: Marcar Webhook como Em Construcao

## Resumo

Adicionar um banner de "Em Construcao" na aba de Webhook do modal de detalhes da sessao, informando que a funcionalidade esta sendo desenvolvida. O restante do codigo nao apresenta erros tecnicos detectados.

---

## Mudancas a Implementar

### 1. Atualizar SessionDetailsModal.tsx

**Localizacao:** `src/components/SessionDetailsModal.tsx`

**Mudanca:** Substituir o componente `SessionWebhookConfig` por um componente de "Em Construcao" com:
- Icone de construcao (Construction ou Wrench)
- Titulo explicativo
- Mensagem informando que a funcionalidade esta em desenvolvimento
- Visual consistente com o design do sistema

**Antes:**
```typescript
<TabsContent value="webhook" className="mt-4">
  <SessionWebhookConfig
    sessionId={session.id}
    sessionName={session.name}
    initialUrl={session.webhook_url || ''}
    initialEnabled={session.webhook_enabled || false}
    initialEvents={session.webhook_events || ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']}
    onUpdate={onRefresh}
  />
</TabsContent>
```

**Depois:**
```typescript
<TabsContent value="webhook" className="mt-4">
  <Card className="border-border">
    <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="p-4 rounded-full bg-yellow-500/10">
        <Construction className="h-12 w-12 text-yellow-500" />
      </div>
      <h3 className="text-xl font-semibold">{t('webhooks.underConstruction')}</h3>
      <p className="text-muted-foreground text-center max-w-md">
        {t('webhooks.underConstructionDescription')}
      </p>
    </CardContent>
  </Card>
</TabsContent>
```

---

### 2. Adicionar Traducoes

**Arquivo:** `src/i18n/locales/pt-BR.json`

```json
"webhooks": {
  ...
  "underConstruction": "Em Construcao",
  "underConstructionDescription": "Estamos trabalhando para trazer webhooks personalizados para suas sessoes. Em breve voce podera configurar endpoints para receber eventos em tempo real."
}
```

**Arquivo:** `src/i18n/locales/en.json`

```json
"webhooks": {
  ...
  "underConstruction": "Under Construction",
  "underConstructionDescription": "We are working to bring custom webhooks to your sessions. Soon you will be able to configure endpoints to receive real-time events."
}
```

---

### 3. Importar Icone no Modal

Adicionar `Construction` aos imports do Lucide:

```typescript
import { Copy, Info, Webhook, Construction } from "lucide-react";
```

---

## Secao Tecnica

### Arquivos Modificados

| Arquivo | Tipo de Mudanca |
|---------|-----------------|
| `src/components/SessionDetailsModal.tsx` | Substituir webhook config por banner de construcao |
| `src/i18n/locales/pt-BR.json` | Adicionar 2 novas traducoes |
| `src/i18n/locales/en.json` | Adicionar 2 novas traducoes |

### Dependencias

Nenhuma nova dependencia necessaria. O icone `Construction` ja esta disponivel no pacote `lucide-react` instalado.

### Componentes Mantidos

O arquivo `SessionWebhookConfig.tsx` sera mantido no projeto para uso futuro quando a funcionalidade for reativada.

---

## Verificacao de Erros

Analisei os seguintes pontos e nao encontrei erros:
- Console logs: Apenas warning do Tailwind CDN (normal em desenvolvimento)
- Network requests: Sem erros
- Traducoes: Todas as chaves usadas existem nos arquivos JSON
- Componentes: Todos importados corretamente

---

## Resultado Esperado

Ao abrir os detalhes de uma sessao e clicar na aba "Webhook", o usuario vera um banner informativo indicando que a funcionalidade esta em desenvolvimento, em vez do formulario de configuracao.

