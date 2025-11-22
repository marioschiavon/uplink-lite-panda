import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language: 'bash' | 'javascript' | 'python' | 'php' | 'json';
  title?: string;
  showCopy?: boolean;
}

export function CodeBlock({ code, language, title, showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languageColors = {
    bash: 'text-green-400',
    javascript: 'text-yellow-400',
    python: 'text-blue-400',
    php: 'text-purple-400',
    json: 'text-orange-400',
  };

  return (
    <div className="relative rounded-lg border bg-muted/50 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/80">
          <span className={cn("text-sm font-mono font-semibold", languageColors[language])}>
            {title || language.toUpperCase()}
          </span>
          {showCopy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  <span className="text-xs">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  <span className="text-xs">Copiar</span>
                </>
              )}
            </Button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm">
          <code className="font-mono text-foreground">{code}</code>
        </pre>
      </div>
    </div>
  );
}