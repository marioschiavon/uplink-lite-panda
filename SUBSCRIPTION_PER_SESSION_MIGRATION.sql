-- ============================================================================
-- MIGRAÇÃO: Sistema de Assinaturas por Sessão
-- Data: 2025-11-11
-- Descrição: Implementa modelo onde cada sessão tem assinatura independente
--            e protege clientes legacy (anteriores a esta migração)
-- ============================================================================

-- FASE 1: Adicionar colunas necessárias
-- ============================================================================

-- 1.1 Adicionar flag is_legacy na tabela organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.organizations.is_legacy IS 'Clientes antigos que não precisam pagar por sessão (criados antes de 11/11/2025)';

-- 1.2 Adicionar flag requires_subscription na tabela sessions
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS requires_subscription BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.sessions.requires_subscription IS 'Se TRUE, sessão precisa de assinatura ativa para funcionar';

-- 1.3 Adicionar vinculação session_id na tabela subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.subscriptions.session_id IS 'Assinatura vinculada a uma sessão específica (cada sessão = uma assinatura)';


-- FASE 2: Criar índices para performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_session 
ON public.subscriptions(session_id);

CREATE INDEX IF NOT EXISTS idx_organizations_is_legacy 
ON public.organizations(is_legacy);

CREATE INDEX IF NOT EXISTS idx_sessions_requires_subscription 
ON public.sessions(requires_subscription);


-- FASE 3: Proteger usuários e sessões existentes (LEGACY)
-- ============================================================================

-- 3.1 Marcar todas as organizações criadas até hoje como LEGACY
UPDATE public.organizations 
SET is_legacy = TRUE 
WHERE created_at < NOW() 
  AND is_legacy = FALSE;

-- 3.2 Liberar todas as sessões existentes (não precisam de assinatura)
UPDATE public.sessions 
SET requires_subscription = FALSE 
WHERE created_at < NOW() 
  AND requires_subscription = TRUE;

-- Log das mudanças
DO $$
DECLARE
  legacy_orgs_count INTEGER;
  legacy_sessions_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO legacy_orgs_count 
  FROM public.organizations 
  WHERE is_legacy = TRUE;
  
  SELECT COUNT(*) INTO legacy_sessions_count 
  FROM public.sessions 
  WHERE requires_subscription = FALSE;
  
  RAISE NOTICE '✅ Migração concluída:';
  RAISE NOTICE '   - % organizações marcadas como LEGACY', legacy_orgs_count;
  RAISE NOTICE '   - % sessões liberadas (sem cobrança)', legacy_sessions_count;
END $$;


-- FASE 4: Atualizar políticas RLS (se necessário)
-- ============================================================================

-- As políticas existentes já cobrem as novas colunas
-- Nenhuma mudança necessária em RLS


-- FASE 5: Verificações finais
-- ============================================================================

-- Verificar estrutura
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('organizations', 'sessions', 'subscriptions')
  AND column_name IN ('is_legacy', 'requires_subscription', 'session_id')
ORDER BY table_name, ordinal_position;

-- Verificar dados legacy
SELECT 
  'Organizations LEGACY' as tipo,
  COUNT(*) as total
FROM public.organizations
WHERE is_legacy = TRUE

UNION ALL

SELECT 
  'Sessions sem cobrança' as tipo,
  COUNT(*) as total
FROM public.sessions
WHERE requires_subscription = FALSE;
