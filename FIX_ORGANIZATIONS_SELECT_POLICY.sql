-- ============================================================================
-- FIX: Adicionar policy SELECT para usuários sem organização
-- ============================================================================
-- 
-- PROBLEMA: Após INSERT na organizations, o .select() falha porque
-- get_user_organization(auth.uid()) ainda retorna NULL (users.organization_id
-- só é atualizado depois do INSERT)
--
-- SOLUÇÃO: Permitir SELECT temporário para usuários sem organização
-- ============================================================================

-- Policy: Usuários sem organização podem ver orgs (para o fluxo de criação)
CREATE POLICY "Users can view orgs when creating"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    get_user_organization(auth.uid()) IS NULL
  );

-- ============================================================================
-- RESULTADO ESPERADO:
-- - Usuário novo consegue fazer INSERT na organizations
-- - Consegue fazer .select() imediatamente após (mesmo com organization_id NULL)
-- - Após atualizar users.organization_id, passa a usar policy "Users can view own organization"
-- ============================================================================
