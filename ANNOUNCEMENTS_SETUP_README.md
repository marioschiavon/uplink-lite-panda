# 📢 Sistema de Anúncios - Setup Completo

Sistema completo de notificações para Superadmin com in-app notifications e envio de emails via Resend.

## 🚀 Setup Passo-a-Passo

### 1️⃣ **EXECUTAR MIGRATION** (OBRIGATÓRIO)

Os erros de build vão desaparecer após executar esta etapa!

1. Acesse o SQL Editor do Supabase:
   👉 https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/sql/new

2. Copie e execute todo o conteúdo do arquivo `ANNOUNCEMENTS_SYSTEM.sql`

3. Aguarde a execução completa da migration

4. **Reinicie o dev server** (os erros de TypeScript vão desaparecer automaticamente)

### 2️⃣ Configuração Resend

✅ Já configurado! O `RESEND_API_KEY` foi adicionado aos secrets.

**Importante**: Certifique-se de que:
- Você tem uma conta no [Resend](https://resend.com)
- Validou o domínio de envio em: https://resend.com/domains
- O API key está ativo em: https://resend.com/api-keys

### 3️⃣ Edge Function Deployment

A edge function `send-announcement-email` será deployada automaticamente junto com o próximo build.

Após o deploy, você pode visualizar os logs em:
👉 https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/functions/send-announcement-email/logs

---

## 📋 Funcionalidades Implementadas

### 🔔 **Fase 1: In-App Notifications**

**Para todos os usuários:**
- Banner de anúncios no topo do Dashboard
- Notificações permanecem até serem dispensadas
- Polling automático a cada 30 segundos
- Suporte para 4 tipos: info, warning, success, error
- Expiração automática de anúncios (opcional)

**Para superadmins:**
- Painel de gerenciamento de anúncios
- Criação, visualização e exclusão de anúncios
- Estatísticas de visualização por anúncio
- Status de ativo/inativo

### 📧 **Fase 2: Email via Resend**

**Funcionalidades:**
- Envio de emails para todos os usuários cadastrados
- Templates HTML responsivos e estilizados
- Assunto personalizável (ou usa o título do anúncio)
- Log completo de envios (sucesso/falha)
- Estatísticas de emails enviados por anúncio

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

#### `announcements`
- Armazena todos os anúncios criados
- Campos: title, message, type, send_email, email_subject, expires_at, is_active
- RLS: Superadmins gerenciam, usuários visualizam apenas ativos

#### `announcement_reads`
- Registra quando um usuário visualiza/dispensa um anúncio
- Previne exibição repetida do mesmo anúncio
- RLS: Usuários gerenciam próprias leituras

#### `announcement_email_logs`
- Log completo de todos os emails enviados
- Rastreamento de falhas e erros
- RLS: Apenas superadmins visualizam

---

## 💻 Componentes Frontend

### `AnnouncementBanner` (Todos os usuários)
- Exibido no topo do Dashboard
- Busca anúncios ativos e não lidos
- Permite dispensar anúncios individuais
- Auto-atualiza a cada 30 segundos

### `AnnouncementManager` (Superadmins)
- Painel completo de gerenciamento
- Lista todos os anúncios (ativos e inativos)
- Estatísticas de visualização e emails
- Exclusão de anúncios

### `CreateAnnouncementModal` (Superadmins)
- Modal para criar novos anúncios
- Opção de envio de email
- Configuração de expiração
- Validação de campos

---

## 🔐 Segurança

### RLS (Row-Level Security)
✅ Todas as tabelas têm RLS habilitado

**Políticas implementadas:**
- Superadmins: Acesso total a todos os anúncios e logs
- Usuários comuns: Apenas visualização de anúncios ativos
- Isolamento de leituras por usuário
- Logs de email visíveis apenas para superadmins

### Edge Function
- Requer JWT authentication (`verify_jwt: true`)
- Validação de role superadmin antes de enviar emails
- Service role key usado apenas no backend

---

## 📊 Como Usar

### Para Superadmins:

1. **Criar um novo anúncio:**
   - Acesse o Dashboard
   - Clique em "Novo Anúncio" no painel de gerenciamento
   - Preencha título, mensagem e tipo
   - (Opcional) Ative "Enviar por Email"
   - (Opcional) Configure dias de expiração
   - Clique em "Criar Anúncio"

2. **Visualizar estatísticas:**
   - Veja quantas pessoas visualizaram cada anúncio
   - Acompanhe status de envio de emails
   - Identifique falhas de envio

3. **Excluir anúncios:**
   - Clique no ícone de lixeira no anúncio
   - Confirme a exclusão

### Para Usuários:

1. **Visualizar anúncios:**
   - Anúncios aparecem automaticamente no topo do Dashboard
   - Cores diferentes indicam tipo (info/warning/success/error)

2. **Dispensar anúncios:**
   - Clique no "X" no canto superior direito do anúncio
   - O anúncio não aparecerá novamente

---

## 🔗 Links Úteis

- **Supabase SQL Editor:** https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/sql/new
- **Edge Functions:** https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/functions
- **Edge Function Logs:** https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/functions/send-announcement-email/logs
- **Secrets Management:** https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/settings/functions
- **Resend Dashboard:** https://resend.com/domains

---

## 🐛 Troubleshooting

### Erros de TypeScript
**Causa:** Tabelas ainda não criadas no banco
**Solução:** Execute a migration `ANNOUNCEMENTS_SYSTEM.sql` e reinicie o dev server

### Emails não são enviados
**Verificar:**
1. RESEND_API_KEY configurado corretamente
2. Domínio validado no Resend
3. Logs da edge function: https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/functions/send-announcement-email/logs

### Anúncios não aparecem
**Verificar:**
1. Anúncio está marcado como `is_active = true`
2. Anúncio não está expirado (`expires_at`)
3. Usuário já não visualizou/dispensou o anúncio

---

## 📈 Próximos Passos (Futuro)

- [ ] Integração com WhatsApp via API existente
- [ ] Agendamento de anúncios
- [ ] Segmentação de audiência (enviar para grupos específicos)
- [ ] Rich text editor para mensagens
- [ ] Anexos em emails
- [ ] Notificações push (PWA)

---

**🎉 Sistema pronto para uso!** Execute a migration e comece a enviar anúncios aos usuários.
