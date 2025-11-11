import { Plus, Send, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onNewSession: () => void;
  onSendMessage: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function QuickActions({
  onNewSession,
  onSendMessage,
  onRefresh,
  isRefreshing = false,
}: QuickActionsProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      <Button size="lg" onClick={onNewSession} className="gap-2">
        <Plus className="h-4 w-4" />
        Nova Sessão
      </Button>
      <Button size="lg" variant="outline" onClick={onSendMessage} className="gap-2">
        <Send className="h-4 w-4" />
        Enviar Mensagem Teste
      </Button>
      <Button
        size="lg"
        variant="outline"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        Atualizar Status
      </Button>
    </div>
  );
}
