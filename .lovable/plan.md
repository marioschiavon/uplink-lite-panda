
# Plano: Configuracao de Webhook para Receber Mensagens

## Resumo

Substituir o banner "Em Construcao" por um formulario simplificado que permite aos clientes configurar o webhook para receber mensagens do WhatsApp. A URL sera pre-configurada automaticamente com o padrao `https://api.uplinklite.com/webhook/{nome_sessao}` e a seguranca sera garantida pelo token da sessao (api_token).

---

## Arquitetura de Seguranca

O sistema ja possui seguranca implementada:

```text
Evolution API
     |
     | (envia apikey no header)
     v
whatsapp-webhook Edge Function
     |
     | (valida api_token da sessao)
     v
webhook_url do cliente
     |
     | (recebe apikey no header para validacao)
     v
Sistema do Cliente
```

**O cliente deve validar o header `apikey` recebido para garantir que a requisicao e legitima.**

---

## Mudancas a Implementar

### 1. SessionCard.tsx - Adicionar Badge de Status do Webhook

Adicionar um indicador visual mostrando se o webhook esta configurado ou pendente.

**Mudancas:**
- Adicionar propriedades `webhook_url` e `webhook_enabled` na interface `SessionData`
- Exibir badge de status do webhook apos o badge de status da conexao
- Badge verde: "Recebendo Msgs" quando webhook ativo
- Badge amarelo: "Configurar Webhook" quando nao configurado

---

### 2. SessionDetailsModal.tsx - Formulario Simplificado de Webhook

Substituir o banner "Em Construcao" por um formulario funcional.

**Layout do Formulario:**

```text
+------------------------------------------------+
|  Receber Mensagens do WhatsApp                |
|  Configure para onde enviar as mensagens      |
+------------------------------------------------+
|                                                |
|  URL do Webhook (pre-preenchida)               |
|  [https://api.uplinklite.com/webhook/sessao1] |
|                                                |
|  Seu Token de Seguranca (somente leitura)      |
|  [abc123...] [Copiar]                         |
|                                                |
|  Eventos para Receber:                         |
|  [x] Mensagens Recebidas (obrigatorio)         |
|  [ ] Status de Entrega                         |
|  [ ] Status da Conexao                         |
|  [ ] Atualizacao do QR Code                    |
|                                                |
|  [Salvar Configuracao]                         |
+------------------------------------------------+
```

**Logica:**
- URL pre-preenchida: `https://api.uplinklite.com/webhook/{session.name}`
- Token exibido (primeiros 20 chars + "...") com botao copiar
- "Mensagens Recebidas" (MESSAGES_UPSERT) sempre ativado e desabilitado visualmente
- Outros eventos sao opcionais (checkboxes)
- Ao salvar, automaticamente define `webhook_enabled = true`

---

### 3. Traducoes - Nomenclatura Amigavel

**Eventos com nomes leigos:**

| Evento Tecnico | PT-BR | EN |
|----------------|-------|-----|
| MESSAGES_UPSERT | Mensagens Recebidas | Messages Received |
| MESSAGES_UPDATE | Status de Entrega (lido, entregue) | Delivery Status (read, delivered) |
| CONNECTION_UPDATE | Status da Conexao (online/offline) | Connection Status (online/offline) |
| QRCODE_UPDATED | Atualizacao do QR Code | QR Code Update |

**Novas chaves de traducao:**

```json
"webhooks": {
  "receiveMessages": "Receber Mensagens do WhatsApp",
  "receiveMessagesDescription": "Configure para onde enviar as mensagens recebidas",
  "webhookUrl": "URL do Webhook",
  "webhookUrlHint": "Endereco HTTPS que recebera as notificacoes",
  "securityToken": "Seu Token de Seguranca",
  "securityTokenHint": "Use este token para validar as requisicoes no seu servidor",
  "selectEvents": "Eventos para Receber",
  "requiredEvent": "(obrigatorio)",
  "optionalEvents": "Eventos opcionais",
  "eventDescriptions": {
    "MESSAGES_UPSERT": "Recebe todas as mensagens enviadas para o numero conectado",
    "MESSAGES_UPDATE": "Notifica quando mensagens sao lidas ou entregues",
    "CONNECTION_UPDATE": "Avisa quando a sessao conecta ou desconecta",
    "QRCODE_UPDATED": "Notifica quando um novo QR Code e gerado"
  },
  "webhookActive": "Recebendo Mensagens",
  "webhookPending": "Configurar Webhook",
  "webhookSaved": "Webhook configurado com sucesso!",
  "copyToken": "Copiar Token",
  "tokenCopied": "Token copiado!"
}
```

---

### 4. SessionCard.tsx - Interface Atualizada

```typescript
interface SessionData {
  id: string;
  name: string;
  api_session: string | null;
  api_token: string | null;
  plan: string | null;
  created_at: string;
  updated_at: string;
  status?: 'online' | 'offline' | 'qrcode' | 'loading' | 'no-session';
  statusMessage?: string;
  // Novas propriedades
  webhook_url?: string | null;
  webhook_enabled?: boolean;
}
```

---

## Secao Tecnica

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/SessionDetailsModal.tsx` | Substituir banner por formulario de webhook |
| `src/components/SessionCard.tsx` | Adicionar badge de status do webhook + propriedades na interface |
| `src/i18n/locales/pt-BR.json` | Novas traducoes para webhook |
| `src/i18n/locales/en.json` | Novas traducoes para webhook |

### Fluxo do Usuario

```text
1. Usuario abre "Ver Detalhes" de uma sessao
         |
         v
2. Clica na aba "Webhook"
         |
         v
3. Ve formulario com URL pre-preenchida
   https://api.uplinklite.com/webhook/{nome_sessao}
         |
         v
4. Pode editar URL se quiser usar outra
         |
         v
5. Eventos: "Mensagens Recebidas" ja ativo
   Pode marcar outros opcionais
         |
         v
6. Copia o Token de Seguranca
         |
         v
7. Clica "Salvar"
         |
         v
8. Edge Function update-session-webhook salva no banco
         |
         v
9. Badge no SessionCard muda para "Recebendo Mensagens" (verde)
         |
         v
10. Mensagens do WhatsApp sao encaminhadas para a URL
```

### Validacao no Lado do Cliente

Instrucoes para o cliente validar webhooks recebidos:

```javascript
// Exemplo: Validar webhook no servidor do cliente
app.post('/webhook', (req, res) => {
  const apikey = req.headers['apikey'];
  const expectedToken = 'SEU_TOKEN_COPIADO';
  
  if (apikey !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Processar evento
  const { event, data } = req.body;
  console.log(`Evento: ${event}`, data);
  
  res.status(200).json({ ok: true });
});
```

### Componente Interno: WebhookConfigForm

Criar um componente interno no SessionDetailsModal para manter o codigo organizado:

```typescript
// Componente simplificado dentro do modal
function WebhookConfigForm({ session, onSave }) {
  const [url, setUrl] = useState(
    session.webhook_url || 
    `https://api.uplinklite.com/webhook/${session.name}`
  );
  const [events, setEvents] = useState(
    session.webhook_events || ['MESSAGES_UPSERT']
  );
  
  // MESSAGES_UPSERT sempre ativo
  const toggleEvent = (eventId) => {
    if (eventId === 'MESSAGES_UPSERT') return; // Nao pode desativar
    // Toggle outros eventos
  };
  
  const handleSave = async () => {
    // Chamar edge function update-session-webhook
  };
}
```

### Eventos Disponiveis

| ID Tecnico | Nome Amigavel | Obrigatorio | Descricao |
|------------|---------------|-------------|-----------|
| MESSAGES_UPSERT | Mensagens Recebidas | Sim | Todas as mensagens do WhatsApp |
| MESSAGES_UPDATE | Status de Entrega | Nao | Lido, entregue, visualizado |
| CONNECTION_UPDATE | Status da Conexao | Nao | Online/offline da sessao |
| QRCODE_UPDATED | QR Code Atualizado | Nao | Novo QR gerado |

---

## Resultado Esperado

1. **SessionCard**: Badge mostrando status do webhook (verde/amarelo)
2. **Modal**: Formulario funcional com URL pre-preenchida
3. **Seguranca**: Token visivel para o cliente copiar e validar
4. **Simplicidade**: MESSAGES_UPSERT sempre ativo por padrao
5. **Flexibilidade**: Outros eventos sao opcionais
6. **Backend**: Nenhuma alteracao necessaria (edge functions ja funcionam)
