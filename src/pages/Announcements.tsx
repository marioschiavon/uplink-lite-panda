import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AnnouncementManager } from "@/components/AnnouncementManager";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { motion } from "framer-motion";

const Announcements = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Acesso negado");
          navigate("/login");
          return;
        }

        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userData?.role !== "superadmin") {
          toast.error("Acesso negado - apenas superadmin");
          navigate("/dashboard");
          return;
        }

        setIsSuperAdmin(true);
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        toast.error("Erro ao verificar permissões");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    checkSuperAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Gerenciar Anúncios</CardTitle>
                <CardDescription>
                  Envie notificações e atualizações para todos os usuários do sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Announcement Manager */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AnnouncementManager />
      </motion.div>
    </div>
  );
};

export default Announcements;
