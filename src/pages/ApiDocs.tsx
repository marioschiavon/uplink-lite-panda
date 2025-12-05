import { motion } from "framer-motion";
import { BookOpen, Shield, Code2, Zap, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EndpointCard } from "@/components/api-docs/EndpointCard";
import { CodeBlock } from "@/components/api-docs/CodeBlock";
import { SEO } from "@/components/SEO";

const ApiDocs = () => {
  const commonErrors = [
    { code: "401", message: "Unauthorized", solution: "Verifique se o Bearer Token está correto" },
    { code: "404", message: "Session not found", solution: "Sessão não existe ou foi deletada" },
    { code: "400", message: "Invalid phone number", solution: "Formato do número está incorreto (use DDI)" },
    { code: "503", message: "Session not connected", solution: "Sessão está offline, conecte novamente" },
  ];

  return (
    <>
      <SEO 
        title="Documentação da API WhatsApp | Uplink"
        description="Documentação completa da API WhatsApp Uplink. Aprenda a enviar mensagens, mídias e integrar com n8n, Make, Zapier. Exemplos em JavaScript, Python e PHP."
        canonical="https://uplinklite.com/api-docs"
      />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <h1 className="text-3xl font-bold">Documentação da API WhatsApp Uplink</h1>
              <p className="text-muted-foreground">
                Integre o WhatsApp nas suas aplicações com nossa API REST completa
              </p>
            </div>
            <Badge variant="outline" className="ml-auto">
              v1.0
            </Badge>
          </div>

          {/* Authentication Section */}
          <Alert className="border-primary/50 bg-primary/5">
            <Shield className="h-4 w-4" aria-hidden="true" />
            <AlertTitle className="font-semibold">Autenticação da API WhatsApp</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Todas as requisições requerem autenticação via <strong>Bearer Token</strong>. 
                Obtenha seu token no Dashboard → Ferramentas → Ver Bearer Token.
              </p>
              <code className="block bg-muted px-3 py-2 rounded text-sm mt-2">
                Authorization: Bearer seu-token-aqui
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ <strong>IMPORTANTE:</strong> Nunca compartilhe seu Bearer Token publicamente! 
                Ele dá acesso total à sua sessão WhatsApp.
              </p>
            </AlertDescription>
          </Alert>
        </motion.header>

        {/* Tabs Section */}
        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="messages">Enviar Mensagens</TabsTrigger>
            <TabsTrigger value="examples">Exemplos de Código</TabsTrigger>
          </TabsList>

          {/* Tab: Send Messages */}
          <TabsContent value="messages" className="space-y-6">
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
              aria-labelledby="send-messages-heading"
            >
              <h2 id="send-messages-heading" className="sr-only">Endpoints para envio de mensagens WhatsApp</h2>
              
              {/* Send Text Message */}
              <EndpointCard
                method="POST"
                endpoint="/api/{session}/send-message"
                description="Enviar Mensagem de Texto via API WhatsApp"
                parameters={[
                  { name: "phone", type: "string", required: true, description: "Número com DDI", example: "5511999999999" },
                  { name: "message", type: "string", required: true, description: "Texto da mensagem", example: "Olá, tudo bem?" },
                  { name: "isGroup", type: "boolean", required: false, description: "Se é grupo (default: false)" },
                  { name: "isNewsletter", type: "boolean", required: false, description: "Se é canal (default: false)" },
                ]}
                requestExample={`curl -X POST "https://api.uplinklite.com/api/sua-sessao/send-message" \\
  -H "Authorization: Bearer seu-token-aqui" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "message": "Olá! Esta é uma mensagem de teste.",
    "isGroup": false
  }'`}
                responseExample={`{
  "success": true,
  "message": "Mensagem enviada com sucesso",
  "messageId": "WAM123456789"
}`}
                errorCodes={commonErrors}
              />

              {/* Send Media */}
              <EndpointCard
                method="POST"
                endpoint="/api/{session}/send-media"
                description="Enviar Mídia (Imagem/Áudio/Documento) via API WhatsApp"
                parameters={[
                  { name: "phone", type: "string", required: true, description: "Número com DDI", example: "5511999999999" },
                  { name: "mediaUrl", type: "string", required: true, description: "URL pública da mídia", example: "https://exemplo.com/imagem.jpg" },
                  { name: "mediaType", type: "string", required: true, description: "Tipo: image, audio, document", example: "image" },
                  { name: "caption", type: "string", required: false, description: "Legenda (para imagem)" },
                  { name: "filename", type: "string", required: false, description: "Nome do arquivo (para documento)" },
                ]}
                requestExample={`# Exemplo 1: Enviar IMAGEM
curl -X POST "https://api.uplinklite.com/api/sua-sessao/send-media" \\
  -H "Authorization: Bearer seu-token-aqui" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "mediaUrl": "https://exemplo.com/foto.jpg",
    "mediaType": "image",
    "caption": "Confira esta imagem!"
  }'

# Exemplo 2: Enviar ÁUDIO
curl -X POST "https://api.uplinklite.com/api/sua-sessao/send-media" \\
  -H "Authorization: Bearer seu-token-aqui" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "mediaUrl": "https://exemplo.com/audio.mp3",
    "mediaType": "audio"
  }'

# Exemplo 3: Enviar DOCUMENTO/ARQUIVO
curl -X POST "https://api.uplinklite.com/api/sua-sessao/send-media" \\
  -H "Authorization: Bearer seu-token-aqui" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "mediaUrl": "https://exemplo.com/relatorio.pdf",
    "mediaType": "document",
    "filename": "relatorio.pdf"
  }'`}
                responseExample={`{
  "success": true,
  "message": "Mídia enviada com sucesso",
  "messageId": "WAM987654321"
}`}
              />
            </motion.section>
          </TabsContent>

          {/* Tab: Examples */}
          <TabsContent value="examples" className="space-y-6">
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
              aria-labelledby="code-examples-heading"
            >
              <h2 id="code-examples-heading" className="sr-only">Exemplos de código para integração com a API WhatsApp</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" aria-hidden="true" />
                    JavaScript / Node.js - Integração API WhatsApp
                  </CardTitle>
                  <CardDescription>Exemplo usando Axios para enviar mensagens WhatsApp</CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    language="javascript"
                    code={`const axios = require('axios');

const sendMessage = async () => {
  try {
    const response = await axios.post(
      'https://api.uplinklite.com/api/sua-sessao/send-message',
      {
        phone: '5511999999999',
        message: 'Olá! Esta é uma mensagem de teste.',
        isGroup: false
      },
      {
        headers: {
          'Authorization': 'Bearer seu-token-aqui',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Mensagem enviada:', response.data);
  } catch (error) {
    console.error('❌ Erro:', error.response?.data);
  }
};

sendMessage();`}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" aria-hidden="true" />
                    Python - Integração API WhatsApp
                  </CardTitle>
                  <CardDescription>Exemplo usando Requests para automação WhatsApp</CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    language="python"
                    code={`import requests

def send_message():
    url = 'https://api.uplinklite.com/api/sua-sessao/send-message'
    headers = {
        'Authorization': 'Bearer seu-token-aqui',
        'Content-Type': 'application/json'
    }
    data = {
        'phone': '5511999999999',
        'message': 'Olá! Esta é uma mensagem de teste.',
        'isGroup': False
    }
    
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 200:
        print('✅ Resposta:', response.json())
    else:
        print('❌ Erro:', response.text)

send_message()`}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>PHP - Integração API WhatsApp</CardTitle>
                  <CardDescription>Exemplo usando cURL para enviar mensagens WhatsApp</CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    language="php"
                    code={`<?php
$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://api.uplinklite.com/api/sua-sessao/send-message',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => array(
    'Authorization: Bearer seu-token-aqui',
    'Content-Type: application/json'
  ),
  CURLOPT_POSTFIELDS => json_encode(array(
    'phone' => '5511999999999',
    'message' => 'Olá! Esta é uma mensagem de teste.',
    'isGroup' => false
  ))
));

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($httpCode == 200) {
    echo "✅ Resposta: " . $response;
} else {
    echo "❌ Erro: " . $response;
}
?>`}
                  />
                </CardContent>
              </Card>
            </motion.section>
          </TabsContent>
        </Tabs>

        {/* How to Get Token */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          aria-labelledby="get-token-heading"
        >
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle id="get-token-heading" className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                Como Obter seu Bearer Token da API WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">📍 Opção 1: Via Dashboard (Rápido)</h3>
                <ol className="space-y-2 list-decimal list-inside text-sm ml-2">
                  <li>Acesse o <strong>Dashboard</strong></li>
                  <li>Clique em <strong>"Ferramentas"</strong></li>
                  <li>Clique em <strong>"Ver Token da API"</strong></li>
                  <li>Selecione a sessão desejada no dropdown (se houver múltiplas)</li>
                  <li>Copie o token</li>
                </ol>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">📍 Opção 2: Via Detalhes da Sessão</h3>
                <ol className="space-y-2 list-decimal list-inside text-sm ml-2">
                  <li>Vá para <strong>Sessões → Minhas Sessões</strong></li>
                  <li>Selecione a sessão desejada</li>
                  <li>Clique em <strong>"Ver Detalhes"</strong></li>
                  <li>Na seção <strong>"Credenciais da API"</strong>, copie o <strong>API Token</strong></li>
                </ol>
              </div>

              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>Segurança</AlertTitle>
                <AlertDescription>
                  Nunca compartilhe seu Bearer Token publicamente! 
                  Ele dá acesso total à sua sessão WhatsApp.
                </AlertDescription>
              </Alert>
              
              <div className="bg-muted p-3 rounded-lg mt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  💡 <strong>Dica:</strong> Use o header no formato:
                </p>
                <code className="block bg-background px-3 py-2 rounded text-xs">
                  Authorization: Bearer seu-token-aqui
                </code>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </>
  );
};

export default ApiDocs;
