import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import type { AnnouncementInsert, AnnouncementRow } from "@/integrations/supabase/types/announcements";

interface CreateAnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateAnnouncementModal = ({ open, onOpenChange, onSuccess }: CreateAnnouncementModalProps) => {
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "success" | "error",
    sendEmail: false,
    emailSubject: "",
    expiresInDays: "",
    recipientType: "all" as "all" | "specific",
    recipientEmails: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Não autenticado");

      // Calcular data de expiração
      let expiresAt = null;
      if (formData.expiresInDays) {
        const days = parseInt(formData.expiresInDays);
        if (!isNaN(days) && days > 0) {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + days);
        }
      }

      // Criar anúncio
      const { data: announcement, error: createError } = await (supabase as any)
        .from("announcements")
        .insert({
          title: formData.title,
          message: formData.message,
          type: formData.type,
          send_email: formData.sendEmail,
          email_subject: formData.sendEmail ? (formData.emailSubject || formData.title) : null,
          recipient_type: formData.sendEmail ? formData.recipientType : 'all',
          recipient_emails: formData.sendEmail && formData.recipientType === 'specific' 
            ? formData.recipientEmails 
            : null,
          created_by: user.user.id,
          expires_at: expiresAt?.toISOString() || null,
        })
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: "Anúncio criado!",
        description: "O anúncio foi publicado com sucesso.",
      });

      // Enviar emails se solicitado
      if (formData.sendEmail && announcement) {
        setSendingEmail(true);
        
        const { error: emailError } = await supabase.functions.invoke("send-announcement-email", {
          body: { announcementId: announcement.id },
        });

        if (emailError) {
          console.error("Erro ao enviar emails:", emailError);
          toast({
            title: "Aviso",
            description: "Anúncio criado, mas houve erro ao enviar alguns emails.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Emails enviados!",
            description: "Os emails foram enviados para todos os usuários.",
          });
        }
      }

      // Resetar formulário
      setFormData({
        title: "",
        message: "",
        type: "info",
        sendEmail: false,
        emailSubject: "",
        expiresInDays: "",
        recipientType: "all",
        recipientEmails: "",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao criar anúncio:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o anúncio",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSendingEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Anúncio</DialogTitle>
          <DialogDescription>
            Envie uma notificação para todos os usuários do sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Manutenção programada"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Descreva a notificação..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Informação</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro/Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresInDays">Expira em (dias)</Label>
            <Input
              id="expiresInDays"
              type="number"
              min="1"
              value={formData.expiresInDays}
              onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
              placeholder="Deixe vazio para não expirar"
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-4">
            <div className="space-y-0.5">
              <Label htmlFor="sendEmail">Enviar por Email</Label>
              <p className="text-sm text-muted-foreground">
                Enviar notificação por email para todos os usuários
              </p>
            </div>
            <Switch
              id="sendEmail"
              checked={formData.sendEmail}
              onCheckedChange={(checked) => setFormData({ ...formData, sendEmail: checked })}
            />
          </div>

          {formData.sendEmail && (
            <>
              <div className="space-y-2">
                <Label htmlFor="emailSubject">Assunto do Email (opcional)</Label>
                <Input
                  id="emailSubject"
                  placeholder="Se vazio, usará o título do anúncio"
                  value={formData.emailSubject}
                  onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Enviar para</Label>
                <Select
                  value={formData.recipientType}
                  onValueChange={(value: "all" | "specific") => 
                    setFormData({ ...formData, recipientType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    <SelectItem value="specific">Emails específicos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.recipientType === "specific" && (
                <div className="space-y-2">
                  <Label htmlFor="recipientEmails">
                    Emails dos destinatários
                    <span className="text-xs text-muted-foreground ml-2">
                      (separados por vírgula)
                    </span>
                  </Label>
                  <Textarea
                    id="recipientEmails"
                    placeholder="usuario1@exemplo.com, usuario2@exemplo.com"
                    value={formData.recipientEmails}
                    onChange={(e) => setFormData({ ...formData, recipientEmails: e.target.value })}
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite os emails separados por vírgula. Emails inválidos serão ignorados.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>ℹ️ Envio controlado:</strong> Os emails serão enviados com intervalo de 1 segundo entre cada um para evitar sobrecarga.
                  {formData.recipientType === "all" && " Pode levar alguns minutos para enviar a todos."}
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || sendingEmail}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || sendingEmail}
              className="flex-1"
            >
              {sendingEmail ? (
                <>
                  <Send className="mr-2 h-4 w-4 animate-pulse" />
                  Enviando emails...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Anúncio"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
