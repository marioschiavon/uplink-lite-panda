import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { QrCode, Play, Trash2 } from "lucide-react";

interface SessionData {
  id: string;
  name: string;
  api_session: string | null;
  api_token: string | null;
  api_token_full: string | null;
  status: string | null;
  qr: string | null;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}

interface SessionStatus {
  status: boolean;
  message?: string;
  qrCode?: string;
}

interface SessionManagementCardProps {
  session: SessionData;
  status: SessionStatus | null;
  onViewQr: () => void;
  onStartSession: () => void;
  onDelete: () => void;
}

const SessionManagementCard = ({ 
  session, 
  status,
  onViewQr,
  onStartSession,
  onDelete
}: SessionManagementCardProps) => {
  const getStatusConfig = () => {
    if (status?.status === true) {
      return {
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950',
        label: 'Online',
        emoji: '🟢'
      };
    }
    
    if (status?.qrCode || status?.message?.toUpperCase() === 'QRCODE') {
      return {
        color: 'bg-yellow-500',
        textColor: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        label: 'QR Code',
        emoji: '🟡'
      };
    }
    
    return {
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950',
      label: 'Offline',
      emoji: '🔴'
    };
  };

  const statusConfig = getStatusConfig();
  const isOnline = status?.status === true;
  const hasQrCode = status?.qrCode || status?.message?.toUpperCase() === 'QRCODE';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="hover:shadow-lg transition-all border-2 hover:border-primary/50 h-full flex flex-col">
        <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
              <span className={`inline-block w-2 h-2 rounded-full ${statusConfig.color} mr-2 animate-pulse`} />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Nome da Sessão */}
          <div className="flex-1">
            <h3 className="font-bold text-lg truncate">{session.name}</h3>
            <p className="text-sm text-muted-foreground truncate font-mono">
              {session.api_session || 'Sem sessão configurada'}
            </p>
          </div>

          {/* Informações */}
          {session.updated_at && (
            <div className="text-xs text-muted-foreground">
              Atualizado{' '}
              {formatDistanceToNow(new Date(session.updated_at), {
                addSuffix: true,
                locale: ptBR
              })}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="space-y-2 pt-2 border-t">
            {hasQrCode && (
              <Button
                onClick={onViewQr}
                className="w-full gap-2"
                variant="default"
              >
                <QrCode className="w-4 h-4" />
                Ver QR Code
              </Button>
            )}
            
            {!isOnline && !hasQrCode && (
              <Button
                onClick={onStartSession}
                className="w-full gap-2"
                variant="default"
              >
                <Play className="w-4 h-4" />
                Iniciar Sessão
              </Button>
            )}

            {isOnline && (
              <Button
                onClick={onViewQr}
                className="w-full gap-2"
                variant="outline"
              >
                Ver Detalhes
              </Button>
            )}
            
            <Button
              onClick={onDelete}
              className="w-full gap-2"
              variant="destructive"
              size="sm"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SessionManagementCard;
