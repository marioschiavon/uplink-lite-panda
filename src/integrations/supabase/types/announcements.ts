// Tipos estendidos para as tabelas de anúncios
// Estes tipos complementam os tipos gerados automaticamente

export interface AnnouncementRow {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  send_email: boolean | null;
  email_subject: string | null;
  recipient_type?: "all" | "specific";
  recipient_emails?: string | null;
  created_by: string | null;
  created_at: string | null;
  expires_at: string | null;
  is_active: boolean | null;
}

export interface AnnouncementInsert {
  id?: string;
  title: string;
  message: string;
  type?: string;
  send_email?: boolean | null;
  email_subject?: string | null;
  recipient_type?: "all" | "specific";
  recipient_emails?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean | null;
}

export interface AnnouncementReadRow {
  id: string;
  announcement_id: string;
  user_id: string;
  read_at: string | null;
}

export interface AnnouncementReadInsert {
  id?: string;
  announcement_id: string;
  user_id: string;
  read_at?: string | null;
}

export interface AnnouncementEmailLogRow {
  id: string;
  announcement_id: string;
  user_email: string;
  sent_at: string | null;
  status: string;
  error_message: string | null;
}
