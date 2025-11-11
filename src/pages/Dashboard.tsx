import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateOrgModal from "@/components/CreateOrgModal";
import CreateSessionModal from "@/components/CreateSessionModal";
import SessionManagementCard from "@/components/SessionManagementCard";
import SessionQrModal from "@/components/SessionQrModal";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { AnnouncementManager } from "@/components/AnnouncementManager";
import { toast } from "sonner";
import { LogOut, Server, Key, Plus, MessageSquare, Send, Copy, CreditCard } from "lucide-react";
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
  session_limit: number | null;
  is_legacy: boolean;
}

interface SessionData {
  id: string;
  name: string;
  api_session: string | null;
  api_token: string | null;
  api_token_full: string | null;
  status: string | null;
  qr: string | null;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}

interface SessionStatus {
  status: boolean;
  message?: string;
  qrCode?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionsStatus, setSessionsStatus] = useState<Record<string, SessionStatus>>({});
  const [creatingSession, setCreatingSession] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [refreshingQr, setRefreshingQr] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [qrExpiresIn, setQrExpiresIn] = useState<number | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Olá do Uplink");
  const [sendingTest, setSendingTest] = useState(false);
  const [generatingQrCode, setGeneratingQrCode] = useState(false);
  const [selectedTestSession, setSelectedTestSession] = useState<SessionData | null>(null);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (userError) throw userError;

      if (!userRecord) {
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || null,
            role: 'admin',
          })
          .select()
          .single();

        if (createError) throw createError;
        setUserData(newUser);
        setShowOrgModal(true);
        return;
      }

      setUserData(userRecord);

      if (!userRecord.organization_id) {
        setShowOrgModal(true);
        return;
      }

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", userRecord.organization_id)
        .maybeSingle();

      if (orgError) throw orgError;
      
      const orgDataTyped: OrgData = {
        id: org.id,
        name: org.name,
        plan: org.plan,
        session_limit: org.session_limit,
        is_legacy: (org as any).is_legacy || false
      };
      
      setOrgData(orgDataTyped);

      // Buscar todas as sessões da organização
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('organization_id', userRecord.organization_id)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
      } else if (sessionsData && sessionsData.length > 0) {
        const typedSessions: SessionData[] = sessionsData.map((s: any) => ({
          id: s.id,
          name: s.name,
          api_session: s.api_session,
          api_token: s.api_token,
          api_token_full: s.api_token_full,
          status: s.status,
          qr: s.qr,
          organization_id: s.organization_id,
          created_at: s.created_at,
          updated_at: s.updated_at
        }));
        
        setSessions(typedSessions);
        
        // Buscar status de cada sessão
        await Promise.all(
          typedSessions.map(async (session) => {
            if (session.api_session && session.api_token) {
              await fetchSessionStatus(session.id, session.api_session, session.api_token);
            }
          })
        );
      }
    } catch (error: any) {
      console.error("❌ Error fetching data:", error);
      toast.error(`Erro ao carregar dados: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionStatus = async (sessionId: string, apiSession: string, apiToken: string) => {
    try {
      const response = await fetch(
        `https://wpp.panda42.com.br/api/${apiSession}/check-connection-session`,
        {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${apiToken}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSessionsStatus(prev => ({
          ...prev,
          [sessionId]: data
        }));
      } else {
        setSessionsStatus(prev => ({
          ...prev,
          [sessionId]: { status: false, message: 'Offline' }
        }));
      }
    } catch (error) {
      console.error(`Error fetching session status for ${sessionId}:`, error);
      setSessionsStatus(prev => ({
        ...prev,
        [sessionId]: { status: false, message: 'Offline' }
      }));
    }
  };

  const checkConnectionStatus = useCallback(async (sessionId: string, apiSession: string, apiToken: string) => {
    try {
      const response = await fetch(
        `https://wpp.panda42.com.br/api/${apiSession}/check-connection-session`,
        {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${apiToken}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        setSessionsStatus(currentStatus => {
          const current = currentStatus[sessionId];
          if (data.status === true) {
            return { ...currentStatus, [sessionId]: data };
          }
          if (!current?.qrCode) {
            return { ...currentStatus, [sessionId]: data };
          }
          return currentStatus;
        });
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
    }
  }, []);

  const handleStartSession = useCallback(async (session: SessionData) => {
    if (!session.api_session || !session.api_token) {
      toast.error("Sessão não encontrada.");
      return;
    }
    
    setStartingSession(true);
    setGeneratingQrCode(true);
    setSelectedSession(session);
    setShowSessionModal(true);
    
    try {
      console.log('Iniciando sessão:', session.api_session);
      
      const startResponse = await fetch(
        `https://wpp.panda42.com.br/api/${session.api_session}/start-session`,
        {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${session.api_token}`
          },
          body: ''
        }
      );
      
      if (!startResponse.ok) {
        throw new Error(`Erro ao iniciar sessão: ${startResponse.status}`);
      }
      
      toast.info("Gerando QR Code, aguarde 10 segundos...");
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const qrResponse = await fetch(
        `https://wpp.panda42.com.br/api/${session.api_session}/qrcode-session`,
        {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${session.api_token}`
          }
        }
      );
      
      if (!qrResponse.ok) {
        throw new Error(`Erro ao buscar QR Code: ${qrResponse.status}`);
      }
      
      const blob = await qrResponse.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setSessionsStatus(prev => ({
          ...prev,
          [session.id]: {
            status: false,
            message: 'qrcode',
            qrCode: reader.result as string
          }
        }));
        setGeneratingQrCode(false);
        toast.success("QR Code gerado! Escaneie para conectar.");
      };
      
      reader.readAsDataURL(blob);
      
    } catch (error: any) {
      console.error('Erro ao iniciar sessão:', error);
      toast.error(error.message || "Erro ao iniciar sessão");
      setGeneratingQrCode(false);
      setShowSessionModal(false);
    } finally {
      setStartingSession(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Polling automático a cada 10 segundos para todas as sessões
  useEffect(() => {
    if (sessions.length === 0) return;
    
    const intervalId = setInterval(() => {
      sessions.forEach(session => {
        if (session.api_session && session.api_token) {
          checkConnectionStatus(session.id, session.api_session, session.api_token);
        }
      });
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [sessions, checkConnectionStatus]);

  // Polling inteligente de QR Code (apenas quando modal está aberto e sessão não conectada)
  useEffect(() => {
    if (!selectedSession || !showSessionModal) return;
    
    const sessionStatus = sessionsStatus[selectedSession.id];
    
    // Só fazer polling se sessão não está conectada e está aguardando QR Code
    if (sessionStatus?.status === false && (generatingQrCode || sessionStatus.qrCode)) {
      const intervalId = setInterval(async () => {
        if (!selectedSession.api_session || !selectedSession.api_token) return;
        
        try {
          const qrResponse = await fetch(
            `https://wpp.panda42.com.br/api/${selectedSession.api_session}/qrcode-session`,
            {
              headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${selectedSession.api_token}`
              }
            }
          );
          
          if (qrResponse.ok) {
            const blob = await qrResponse.blob();
            const reader = new FileReader();
            
            reader.onloadend = () => {
              setSessionsStatus(prev => ({
                ...prev,
                [selectedSession.id]: {
                  status: false,
                  message: 'qrcode',
                  qrCode: reader.result as string
                }
              }));
              setGeneratingQrCode(false);
            };
            
            reader.readAsDataURL(blob);
          }
        } catch (error) {
          console.error('Erro no polling de QR Code:', error);
        }
      }, 5000);
      
      return () => clearInterval(intervalId);
    }
  }, [selectedSession, showSessionModal, sessionsStatus, generatingQrCode]);

  // Timer de expiração do QR Code (50 segundos) para sessão selecionada
  useEffect(() => {
    if (selectedSession && sessionsStatus[selectedSession.id]?.qrCode) {
      setQrExpiresIn(50);
      
      const intervalId = setInterval(() => {
        setQrExpiresIn(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(intervalId);
            toast.warning("QR Code expirado! Clique em 'Renovar QR' para gerar um novo.", {
              duration: 5000
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(intervalId);
    } else {
      setQrExpiresIn(null);
    }
  }, [selectedSession, sessionsStatus]);

  const handleCreateSession = async (sessionName: string) => {
    if (!orgData) return;
    
    setShowCreateSessionModal(false);
    
    // PROTEÇÃO PARA CLIENTES LEGACY
    if (orgData.is_legacy) {
      console.log('Cliente LEGACY - criando sessão sem cobrança');
      
      // Verificar limite de sessões (se houver)
      const activeSessionsCount = sessions.length;
      if (orgData.session_limit && activeSessionsCount >= orgData.session_limit) {
        toast.error(`Limite de ${orgData.session_limit} sessões atingido. Exclua uma sessão existente.`);
        return;
      }
      
      setCreatingSession(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-whatsapp-token', {
          body: { session_name: sessionName }
        });

        if (error) throw error;

        if (data.success && data.session_id) {
          await fetchUserData();
          toast.success("Sessão criada com sucesso! Clique em 'Iniciar Sessão' para conectar.");
        } else {
          throw new Error(data.error || "Erro ao gerar token");
        }
      } catch (error: any) {
        console.error("Erro ao criar sessão:", error);
        toast.error(error.message || "Erro ao criar sessão");
      } finally {
        setCreatingSession(false);
      }
      return;
    }
    
    // NOVO CLIENTE - Redirecionar para checkout com nome da sessão
    console.log('Novo cliente - redirecionando para checkout');
    toast.info("Configure o pagamento para criar sua sessão");
    navigate(`/checkout?session_name=${encodeURIComponent(sessionName)}`);
  };

  const handleRefreshQr = async (session: SessionData) => {
    if (!session.api_session || !session.api_token) {
      toast.error("Sessão não encontrada.");
      return;
    }
    
    setRefreshingQr(true);
    setGeneratingQrCode(true);
    
    try {
      toast.info("Buscando QR Code atualizado...");
      
      const qrResponse = await fetch(
        `https://wpp.panda42.com.br/api/${session.api_session}/qrcode-session`,
        {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${session.api_token}`
          }
        }
      );
      
      if (!qrResponse.ok) {
        throw new Error(`Erro ao buscar QR Code: ${qrResponse.status}`);
      }
      
      const blob = await qrResponse.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setSessionsStatus(prev => ({
          ...prev,
          [session.id]: {
            status: false,
            message: 'qrcode',
            qrCode: reader.result as string
          }
        }));
        setQrExpiresIn(50);
        setGeneratingQrCode(false);
        toast.success("QR Code atualizado!");
      };
      
      reader.readAsDataURL(blob);
      
    } catch (error: any) {
      console.error('Erro ao atualizar QR Code:', error);
      toast.error(error.message || "Erro ao atualizar QR Code");
      setGeneratingQrCode(false);
    } finally {
      setRefreshingQr(false);
    }
  };

  const handleCloseSession = async (session: SessionData) => {
    if (!session.api_session || !session.api_token) {
      toast.error("Sessão não encontrada");
      return;
    }
    
    setClosingSession(true);
    
    try {
      const response = await fetch(
        `https://wpp.panda42.com.br/api/${session.api_session}/close-session`,
        {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${session.api_token}`
          },
          body: ''
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
      
      setSessionsStatus(prev => ({
        ...prev,
        [session.id]: { status: false, message: 'offline' }
      }));
      
      toast.success("Sessão fechada com sucesso!");
      await fetchUserData();
    } catch (error: any) {
      console.error('Erro ao fechar sessão:', error);
      toast.error(error.message || "Erro ao fechar sessão");
    } finally {
      setClosingSession(false);
    }
  };

  const handleDeleteSession = async (session: SessionData) => {
    if (!confirm(`Tem certeza que deseja excluir a sessão "${session.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    setLoggingOut(true);
    
    try {
      // Fazer logout na API externa primeiro
      if (session.api_session && session.api_token) {
        try {
          await fetch(
            `https://wpp.panda42.com.br/api/${session.api_session}/logout-session`,
            {
              method: 'POST',
              headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${session.api_token}`
              },
              body: ''
            }
          );
        } catch (apiError) {
          console.warn('Erro ao fazer logout na API externa:', apiError);
        }
      }
      
      // Deletar do banco de dados
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', session.id);
      
      if (error) throw error;
      
      // Remover da lista
      setSessions(prev => prev.filter(s => s.id !== session.id));
      
      // Limpar sessão selecionada se for a mesma
      if (selectedSession?.id === session.id) {
        setSelectedSession(null);
        setShowSessionModal(false);
      }
      
      toast.success("Sessão excluída com sucesso!");
      
    } catch (error: any) {
      console.error('Erro ao excluir sessão:', error);
      toast.error(error.message || "Erro ao excluir sessão");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!selectedTestSession?.api_session || !selectedTestSession?.api_token) {
      toast.error("Selecione uma sessão ativa.");
      return;
    }
    
    if (!testPhone || !testMessage) {
      toast.error("Preencha o número e a mensagem.");
      return;
    }
    
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(testPhone)) {
      toast.error("Número inválido. Use o formato: DDD + número (ex: 11987654321)");
      return;
    }
    
    setSendingTest(true);
    
    try {
      const response = await fetch(
        `https://wpp.panda42.com.br/api/${selectedTestSession.api_session}/send-message`,
        {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${selectedTestSession.api_token}`
          },
          body: JSON.stringify({
            phone: `55${testPhone}`,
            isGroup: false,
            isNewsletter: false,
            isLid: false,
            message: testMessage
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ${response.status}: ${errorData}`);
      }
      
      toast.success("Mensagem enviada com sucesso!");
      setTestPhone("");
      
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(error.message || "Erro ao enviar mensagem");
    } finally {
      setSendingTest(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
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

  const activeSessions = sessions.filter(s => sessionsStatus[s.id]?.status === true);

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 pointer-events-none" />
      
      <CreateOrgModal 
        open={showOrgModal} 
        onOrgCreated={() => {
          setShowOrgModal(false);
          fetchUserData();
        }}
        onClose={() => setShowOrgModal(false)}
      />

      <CreateSessionModal
        open={showCreateSessionModal}
        onSessionCreated={(sessionName) => handleCreateSession(sessionName)}
        onClose={() => setShowCreateSessionModal(false)}
      />

      <SessionQrModal
        session={selectedSession}
        status={selectedSession ? sessionsStatus[selectedSession.id] : null}
        open={showSessionModal}
        onClose={() => {
          setShowSessionModal(false);
          setQrExpiresIn(null);
        }}
        onRefreshQr={() => selectedSession && handleRefreshQr(selectedSession)}
        onCloseSession={() => selectedSession && handleCloseSession(selectedSession)}
        onLogoutSession={() => selectedSession && handleDeleteSession(selectedSession)}
        refreshingQr={refreshingQr}
        closingSession={closingSession}
        loggingOut={loggingOut}
        generatingQrCode={generatingQrCode}
        qrExpiresIn={qrExpiresIn}
      />
      
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/30 relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.3)]">
              <span className="text-lg font-bold text-primary-foreground">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Uplink Lite
              </h1>
              <p className="text-xs text-muted-foreground">por Panda42</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userData?.role === 'superadmin' && (
              <Button 
                variant="outline" 
                onClick={() => navigate("/monitoring")}
                className="gap-2"
              >
                <Server className="w-4 h-4" />
                Monitoramento
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => navigate("/subscriptions")}
              className="gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Assinaturas
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
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
          {/* Announcement Banner */}
          <AnnouncementBanner />

          {/* Superadmin Announcement Manager */}
          {userData?.role === 'superadmin' && (
            <AnnouncementManager />
          )}

          {/* Organization Info Card */}
          <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.2)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                  <Server className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{orgData?.name || "Minha Empresa"}</CardTitle>
                  <CardDescription>
                    Plano: {orgData?.plan || "basic"} | Sessões: {sessions.length}/{orgData?.session_limit || 1}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* API Token Card - Mostra se houver alguma sessão online */}
          {activeSessions.length > 0 && activeSessions[0].api_token && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.2)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-secondary to-primary rounded-lg flex items-center justify-center">
                        <Key className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Bearer Token - {activeSessions[0].name}</CardTitle>
                        <CardDescription>Token de autenticação para chamadas API</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(activeSessions[0].api_token || '');
                        toast.success("Token copiado!");
                      }}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <code className="text-sm bg-muted/50 px-3 py-2 rounded-md block overflow-x-auto break-all">
                    {activeSessions[0].api_token}
                  </code>
                  <p className="text-xs text-muted-foreground">
                    Use este token no header: <code className="text-xs bg-muted px-1 py-0.5 rounded">Authorization: Bearer {activeSessions[0].api_token}</code>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Sessions Management Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.2)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Minhas Sessões WhatsApp</CardTitle>
                  <CardDescription>
                    {sessions.length}/{orgData?.session_limit || 1} sessões criadas
                  </CardDescription>
                </div>
                
                <Button
                  onClick={() => setShowCreateSessionModal(true)}
                  disabled={
                    creatingSession || 
                    (orgData?.session_limit !== null && sessions.length >= orgData.session_limit)
                  }
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nova Sessão
                </Button>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhuma sessão criada</p>
                    <p className="text-sm mt-2">Clique em "Nova Sessão" para começar</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map((session) => (
                      <SessionManagementCard
                        key={session.id}
                        session={session}
                        status={sessionsStatus[session.id] || null}
                        onViewQr={() => {
                          setSelectedSession(session);
                          setShowSessionModal(true);
                        }}
                        onStartSession={() => handleStartSession(session)}
                        onDelete={() => handleDeleteSession(session)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Test Message Card */}
          {activeSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.2)]">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Teste de Envio</CardTitle>
                      <CardDescription>Envie uma mensagem de teste via API</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="test-session">Sessão</Label>
                      <Select
                        value={selectedTestSession?.id || ''}
                        onValueChange={(value) => {
                          const session = sessions.find(s => s.id === value);
                          setSelectedTestSession(session || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma sessão ativa" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeSessions.map(session => (
                            <SelectItem key={session.id} value={session.id}>
                              {session.name} ({session.api_session})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTestSession && (
                      <>
                        <div>
                          <Label htmlFor="test-phone">Número de Telefone</Label>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-3 py-2 bg-muted rounded-md border border-input">
                              <span className="text-lg">🇧🇷</span>
                              <span className="text-sm font-mono font-medium">+55</span>
                            </div>
                            <Input
                              id="test-phone"
                              type="text"
                              placeholder="11987654321"
                              value={testPhone}
                              onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                              className="font-mono flex-1"
                              maxLength={11}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Formato: DDD + número (somente números)
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="test-message">Mensagem</Label>
                          <Textarea
                            id="test-message"
                            placeholder="Digite sua mensagem..."
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            className="resize-none"
                            rows={3}
                          />
                        </div>
                        
                        <Button
                          onClick={handleSendTestMessage}
                          disabled={sendingTest || !testPhone || !testMessage}
                          className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                          {sendingTest ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Enviar Mensagem de Teste
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
