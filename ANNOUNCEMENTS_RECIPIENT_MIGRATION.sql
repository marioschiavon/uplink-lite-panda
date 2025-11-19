-- Adicionar campos para controle de destinatários de emails
-- Executar este SQL no Supabase SQL Editor

ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS recipient_type TEXT DEFAULT 'all' CHECK (recipient_type IN ('all', 'specific')),
ADD COLUMN IF NOT EXISTS recipient_emails TEXT;

COMMENT ON COLUMN announcements.recipient_type IS 'all = todos usuários, specific = emails específicos';
COMMENT ON COLUMN announcements.recipient_emails IS 'Lista de emails separados por vírgula (usado quando recipient_type=specific)';
