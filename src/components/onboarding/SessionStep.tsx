import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

interface SessionStepProps {
  sessionName: string;
  setSessionName: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  showBack?: boolean;
}

export function SessionStep({ 
  sessionName, 
  setSessionName, 
  onNext, 
  onBack, 
  isLoading,
  showBack = true 
}: SessionStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <Card className="border-2 border-border/50 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Nome da sua sessão WhatsApp</CardTitle>
        <CardDescription>
          Escolha um nome para identificar esta conexão
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionName">Nome da sessão</Label>
            <Input
              id="sessionName"
              placeholder="Ex: atendimento"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value.toLowerCase().replace(/\s/g, '-'))}
              autoFocus
              className="h-12 text-lg"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Use apenas letras minúsculas, números e hífen. Ex: vendas-loja1
            </p>
          </div>

          <div className="flex gap-3">
            {showBack && (
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
            )}
            <Button 
              type="submit"
              className={showBack ? "flex-1 h-12" : "w-full h-12"}
              disabled={isLoading || !sessionName.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aguarde...
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
