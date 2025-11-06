-- ============================================================================
-- FIX: Adicionar políticas RLS para tabela organizations
-- ============================================================================
-- 
-- PROBLEMA: A tabela organizations tem RLS habilitado mas sem políticas,
-- bloqueando todas as operações (SELECT, INSERT, UPDATE, DELETE)
--
-- SOLUÇÃO: Adicionar políticas que permitem:
-- 1. Usuários visualizarem sua própria organização
-- 2. Usuários atualizarem sua própria organização
-- 3. Superadmins terem acesso total
-- ============================================================================

-- Política: Usuários podem ver sua própria organização
CREATE POLICY "Users can view own organization"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id = get_user_organization(auth.uid())
  );

-- Política: Usuários podem atualizar sua própria organização
CREATE POLICY "Users can update own organization"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    id = get_user_organization(auth.uid())
  )
  WITH CHECK (
    id = get_user_organization(auth.uid())
  );

-- Política: Admins podem inserir em sua própria organização
CREATE POLICY "Admins can insert own organization"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = get_user_organization(auth.uid())
  );

-- Política: Superadmins têm acesso total
CREATE POLICY "Superadmins have full access"
  ON public.organizations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Execute esta query para verificar as políticas criadas:
-- 
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'organizations';
-- ============================================================================
