import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Loader2, ArrowLeft, Shield } from "lucide-react";

interface PaymentStepProps {
  orgName: string;
  sessionName: string;
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function PaymentStep({ orgName, sessionName, onConfirm, onBack, isLoading }: PaymentStepProps) {
  return (
    <Card className="bg-card border border-primary/30 shadow-xl">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Finalizar Assinatura</CardTitle>
        <CardDescription>
          Revise os dados e complete o pagamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Resumo */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Organização:</span>
            <span className="font-medium">{orgName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Sessão:</span>
            <span className="font-medium">{sessionName}</span>
          </div>
        </div>

        {/* Preço */}
        <div className="text-center py-4 border-y">
          <div className="text-4xl font-bold text-primary">
            R$ 69,90
          </div>
          <div className="text-muted-foreground text-sm">por mês</div>
        </div>

        {/* Benefícios */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
            <span>1 sessão de API WhatsApp</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Mensagens ilimitadas</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Suporte técnico 24/7</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Cancele quando quiser</span>
          </div>
        </div>

        {/* Segurança */}
        <div className="flex items-start gap-2 bg-muted/30 rounded-lg p-3">
          <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Pagamento 100% seguro via Stripe. Renovação automática mensal.
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <Button 
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 h-12"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button 
            onClick={onConfirm}
            className="flex-1 h-12"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Assinar Agora"
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Ao assinar, você concorda com os{" "}
          <a href="/terms" className="text-primary hover:underline">Termos de Serviço</a>
        </p>
      </CardContent>
    </Card>
  );
}
