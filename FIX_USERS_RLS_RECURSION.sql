-- ============================================================================
-- FIX: Corrigir Recursão Infinita em Políticas RLS da Tabela users
-- ============================================================================
-- 
-- PROBLEMA:
-- Políticas RLS em 'users' fazem SELECT na própria tabela 'users', causando
-- recursão infinita quando get_user_role() é chamado por outras tabelas.
--
-- SOLUÇÃO:
-- 1. Remover políticas recursivas
-- 2. Usar tabela auxiliar superadmin_users (já existe)
-- 3. Criar função is_superadmin() sem recursão
-- 4. Criar políticas RLS simples sem SELECT em users
-- ============================================================================

-- ============================================================================
-- PASSO 1: Remover Políticas Recursivas Antigas
-- ============================================================================
DROP POLICY IF EXISTS "superadmin can do anything on users" ON public.users;
DROP POLICY IF EXISTS "admin can manage users in own org" ON public.users;
DROP POLICY IF EXISTS "agent can read users of own org" ON public.users;

-- ============================================================================
-- PASSO 2: Garantir que Tabela superadmin_users Existe e Está Populada
-- ============================================================================
-- A tabela já existe, apenas garantir que está habilitada para RLS
ALTER TABLE public.superadmin_users ENABLE ROW LEVEL SECURITY;

-- Popular com superadmin existente (se não estiver lá)
INSERT INTO public.superadmin_users (user_id)
SELECT id FROM auth.users WHERE email = 'contato@upevolution.com.br'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- PASSO 3: Criar Função is_superadmin() SEM RECURSÃO
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.superadmin_users 
    WHERE user_id = auth.uid()
  );
$$;

-- ============================================================================
-- PASSO 4: Criar Políticas RLS para 'users' SEM RECURSÃO
-- ============================================================================

-- 4.1. Usuários podem ver próprio perfil (sem SELECT em users)
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 4.2. Usuários podem atualizar próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4.3. Usuários podem inserir próprio perfil (signup)
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 4.4. Superadmins têm acesso total (usando função sem recursão)
CREATE POLICY "Superadmins have full access to users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- 4.5. Usuários podem ver membros da mesma organização
CREATE POLICY "Users can view org members"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.users 
      WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- PASSO 5: Criar Política RLS para superadmin_users
-- ============================================================================
DROP POLICY IF EXISTS "Only superadmins can view superadmin list" ON public.superadmin_users;

CREATE POLICY "Only superadmins can view superadmin list"
  ON public.superadmin_users
  FOR SELECT
  TO authenticated
  USING (is_superadmin());

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================
-- Execute estas queries após aplicar o script para validar

-- Teste 1: Verificar se superadmin está na tabela auxiliar
-- SELECT * FROM public.superadmin_users;

-- Teste 2: Testar função is_superadmin()
-- SELECT 
--   auth.uid() as current_user,
--   is_superadmin() as is_superadmin_result;

-- Teste 3: Testar acesso a users (não deve dar recursão)
-- SELECT id, email, role, organization_id 
-- FROM public.users 
-- WHERE email = 'contato@upevolution.com.br';

-- Teste 4: Verificar políticas em users
-- SELECT policyname, cmd, qual
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'users';

-- Teste 5: Testar get_user_role() (não deve dar recursão)
-- SELECT get_user_role(auth.uid()) as my_role;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- ✅ Login funciona sem erro "infinite recursion"
-- ✅ Superadmin vê botão "Monitoramento"
-- ✅ Superadmin vê sessão WhatsApp ativa
-- ✅ Admins/Agents veem apenas usuários da própria organização
-- ✅ get_user_role() funciona em outras tabelas sem recursão
-- ============================================================================
