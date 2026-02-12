

# Corrigir acesso do superadmin a tabela subscriptions

## Problema

Todas as queries de subscriptions retornam arrays vazios (`[]`) no painel admin. A tabela `subscriptions` nao possui policy de SELECT para superadmins.

Policies atuais da tabela `subscriptions`:
- **SELECT**: apenas `organization_id = get_user_organization(auth.uid())` (filtra pela org do usuario)
- **INSERT**: `true` (service role)
- **UPDATE**: `true` (service role)
- Nenhuma policy para superadmin

O superadmin (contato@upevolution.com.br) pertence a uma organizacao diferente das que possuem assinaturas, entao a policy de SELECT nao retorna nada.

## Solucao

Criar uma RLS policy que permita ao superadmin fazer SELECT em todas as subscriptions:

```sql
CREATE POLICY "Superadmins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (is_superadmin());
```

## Resultado esperado

Apos a migracao:
- **Card Receita Mensal**: mostrara R$ 124.80 (54.90 + 69.90)
- **Grafico Assinaturas por Status**: mostrara 2 assinaturas "active"
- **Ultimas Assinaturas**: mostrara as 2 assinaturas com nome da org e valor

## Secao tecnica

### Arquivo modificado

Nenhum arquivo de codigo precisa ser alterado. Apenas uma migracao SQL e necessaria.

### Migracao

Uma unica policy RLS na tabela `subscriptions` usando a funcao `is_superadmin()` que ja existe no banco.

### Por que nao precisa alterar codigo

O codigo do `AdminDashboard.tsx` ja esta correto — as queries estao buscando os dados certos. O problema e exclusivamente de permissao no banco de dados.

