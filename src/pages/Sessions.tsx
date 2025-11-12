import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreateSessionModal from "@/components/CreateSessionModal";
import SessionQrModal from "@/components/SessionQrModal";
import { SessionsGrid } from "@/components/dashboard/SessionsGrid";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { toast } from "sonner";
import { MessageSquare, Zap, Clock, AlertTriangle, Plus } from "lucide-react";
import { motion } from "framer-motion";

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
  requires_subscription?: boolean;
}

interface SessionStatus {
  status: boolean;
  message?: string;
  qrCode?: string;
}

interface OrgData {
  id: string;
  name: string;
  plan: string | null;
  session_limit: number | null;
  is_legacy: boolean;
}

const Sessions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionsStatus, setSessionsStatus] = useState<Record<string, SessionStatus>>({});
  const [creatingSession, setCreatingSession] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [refreshingQr, setRefreshingQr] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [qrExpiresIn, setQrExpiresIn] = useState<number | null>(null);
  const [generatingQrCode, setGeneratingQrCode] = useState(false);

  const fetchSessions = async () => {
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
        .single();

      if (userError) throw userError;

      if (!userRecord.organization_id) {
        toast.error("Organização não encontrada");
        navigate("/dashboard");
        return;
      }

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", userRecord.organization_id)
        .single();

      if (orgError) throw orgError;
      
      const orgDataTyped: OrgData = {
        id: org.id,
        name: org.name,
        plan: org.plan,
        session_limit: org.session_limit,
        is_legacy: (org as any).is_legacy || false
      };
      
      setOrgData(orgDataTyped);

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
          updated_at: s.updated_at,
          requires_subscription: s.requires_subscription
        }));
        
        setSessions(typedSessions);
        
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

  const handleQrExpiration = async (session: SessionData) => {
    if (!session.api_session || !session.api_token) return;
    
    try {
      const response = await fetch(
        `https://wpp.panda42.com.br/api/${session.api_session}/check-connection-session`,
        {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${session.api_token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === false) {
          setSessionsStatus(prev => ({
            ...prev,
            [session.id]: {
              status: false,
              message: 'Disconnected'
            }
          }));
          
          setShowSessionModal(false);
          setSelectedSession(null);
          
          toast.info(
            "QR Code expirou e a sessão ainda está desconectada. Clique em 'Iniciar Sessão' para tentar novamente.",
            { duration: 5000 }
          );
        } else if (data.status === true) {
          setSessionsStatus(prev => ({
            ...prev,
            [session.id]: data
          }));
          toast.success("Sessão conectada com sucesso! ✓");
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status na expiração:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

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

  useEffect(() => {
    if (!selectedSession || !showSessionModal) return;
    
    const sessionStatus = sessionsStatus[selectedSession.id];
    
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

  useEffect(() => {
    if (selectedSession && sessionsStatus[selectedSession.id]?.qrCode) {
      setQrExpiresIn(120);
      
      const intervalId = setInterval(() => {
        setQrExpiresIn(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(intervalId);
            
            if (selectedSession) {
              handleQrExpiration(selectedSession);
            }
            
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
    
    if (orgData.is_legacy) {
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
          await fetchSessions();
          setShowCreateSessionModal(false);
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
        setQrExpiresIn(120);
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
      await fetchSessions();
    } catch (error: any) {
      console.error('Erro ao fechar sessão:', error);
      toast.error(error.message || "Erro ao fechar sessão");
    } finally {
      setClosingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    if (!confirm(`Tem certeza que deseja excluir a sessão "${session.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    setLoggingOut(true);
    
    try {
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
      
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', session.id);
      
      if (error) throw error;
      
      setSessions(prev => prev.filter(s => s.id !== session.id));
      
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

  const activeSessions = sessions.filter(s => sessionsStatus[s.id]?.status === true);
  const qrCodeSessions = sessions.filter(s => sessionsStatus[s.id]?.qrCode || sessionsStatus[s.id]?.message?.toUpperCase() === 'QRCODE');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <CreateSessionModal
        open={showCreateSessionModal}
        onSessionCreated={(sessionName) => handleCreateSession(sessionName)}
        onClose={() => setShowCreateSessionModal(false)}
        isCreating={creatingSession}
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
        onLogoutSession={() => selectedSession && handleDeleteSession(selectedSession.id)}
        refreshingQr={refreshingQr}
        closingSession={closingSession}
        loggingOut={loggingOut}
        generatingQrCode={generatingQrCode}
        qrExpiresIn={qrExpiresIn}
      />

      {/* Header with New Session Button */}
      <motion.div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessões WhatsApp</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas conexões WhatsApp
          </p>
        </div>
        <Button
          onClick={() => setShowCreateSessionModal(true)}
          size="lg"
          className="gap-2 shadow-lg hover:shadow-xl transition-all"
          disabled={creatingSession}
        >
          <Plus className="h-5 w-5" />
          Nova Sessão
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
        >
          <StatsCard
            title="Sessões Ativas"
            value={activeSessions.length}
            icon={Zap}
            subtitle={`${activeSessions.length} de ${sessions.length} online`}
            color="green"
            progress={sessions.length > 0 ? (activeSessions.length / sessions.length) * 100 : 0}
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
        >
          <StatsCard
            title="Total de Sessões"
            value={sessions.length}
            icon={MessageSquare}
            subtitle={`Limite: ${orgData?.session_limit || '∞'}`}
            color="blue"
            progress={orgData?.session_limit ? (sessions.length / orgData.session_limit) * 100 : 0}
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
        >
          <StatsCard
            title="Aguardando QR"
            value={qrCodeSessions.length}
            icon={Clock}
            subtitle="Esperando conexão"
            color="orange"
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
        >
          <StatsCard
            title="Limite Disponível"
            value={orgData?.session_limit ? Math.max(0, orgData.session_limit - sessions.length) : '∞'}
            icon={AlertTriangle}
            subtitle={orgData?.is_legacy ? "Cliente Legacy" : "Slots restantes"}
            color="purple"
          />
        </motion.div>
      </motion.div>

      {/* Sessions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Minhas Sessões WhatsApp</CardTitle>
            <CardDescription>
              {sessions.length}/{orgData?.session_limit || '∞'} sessões criadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionsGrid
              sessions={sessions}
              sessionStatuses={sessionsStatus}
              onViewQr={(session) => {
                setSelectedSession(session);
                setShowSessionModal(true);
              }}
              onStartSession={handleStartSession}
              onDeleteSession={handleDeleteSession}
              loading={loading}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Sessions;
