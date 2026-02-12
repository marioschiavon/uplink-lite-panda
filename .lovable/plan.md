
# Corrigir dados de assinatura no painel admin

## Problema

O painel admin usa o campo legado `organizations.subscription_status` para exibir o status das organizacoes, mas esse campo nao e atualizado corretamente. A fonte da verdade e a tabela `subscriptions`.

Dados atuais:
- **GTi Tecnologias**: `organizations.subscription_status = "inactive"` mas `subscriptions.status = "active"`
- **Groomer Genius**: `organizations.subscription_status = "inactive"` mas `subscriptions.status = "active"`

## Mudancas

### 1. AdminOrganizations.tsx

**Problema**: Busca `subscription_status` da tabela `organizations` (legado).

**Solucao**: Fazer JOIN com a tabela `subscriptions` para trazer o status real. Buscar as assinaturas da org e usar o status mais recente.

Mudanca na query:
```typescript
// Buscar orgs
const { data: orgsData } = await supabase
  .from("organizations")
  .select("id, name, plan, is_legacy, created_at, session_limit")
  .order("created_at", { ascending: false });

// Buscar todas as assinaturas (mais recente por org)
const { data: subsData } = await supabase
  .from("subscriptions")
  .select("organization_id, status, amount, plan_name")
  .order("created_at", { ascending: false });

// Mapear: para cada org, pegar o status da assinatura mais recente
```

Mudanca na interface `OrgRow`: remover `subscription_status` e adicionar `real_subscription_status` derivado de `subscriptions`.

Mudanca na tabela: a coluna "Status" mostra o status real da assinatura mais recente, ou "Sem assinatura" se nao houver.

Mudanca no modal de detalhes: remover referencia a `subscription_status` da org e mostrar o status derivado.

### 2. AdminDashboard.tsx

**Problema**: As metricas de receita e assinaturas ja estao corretas (buscam de `subscriptions`). Porem, nos cards de "Ultimas Assinaturas" nao mostra o nome da organizacao.

**Solucao**: Incluir o nome da organizacao no select das assinaturas recentes via JOIN:
```typescript
supabase.from("subscriptions")
  .select("id, status, amount, payment_provider, created_at, plan_name, organizations(name)")
```

E exibir o nome da org junto ao plano.

### 3. AdminSubscriptions.tsx

Ja esta correto - busca dados diretamente de `subscriptions` com JOIN para `organizations(name)` e `sessions(name)`.

## Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/admin/AdminOrganizations.tsx` | Buscar status real de `subscriptions` em vez de `organizations.subscription_status` |
| `src/pages/admin/AdminDashboard.tsx` | Incluir nome da org nas assinaturas recentes |

## Secao tecnica

### AdminOrganizations.tsx - Abordagem

1. Remover `subscription_status` do select de organizations
2. Buscar todas as subscriptions em paralelo: `supabase.from("subscriptions").select("organization_id, status")`
3. Criar um Map de `org_id -> status da assinatura mais recente`
4. Mapear cada org com seu status real
5. Atualizar a interface `OrgRow` para usar `realSubStatus` em vez de `subscription_status`
6. Atualizar o modal de detalhes para remover referencia ao campo legado

### AdminDashboard.tsx - Abordagem

1. No select de `recentSubs`, adicionar `organizations(name)` ao JOIN
2. Exibir `s.organizations?.name` no card de ultimas assinaturas

## Resultado

Todos os paineis admin mostrarao o status real das assinaturas (da tabela `subscriptions`), nao mais o campo legado da tabela `organizations`.
