import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { RefreshCw, ArrowLeft, Activity } from "lucide-react";
import SessionCard from "@/components/SessionCard";
import SessionDetailsModal from "@/components/SessionDetailsModal";

interface SessionData {
  id: string;
  name: string;
  api_session: string | null;
  api_token: string | null;
  api_token_full: string | null;
  plan: string | null;
  created_at: string;
  updated_at: string;
  api_message_usage: number | null;
  api_message_limit: number | null;
  session_limit: number | null;
  agent_limit: number | null;
  status?: 'online' | 'offline' | 'qrcode' | 'loading' | 'no-session';
  statusMessage?: string;
}

type FilterType = 'all' | 'online' | 'offline' | 'qrcode' | 'no-session';

const SessionMonitoring = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [userEmail, setUserEmail] = useState<string>("");

  // Verificar se é superadmin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Acesso negado");
        navigate("/login");
        return;
      }

      const email = user.email || "";
      setUserEmail(email);

      // Check if user is in superadmin_users table
      const { data: superadminData, error: superadminError } = await supabase
        .from('superadmin_users' as any)
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (superadminError || !superadminData) {
        toast.error("Acesso negado - apenas superadmin");
        navigate("/dashboard");
        return;
      }

      fetchSessions();
    };

    checkSuperAdmin();
  }, [navigate]);

  const fetchSessions = async () => {
    try {
      setLoading(true);

      // Buscar sessões com JOIN em organizations
      const { data: sessionsData, error } = await supabase
        .from('sessions')
        .select(`
          *,
          organizations (
            name,
            plan,
            api_message_usage,
            api_message_limit,
            session_limit,
            agent_limit
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (sessionsData) {
        const sessionsWithStatus: SessionData[] = (sessionsData as any[]).map(session => ({
          id: session.id,
          name: session.name,
          api_session: session.api_session || null,
          api_token: session.api_token || null,
          api_token_full: session.api_token_full || null,
          plan: session.organizations?.plan || null,
          created_at: session.created_at,
          updated_at: session.updated_at,
          api_message_usage: session.organizations?.api_message_usage || 0,
          api_message_limit: session.organizations?.api_message_limit || 0,
          session_limit: session.organizations?.session_limit || 0,
          agent_limit: session.organizations?.agent_limit || 0,
          status: 'loading' as const,
          statusMessage: 'Verificando...'
        }));

        setSessions(sessionsWithStatus);

        // Verificar status de cada sessão em paralelo
        const statusPromises = (sessionsData as any[]).map(async (session) => {
          if (!session.api_session || !session.api_token) {
            return { id: session.id, status: 'no-session' as const, statusMessage: 'Sem sessão ativa' };
          }

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

            const data = await response.json();
            
            if (data.message === 'QRCODE') {
              return { id: session.id, status: 'qrcode' as const, statusMessage: 'Aguardando QR Code' };
            }

            return {
              id: session.id,
              status: data.status ? 'online' as const : 'offline' as const,
              statusMessage: data.message || 'Desconhecido'
            };
          } catch (error) {
            return { id: session.id, status: 'offline' as const, statusMessage: 'Erro ao verificar' };
          }
        });

        const statuses = await Promise.all(statusPromises);

        // Atualizar sessões com status
        setSessions(prev => prev.map(session => {
          const statusUpdate = statuses.find(s => s.id === session.id);
          return statusUpdate ? { ...session, ...statusUpdate } : session;
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      toast.error("Erro ao carregar sessões");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
    toast.success("Sessões atualizadas");
  };

  // Auto-refresh a cada 30 minutos
  useEffect(() => {
    if (userEmail === "contato@upevolution.com.br") {
      const interval = setInterval(() => {
        fetchSessions();
      }, 1800000);

      return () => clearInterval(interval);
    }
  }, [userEmail]);

  const handleCardClick = (session: SessionData) => {
    setSelectedSession(session);
    setModalOpen(true);
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  const getStatusCount = (status: FilterType) => {
    if (status === 'all') return sessions.length;
    return sessions.filter(s => s.status === status).length;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/dashboard")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-6 w-6 text-primary" />
                    Monitoramento de Sessões
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Visão geral de todas as sessões ativas do sistema
                  </p>
                </div>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                Todas ({getStatusCount('all')})
              </Button>
              <Button
                variant={filter === 'online' ? 'default' : 'outline'}
                onClick={() => setFilter('online')}
              >
                🟢 Online ({getStatusCount('online')})
              </Button>
              <Button
                variant={filter === 'qrcode' ? 'default' : 'outline'}
                onClick={() => setFilter('qrcode')}
              >
                🟡 QR Code ({getStatusCount('qrcode')})
              </Button>
              <Button
                variant={filter === 'offline' ? 'default' : 'outline'}
                onClick={() => setFilter('offline')}
              >
                🔴 Offline ({getStatusCount('offline')})
              </Button>
              <Button
                variant={filter === 'no-session' ? 'default' : 'outline'}
                onClick={() => setFilter('no-session')}
              >
                ⚪ Sem Sessão ({getStatusCount('no-session')})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => handleCardClick(session)}
              />
            ))}
          </div>
        )}

        {!loading && filteredSessions.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Nenhuma sessão encontrada com este filtro
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Detalhes */}
      <SessionDetailsModal
        session={selectedSession}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default SessionMonitoring;
