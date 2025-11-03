-- ============================================================================
-- MIGRATION: Sistema de Assinaturas com Mercado Pago
-- ============================================================================
-- Este script deve ser executado no SQL Editor do Supabase
-- URL: https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/sql/new
-- ============================================================================

-- 1. Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Dados do Mercado Pago
  preapproval_id TEXT UNIQUE,
  payer_id TEXT,
  payer_email TEXT,
  
  -- Status e controle
  status TEXT NOT NULL DEFAULT 'pending',
  plan_name TEXT NOT NULL DEFAULT 'api_session',
  amount DECIMAL(10,2) NOT NULL DEFAULT 69.90,
  
  -- Datas importantes
  start_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  payment_method_id TEXT,
  external_reference TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_preapproval ON public.subscriptions(preapproval_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Criar policies de segurança
-- Usuários podem ver assinaturas da sua organização
CREATE POLICY "Users can view their organization subscriptions"
  ON public.subscriptions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  ));

-- Service role pode inserir assinaturas (via edge functions)
CREATE POLICY "Service role can insert subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (true);

-- Service role pode atualizar assinaturas (via webhooks)
CREATE POLICY "Service role can update subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (true);

-- 5. Adicionar trigger para updated_at
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 6. Adicionar colunas na tabela organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- 7. Criar índice para subscription_status
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status 
  ON public.organizations(subscription_status);

-- 8. Adicionar comentários para documentação
COMMENT ON TABLE public.subscriptions IS 'Gerenciamento de assinaturas do Mercado Pago';
COMMENT ON COLUMN public.organizations.subscription_status IS 'Status da assinatura: active, inactive, paused, cancelled';
COMMENT ON COLUMN public.organizations.subscription_expires_at IS 'Data de expiração/próximo pagamento da assinatura';

-- ============================================================================
-- VERIFICAÇÃO: Execute este query para confirmar que tudo foi criado
-- ============================================================================
-- SELECT 
--   table_name,
--   column_name,
--   data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name IN ('subscriptions', 'organizations')
-- ORDER BY table_name, ordinal_position;
-- ============================================================================
