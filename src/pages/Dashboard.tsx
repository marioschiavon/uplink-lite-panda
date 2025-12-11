import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreateOrgModal from "@/components/CreateOrgModal";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { OrganizationBanner } from "@/components/dashboard/OrganizationBanner";
import { BearerTokenSheet } from "@/components/dashboard/BearerTokenSheet";
import { SendTestMessageDialog } from "@/components/dashboard/SendTestMessageDialog";
import { ConnectionHelpCard } from "@/components/dashboard/ConnectionHelpCard";
import { toast } from "sonner";
import { Zap, MessageSquare, CreditCard, ArrowRight, Plus, DollarSign, Settings, Megaphone, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  status: string | null;
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
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [sessionsStatus, setSessionsStatus] = useState<Record<string, SessionStatus>>({});
  const [activeSubscriptionsCount, setActiveSubscriptionsCount] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [showConnectionHelp, setShowConnectionHelp] = useState(false);
  const [newSessionName, setNewSessionName] = useState<string | undefined>();

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
        // Novo usuário - redirecionar para onboarding
        navigate("/welcome");
        return;
      }

      setUserData(userRecord);

      if (!userRecord.organization_id) {
        // Sem organização - redirecionar para onboarding
        navigate("/welcome");
        return;
      }
      
      // Verificar se tem sessões
      const { count: sessionCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", userRecord.organization_id);

      if (!sessionCount || sessionCount === 0) {
        // Tem org mas não tem sessões - ir para step 2 do onboarding
        navigate("/welcome?step=2");
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

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('organization_id', userRecord.organization_id)
        .order('created_at', { ascending: false })
        .limit(4);

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
      } else if (sessionsData && sessionsData.length > 0) {
        const typedSessions: SessionData[] = sessionsData.map((s: any) => ({
          id: s.id,
          name: s.name,
          api_session: s.api_session,
          api_token: s.api_token,
          status: s.status,
          created_at: s.created_at,
          updated_at: s.updated_at
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

      // Buscar assinaturas ativas
      const { data: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('amount, status')
        .eq('organization_id', userRecord.organization_id)
        .eq('status', 'active');

      const subscriptionCount = activeSubscriptions?.length || 0;
      const total = activeSubscriptions?.reduce((sum, sub) => 
        sum + Number(sub.amount || 0), 0
      ) || 0;

      setActiveSubscriptionsCount(subscriptionCount);
      setMonthlyTotal(total);
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
        `https://api.uplinklite.com/api/${apiSession}/check-connection-session`,
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

  const handleSendTestMessage = async (sessionId: string, phoneNumber: string, message: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session?.api_session || !session?.api_token) {
      toast.error("Sessão não encontrada.");
      return;
    }
    
    try {
      const response = await fetch(
        `https://api.uplinklite.com/api/${session.api_session}/send-message`,
        {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.api_token}`
          },
          body: JSON.stringify({
            phone: phoneNumber,
            isGroup: false,
            isNewsletter: false,
            isLid: false,
            message: message
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ${response.status}: ${errorData}`);
      }
      
      toast.success("Mensagem enviada com sucesso!");
      
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(error.message || "Erro ao enviar mensagem");
      throw error;
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

  // Detectar payment=success para mostrar ajuda
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment') === 'success';
    const sessionName = searchParams.get('session');
    
    if (paymentSuccess) {
      const helpDismissed = localStorage.getItem('connectionHelpDismissed');
      if (!helpDismissed) {
        setShowConnectionHelp(true);
        if (sessionName) {
          setNewSessionName(sessionName);
        }
      }
      // Limpar parâmetros da URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  const handleDismissHelp = () => {
    setShowConnectionHelp(false);
    localStorage.setItem('connectionHelpDismissed', 'true');
  };

  const handleShowHelp = () => {
    localStorage.removeItem('connectionHelpDismissed');
    setShowConnectionHelp(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const activeSessions = sessions.filter(s => sessionsStatus[s.id]?.status === true);

  const getStatusBadge = (sessionId: string) => {
    const status = sessionsStatus[sessionId];
    if (status?.status === true) {
      return <Badge className="bg-green-500/10 text-green-600">Online</Badge>;
    }
    if (status?.qrCode || status?.message?.toUpperCase() === 'QRCODE') {
      return <Badge className="bg-yellow-500/10 text-yellow-600">QR Code</Badge>;
    }
    return <Badge className="bg-red-500/10 text-red-600">Offline</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <CreateOrgModal 
        open={showOrgModal} 
        onOrgCreated={() => {
          setShowOrgModal(false);
          fetchUserData();
        }}
        onClose={() => setShowOrgModal(false)}
      />

      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Connection Help Card */}
      <AnimatePresence>
        {showConnectionHelp && (
          <ConnectionHelpCard 
            onDismiss={handleDismissHelp}
            sessionName={newSessionName}
          />
        )}
      </AnimatePresence>

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
            title="Sessões Conectadas"
            value={activeSessions.length}
            icon={Zap}
            subtitle="Conectadas via WhatsApp"
            color="green"
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
        >
          <StatsCard
            title="Sessões Criadas"
            value={sessions.length}
            icon={MessageSquare}
            subtitle="Crie quantas precisar"
            color="blue"
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
        >
          <StatsCard
            title="Assinaturas Ativas"
            value={activeSubscriptionsCount}
            icon={CreditCard}
            subtitle="R$ 69,90 por sessão/mês"
            color="green"
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
        >
          <StatsCard
            title="Custo Mensal"
            value={`R$ ${monthlyTotal.toFixed(2)}`}
            icon={DollarSign}
            subtitle="Total das suas assinaturas"
            color="orange"
          />
        </motion.div>
      </motion.div>

      {/* Organization Banner */}
      {orgData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-4"
        >
          <div className="flex-1">
            <OrganizationBanner
              name={orgData.name}
              isLegacy={orgData.is_legacy}
              sessionCount={sessions.length}
            />
          </div>
          {!showConnectionHelp && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShowHelp}
              className="shrink-0 gap-1.5"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Como conectar?</span>
            </Button>
          )}
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/sessions")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Gerenciar Sessões
            </CardTitle>
            <CardDescription>
              Crie e gerencie suas sessões WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Nova Sessão
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/subscriptions")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Assinaturas
            </CardTitle>
            <CardDescription>
              Gerencie suas assinaturas e pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Ver Assinaturas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Ferramentas
            </CardTitle>
            <CardDescription>
              Teste mensagens e veja tokens de API
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            {activeSessions.length > 0 && (
              <BearerTokenSheet
                sessions={activeSessions
                  .filter(s => s.api_token)
                  .map(s => ({
                    id: s.id,
                    name: s.name,
                    api_token: s.api_token!
                  }))
                }
              />
            )}
            
            {activeSessions.length > 0 && (
              <SendTestMessageDialog
                sessions={activeSessions.map(s => ({ id: s.id, name: s.name }))}
                onSend={handleSendTestMessage}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Últimas Sessões Preview */}
      {sessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Últimas Sessões</CardTitle>
                  <CardDescription>
                    Preview das suas sessões mais recentes
                  </CardDescription>
                </div>
                <Button variant="ghost" asChild>
                  <Link to="/sessions">
                    Ver Todas
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold">{session.name}</h4>
                        {getStatusBadge(session.id)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {session.api_session || 'Sem sessão configurada'}
                      </p>
                      {session.updated_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Atualizado {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/sessions")}>
                      Ver Detalhes
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Anúncios Recentes (Superadmin apenas) */}
      {userData?.role === 'superadmin' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    Gerenciar Anúncios
                  </CardTitle>
                  <CardDescription>
                    Acesso administrativo para gerenciar anúncios do sistema
                  </CardDescription>
                </div>
                <Button variant="default" asChild>
                  <Link to="/announcements">
                    Acessar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
