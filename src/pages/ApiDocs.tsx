import { motion } from "framer-motion";
import { BookOpen, Shield, Code2, Zap, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EndpointCard } from "@/components/api-docs/EndpointCard";
import { CodeBlock } from "@/components/api-docs/CodeBlock";

const ApiDocs = () => {
  const commonErrors = [
    { code: "401", message: "Unauthorized", solution: "Verifique se o Bearer Token está correto" },
    { code: "404", message: "Session not found", solution: "Sessão não existe ou foi deletada" },
    { code: "400", message: "Invalid phone number", solution: "Formato do número está incorreto (use DDI)" },
    { code: "503", message: "Session not connected", solution: "Sessão está offline, conecte novamente" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">API de Mensagens WhatsApp</h1>
            <p className="text-muted-foreground">
              Integre o WhatsApp nas suas aplicações com nossa API REST
            </p>
          </div>
          <Badge variant="outline" className="ml-auto">
            v1.0
          </Badge>
        </div>

        {/* Authentication Section */}
        <Alert className="border-primary/50 bg-primary/5">
          <Shield className="h-4 w-4" />
          <AlertTitle className="font-semibold">Autenticação</AlertTitle>
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
      </motion.div>

      {/* Tabs Section */}
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages">Enviar Mensagens</TabsTrigger>
          <TabsTrigger value="status">Verificar Status</TabsTrigger>
          <TabsTrigger value="examples">Exemplos de Código</TabsTrigger>
        </TabsList>

        {/* Tab: Send Messages */}
        <TabsContent value="messages" className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Send Text Message */}
            <EndpointCard
              method="POST"
              endpoint="/api/{session}/send-message"
              description="Enviar Mensagem de Texto"
              parameters={[
                { name: "phone", type: "string", required: true, description: "Número com DDI", example: "5511999999999" },
                { name: "message", type: "string", required: true, description: "Texto da mensagem", example: "Olá, tudo bem?" },
                { name: "isGroup", type: "boolean", required: false, description: "Se é grupo (default: false)" },
                { name: "isNewsletter", type: "boolean", required: false, description: "Se é canal (default: false)" },
              ]}
              requestExample={`curl -X POST "https://wpp.panda42.com.br/api/sua-sessao/send-message" \\
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
              description="Enviar Mídia (Imagem/Vídeo/Documento)"
              parameters={[
                { name: "phone", type: "string", required: true, description: "Número com DDI", example: "5511999999999" },
                { name: "mediaUrl", type: "string", required: true, description: "URL pública da mídia", example: "https://exemplo.com/imagem.jpg" },
                { name: "mediaType", type: "string", required: true, description: "Tipo de mídia", example: "image, video, document, audio" },
                { name: "caption", type: "string", required: false, description: "Legenda da mídia" },
                { name: "filename", type: "string", required: false, description: "Nome do arquivo (para documentos)" },
              ]}
              requestExample={`curl -X POST "https://wpp.panda42.com.br/api/sua-sessao/send-media" \\
  -H "Authorization: Bearer seu-token-aqui" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "mediaUrl": "https://exemplo.com/imagem.jpg",
    "mediaType": "image",
    "caption": "Confira esta imagem!"
  }'`}
              responseExample={`{
  "success": true,
  "message": "Mídia enviada com sucesso",
  "messageId": "WAM987654321"
}`}
            />

            {/* Send Buttons */}
            <EndpointCard
              method="POST"
              endpoint="/api/{session}/send-buttons"
              description="Enviar Mensagem com Botões"
              parameters={[
                { name: "phone", type: "string", required: true, description: "Número com DDI", example: "5511999999999" },
                { name: "message", type: "string", required: true, description: "Texto da mensagem" },
                { name: "buttons", type: "array", required: true, description: "Array de até 3 botões" },
                { name: "footer", type: "string", required: false, description: "Rodapé da mensagem" },
              ]}
              requestExample={`curl -X POST "https://wpp.panda42.com.br/api/sua-sessao/send-buttons" \\
  -H "Authorization: Bearer seu-token-aqui" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "message": "Escolha uma opção:",
    "buttons": [
      { "id": "1", "text": "Opção 1" },
      { "id": "2", "text": "Opção 2" },
      { "id": "3", "text": "Opção 3" }
    ],
    "footer": "Powered by Panda42"
  }'`}
              responseExample={`{
  "success": true,
  "message": "Botões enviados com sucesso",
  "messageId": "WAM456789123"
}`}
            />
          </motion.div>
        </TabsContent>

        {/* Tab: Status */}
        <TabsContent value="status" className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <EndpointCard
              method="GET"
              endpoint="/api/{session}/check-connection-session"
              description="Verificar Status da Sessão"
              requestExample={`curl -X GET "https://wpp.panda42.com.br/api/sua-sessao/check-connection-session" \\
  -H "Authorization: Bearer seu-token-aqui"`}
              responseExample={`// Sessão Conectada
{
  "status": true,
  "message": "CONNECTED",
  "qrCode": null
}

// Aguardando QR Code
{
  "status": false,
  "message": "QRCODE",
  "qrCode": "data:image/png;base64,iVBORw0KG..."
}`}
              errorCodes={[
                { code: "401", message: "Unauthorized", solution: "Verifique seu Bearer Token" },
                { code: "404", message: "Session not found", solution: "Sessão não existe" },
              ]}
            />
          </motion.div>
        </TabsContent>

        {/* Tab: Examples */}
        <TabsContent value="examples" className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  JavaScript / Node.js
                </CardTitle>
                <CardDescription>Exemplo usando Axios</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  language="javascript"
                  code={`const axios = require('axios');

const sendMessage = async () => {
  try {
    const response = await axios.post(
      'https://wpp.panda42.com.br/api/sua-sessao/send-message',
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
                  <Zap className="h-5 w-5" />
                  Python
                </CardTitle>
                <CardDescription>Exemplo usando Requests</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  language="python"
                  code={`import requests

def send_message():
    url = 'https://wpp.panda42.com.br/api/sua-sessao/send-message'
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
                <CardTitle>PHP</CardTitle>
                <CardDescription>Exemplo usando cURL</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  language="php"
                  code={`<?php
$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://wpp.panda42.com.br/api/sua-sessao/send-message',
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
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* How to Get Token */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Como Obter seu Bearer Token
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-2 list-decimal list-inside">
              <li>Acesse o <strong>Dashboard</strong></li>
              <li>Clique em <strong>"Ferramentas"</strong></li>
              <li>Clique em <strong>"Ver Bearer Token"</strong></li>
              <li>Copie o token e use no header <code className="bg-muted px-1.5 py-0.5 rounded">Authorization: Bearer {"{token}"}</code></li>
            </ol>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Segurança</AlertTitle>
              <AlertDescription>
                Nunca compartilhe seu Bearer Token publicamente! Ele dá acesso total à sua sessão WhatsApp.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ApiDocs;