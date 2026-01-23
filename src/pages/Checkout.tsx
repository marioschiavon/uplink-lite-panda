import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CreditCard, Shield, Check, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRegionalPricing, formatPrice } from "@/hooks/useRegionalPricing";

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionName = searchParams.get('session_name');
  const { t } = useTranslation();
  const pricing = useRegionalPricing();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t('checkout.loginRequired'));
      navigate("/login");
      return;
    }
    setUser(user);
  };

  const handleSubscribe = async () => {
    if (!sessionName) {
      toast.error(t('checkout.sessionNameRequired'));
      return;
    }

    setLoading(true);
    setCreatingSession(true);

    try {
      toast.info(t('checkout.preparingSession'));
      console.log('Criando registro de sessão:', sessionName);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userRecord } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!userRecord?.organization_id) {
        throw new Error('Organization not found');
      }

      const { data: newSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          name: sessionName,
          organization_id: userRecord.organization_id,
          requires_subscription: true,
          status: 'pending_payment'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Erro ao criar sessão:', sessionError);
        throw new Error(t('checkout.sessionCreateError'));
      }

      console.log('Sessão criada:', newSession.id);
      setCreatingSession(false);

      toast.info(t('checkout.redirectingPayment'));
      console.log('Criando checkout Stripe para sessão:', newSession.id);

      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: { session_id: newSession.id }
      });

      if (error) {
        console.error('Erro ao criar checkout:', error);
        throw error;
      }

      if (data.success && data.url) {
        console.log('Redirecionando para Stripe Checkout:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Error creating payment session");
      }
    } catch (error: any) {
      console.error("Erro no processo de checkout:", error);
      toast.error(error.message || t('checkout.checkoutError'));
      setLoading(false);
      setCreatingSession(false);
    }
  };

  const priceDisplay = formatPrice(pricing);
  const features = t('checkout.features', { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          disabled={loading}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('checkout.backToDashboard')}
        </Button>
      </div>

      <Card className="max-w-lg w-full border-2 border-primary/20">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">{t('checkout.title')}</CardTitle>
          <CardDescription className="text-lg mt-2">
            {sessionName 
              ? t('checkout.subtitleWithSession', { sessionName })
              : t('checkout.subtitle')
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center py-6 border-y">
            <div className="text-5xl font-bold text-primary mb-2">
              {priceDisplay}
            </div>
            <div className="text-muted-foreground">{t('checkout.perMonth')}</div>
          </div>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              {t('checkout.securePayment')}
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
                {t('checkout.creatingSession')}
              </>
            )}
            {!creatingSession && loading && (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('checkout.processingPayment')}
              </>
            )}
            {!creatingSession && !loading && t('checkout.subscribeNow')}
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            disabled={loading}
            className="w-full"
          >
            {t('checkout.backToDashboard')}
          </Button>

          {!sessionName && (
            <p className="text-sm text-destructive text-center font-medium">
              {t('checkout.sessionNotFound')}
            </p>
          )}

          <div className="text-center text-sm text-muted-foreground">
            {t('checkout.termsAgree')}{" "}
            <button onClick={() => navigate("/terms")} className="text-primary hover:underline">{t('checkout.termsLink')}</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}