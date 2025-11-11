import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CreditCard, Shield, Check } from "lucide-react";

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionName = searchParams.get('session_name');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa fazer login primeiro");
      navigate("/login");
      return;
    }
    setUser(user);
  };

  const handleSubscribe = async () => {
    if (!sessionName) {
      toast.error("Nome da sessão não encontrado. Volte ao dashboard e tente novamente.");
      return;
    }

    setLoading(true);
    setCreatingSession(true);

    try {
      // PASSO 1: Criar a sessão primeiro
      toast.info("Criando sua sessão...");
      console.log('Criando sessão:', sessionName);
      
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
        'generate-whatsapp-token',
        { body: { session_name: sessionName } }
      );

      if (sessionError) {
        console.error('Erro ao criar sessão:', sessionError);
        throw new Error('Erro ao criar sessão');
      }

      if (!sessionData.success || !sessionData.session_id) {
        throw new Error(sessionData.error || "Erro ao gerar token da sessão");
      }

      console.log('Sessão criada com sucesso:', sessionData.session_id);
      setCreatingSession(false);

      // PASSO 2: Criar assinatura para essa sessão
      toast.info("Preparando pagamento...");
      console.log('Criando assinatura para sessão:', sessionData.session_id);

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { session_id: sessionData.session_id }
      });

      if (error) {
        console.error('Erro ao criar assinatura:', error);
        throw error;
      }

      if (data.success && data.init_point) {
        console.log('Redirecionando para Mercado Pago:', data.init_point);
        window.location.href = data.init_point;
      } else {
        throw new Error(data.error || "Erro ao criar assinatura");
      }
    } catch (error: any) {
      console.error("Erro no processo de checkout:", error);
      toast.error(error.message || "Erro ao processar assinatura");
      setLoading(false);
      setCreatingSession(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-2 border-primary/20">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Assinar Uplink</CardTitle>
          <CardDescription className="text-lg mt-2">
            {sessionName 
              ? `Finalize o pagamento para criar a sessão "${sessionName}"`
              : "Plano de Sessão API WhatsApp"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center py-6 border-y">
            <div className="text-5xl font-bold text-primary mb-2">
              R$ 69,90
            </div>
            <div className="text-muted-foreground">por mês</div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0" />
              <span>1 sessão de API WhatsApp</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0" />
              <span>Configuração em minutos</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0" />
              <span>Documentação completa</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0" />
              <span>Suporte técnico</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0" />
              <span>Cancele quando quiser</span>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              Pagamento 100% seguro processado pelo Mercado Pago. 
              Renovação automática mensal. Cancele quando quiser.
            </div>
          </div>

          <Button 
            onClick={handleSubscribe} 
            disabled={loading || !sessionName}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {creatingSession && (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Criando sessão...
              </>
            )}
            {!creatingSession && loading && (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando pagamento...
              </>
            )}
            {!creatingSession && !loading && "Assinar agora"}
          </Button>

          {!sessionName && (
            <p className="text-sm text-destructive text-center font-medium">
              ⚠️ Nome da sessão não encontrado. Volte ao dashboard.
            </p>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Ao assinar, você concorda com nossos{" "}
            <a href="#" className="text-primary hover:underline">Termos de Serviço</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
