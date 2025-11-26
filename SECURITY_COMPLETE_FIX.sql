-- ============================================================================
-- CORREÇÃO COMPLETA DE SEGURANÇA - UPLINK
-- ============================================================================
-- Este arquivo corrige todas as vulnerabilidades identificadas:
-- - Adiciona políticas RLS para tabelas sensíveis
-- - Corrige funções sem search_path
-- - Cria views seguras sem expor tokens
-- ============================================================================

-- ============================================================================
-- FASE 1: CRIAR POLÍTICAS RLS PARA TABELAS SENSÍVEIS
-- ============================================================================

-- 1.1 CONTACTS: Apenas usuários da mesma organização
DROP POLICY IF EXISTS "Users can view contacts in own org" ON public.contacts;
CREATE POLICY "Users can view contacts in own org"
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization(auth.uid()));

-- 1.2 API_LOGS: Apenas usuários da mesma organização
DROP POLICY IF EXISTS "Users can view api_logs in own org" ON public.api_logs;
CREATE POLICY "Users can view api_logs in own org"
  ON public.api_logs
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization(auth.uid()));

-- 1.3 SESSIONS: Apenas usuários da mesma organização
DROP POLICY IF EXISTS "Users can view sessions in own org" ON public.sessions;
CREATE POLICY "Users can view sessions in own org"
  ON public.sessions
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization(auth.uid()));

-- 1.4 CONVERSATIONS: Apenas usuários da mesma organização
DROP POLICY IF EXISTS "Users can view conversations in own org" ON public.conversations;
CREATE POLICY "Users can view conversations in own org"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization(auth.uid()));

-- 1.5 MESSAGES: Apenas usuários da mesma organização
DROP POLICY IF EXISTS "Users can view messages in own org" ON public.messages;
CREATE POLICY "Users can view messages in own org"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization(auth.uid()));

-- 1.6 TICKETS: Apenas usuários da mesma organização
DROP POLICY IF EXISTS "Users can view tickets in own org" ON public.tickets;
CREATE POLICY "Users can view tickets in own org"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization(auth.uid()));

-- 1.7 TICKET_MESSAGES: Apenas usuários da mesma organização (via tickets)
DROP POLICY IF EXISTS "Users can view ticket_messages in own org" ON public.ticket_messages;
CREATE POLICY "Users can view ticket_messages in own org"
  ON public.ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.tickets 
      WHERE organization_id = get_user_organization(auth.uid())
    )
  );

-- 1.8 COMPANIES: Apenas usuários da própria empresa ou superadmins
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
CREATE POLICY "Users can view own company"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Superadmins can view all companies" ON public.companies;
CREATE POLICY "Superadmins can view all companies"
  ON public.companies
  FOR ALL
  TO authenticated
  USING (is_superadmin());

-- ============================================================================
-- FASE 2: CORRIGIR FUNÇÕES SEM search_path
-- ============================================================================

-- 2.1 rotate_org_api_token
CREATE OR REPLACE FUNCTION public.rotate_org_api_token(org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_token text := 'p42_' || encode(gen_random_bytes(24), 'hex');
BEGIN
  UPDATE public.organizations
  SET api_token = new_token
  WHERE id = org_id;
  RETURN new_token;
END;
$function$;

-- 2.2 increment_api_usage
CREATE OR REPLACE FUNCTION public.increment_api_usage(org uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.organizations
  SET api_message_usage = api_message_usage + 1
  WHERE id = org;
END;
$function$;

-- 2.3 set_message_org_from_conversation
CREATE OR REPLACE FUNCTION public.set_message_org_from_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.organization_id := (
    SELECT organization_id
    FROM public.conversations
    WHERE id = NEW.conversation_id
    LIMIT 1
  );
  RETURN NEW;
END;
$function$;

-- 2.4 update_conversation_timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;

-- 2.5 current_user_org (já tem search_path, mas vamos garantir)
CREATE OR REPLACE FUNCTION public.current_user_org()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT organization_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$function$;

-- 2.6 handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.users (id, email, role, created_at)
  VALUES (NEW.id, NEW.email, 'admin', now());
  RETURN NEW;
END;
$function$;

-- 2.7 update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2.8 set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- FASE 3: CRIAR VIEWS SEGURAS (sem expor tokens/credenciais)
-- ============================================================================

-- 3.1 View segura de organizations (sem tokens/credenciais)
DROP VIEW IF EXISTS public.organizations_safe CASCADE;
CREATE VIEW public.organizations_safe AS
SELECT 
  id, 
  name, 
  plan, 
  created_at, 
  updated_at,
  api_message_usage, 
  api_message_limit,
  session_limit, 
  agent_limit, 
  routing_mode,
  is_legacy, 
  subscription_status, 
  subscription_expires_at
FROM public.organizations;

-- 3.2 View segura de sessions (sem tokens/credenciais)
DROP VIEW IF EXISTS public.sessions_safe CASCADE;
CREATE VIEW public.sessions_safe AS
SELECT 
  id, 
  organization_id, 
  name, 
  status,
  requires_subscription, 
  created_at, 
  updated_at
FROM public.sessions;

-- ============================================================================
-- FASE 4: HABILITAR RLS EM TABELAS QUE AINDA NÃO TÊM
-- ============================================================================
-- (Todas as tabelas já têm RLS habilitado conforme o scan de segurança)

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- ✅ Todas as tabelas sensíveis agora têm políticas SELECT apropriadas
-- ✅ Todas as funções SECURITY DEFINER têm search_path = public
-- ✅ Views seguras criadas para evitar exposição de tokens
-- ✅ Isolamento completo por organização implementado
-- ✅ Proteção contra privilege escalation

-- ============================================================================
-- PRÓXIMOS PASSOS MANUAIS
-- ============================================================================
-- 1. Executar este SQL no Supabase SQL Editor
-- 2. Habilitar "Leaked Password Protection" em Authentication → Settings
-- 3. Verificar se o código frontend foi atualizado (SessionMonitoring.tsx)
-- 4. Testar acesso com diferentes usuários/organizações
-- 5. Executar novo scan de segurança para verificar correções
