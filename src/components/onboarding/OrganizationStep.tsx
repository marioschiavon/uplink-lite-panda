import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, ArrowRight } from "lucide-react";

interface OrganizationStepProps {
  orgName: string;
  setOrgName: (name: string) => void;
  onNext: () => void;
  isLoading: boolean;
}

export function OrganizationStep({ orgName, setOrgName, onNext, isLoading }: OrganizationStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <Card className="border-2 border-border/50 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Como se chama sua empresa?</CardTitle>
        <CardDescription>
          Esse nome aparecerá no seu painel e relatórios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Nome da organização</Label>
            <Input
              id="orgName"
              placeholder="Ex: Minha Loja"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              autoFocus
              className="h-12 text-lg"
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit"
            className="w-full h-12 text-base"
            disabled={isLoading || !orgName.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
