-- ============================================================================
-- MIGRAÇÃO: Sistema de Pagamentos Stripe
-- Data: 2025-11-19
-- Descrição: Adiciona suporte para Stripe junto com Mercado Pago
-- ============================================================================

-- FASE 1: Adicionar colunas para Stripe
-- ============================================================================

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe';

-- FASE 2: Criar índices para performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id 
ON subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id 
ON subscriptions(stripe_customer_id);

-- FASE 3: Adicionar comentários para documentação
-- ============================================================================

COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'ID da subscription no Stripe (sub_xxx)';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'ID do customer no Stripe (cus_xxx)';
COMMENT ON COLUMN subscriptions.payment_provider IS 'stripe ou mercadopago';

-- FASE 4: Marcar assinaturas existentes como Mercado Pago
-- ============================================================================

UPDATE subscriptions 
SET payment_provider = 'mercadopago' 
WHERE stripe_subscription_id IS NULL;

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
  AND table_name = 'subscriptions'
  AND column_name IN ('stripe_subscription_id', 'stripe_customer_id', 'payment_provider')
ORDER BY table_name, ordinal_position;

-- Log das mudanças
DO $$
DECLARE
  stripe_subs_count INTEGER;
  mp_subs_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO stripe_subs_count 
  FROM subscriptions 
  WHERE payment_provider = 'stripe';
  
  SELECT COUNT(*) INTO mp_subs_count 
  FROM subscriptions 
  WHERE payment_provider = 'mercadopago';
  
  RAISE NOTICE '✅ Migração Stripe concluída:';
  RAISE NOTICE '   - % assinaturas Stripe', stripe_subs_count;
  RAISE NOTICE '   - % assinaturas Mercado Pago', mp_subs_count;
END $$;
