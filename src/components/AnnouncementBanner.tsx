import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { X, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  created_at: string;
  expires_at: string | null;
}

export const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
    
    // Polling a cada 30 segundos
    const interval = setInterval(fetchAnnouncements, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Buscar anúncios ativos
      const { data: activeAnnouncements, error: announcementsError } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });

      if (announcementsError) throw announcementsError;

      // Buscar anúncios já lidos
      const { data: reads, error: readsError } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("user_id", user.user.id);

      if (readsError) throw readsError;

      const readIds = reads?.map(r => r.announcement_id) || [];
      
      // Filtrar anúncios não lidos
      const unreadAnnouncements = activeAnnouncements?.filter(
        a => !readIds.includes(a.id) && !dismissedIds.includes(a.id)
      ) || [];

      setAnnouncements(unreadAnnouncements);
    } catch (error: any) {
      console.error("Erro ao buscar anúncios:", error);
    }
  };

  const markAsRead = async (announcementId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase.from("announcement_reads").insert({
        announcement_id: announcementId,
        user_id: user.user.id,
      });

      setDismissedIds(prev => [...prev, announcementId]);
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    } catch (error: any) {
      console.error("Erro ao marcar como lido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o anúncio como lido",
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "error":
        return <XCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getVariant = (type: string): "default" | "destructive" => {
    return type === "error" ? "destructive" : "default";
  };

  if (announcements.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {announcements.map((announcement) => (
        <Alert key={announcement.id} variant={getVariant(announcement.type)}>
          <div className="flex items-start gap-3">
            {getIcon(announcement.type)}
            <div className="flex-1">
              <AlertTitle className="mb-2">{announcement.title}</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap">
                {announcement.message}
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => markAsRead(announcement.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};
