
## Plano: Sistema de Webhooks por Sessao com Seguranca via API Key

### Resumo

Implementar sistema de webhooks onde cada sessao WhatsApp tem seu proprio webhook configuravel. A seguranca sera garantida validando o header `apikey` em cada chamada recebida - o mesmo token usado para enviar mensagens.

---

### Arquitetura do Sistema

```text
+----------------+     +------------------+     +-------------------+
|  WhatsApp      | --> |  Evolution API   | --> |  Edge Function    |
|  (Mensagens)   |     |  (Webhook)       |     |  whatsapp-webhook |
+----------------+     +------------------+     +-------------------+
                              |                         |
                              |  Header: apikey         |
                              +-------------------------+
                                        |
                                        v
                              +-------------------+
                              |  Validar apikey   |
                              |  vs sessions.     |
                              |  api_token        |
                              +-------------------+
                                        |
                                        v
                              +-------------------+
                              |  Processar evento |
                              |  e notificar      |
                              |  cliente          |
                              +-------------------+
```

---

### Parte 1: Migracacao do Banco de Dados

**Adicionar colunas na tabela `sessions`:**

```sql
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS webhook_events TEXT[] DEFAULT ARRAY['MESSAGES_UPSERT', 'CONNECTION_UPDATE'];
```

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| webhook_url | TEXT | URL do cliente para receber eventos |
| webhook_enabled | BOOLEAN | Se o webhook esta ativo |
| webhook_events | TEXT[] | Eventos selecionados |

---

### Parte 2: Nova Edge Function `whatsapp-webhook`

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

**Responsabilidades:**
1. Receber eventos da Evolution API
2. Validar `apikey` no header contra `sessions.api_token`
3. Identificar a sessao pelo `instanceName`
4. Encaminhar o evento para o `webhook_url` do cliente
5. Logar eventos na tabela `webhook_logs` (opcional)

**Fluxo de seguranca:**
```text
1. Evolution API envia POST para /whatsapp-webhook
2. Edge function extrai apikey do header
3. Busca sessao onde api_token = apikey
4. Se encontrar, processa; senao, rejeita 401
5. Envia evento para webhook_url do cliente com mesma apikey
```

**Eventos suportados:**
- `MESSAGES_UPSERT` - Mensagens recebidas
- `MESSAGES_UPDATE` - Status de entrega (sent, delivered, read)
- `CONNECTION_UPDATE` - Conexao/desconexao
- `QRCODE_UPDATED` - Novo QR code disponivel

---

### Parte 3: Atualizar `generate-whatsapp-token`

**Modificacoes na edge function existente:**

Apos criar/atualizar a instancia, configurar webhook automaticamente:

```typescript
// Configurar webhook na Evolution API
const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/set/${session_name}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': evolutionApiKey
  },
  body: JSON.stringify({
    enabled: true,
    url: `https://kfsvpbujmetlendgwnrs.supabase.co/functions/v1/whatsapp-webhook`,
    webhookByEvents: true,
    webhookBase64: true,
    headers: {
      'apikey': instanceApiKey  // Seguranca: token da sessao
    },
    events: [
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE', 
      'CONNECTION_UPDATE',
      'QRCODE_UPDATED'
    ]
  })
});
```

---

### Parte 4: Interface de Configuracao de Webhook

**Novo componente:** `src/components/SessionWebhookConfig.tsx`

**Campos:**
- Toggle: Habilitar/Desabilitar webhook
- Input: URL do webhook (validacao de URL)
- Checkboxes: Eventos a receber
- Botao: Testar webhook (envia payload de teste)

**Integracao:**
- Adicionar aba/secao no modal de detalhes da sessao
- Ou criar modal separado acessivel pelo SessionCard

---

### Parte 5: Adicionar Endpoint para Atualizar Webhook

**Nova edge function ou expandir existente:**

`PUT /sessions/{id}/webhook`

```typescript
// Atualizar configuracao no Supabase
await supabase
  .from('sessions')
  .update({
    webhook_url: body.url,
    webhook_enabled: body.enabled,
    webhook_events: body.events
  })
  .eq('id', sessionId);

// Atualizar na Evolution API
await fetch(`${evolutionApiUrl}/webhook/set/${sessionName}`, {
  method: 'POST',
  headers: { 'apikey': evolutionApiKey },
  body: JSON.stringify({
    enabled: body.enabled,
    url: body.url || webhookBaseUrl,
    events: body.events
  })
});
```

---

### Parte 6: Documentacao de Webhooks

**Adicionar nova tab em `ApiDocs.tsx`:**

```text
Tab: "Webhooks"

Conteudo:
- Explicacao do sistema de webhooks
- Como configurar URL de destino
- Validacao de seguranca (header apikey)
- Formato dos payloads por evento
- Exemplos de codigo (Node.js, Python)
```

**Payload de exemplo:**
```json
{
  "event": "MESSAGES_UPSERT",
  "instance": "vendas-sp",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "id": "ABC123"
    },
    "message": {
      "conversation": "Ola, quero fazer um pedido"
    },
    "messageTimestamp": 1706300000
  }
}
```

---

### Parte 7: Tabela de Logs (Opcional mas Recomendado)

**Nova tabela `webhook_logs`:**

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  response_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: usuarios veem logs da propria org
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own org webhook logs" ON webhook_logs
FOR SELECT USING (
  session_id IN (
    SELECT id FROM sessions 
    WHERE organization_id = get_user_organization(auth.uid())
  )
);
```

---

### Parte 8: Traducoes i18n

**Adicionar chaves em `pt-BR.json` e `en.json`:**

```json
{
  "webhooks": {
    "title": "Configurar Webhook",
    "description": "Receba notificacoes em tempo real",
    "url": "URL do Webhook",
    "urlPlaceholder": "https://seu-servidor.com/webhook",
    "enabled": "Webhook Ativo",
    "events": "Eventos",
    "eventsDescription": "Selecione os eventos que deseja receber",
    "testWebhook": "Testar Webhook",
    "testSuccess": "Webhook testado com sucesso!",
    "testError": "Erro ao testar webhook",
    "saveSuccess": "Configuracao salva",
    "eventTypes": {
      "MESSAGES_UPSERT": "Mensagens Recebidas",
      "MESSAGES_UPDATE": "Status de Entrega",
      "CONNECTION_UPDATE": "Status da Conexao",
      "QRCODE_UPDATED": "QR Code Atualizado"
    }
  }
}
```

---

### Ordem de Implementacao

| Etapa | Descricao | Prioridade |
|-------|-----------|------------|
| 1 | Migracacao DB (webhook_url, webhook_enabled, webhook_events) | Alta |
| 2 | Edge function `whatsapp-webhook` para receber eventos | Alta |
| 3 | Atualizar `generate-whatsapp-token` para configurar webhook automatico | Alta |
| 4 | Componente `SessionWebhookConfig` na UI | Media |
| 5 | Documentacao de webhooks em ApiDocs.tsx | Media |
| 6 | Tabela `webhook_logs` + visualizacao | Baixa |
| 7 | Traducoes i18n | Baixa |

---

### Consideracoes de Seguranca

1. **Validacao de apikey** - Toda requisicao de webhook valida o header apikey contra sessions.api_token
2. **HTTPS obrigatorio** - webhook_url deve comecar com https://
3. **Rate limiting** - Limitar requisicoes por sessao (ex: 100/min)
4. **Timeout** - Timeout de 10s para chamadas ao webhook do cliente
5. **Retry** - Retry automatico em caso de falha (3 tentativas)

---

### Resposta a Pergunta Original

**Sim, e possivel ativar o webhook automaticamente quando o cliente cria a sessao!**

O momento ideal e na edge function `generate-whatsapp-token`, logo apos criar a instancia na Evolution API. O webhook sera configurado para enviar eventos para nossa edge function central (`whatsapp-webhook`), que valida a apikey e encaminha para o URL configurado pelo cliente.
