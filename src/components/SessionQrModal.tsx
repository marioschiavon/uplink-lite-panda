import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, RefreshCw, XCircle, Trash2, Loader2, Server, Settings, ChevronDown, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";

interface SessionData {
  id: string;
  name: string;
  api_session: string | null;
  api_token: string | null;
  api_token_full: string | null;
  status: string | null;
  qr: string | null;
  organization_id: string;
}

interface SessionStatus {
  status: boolean;
  message?: string;
  qrCode?: string;
}

interface SessionQrModalProps {
  session: SessionData | null;
  status: SessionStatus | null;
  open: boolean;
  onClose: () => void;
  onRefreshQr: () => void;
  onCloseSession: () => void;
  onLogoutSession: () => void;
  refreshingQr?: boolean;
  closingSession?: boolean;
  loggingOut?: boolean;
  generatingQrCode?: boolean;
  qrExpiresIn?: number | null;
}

const SessionQrModal = ({ 
  session, 
  status, 
  open, 
  onClose,
  onRefreshQr,
  onCloseSession,
  onLogoutSession,
  refreshingQr = false,
  closingSession = false,
  loggingOut = false,
  generatingQrCode = false,
  qrExpiresIn = null
}: SessionQrModalProps) => {
  const [showAdvancedActions, setShowAdvancedActions] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'close' | 'delete' | null>(null);

  if (!session) return null;

  const handleCopyToken = () => {
    if (session.api_token) {
      navigator.clipboard.writeText(session.api_token);
      toast.success("Token copiado!");
    }
  };

  const isConnected = status?.status === true && status?.message?.toUpperCase() === 'CONNECTED';
  const hasQrCode = status?.qrCode && !isConnected;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {session.name}
          </DialogTitle>
          <DialogDescription>
            Sessão: <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{session.api_session}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={isConnected ? "default" : "secondary"} className="gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
              {isConnected ? 'Conectado' : hasQrCode ? 'Aguardando QR Code' : 'Desconectado'}
            </Badge>
          </div>

          {/* QR Code Display */}
          {generatingQrCode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-8 text-primary"
            >
              <RefreshCw className="w-8 h-8 animate-spin" />
              <span className="font-medium">Gerando QR Code, aguarde...</span>
            </motion.div>
          )}

          {!generatingQrCode && hasQrCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <img 
                  src={status.qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64"
                />
              </div>

              {/* Contador de expiração */}
              {qrExpiresIn !== null && qrExpiresIn > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <p className="text-muted-foreground">
                    QR Code expira em <span className="font-bold text-foreground">{qrExpiresIn}s</span>
                  </p>
                </div>
              )}

              <p className="text-sm text-muted-foreground text-center">
                Escaneie o QR Code com seu WhatsApp para conectar
              </p>

              <Button
                onClick={onRefreshQr}
                variant="outline"
                disabled={refreshingQr}
                className="gap-2"
              >
                {refreshingQr ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Renovar QR Code
              </Button>
            </motion.div>
          )}

          {/* Connected State */}
          {!generatingQrCode && isConnected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-4">
                  <Server className="w-8 h-8 text-primary-foreground" />
                </div>
                <p className="text-lg font-semibold">Sessão Conectada!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Seu WhatsApp está online e pronto para uso
                </p>
              </div>

              {/* API Token */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bearer Token</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyToken}
                    className="gap-2"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </Button>
                </div>
                <code className="text-xs bg-muted px-3 py-2 rounded-md block overflow-x-auto break-all">
                  {session.api_token}
                </code>
                <p className="text-xs text-muted-foreground">
                  Use este token no header: <code className="bg-muted px-1 py-0.5 rounded">Authorization: Bearer {session.api_token}</code>
                </p>
              </div>
            </motion.div>
          )}

          {/* Não conectado e sem QR Code */}
          {!generatingQrCode && !hasQrCode && !isConnected && (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Sessão desconectada</p>
              <p className="text-sm mt-2">Clique em "Iniciar Sessão" para conectar</p>
            </div>
          )}
        </div>

        {/* Advanced Actions - Collapsible */}
        <Collapsible open={showAdvancedActions} onOpenChange={setShowAdvancedActions}>
          <div className="border-t pt-4">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <Settings className="w-4 h-4 mr-2" />
                Ações Avançadas
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showAdvancedActions ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-3 pt-4">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Atenção: Estas ações afetam sua sessão WhatsApp
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmAction('close')}
                  disabled={closingSession || !isConnected}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  {closingSession ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Fechando...
                    </>
                  ) : (
                    'Fechar Sessão'
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmAction('delete')}
                  disabled={loggingOut}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  {loggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    'Excluir Sessão'
                  )}
                </Button>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                {confirmAction === 'delete' ? 'Excluir Sessão?' : 'Fechar Sessão?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction === 'delete' 
                  ? 'Esta ação é permanente e não pode ser desfeita. A sessão será completamente removida e você precisará criar uma nova sessão para reconectar.'
                  : 'Isso irá desconectar seu WhatsApp desta sessão. Você precisará escanear o QR Code novamente para reconectar.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (confirmAction === 'delete') {
                    onLogoutSession();
                  } else {
                    onCloseSession();
                  }
                  setConfirmAction(null);
                }}
                className={confirmAction === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
              >
                {confirmAction === 'delete' ? 'Excluir Permanentemente' : 'Confirmar Fechamento'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default SessionQrModal;
