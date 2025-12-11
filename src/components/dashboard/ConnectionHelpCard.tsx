import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, X, Play, Smartphone, QrCode, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface ConnectionHelpCardProps {
  onDismiss: () => void;
  sessionName?: string;
}

export function ConnectionHelpCard({ onDismiss, sessionName }: ConnectionHelpCardProps) {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      icon: Play,
      text: (
        <>
          Vá em <strong>Sessões</strong> e clique em <strong>Iniciar Sessão</strong>
        </>
      )
    },
    {
      number: 2,
      icon: Smartphone,
      text: (
        <>
          No celular, abra o <strong>WhatsApp</strong>
        </>
      )
    },
    {
      number: 3,
      icon: Settings,
      text: (
        <>
          Vá em <strong>Menu (⋮)</strong> → <strong>Dispositivos conectados</strong>
        </>
      )
    },
    {
      number: 4,
      icon: QrCode,
      text: (
        <>
          Toque em <strong>Conectar dispositivo</strong> e escaneie o <strong>QR Code</strong>
        </>
      )
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {sessionName 
                  ? `🎉 Sessão "${sessionName}" criada!` 
                  : "Precisa de ajuda para conectar?"
                }
              </CardTitle>
              <CardDescription>
                Siga os passos abaixo para conectar seu WhatsApp
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDismiss}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center gap-3 text-sm">
              <Badge 
                variant="secondary" 
                className="w-7 h-7 flex items-center justify-center rounded-full shrink-0 bg-primary/20 text-primary font-semibold"
              >
                {step.number}
              </Badge>
              <step.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-foreground">{step.text}</span>
            </div>
          ))}
          
          <div className="flex gap-2 pt-3 border-t border-border/50 mt-4">
            <Button 
              onClick={() => navigate("/sessions")} 
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Ir para Sessões
            </Button>
            <Button variant="outline" onClick={onDismiss}>
              Entendi
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
