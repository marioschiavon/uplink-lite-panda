-- =====================================================
-- MIGRAÇÃO: Centralizar Sessões na Tabela sessions
-- =====================================================

-- PASSO 1: Adicionar campos à tabela sessions
-- ----------------------------------------------------

ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS api_session TEXT,
ADD COLUMN IF NOT EXISTS api_token TEXT,
ADD COLUMN IF NOT EXISTS api_token_full TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- PASSO 2: Adicionar índices para performance
-- ----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_sessions_organization_id ON public.sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_api_session ON public.sessions(api_session);

-- PASSO 3: Adicionar trigger para updated_at
-- ----------------------------------------------------

DROP TRIGGER IF EXISTS set_sessions_updated_at ON public.sessions;

CREATE TRIGGER set_sessions_updated_at 
  BEFORE UPDATE ON public.sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

-- PASSO 4: Adicionar comentários
-- ----------------------------------------------------

COMMENT ON COLUMN public.sessions.api_session IS 'Nome/identificador da sessão usado na API externa';
COMMENT ON COLUMN public.sessions.api_token IS 'Token de autenticação da sessão';
COMMENT ON COLUMN public.sessions.api_token_full IS 'Token completo no formato session:token';

-- PASSO 5: Migrar dados existentes de organizations para sessions
-- ----------------------------------------------------

-- Apenas migrar organizações que têm sessões ativas
INSERT INTO public.sessions (
  organization_id,
  name,
  api_session,
  api_token,
  api_token_full,
  status,
  created_at,
  updated_at
)
SELECT 
  id as organization_id,
  api_session as name,
  api_session,
  api_token,
  api_token_full,
  CASE 
    WHEN api_session IS NOT NULL THEN 'active'
    ELSE 'inactive'
  END as status,
  created_at,
  NOW() as updated_at
FROM public.organizations
WHERE api_session IS NOT NULL
ON CONFLICT DO NOTHING;

-- PASSO 6: Criar/Atualizar políticas RLS para sessions
-- ----------------------------------------------------

-- Remover políticas antigas se existirem (para recriar)
DROP POLICY IF EXISTS "Users can view sessions in their org" ON public.sessions;
DROP POLICY IF EXISTS "Admins can manage sessions in their org" ON public.sessions;
DROP POLICY IF EXISTS "Service role can manage all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Superadmin can view all sessions" ON public.sessions;

-- Permitir usuários visualizarem sessões de sua organização
CREATE POLICY "Users can view sessions in their org"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization(auth.uid())
);

-- Permitir admins gerenciarem sessões em sua organização
CREATE POLICY "Admins can manage sessions in their org"
ON public.sessions
FOR ALL
TO authenticated
USING (
  organization_id = get_user_organization(auth.uid())
  AND get_user_role(auth.uid()) = 'admin'::user_role
)
WITH CHECK (
  organization_id = get_user_organization(auth.uid())
);

-- Permitir service_role (edge functions) gerenciar todas as sessões
CREATE POLICY "Service role can manage all sessions"
ON public.sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Permitir superadmin visualizar todas as sessões
CREATE POLICY "Superadmin can view all sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  is_superadmin()
);

-- PASSO 7: Verificação final
-- ----------------------------------------------------

-- Mostrar contagem de sessões migradas
SELECT 
  'Sessões migradas' as tipo,
  COUNT(*) as total,
  COUNT(DISTINCT organization_id) as organizacoes_distintas
FROM public.sessions
WHERE api_session IS NOT NULL;

-- Mostrar sessões criadas
SELECT 
  s.id,
  s.name,
  s.api_session,
  o.name as organization_name,
  s.created_at,
  s.updated_at
FROM public.sessions s
JOIN public.organizations o ON s.organization_id = o.id
WHERE s.api_session IS NOT NULL
ORDER BY s.created_at DESC;
