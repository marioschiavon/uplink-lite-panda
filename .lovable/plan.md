
# Painel Admin Profissional para Superadmins

## Problema Atual

O superadmin compartilha o mesmo layout e dashboard do cliente, com apenas 2 itens extras no menu lateral (Anuncios e Monitoramento). Nao existe uma visao administrativa real com metricas globais, gestao de usuarios/organizacoes e controle do sistema.

## Solucao

Criar um painel admin dedicado com dashboard proprio, paginas de gestao e rotas separadas, mantendo o layout existente com sidebar mas com conteudo completamente diferente para superadmins.

## Arquitetura

O superadmin continuara usando o mesmo `ProtectedLayout` com `AppSidebar`, mas:
- O sidebar mostrara itens diferentes quando for superadmin
- Novas paginas admin serao criadas em `/admin/*`
- O dashboard do superadmin sera redirecionado para `/admin`

## Novas Paginas

### 1. Admin Dashboard (`/admin`) - Visao Geral do Sistema

Cards de metricas globais:
- Total de organizacoes (3 atualmente)
- Total de usuarios (3 atualmente)
- Total de sessoes (3 atualmente)
- Receita mensal (assinaturas ativas x valor)
- Sessoes online vs offline (reutilizar logica do Monitoramento)
- Assinaturas por status (active, past_due, pending, cancelled)

Secoes:
- Grafico de crescimento (novos usuarios/sessoes por mes usando Recharts)
- Ultimas atividades (ultimos usuarios criados, ultimas sessoes, ultimos pagamentos)
- Alertas do sistema (sessoes offline, pagamentos falhos, assinaturas vencidas)

### 2. Gestao de Organizacoes (`/admin/organizations`)

Tabela com todas as organizacoes mostrando:
- Nome
- Plano (starter, pro, etc)
- Numero de sessoes
- Numero de usuarios
- Status da assinatura
- Data de criacao
- Acoes: ver detalhes, editar plano, marcar como legacy

Modal de detalhes da organizacao com:
- Informacoes completas
- Lista de sessoes da org
- Lista de usuarios da org
- Historico de assinaturas

### 3. Gestao de Usuarios (`/admin/users`)

Tabela com todos os usuarios mostrando:
- Nome/Email
- Organizacao vinculada
- Role (admin, agent, superadmin)
- Data de criacao
- Status (ativo/inativo baseado no ultimo acesso)

### 4. Gestao de Assinaturas (`/admin/subscriptions`)

Tabela global de todas as assinaturas:
- Organizacao
- Sessao vinculada
- Status
- Valor
- Provedor (Stripe/MercadoPago)
- Proxima cobranca
- Acoes: ver no Stripe

### 5. Mover paginas existentes

- Monitoramento: mover de `/monitoring` para `/admin/monitoring`
- Anuncios: mover de `/announcements` para `/admin/announcements`

## Mudancas no Sidebar

Quando o usuario for superadmin, o sidebar mostrara:

```text
ADMIN
  Dashboard Admin
  Organizacoes
  Usuarios
  Assinaturas
  Monitoramento
  Anuncios

FERRAMENTAS
  Documentacao API

CONTA
  Sair
```

O superadmin NAO vera mais o dashboard do cliente. Ao acessar `/dashboard`, sera redirecionado para `/admin`.

## Secao Tecnica

### Arquivos a criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/admin/AdminDashboard.tsx` | Dashboard com metricas globais e graficos |
| `src/pages/admin/AdminOrganizations.tsx` | Tabela de organizacoes + modal de detalhes |
| `src/pages/admin/AdminUsers.tsx` | Tabela de usuarios |
| `src/pages/admin/AdminSubscriptions.tsx` | Tabela global de assinaturas |

### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/layout/AppSidebar.tsx` | Menu condicional: items admin vs items cliente |
| `src/App.tsx` | Adicionar rotas `/admin/*` dentro do ProtectedLayout |
| `src/pages/Dashboard.tsx` | Redirecionar superadmin para `/admin` |

### Rotas novas (dentro do ProtectedLayout)

```typescript
<Route path="/admin" element={<AdminDashboard />} />
<Route path="/admin/organizations" element={<AdminOrganizations />} />
<Route path="/admin/users" element={<AdminUsers />} />
<Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
<Route path="/admin/monitoring" element={<SessionMonitoring />} />
<Route path="/admin/announcements" element={<Announcements />} />
```

### Queries do Admin Dashboard

O dashboard admin usara queries diretas ao Supabase (o superadmin ja tem acesso total via RLS):

```typescript
// Total orgs
const { count } = await supabase.from('organizations').select('*', { count: 'exact', head: true });

// Total users  
const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });

// Total sessions
const { count } = await supabase.from('sessions').select('*', { count: 'exact', head: true });

// Subscriptions by status
const { data } = await supabase.from('subscriptions').select('status, amount');

// Recent users
const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5);
```

### Protecao das rotas admin

Cada pagina admin verificara se o usuario e superadmin (mesma logica ja usada em `SessionMonitoring` e `Announcements`), redirecionando para `/dashboard` se nao for.

### Nao requer migracoes

Todas as tabelas e RLS policies necessarias ja existem. O superadmin ja tem acesso total via `is_superadmin()` e policies existentes.

## Ordem de Implementacao

1. Criar `AdminDashboard.tsx` com metricas globais e graficos
2. Criar `AdminOrganizations.tsx` com tabela e modal de detalhes
3. Criar `AdminUsers.tsx` com tabela de usuarios
4. Criar `AdminSubscriptions.tsx` com tabela global
5. Atualizar `AppSidebar.tsx` com menu condicional
6. Atualizar `App.tsx` com novas rotas
7. Atualizar `Dashboard.tsx` para redirecionar superadmin
8. Mover rotas de `/monitoring` e `/announcements` para `/admin/*`
