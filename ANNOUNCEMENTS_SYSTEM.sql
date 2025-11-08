-- Sistema de Anúncios para Superadmin
-- Fase 1: In-App Notifications + Fase 2: Email via Resend

-- Criar tabela de anúncios
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  send_email boolean DEFAULT false,
  email_subject text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Criar tabela de leituras de anúncios
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  read_at timestamp with time zone DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Criar tabela de logs de email
CREATE TABLE IF NOT EXISTS public.announcement_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  user_email text NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  error_message text
);

-- Habilitar RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_email_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para announcements
DROP POLICY IF EXISTS "Superadmins manage announcements" ON public.announcements;
CREATE POLICY "Superadmins manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'superadmin'::user_role)
WITH CHECK (get_user_role(auth.uid()) = 'superadmin'::user_role);

DROP POLICY IF EXISTS "Users view active announcements" ON public.announcements;
CREATE POLICY "Users view active announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Políticas para announcement_reads
DROP POLICY IF EXISTS "Users manage own reads" ON public.announcement_reads;
CREATE POLICY "Users manage own reads"
ON public.announcement_reads FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Superadmins view all reads" ON public.announcement_reads;
CREATE POLICY "Superadmins view all reads"
ON public.announcement_reads FOR SELECT
TO authenticated
USING (get_user_role(auth.uid()) = 'superadmin'::user_role);

-- Políticas para announcement_email_logs
DROP POLICY IF EXISTS "Superadmins view email logs" ON public.announcement_email_logs;
CREATE POLICY "Superadmins view email logs"
ON public.announcement_email_logs FOR SELECT
TO authenticated
USING (get_user_role(auth.uid()) = 'superadmin'::user_role);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON public.announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement ON public.announcement_reads(announcement_id);
