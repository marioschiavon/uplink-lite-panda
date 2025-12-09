import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  notification_phone?: string | null;
  status?: 'online' | 'offline' | 'qrcode' | 'loading' | 'no-session';
  statusMessage?: string;
}

interface SessionDetailsModalProps {
  session: SessionData | null;
  open: boolean;
  onClose: () => void;
}

const SessionDetailsModal = ({ session, open, onClose }: SessionDetailsModalProps) => {
  if (!session) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const getStatusConfig = () => {
    switch (session.status) {
      case 'online':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
          label: 'Online',
          emoji: '🟢'
        };
      case 'qrcode':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          label: 'QR Code',
          emoji: '🟡'
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950',
          label: 'Offline',
          emoji: '🔴'
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-950',
          label: 'Desconhecido',
          emoji: '⚪'
        };
    }
  };

  const statusConfig = getStatusConfig();

  const usagePercentage = session.api_message_limit
    ? Math.round(((session.api_message_usage || 0) / session.api_message_limit) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Detalhes da Sessão: {session.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div>
            <h3 className="font-semibold mb-2">Status</h3>
            <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0 text-base px-4 py-2`}>
              <span className={`inline-block w-3 h-3 rounded-full ${statusConfig.color} mr-2 animate-pulse`} />
              {statusConfig.label}
            </Badge>
            {session.statusMessage && (
              <p className="text-sm text-muted-foreground mt-2">
                {session.statusMessage}
              </p>
            )}
          </div>

          {/* Informações Gerais */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              📋 Informações Gerais
            </h3>
            <div className="space-y-2 text-sm bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-xs">{session.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{session.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plano:</span>
                <span className="font-medium">{session.plan || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em:</span>
                <span>
                  {format(new Date(session.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atualizado em:</span>
                <span>
                  {format(new Date(session.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              {session.notification_phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">📱 Tel. Notificação:</span>
                  <span className="font-mono">{session.notification_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Credenciais */}
          {session.api_session && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                🔐 Credenciais
              </h3>
              <div className="space-y-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">API Session</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(session.api_session!, "API Session")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="text-xs break-all">{session.api_session}</code>
                </div>

                {session.api_token && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">API Token</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(session.api_token!, "API Token")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <code className="text-xs break-all">{session.api_token.substring(0, 50)}...</code>
                  </div>
                )}

                {session.api_token_full && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Token Full</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(session.api_token_full!, "Token Full")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <code className="text-xs break-all">{session.api_token_full.substring(0, 50)}...</code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Uso da API */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              📊 Uso da API
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mensagens Enviadas:</span>
                <span className="font-medium">
                  {session.api_message_usage || 0} / {session.api_message_limit || 0}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progresso</span>
                  <span>{usagePercentage}%</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>
            </div>
          </div>

          {/* Limites */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              ⚙️ Limites
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Sessões</div>
                <div className="text-2xl font-bold">{session.session_limit || 0}</div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Agentes</div>
                <div className="text-2xl font-bold">{session.agent_limit || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionDetailsModal;
