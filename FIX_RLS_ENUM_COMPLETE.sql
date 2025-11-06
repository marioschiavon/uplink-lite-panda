-- ================================================
-- FIX RLS ENUM COMPLETE
-- Corrige função get_user_role() e políticas RLS
-- ================================================

-- 1. CORRIGIR FUNÇÃO get_user_role() PARA RETORNAR ENUM
-- ================================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role  -- MUDANÇA: era 'text', agora é 'user_role'
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- 2. RECRIAR POLÍTICAS RLS COM COMPARAÇÕES CORRETAS
-- ================================================

-- 2.1. Tabela contacts - Policy DELETE
DROP POLICY IF EXISTS "contacts_delete_admin_same_org" ON public.contacts;

CREATE POLICY "contacts_delete_admin_same_org"
  ON public.contacts
  FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization(auth.uid()) 
    AND get_user_role(auth.uid()) = 'admin'::user_role
  );

-- 2.2. Tabela conversations - Policy DELETE
DROP POLICY IF EXISTS "conv_delete_admin_same_org" ON public.conversations;

CREATE POLICY "conv_delete_admin_same_org"
  ON public.conversations
  FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization(auth.uid())
    AND get_user_role(auth.uid()) = 'admin'::user_role
  );

-- 2.3. Tabela organizations - Policy ALL (Superadmin)
DROP POLICY IF EXISTS "Superadmins have full access" ON public.organizations;

CREATE POLICY "Superadmins have full access"
  ON public.organizations
  FOR ALL
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'superadmin'::user_role
  )
  WITH CHECK (
    get_user_role(auth.uid()) = 'superadmin'::user_role
  );

-- 2.4. Tabela tickets - Policy DELETE
DROP POLICY IF EXISTS "tickets_delete_admin_same_org" ON public.tickets;

CREATE POLICY "tickets_delete_admin_same_org"
  ON public.tickets
  FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization(auth.uid())
    AND get_user_role(auth.uid()) = 'admin'::user_role
  );

-- 3. HABILITAR RLS NAS TABELAS SEM PROTEÇÃO
-- ================================================
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. QUERIES DE VALIDAÇÃO
-- ================================================
-- Execute estas queries após aplicar o script para validar

-- Teste 1: Verificar tipo de retorno da função
-- SELECT 
--   routine_name,
--   data_type as return_type
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
--   AND routine_name = 'get_user_role';
-- Esperado: return_type = 'USER-DEFINED'

-- Teste 2: Testar a função com seu usuário
-- SELECT 
--   auth.uid() as current_user_id,
--   get_user_role(auth.uid()) as user_role,
--   pg_typeof(get_user_role(auth.uid())) as role_type;
-- Esperado: user_role = 'superadmin', role_type = 'user_role'

-- Teste 3: Verificar acesso do superadmin
-- SELECT 
--   id,
--   name,
--   api_session,
--   api_token
-- FROM organizations
-- WHERE id = get_user_organization(auth.uid());
-- Esperado: retorna a organização do usuário
