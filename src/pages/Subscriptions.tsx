import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SessionWithSubscription {
  id: string;
  name: string;
  created_at: string;
  requires_subscription: boolean;
  subscription?: {
    id: string;
    status: string;
    amount: number;
    next_payment_date: string | null;
    preapproval_id: string;
    created_at: string;
  };
}

const Subscriptions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionWithSubscription[]>([]);
  const [isLegacy, setIsLegacy] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Buscar organização do usuário
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (userError || !userData?.organization_id) {
        toast.error("Organização não encontrada");
        navigate("/dashboard");
        return;
      }

      setOrganizationId(userData.organization_id);

      // Verificar se é cliente legacy
      const { data: orgData } = await supabase
        .from("organizations")
        .select("is_legacy")
        .eq("id", userData.organization_id)
        .single();

      setIsLegacy((orgData as any)?.is_legacy || false);

      // Buscar todas as sessões
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .eq("organization_id", userData.organization_id)
        .order("created_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      // Buscar assinaturas de cada sessão
      const sessionsWithSubs: SessionWithSubscription[] = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { data: subData } = await supabase
            .from("subscriptions" as any)
            .select("*")
            .eq("session_id", session.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: session.id,
            name: session.name || "",
            created_at: session.created_at,
            requires_subscription: (session as any).requires_subscription ?? true,
            subscription: subData ? {
              id: (subData as any).id,
              status: (subData as any).status,
              amount: (subData as any).amount,
              next_payment_date: (subData as any).next_payment_date,
              preapproval_id: (subData as any).preapproval_id,
              created_at: (subData as any).created_at,
            } : undefined,
          };
        })
      );

      setSessions(sessionsWithSubs);
    } catch (error: any) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao carregar assinaturas");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (session: SessionWithSubscription) => {
    if (!session.requires_subscription) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Liberada
        </Badge>
      );
    }

    if (!session.subscription) {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Aguardando Pagamento
        </Badge>
      );
    }

    switch (session.subscription.status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Ativa
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "cancelled":
      case "paused":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {session.subscription.status}
          </Badge>
        );
    }
  };

  const handleManageSubscription = (preapprovalId: string) => {
    // Link direto para gerenciar assinatura no Mercado Pago
    window.open(`https://www.mercadopago.com.br/subscriptions/${preapprovalId}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando assinaturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Minhas Assinaturas</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie suas sessões e assinaturas do Uplink
        </p>
      </div>

      {/* Cliente Legacy Alert */}
      {isLegacy && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Cliente Legacy:</strong> Você possui acesso especial sem cobrança por sessão.
            Suas sessões foram criadas antes do novo modelo de assinatura.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Sessões</CardDescription>
            <CardTitle className="text-3xl">{sessions.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Assinaturas Ativas</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {sessions.filter(s => s.subscription?.status === "active" || !s.requires_subscription).length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Custo Mensal Total</CardDescription>
            <CardTitle className="text-3xl text-primary">
              {isLegacy ? "Grátis" : `R$ ${(sessions.filter(s => s.subscription?.status === "active").length * 69.90).toFixed(2)}`}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Você ainda não possui nenhuma sessão
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Criar Primeira Sessão
              </Button>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{session.name}</CardTitle>
                        {getStatusBadge(session)}
                      </div>
                      <CardDescription>
                        Criada em {format(new Date(session.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Separator className="mb-4" />

                  {/* Informações da Assinatura */}
                  {session.subscription ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Valor Mensal</p>
                          <p className="text-lg font-semibold">
                            R$ {session.subscription.amount.toFixed(2)}
                          </p>
                        </div>

                        {session.subscription.next_payment_date && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Próxima Cobrança</p>
                            <p className="text-lg font-semibold">
                              {format(new Date(session.subscription.next_payment_date), "dd/MM/yyyy")}
                            </p>
                          </div>
                        )}
                      </div>

                      {session.subscription.status === "active" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleManageSubscription(session.subscription!.preapproval_id)}
                            className="flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Gerenciar no Mercado Pago
                          </Button>
                        </div>
                      )}

                      {session.subscription.status === "pending" && (
                        <Alert className="border-yellow-200 bg-yellow-50">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            Aguardando confirmação de pagamento. Isso pode levar alguns minutos.
                          </AlertDescription>
                        </Alert>
                      )}

                      {(session.subscription.status === "cancelled" || session.subscription.status === "paused") && (
                        <Alert className="border-red-200 bg-red-50">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            Esta assinatura foi cancelada. A sessão não pode ser utilizada.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : session.requires_subscription ? (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <p className="mb-2">Esta sessão ainda não possui assinatura ativa.</p>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/checkout?session_name=${encodeURIComponent(session.name)}`)}
                        >
                          Ativar Assinatura
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Esta sessão está liberada e não requer assinatura.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Help Section */}
      <Card className="mt-8 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Precisa de Ajuda?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Para cancelar uma assinatura, clique em "Gerenciar no Mercado Pago"
          </p>
          <p>
            • Cada sessão possui uma assinatura independente de R$ 69,90/mês
          </p>
          <p>
            • O cancelamento de uma assinatura não afeta as outras sessões
          </p>
          <p>
            • Após o cancelamento, a sessão será bloqueada na próxima renovação
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscriptions;
