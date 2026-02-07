
# Corrigir Envio Incorreto de Emails de Lembrete

## Problema Encontrado

O sistema continua enviando emails "Conecte seu WhatsApp" para clientes que ja tem sessao conectada. Isso acontece porque:

1. O campo `sessions.status` no banco de dados nunca e atualizado quando o WhatsApp realmente conecta
2. Todas as sessoes ficam com status `configured` para sempre
3. O script de lembretes verifica `sessions.status = 'connected'`, que nunca retorna resultados
4. Resultado: clientes como `contato@gti.app.br` (assinatura ativa, sessao funcionando) recebem email a cada 2 dias pedindo para conectar

Dados reais do banco confirmam o problema:
- `bescz-app`: status=`configured`, assinatura=`active`, tem api_token -- recebe email indevidamente
- `GroomerGenius`: status=`configured`, assinatura=`past_due`, tem api_token -- recebe email indevidamente

## Causa Raiz

A funcao `whatsapp-webhook` recebe eventos `CONNECTION_UPDATE` da Evolution API quando o WhatsApp conecta/desconecta, mas **nao atualiza** o campo `sessions.status` no banco de dados. O status so e atualizado no Stripe webhook (apos pagamento) e no `generate-whatsapp-token` (criacao), mas nunca quando a conexao real do WhatsApp muda.

## Correcoes Necessarias

### 1. Atualizar `whatsapp-webhook` para sincronizar status de conexao

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

Adicionar logica ANTES do check de webhook habilitado (porque o webhook do cliente pode nao estar configurado, mas o status precisa ser atualizado):

- Quando receber evento `CONNECTION_UPDATE`:
  - Se `data.state === 'open'`: atualizar `sessions.status` para `connected`
  - Se `data.state === 'close'`: atualizar `sessions.status` para `disconnected`
- Essa logica roda independentemente do webhook do cliente estar configurado

### 2. Corrigir logica do `send-onboarding-reminders`

**Arquivo:** `supabase/functions/send-onboarding-reminders/index.ts`

Melhorar a verificacao de sessao conectada (linhas 207-215):

Atual (bugado):
```
.eq("status", "connected")
```

Corrigido - verificar sessoes que estejam `connected` OU que tenham `api_token` valido (indicando que foram configuradas e potencialmente conectadas):
```
.in("status", ["connected", "configured"])
.not("api_token", "is", null)
```

Isso garante que:
- Sessoes com status `connected` (apos o fix do webhook) sao consideradas conectadas
- Sessoes `configured` que possuem `api_token` tambem sao consideradas (retrocompatibilidade com dados existentes)
- Sessoes sem `api_token` (realmente nao configuradas) continuam recebendo lembretes

---

## Secao Tecnica

### Arquivo 1: `supabase/functions/whatsapp-webhook/index.ts`

Adicionar ANTES da verificacao de webhook habilitado (antes da linha 76), apos encontrar a sessao:

```typescript
// Sync connection status to database on CONNECTION_UPDATE events
if (eventType === 'CONNECTION_UPDATE' && payload.data) {
  const connectionState = payload.data?.state || payload.data?.instance?.state;
  
  if (connectionState === 'open') {
    await supabaseAdmin.from('sessions')
      .update({ status: 'connected', updated_at: new Date().toISOString() })
      .eq('id', session.id);
    console.log('Session status updated to connected:', session.name);
  } else if (connectionState === 'close') {
    await supabaseAdmin.from('sessions')
      .update({ status: 'disconnected', updated_at: new Date().toISOString() })
      .eq('id', session.id);
    console.log('Session status updated to disconnected:', session.name);
  }
}
```

### Arquivo 2: `supabase/functions/send-onboarding-reminders/index.ts`

Alterar bloco de verificacao de sessao conectada (linhas 209-213):

De:
```typescript
const { data: connectedSessions } = await supabase
  .from("sessions")
  .select("id, status")
  .eq("organization_id", user.organization_id)
  .eq("status", "connected");
```

Para:
```typescript
const { data: connectedSessions } = await supabase
  .from("sessions")
  .select("id, status, api_token")
  .eq("organization_id", user.organization_id)
  .not("api_token", "is", null);
```

A logica muda de "tem sessao com status connected?" para "tem sessao com api_token configurado?". Se o usuario tem uma sessao com token, ele ja completou o processo de configuracao e nao deve receber lembretes de conexao.

### Fluxo Corrigido

```text
WhatsApp escaneia QR Code
        |
        v
Evolution API envia CONNECTION_UPDATE (state: open)
        |
        v
whatsapp-webhook recebe o evento
        |
        +-> NOVO: Atualiza sessions.status para "connected"
        |
        +-> Encaminha para webhook do cliente (se configurado)
        |
        v
send-onboarding-reminders roda (cron)
        |
        +-> Verifica sessions com api_token nao nulo
        |
        +-> hasConnectedSession = TRUE
        |
        +-> NAO envia email de "Conecte seu WhatsApp"
```

### Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/whatsapp-webhook/index.ts` | Sincronizar status de conexao no banco quando receber CONNECTION_UPDATE |
| `supabase/functions/send-onboarding-reminders/index.ts` | Verificar api_token ao inves de status='connected' |

### Impacto nos Dados Existentes

- Sessoes existentes com `api_token` preenchido deixarao de receber emails indevidos imediatamente
- Proximos eventos `CONNECTION_UPDATE` atualizarao o campo `status` corretamente
- Nenhuma migracao de dados necessaria - o fix no reminder function cobre os dados antigos
