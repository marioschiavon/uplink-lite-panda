
# Plano: Webhook Acessivel ao Cliente + Remover QRCODE_UPDATED

## Problema

1. **Webhook so acessivel no Monitoramento (admin-only):** A configuracao de webhook esta no `SessionDetailsModal`, que so e usado na pagina `/monitoring` (restrita a superadmin). O cliente, na pagina `/sessions`, usa o `SessionQrModal` que NAO tem aba de webhook.

2. **Evento QRCODE_UPDATED deve ser removido:** O evento de QR Code atualizado nao e relevante para o cliente final e deve ser retirado de todas as opcoes.

## Solucao

Adicionar uma aba/secao de webhook no modal que o cliente ja usa (`SessionQrModal`) quando a sessao esta conectada, e remover a opcao `QRCODE_UPDATED` de todos os arquivos.

## Mudancas Necessarias

### 1. Modificar `SessionQrModal.tsx` - Adicionar configuracao de Webhook

Quando a sessao esta **conectada**, alem de mostrar a API Key, adicionar uma secao de configuracao de webhook abaixo. Vou reutilizar a logica ja existente no `SessionDetailsModal` (webhook URL, eventos, botao salvar).

Mudancas:
- Importar componentes necessarios (Input, Label, Checkbox, Badge, Webhook icon)
- Adicionar estados para webhookUrl, selectedEvents, isSaving
- Adicionar props para dados de webhook (`webhook_url`, `webhook_enabled`, `webhook_events`)
- Na secao "Sessao Conectada", apos a API Key, adicionar bloco de configuracao de webhook
- O webhook URL vem pre-preenchido com `https://api.uplinklite.com/webhook/{session_name}`
- Eventos disponiveis: MESSAGES_UPSERT (obrigatorio), MESSAGES_UPDATE, CONNECTION_UPDATE (sem QRCODE_UPDATED)

### 2. Atualizar `SessionData` interface em `Sessions.tsx`

Adicionar campos de webhook na interface e na query de sessoes:
- `webhook_url`
- `webhook_enabled`
- `webhook_events`

Passar esses dados para o `SessionQrModal` via props.

### 3. Remover QRCODE_UPDATED de todos os arquivos

| Arquivo | Mudanca |
|---------|---------|
| `src/components/SessionDetailsModal.tsx` | Remover do array `WEBHOOK_EVENTS` |
| `src/components/SessionWebhookConfig.tsx` | Remover do array `AVAILABLE_EVENTS` |
| `supabase/functions/update-session-webhook/index.ts` | Remover da lista `validEvents` e do fallback de events |
| `supabase/functions/generate-whatsapp-token/index.ts` | Remover dos arrays de webhook_events padrao |
| `src/i18n/locales/en.json` | Remover traducoes de QRCODE_UPDATED |
| `src/i18n/locales/pt-BR.json` | Remover traducoes de QRCODE_UPDATED |

### 4. Fluxo do Cliente

```text
Cliente acessa /sessions
       |
       v
Clica em "Ver Detalhes" (sessao conectada)
       |
       v
SessionQrModal abre mostrando:
  - Status: Conectado
  - API Key (copiar)
  - [NOVO] Secao "Webhook" com:
    - URL pre-preenchida
    - Eventos selecionaveis (sem QRCODE_UPDATED)
    - Botao Salvar
  - Acoes Avancadas (fechar/excluir)
```

## Secao Tecnica

### SessionQrModal - Nova secao de Webhook

A secao sera adicionada DENTRO do bloco `isConnected`, apos a API Key. Incluira:

```typescript
// Novos estados
const [webhookUrl, setWebhookUrl] = useState('');
const [selectedEvents, setSelectedEvents] = useState<string[]>(['MESSAGES_UPSERT']);
const [isSavingWebhook, setIsSavingWebhook] = useState(false);

// Eventos disponiveis (sem QRCODE_UPDATED)
const WEBHOOK_EVENTS = [
  { id: 'MESSAGES_UPSERT', required: true },
  { id: 'MESSAGES_UPDATE', required: false },
  { id: 'CONNECTION_UPDATE', required: false },
];
```

A interface `SessionData` do `SessionQrModal` recebera os campos:
- `webhook_url?: string | null`
- `webhook_enabled?: boolean`
- `webhook_events?: string[]`

A funcao de salvar usara `supabase.functions.invoke('update-session-webhook')`, identica a logica ja existente no `SessionDetailsModal`.

### Arquivos Modificados

| Arquivo | Tipo de Mudanca |
|---------|----------------|
| `src/components/SessionQrModal.tsx` | Adicionar secao de webhook para sessao conectada |
| `src/pages/Sessions.tsx` | Passar dados de webhook para o modal |
| `src/components/SessionDetailsModal.tsx` | Remover QRCODE_UPDATED |
| `src/components/SessionWebhookConfig.tsx` | Remover QRCODE_UPDATED |
| `supabase/functions/update-session-webhook/index.ts` | Remover QRCODE_UPDATED |
| `supabase/functions/generate-whatsapp-token/index.ts` | Remover QRCODE_UPDATED |
| `src/i18n/locales/en.json` | Remover traducoes QRCODE_UPDATED |
| `src/i18n/locales/pt-BR.json` | Remover traducoes QRCODE_UPDATED |
