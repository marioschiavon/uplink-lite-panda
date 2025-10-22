import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CreateOrgModal from "@/components/CreateOrgModal";
import { toast } from "sonner";
import { LogOut, Server, Key, QrCode, Copy, RefreshCw, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  organization_id: string | null;
  role: string | null;
}

interface OrgData {
  id: string;
  name: string;
  plan: string | null;
  api_token: string | null;
}

interface SessionStatus {
  status: string;
  qrCode?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [refreshingQr, setRefreshingQr] = useState(false);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch user data
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (userError) throw userError;

      if (!userRecord) {
        // Create user record if doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || null,
          })
          .select()
          .single();

        if (createError) throw createError;
        setUserData(newUser);
        setShowOrgModal(true);
        return;
      }

      setUserData(userRecord);

      // Check if user has organization
      if (!userRecord.organization_id) {
        setShowOrgModal(true);
        return;
      }

      // Fetch organization data
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", userRecord.organization_id)
        .single();

      if (orgError) throw orgError;
      setOrgData(org);

      // Fetch session status from external API
      fetchSessionStatus(org.id);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchSessionStatus = async (orgId: string) => {
    try {
      const response = await fetch(`https://wpp.panda42.com.br/api/${orgId}/status`);
      if (response.ok) {
        const data = await response.json();
        setSessionStatus(data);
      }
    } catch (error) {
      console.error("Error fetching session status:", error);
    }
  };

  const handleCreateSession = async () => {
    if (!orgData) return;
    
    setCreatingSession(true);
    try {
      const response = await fetch(`https://wpp.panda42.com.br/api/${orgData.id}/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error("Erro ao criar sessão");

      toast.success("Sessão criada! Aguarde o QR Code...");
      
      // Wait a bit and fetch status
      setTimeout(() => fetchSessionStatus(orgData.id), 2000);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar sessão");
    } finally {
      setCreatingSession(false);
    }
  };

  const handleRefreshQr = async () => {
    if (!orgData) return;
    
    setRefreshingQr(true);
    try {
      await fetchSessionStatus(orgData.id);
      toast.success("QR Code atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar QR Code");
    } finally {
      setRefreshingQr(false);
    }
  };

  const handleCopyApiToken = () => {
    if (orgData?.api_token) {
      navigator.clipboard.writeText(orgData.api_token);
      toast.success("API Token copiado!");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-background to-purple-700/10 pointer-events-none" />
      
      <CreateOrgModal 
        open={showOrgModal} 
        onOrgCreated={() => {
          setShowOrgModal(false);
          fetchUserData();
        }}
        onClose={() => setShowOrgModal(false)}
      />
      
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/30 relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-glow">
              <span className="text-lg font-bold text-primary-foreground">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Panda42
              </h1>
              <p className="text-xs text-muted-foreground">Uplink Lite</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Organization Info Card */}
          <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-elegant">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                  <Server className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{orgData?.name || "Minha Empresa"}</CardTitle>
                  <CardDescription>Plano: {orgData?.plan || "basic"}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* API Key Card */}
          {orgData?.api_token && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-elegant">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-secondary to-primary rounded-lg flex items-center justify-center">
                        <Key className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">API Token</CardTitle>
                        <CardDescription>Token de acesso à API</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyApiToken}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <code className="text-sm bg-muted/50 px-3 py-2 rounded-md block overflow-x-auto">
                    {orgData.api_token}
                  </code>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Session Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Sessão WhatsApp</CardTitle>
                      <CardDescription>
                        Status: {sessionStatus?.status || "offline"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {sessionStatus?.status !== "offline" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshQr}
                        disabled={refreshingQr}
                        className="gap-2"
                      >
                        {refreshingQr ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Renovar QR
                      </Button>
                    )}
                    {!sessionStatus || sessionStatus.status === "offline" ? (
                      <Button
                        onClick={handleCreateSession}
                        disabled={creatingSession}
                        className="bg-gradient-to-r from-secondary to-primary hover:opacity-90 transition-opacity gap-2"
                      >
                        {creatingSession ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          "Criar Sessão"
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sessionStatus?.qrCode ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                      <img 
                        src={sessionStatus.qrCode} 
                        alt="QR Code WhatsApp" 
                        className="w-64 h-64"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Escaneie o QR Code com seu WhatsApp para conectar
                    </p>
                  </motion.div>
                ) : sessionStatus?.status === "online" || sessionStatus?.status === "connected" ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-4">
                      <Server className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">Sessão Conectada!</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Seu WhatsApp está online e pronto para uso
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma sessão ativa</p>
                    <p className="text-sm mt-2">Clique em "Criar Sessão" para começar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
