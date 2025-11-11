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

interface BearerTokenSheetProps {
  token: string;
  sessionName: string;
}

export function BearerTokenSheet({ token, sessionName }: BearerTokenSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Key className="h-4 w-4" />
          Ver Token da API
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-96">
        <SheetHeader>
          <SheetTitle>Bearer Token</SheetTitle>
          <SheetDescription>
            Token de autenticação para: {sessionName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
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
