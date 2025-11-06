-- ============================================================================
-- FIX: Corrigir Recursão Infinita em RLS e Políticas de Acesso
-- ============================================================================
-- 
-- PROBLEMAS:
-- 1. Funções get_user_organization() e get_user_role() causam recursão infinita
-- 2. Tabela users sem política INSERT (novos usuários não conseguem se registrar)
-- 3. Coluna role sem valor DEFAULT (novos usuários ficam com role NULL)
-- 4. Política RLS em organizations usando SELECT direto (causa recursão)
--
-- SOLUÇÕES:
-- 1. Adicionar SET search_path = public nas funções de segurança
-- 2. Criar política INSERT para tabela users
-- 3. Definir DEFAULT 'admin' para coluna role
-- 4. Recriar políticas usando funções SECURITY DEFINER corrigidas
-- ============================================================================

-- ============================================================================
-- PASSO 1: Corrigir função get_user_organization()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_organization(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.users WHERE id = user_id;
$$;

-- ============================================================================
-- PASSO 2: Corrigir função get_user_role()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.users WHERE id = user_id;
$$;

-- ============================================================================
-- PASSO 3: Adicionar valor DEFAULT para coluna role
-- ============================================================================
ALTER TABLE public.users 
ALTER COLUMN role SET DEFAULT 'admin'::user_role;

-- ============================================================================
-- PASSO 4: Corrigir usuários existentes com role NULL
-- ============================================================================
UPDATE public.users 
SET role = 'admin'::user_role 
WHERE role IS NULL;

-- ============================================================================
-- PASSO 5: Remover política antiga de superadmin em organizations (se existir)
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins have full access" ON public.organizations;

-- ============================================================================
-- PASSO 6: Recriar política de superadmin usando função corrigida
-- ============================================================================
CREATE POLICY "Superadmins have full access"
  ON public.organizations
  FOR ALL
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'superadmin'
  )
  WITH CHECK (
    get_user_role(auth.uid()) = 'superadmin'
  );

-- ============================================================================
-- PASSO 7: Adicionar política INSERT para tabela users
-- ============================================================================
-- Esta política já existe como "Allow insert for new users", mas vamos garantir
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;

CREATE POLICY "Allow insert for new users"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- VERIFICAÇÕES
-- ============================================================================
-- Execute estas queries para verificar as correções:
-- 
-- 1. Verificar funções:
-- SELECT routine_name, routine_definition 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('get_user_organization', 'get_user_role');
--
-- 2. Verificar coluna role:
-- SELECT column_name, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
-- AND table_name = 'users' 
-- AND column_name = 'role';
--
-- 3. Verificar políticas em organizations:
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'organizations';
--
-- 4. Verificar políticas em users:
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'users';
--
-- 5. Verificar usuários sem role NULL:
-- SELECT id, email, role FROM public.users WHERE role IS NULL;
-- ============================================================================
