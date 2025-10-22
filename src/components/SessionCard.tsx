import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

interface SessionData {
  id: string;
  name: string;
  api_session: string | null;
  api_token: string | null;
  plan: string | null;
  created_at: string;
  updated_at: string;
  status?: 'online' | 'offline' | 'qrcode' | 'loading' | 'no-session';
  statusMessage?: string;
}

interface SessionCardProps {
  session: SessionData;
  onClick: () => void;
}

const SessionCard = ({ session, onClick }: SessionCardProps) => {
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
      case 'no-session':
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-950',
          label: 'Sem Sessão',
          emoji: '⚪'
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-950',
          label: 'Carregando...',
          emoji: '⚫'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
        <CardContent className="p-6 space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
              <span className={`inline-block w-2 h-2 rounded-full ${statusConfig.color} mr-2 animate-pulse`} />
              {statusConfig.label}
            </Badge>
            {session.plan && (
              <Badge variant="outline" className="text-xs">
                {session.plan}
              </Badge>
            )}
          </div>

          {/* Nome da Organização */}
          <div>
            <h3 className="font-bold text-lg truncate">{session.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {session.api_session || 'Sem sessão configurada'}
            </p>
          </div>

          {/* Informações */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>📱</span>
              <span className="truncate">
                Sessão: {session.api_session || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>⏰</span>
              <span>
                Atualizado{' '}
                {formatDistanceToNow(new Date(session.updated_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
            </div>
          </div>

          {/* Botão Ver Detalhes */}
          <Button
            onClick={onClick}
            className="w-full"
            variant="outline"
            disabled={session.status === 'no-session'}
          >
            Ver Detalhes
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SessionCard;
