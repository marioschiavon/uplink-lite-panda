

# Plano: Otimizar Logs de Webhook (Opção B)

## Situação Atual

O código já está parcialmente otimizado:
- **Sem webhook configurado**: Retorna sem logar (correto)
- **Com webhook configurado**: Loga TODAS as tentativas (sucesso e falha)

## Mudança Proposta

Logar apenas em casos específicos para economizar espaço:

| Situação | Logar? | Motivo |
|----------|--------|--------|
| Webhook não configurado | Não | Já funciona assim |
| Evento não inscrito | Não | Já funciona assim |
| URL inválida (não HTTPS) | Sim | Erro de configuração, cliente precisa saber |
| Entrega com sucesso | Não | Não precisa, a Evolution API já tem esse dado |
| Entrega falhou | Sim | Cliente precisa debugar |

## Arquivo a Modificar

`supabase/functions/whatsapp-webhook/index.ts`

## Mudanças no Código

### Remover log de sucesso (linha 164-171)

**Antes:**
```typescript
// 8. Log the webhook delivery attempt
await supabaseAdmin.from('webhook_logs').insert({
  session_id: session.id,
  event_type: eventType,
  payload: forwardPayload,
  status,
  response_code: responseCode,
  error_message: errorMessage
});
```

**Depois:**
```typescript
// 8. Log only failed webhook deliveries (success logs are redundant with Evolution API)
if (status === 'failed' || status === 'error') {
  await supabaseAdmin.from('webhook_logs').insert({
    session_id: session.id,
    event_type: eventType,
    payload: forwardPayload,
    status,
    response_code: responseCode,
    error_message: errorMessage
  });
}
```

## Resultado

- **Logs reduzidos em ~90%**: Apenas falhas serão logadas
- **Debugging mantido**: Cliente ainda pode ver o que falhou
- **Performance melhorada**: Menos escritas no banco

## Seção Técnica

### Lógica Completa do Fluxo

```text
Evento chega da Evolution API
        |
        v
  Sessão tem webhook_url?
        |
   Não  |  Sim
        |    |
   [RETURN]  v
         Evento está inscrito?
              |
         Não  |  Sim
              |    |
         [RETURN]  v
               URL é HTTPS?
                    |
               Não  |  Sim
                    |    |
              [LOG ERRO] v
              [RETURN]   Tenta enviar
                              |
                    Sucesso   |   Falha
                              |     |
                     [RETURN] | [LOG ERRO]
                              | [RETURN]
```

### Arquivo Modificado

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-webhook/index.ts` | Condicionar log apenas para falhas |

