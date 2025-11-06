import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Info } from "lucide-react";
import { toast } from "sonner";

interface CreateSessionModalProps {
  open: boolean;
  onSessionCreated: (sessionName: string) => void;
  onClose: () => void;
}

const CreateSessionModal = ({ open, onSessionCreated, onClose }: CreateSessionModalProps) => {
  const [sessionName, setSessionName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateSessionName = (name: string): string | null => {
    if (!name || name.trim().length === 0) {
      return "O nome da sessão é obrigatório";
    }
    
    if (name.length < 3) {
      return "O nome deve ter pelo menos 3 caracteres";
    }
    
    if (name.length > 50) {
      return "O nome deve ter no máximo 50 caracteres";
    }
    
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(name)) {
      return "Use apenas letras, números, hífens (-) e underscores (_)";
    }
    
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateSessionName(sessionName);
    if (error) {
      toast.error(error);
      return;
    }
    
    setIsSubmitting(true);
    onSessionCreated(sessionName);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSessionName("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Criar Nova Sessão WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escolha um nome para identificar sua sessão
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sessionName">Nome da Sessão</Label>
            <Input
              id="sessionName"
              placeholder="Ex: vendas-sp, suporte_2024"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              disabled={isSubmitting}
              className="font-mono"
              autoFocus
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Use apenas letras, números, hífens (-) e underscores (_)</p>
                <p className="text-xs">Exemplos:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  <li>vendas-sp</li>
                  <li>suporte_2024</li>
                  <li>atendimento-rj</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Sessão"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSessionModal;
