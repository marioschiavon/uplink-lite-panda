import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Info, Webhook, Construction } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";

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
  webhook_url?: string | null;
  webhook_enabled?: boolean;
  webhook_events?: string[];
}

interface SessionDetailsModalProps {
  session: SessionData | null;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const SessionDetailsModal = ({ session, open, onClose, onRefresh }: SessionDetailsModalProps) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith('pt') ? ptBR : enUS;

  if (!session) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const getStatusConfig = () => {
    switch (session.status) {
      case 'online':
        return {
          color: 'bg-primary',
          textColor: 'text-primary',
          bgColor: 'bg-primary/10',
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
          color: 'bg-destructive',
          textColor: 'text-destructive',
          bgColor: 'bg-destructive/10',
          label: 'Offline',
          emoji: '🔴'
        };
      default:
        return {
          color: 'bg-muted',
          textColor: 'text-muted-foreground',
          bgColor: 'bg-muted',
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
            {t('sessions.sessionDetails') || 'Detalhes da Sessão'}: {session.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              {t('common.info') || 'Informações'}
            </TabsTrigger>
            <TabsTrigger value="webhook" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhook
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6 mt-4">
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
                📋 {t('common.generalInfo') || 'Informações Gerais'}
              </h3>
              <div className="space-y-2 text-sm bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono text-xs">{session.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.name') || 'Nome'}:</span>
                  <span className="font-medium">{session.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.plan') || 'Plano'}:</span>
                  <span className="font-medium">{session.plan || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.createdAt') || 'Criado em'}:</span>
                  <span>
                    {format(new Date(session.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: dateLocale })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.updatedAt') || 'Atualizado em'}:</span>
                  <span>
                    {format(new Date(session.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: dateLocale })}
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
                  🔐 {t('common.credentials') || 'Credenciais'}
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
                📊 {t('common.apiUsage') || 'Uso da API'}
              </h3>
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('common.messagesSent') || 'Mensagens Enviadas'}:</span>
                  <span className="font-medium">
                    {session.api_message_usage || 0} / {session.api_message_limit || 0}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('common.progress') || 'Progresso'}</span>
                    <span>{usagePercentage}%</span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                </div>
              </div>
            </div>

            {/* Limites */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                ⚙️ {t('common.limits') || 'Limites'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">{t('common.sessions') || 'Sessões'}</div>
                  <div className="text-2xl font-bold">{session.session_limit || 0}</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">{t('common.agents') || 'Agentes'}</div>
                  <div className="text-2xl font-bold">{session.agent_limit || 0}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="webhook" className="mt-4">
            <Card className="border-border">
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="p-4 rounded-full bg-accent">
                  <Construction className="h-12 w-12 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold">{t('webhooks.underConstruction')}</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {t('webhooks.underConstructionDescription')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>{t('common.close') || 'Fechar'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionDetailsModal;
