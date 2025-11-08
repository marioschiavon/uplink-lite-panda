import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreateAnnouncementModal } from "./CreateAnnouncementModal";
import { Plus, Trash2, Mail, Eye, Calendar } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  send_email: boolean;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface AnnouncementStats {
  totalReads: number;
  emailsSent: number;
  emailsFailed: number;
}

export const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<Record<string, AnnouncementStats>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAnnouncements(data || []);

      // Buscar estatísticas para cada anúncio
      for (const announcement of data || []) {
        await fetchAnnouncementStats(announcement.id);
      }
    } catch (error: any) {
      console.error("Erro ao buscar anúncios:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os anúncios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncementStats = async (announcementId: string) => {
    try {
      const [readsResult, emailsResult] = await Promise.all([
        supabase
          .from("announcement_reads")
          .select("id", { count: "exact" })
          .eq("announcement_id", announcementId),
        supabase
          .from("announcement_email_logs")
          .select("status")
          .eq("announcement_id", announcementId),
      ]);

      const totalReads = readsResult.count || 0;
      const emailsSent = emailsResult.data?.filter(e => e.status === "sent").length || 0;
      const emailsFailed = emailsResult.data?.filter(e => e.status === "failed").length || 0;

      setStats(prev => ({
        ...prev,
        [announcementId]: { totalReads, emailsSent, emailsFailed },
      }));
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Anúncio excluído",
        description: "O anúncio foi removido com sucesso",
      });

      fetchAnnouncements();
    } catch (error: any) {
      console.error("Erro ao excluir anúncio:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o anúncio",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      info: { variant: "default", label: "Info" },
      warning: { variant: "secondary", label: "Aviso" },
      success: { variant: "default", label: "Sucesso" },
      error: { variant: "destructive", label: "Urgente" },
    };

    const config = variants[type] || variants.info;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Carregando anúncios...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Anúncios</CardTitle>
              <CardDescription>
                Envie notificações e atualizações para todos os usuários
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Anúncio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum anúncio criado ainda</p>
              <p className="text-sm mt-2">Crie seu primeiro anúncio para notificar os usuários</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        {getTypeBadge(announcement.type)}
                        {!announcement.is_active && (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {announcement.message}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(announcement.id)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{stats[announcement.id]?.totalReads || 0} visualizações</span>
                    </div>
                    {announcement.send_email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>
                          {stats[announcement.id]?.emailsSent || 0} emails enviados
                          {(stats[announcement.id]?.emailsFailed || 0) > 0 && (
                            <span className="text-destructive">
                              {" "}({stats[announcement.id]?.emailsFailed} falhas)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(announcement.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {announcement.expires_at && (
                      <span className="text-xs">
                        Expira: {new Date(announcement.expires_at).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAnnouncementModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={fetchAnnouncements}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O anúncio será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
