import { useState } from "react";
import { Copy, Check, Key } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface BearerTokenSheetProps {
  sessions: Array<{
    id: string;
    name: string;
    api_token: string;
  }>;
}

export function BearerTokenSheet({ sessions }: BearerTokenSheetProps) {
  const [copied, setCopied] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || "");

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const token = selectedSession?.api_token || "";

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (sessions.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 w-full sm:w-auto justify-center">
          <Key className="h-4 w-4" />
          Ver Token da API
          <Badge variant="secondary" className="ml-1">
            {sessions.length}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-96">
        <SheetHeader>
          <SheetTitle>Bearer Token</SheetTitle>
          <SheetDescription>
            Token de autenticação da API WhatsApp
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {sessions.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione a sessão:</label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma sessão" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {sessions.length === 1 && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Sessão:</label>
              <p className="text-sm text-muted-foreground">{selectedSession?.name}</p>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <code className="text-xs break-all font-mono">{token}</code>
          </div>

          <Button onClick={handleCopy} className="w-full gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Token
              </>
            )}
          </Button>

          <Separator />

          <div className="space-y-3 text-sm">
            <h4 className="font-semibold">Como usar:</h4>
            <div>
              <p className="text-muted-foreground mb-2">
                Adicione o token no header Authorization:
              </p>
              <code className="bg-muted p-2 rounded block text-xs overflow-x-auto">
                Authorization: Bearer {token.substring(0, 20)}...
              </code>
            </div>
            <div>
              <p className="text-muted-foreground mb-2">Exemplo com cURL:</p>
              <code className="bg-muted p-2 rounded block text-xs overflow-x-auto">
                curl -X POST \<br />
                &nbsp;&nbsp;-H "Authorization: Bearer TOKEN" \<br />
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                &nbsp;&nbsp;URL_DA_API
              </code>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
