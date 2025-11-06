import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import CreateOrgModal from "@/components/CreateOrgModal";
import { toast } from "sonner";
import { LogOut, Server, Key, QrCode, Copy, RefreshCw, Loader2, XCircle, Trash2, Plus, MessageSquare, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  organization_id: string | null;
  role: string | null;
}

interface OrgData {
  id: string;
  name: string;
  plan: string | null;
  api_session: string | null;
  api_token: string | null;
  api_token_full: string | null;
}

interface SessionStatus {
  status: boolean;
  message?: string;
  qrCode?: string;
}

// Componente de Indicador de Status
const StatusIndicator = ({ sessionStatus }: { sessionStatus: SessionStatus | null }) => {
  const message = sessionStatus?.message?.toUpperCase() || 'OFFLINE';
  const isConnected = sessionStatus?.status === true;
  
  const getStatusColor = () => {
    if (!sessionStatus || !isConnected) return 'bg-red-500';
    
    switch (message) {
      case 'CONNECTED':
      case 'ONLINE':
        return 'bg-green-500';
      case 'QRCODE':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusText = () => {
    if (!sessionStatus) return 'Offline';
    if (!isConnected) return 'Desconectado';
    
    switch (message) {
      case 'CONNECTED':
        return 'Conectado';
      case 'ONLINE':
        return 'Online';
      case 'QRCODE':
        return 'Aguardando QR Code';
      default:
        return sessionStatus.message || 'Desconhecido';
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        <div className={`absolute inset-0 w-3 h-3 rounded-full ${getStatusColor()} animate-ping opacity-75`} />
      </div>
      <span className="text-sm font-medium">{getStatusText()}</span>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [refreshingQr, setRefreshingQr] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [qrExpiresIn, setQrExpiresIn] = useState<number | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Olá do Uplink");
  const [sendingTest, setSendingTest] = useState(false);
  const [generatingQrCode, setGeneratingQrCode] = useState(false);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch user data
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (userError) throw userError;

      if (!userRecord) {
        // Create user record if doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || null,
            role: 'admin',
          })
          .select()
          .single();

        if (createError) throw createError;
        setUserData(newUser);
        setShowOrgModal(true);
        return;
      }

      setUserData(userRecord);
      console.log('✅ User data loaded:', {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        organization_id: userRecord.organization_id,
        isSuperadmin: userRecord.role === 'superadmin'
      });

      // Check if user has organization
      if (!userRecord.organization_id) {
        setShowOrgModal(true);
        return;
      }

      // Fetch organization data
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", userRecord.organization_id)
        .maybeSingle();

      if (orgError) throw orgError;
      
      // Cast para OrgData com valores padrão para novas colunas
      const orgDataTyped: OrgData = {
        id: org.id,
        name: org.name,
        plan: org.plan,
        api_session: (org as any).api_session || null,
        api_token: org.api_token,
        api_token_full: (org as any).api_token_full || null
      };
      
      setOrgData(orgDataTyped);

      // Fetch session status from external API
      if (orgDataTyped.api_session && orgDataTyped.api_token) {
        fetchSessionStatus(orgDataTyped.api_session, orgDataTyped.api_token);
      }
    } catch (error: any) {
      console.error("❌ Error fetching data:", error);
      console.error("📋 Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      toast.error(`Erro ao carregar dados: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionStatus = async (orgSession: string, token?: string) => {
    const authToken = token || orgData?.api_token;
    if (!authToken) return;
    
    try {
      const response = await fetch(
        `https://wpp.panda42.com.br/api/${orgSession}/check-connection-session`,
        {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSessionStatus(data);
      } else {
        setSessionStatus({ status: false, message: 'Offline' });
      }
    } catch (error) {
      console.error("Error fetching session status:", error);
      setSessionStatus({ status: false, message: 'Offline' });
    }
  };

  const checkConnectionStatus = useCallback(async () => {
    if (!orgData?.api_session || !orgData?.api_token) return;
    
    try {
      const response = await fetch(
        `https://wpp.panda42.com.br/api/${orgData.api_session}/check-connection-session`,
        {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${orgData.api_token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // CRITICAL: Usar callback do setState para acessar valor mais recente
        setSessionStatus(currentStatus => {
          // Se conectado, atualiza
          if (data.status === true) {
            return data;
          }
          // Se desconectado E não há QR Code ativo no estado ATUAL, atualiza
          if (!currentStatus?.qrCode) {
            return data;
          }
          // Se há QR Code ativo no estado ATUAL, preserva
          return currentStatus;
        });
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
    }
  }, [orgData?.api_session, orgData?.api_token]);

  const handleStartSession = useCallback(async () => {
    if (!orgData?.api_session || !orgData?.api_token) {
      toast.error("Token não encontrado.");
      return;
    }
    
    setStartingSession(true);
    setGeneratingQrCode(true);
    try {
      console.log('Iniciando sessão:', orgData.api_session);
      
      // 1. Chamar start-session
      const startResponse = await fetch(
        `https://wpp.panda42.com.br/api/${orgData.api_session}/start-session`,
        {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${orgData.api_token}`
          },
          body: ''
        }
      );
      
      if (!startResponse.ok) {
        throw new Error(`Erro ao iniciar sessão: ${startResponse.status}`);
      }
      
      toast.info("Gerando QR Code, aguarde 10 segundos...");
      
      // 2. Aguardar 10 segundos para processamento
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // 3. Buscar QR Code
      const qrResponse = await fetch(
        `https://wpp.panda42.com.br/api/${orgData.api_session}/qrcode-session`,
        {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${orgData.api_token}`
          }
        }
      );
      
      if (!qrResponse.ok) {
        throw new Error(`Erro ao buscar QR Code: ${qrResponse.status}`);
      }
      
      const blob = await qrResponse.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setSessionStatus({ 
          status: false,
          message: 'qrcode',
          qrCode: reader.result as string 
        });
        setGeneratingQrCode(false);
        toast.success("QR Code gerado! Escaneie para conectar.");
      };
      
      reader.readAsDataURL(blob);
      
    } catch (error: any) {
      console.error('Erro ao iniciar sessão:', error);
      toast.error(error.message || "Erro ao iniciar sessão");
      setGeneratingQrCode(false);
    } finally {
      setStartingSession(false);
    }
  }, [orgData?.api_session, orgData?.api_token]);

  useEffect(() => {
    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Polling automático a cada 10 segundos
  useEffect(() => {
    if (!orgData?.api_session || !orgData?.api_token) return;
    
    checkConnectionStatus();
    
    const intervalId = setInterval(checkConnectionStatus, 10000);
    
    return () => clearInterval(intervalId);
  }, [orgData?.api_session, orgData?.api_token, checkConnectionStatus]);

  // Timer de expiração do QR Code (50 segundos)
  useEffect(() => {
    if (sessionStatus?.qrCode) {
      setQrExpiresIn(50);
      
      const intervalId = setInterval(() => {
        setQrExpiresIn(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(intervalId);
            // Auto-reiniciar quando QR Code expirar
            toast.info("QR Code expirado! Gerando novo QR Code...");
            handleStartSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(intervalId);
    } else {
      setQrExpiresIn(null);
    }
  }, [sessionStatus?.qrCode, handleStartSession]);

  const handleCreateSession = async () => {
    if (!orgData) return;
    
    // Verificar se já existe uma sessão ativa
    if (orgData.api_session || orgData.api_token) {
      toast.error("Você já possui uma sessão ativa. Para criar uma nova, primeiro exclua a sessão existente.");
      return;
    }
    
    setCreatingSession(true);
    setGeneratingQrCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-whatsapp-token', {
        body: { organization_name: orgData.name }
      });

      if (error) throw error;

      if (data.success && data.session && data.token) {
        console.log('Token gerado:', {
          session: data.session,
          token: data.token,
          full: data.token_full
        });

        // Salvar os 3 campos no banco de dados
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ 
            api_session: data.session,
            api_token: data.token,
            api_token_full: data.token_full
          })
          .eq('id', orgData.id);

        if (updateError) throw updateError;

        // Atualizar estado local
        setOrgData({ 
          ...orgData, 
          api_session: data.session,
          api_token: data.token,
          api_token_full: data.token_full
        });
        
        toast.success("Token gerado! Iniciando sessão...");
        
        // Iniciar sessão e buscar QR Code
        const startResponse = await fetch(
          `https://wpp.panda42.com.br/api/${data.session}/start-session`,
          {
            method: 'POST',
            headers: {
              'accept': '*/*',
              'Authorization': `Bearer ${data.token}`
            },
            body: ''
          }
        );
        
        if (startResponse.ok) {
          toast.info("Gerando QR Code, aguarde 10 segundos...");
          
          // Aguardar 10 segundos e buscar QR Code
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          const qrResponse = await fetch(
            `https://wpp.panda42.com.br/api/${data.session}/qrcode-session`,
            {
              headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${data.token}`
              }
            }
          );
          
          if (qrResponse.ok) {
            const blob = await qrResponse.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              setSessionStatus({ 
                status: false,
                message: 'qrcode',
                qrCode: reader.result as string 
              });
              setGeneratingQrCode(false);
              toast.success("QR Code gerado!");
            };
            reader.readAsDataURL(blob);
          } else {
            setGeneratingQrCode(false);
          }
        } else {
          setGeneratingQrCode(false);
        }
      } else {
        throw new Error(data.error || "Erro ao gerar token");
      }
    } catch (error: any) {
      console.error("Erro ao criar sessão:", error);
      toast.error(error.message || "Erro ao criar sessão");
      setGeneratingQrCode(false);
    } finally {
      setCreatingSession(false);
    }
  };

  const handleRefreshQr = async () => {
    if (!orgData?.api_session || !orgData?.api_token) {
      toast.error("Token não encontrado. Crie uma sessão primeiro.");
      return;
    }
    
    setRefreshingQr(true);
    setGeneratingQrCode(true);
    try {
      // 1. Primeiro, iniciar/reiniciar a sessão
      console.log('Iniciando sessão:', orgData.api_session);
      const startResponse = await fetch(
        `https://wpp.panda42.com.br/api/${orgData.api_session}/start-session`,
        {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${orgData.api_token}`
          },
          body: ''
        }
      );
      
      if (!startResponse.ok) {
        throw new Error(`Erro ao iniciar sessão: ${startResponse.status}`);
      }
      
      toast.info("Gerando novo QR Code, aguarde 10 segundos...");
      
      // Aguardar 10 segundos para a sessão inicializar
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // 2. Agora buscar o QR Code
      console.log('Buscando QR Code:', orgData.api_session);
      const response = await fetch(
        `https://wpp.panda42.com.br/api/${orgData.api_session}/qrcode-session`,
        {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${orgData.api_token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar QR Code: ${response.status}`);
      }
      
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setSessionStatus({ 
          status: false,
          message: 'qrcode',
          qrCode: reader.result as string 
        });
        setGeneratingQrCode(false);
        toast.success("QR Code atualizado!");
      };
      
      reader.readAsDataURL(blob);
    } catch (error: any) {
      console.error('Erro ao renovar QR Code:', error);
      toast.error(error.message || "Erro ao renovar QR Code");
      setGeneratingQrCode(false);
    } finally {
      setRefreshingQr(false);
    }
  };

  const handleCloseSession = async () => {
    if (!orgData?.api_session || !orgData?.api_token) {
      toast.error("Sessão não encontrada");
      return;
    }
    
    setClosingSession(true);
    try {
      console.log('Fechando sessão:', orgData.api_session);
      
      const response = await fetch(
        `https://wpp.panda42.com.br/api/${orgData.api_session}/close-session`,
        {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${orgData.api_token}`
          },
          body: ''
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
      
      setSessionStatus({ status: false, message: 'offline' });
      toast.success("Sessão fechada com sucesso!");
      await fetchUserData();
    } catch (error: any) {
      console.error('Erro ao fechar sessão:', error);
      toast.error(error.message || "Erro ao fechar sessão");
    } finally {
      setClosingSession(false);
    }
  };

  const handleLogoutSession = async () => {
    if (!orgData?.api_session || !orgData?.api_token) {
      toast.error("Sessão não encontrada");
      return;
    }
    
    if (!confirm("Tem certeza? Isso irá apagar completamente a sessão e você precisará criar uma nova.")) {
      return;
    }
    
    setLoggingOut(true);
    try {
      console.log('Fazendo logout da sessão:', orgData.api_session);
      
      const response = await fetch(
        `https://wpp.panda42.com.br/api/${orgData.api_session}/logout-session`,
        {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${orgData.api_token}`
          },
          body: ''
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
      
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ 
          api_session: null,
          api_token: null,
          api_token_full: null
        })
        .eq('id', orgData.id);
      
      if (updateError) throw updateError;
      
      setOrgData({ 
        ...orgData, 
        api_session: null,
        api_token: null,
        api_token_full: null
      });
      
      setSessionStatus({ status: false, message: 'offline' });
      toast.success("Sessão removida com sucesso!");
      
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      toast.error(error.message || "Erro ao fazer logout da sessão");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleCopyApiToken = () => {
    if (orgData?.api_token) {
      navigator.clipboard.writeText(orgData.api_token);
      toast.success("API Token copiado!");
    }
  };

  const handleSendTestMessage = async () => {
    if (!orgData?.api_session || !orgData?.api_token) {
      toast.error("Token não encontrado.");
      return;
    }
    
    if (!testPhone || !testMessage) {
      toast.error("Preencha o número e a mensagem.");
      return;
    }
    
    // Validação básica do número
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(testPhone)) {
      toast.error("Número inválido. Use o formato: DDD + número (ex: 11987654321)");
      return;
    }
    
    setSendingTest(true);
    try {
      console.log('Enviando mensagem de teste:', {
        session: orgData.api_session,
        phone: testPhone,
        message: testMessage
      });
      
      const response = await fetch(
        `https://wpp.panda42.com.br/api/${orgData.api_session}/send-message`,
        {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${orgData.api_token}`
          },
          body: JSON.stringify({
            phone: `55${testPhone}`,
            isGroup: false,
            isNewsletter: false,
            isLid: false,
            message: testMessage
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ${response.status}: ${errorData}`);
      }
      
      const result = await response.json();
      console.log('Resposta do envio:', result);
      
      toast.success("Mensagem enviada com sucesso!");
      
      // Limpar apenas o número, manter a mensagem padrão
      setTestPhone("");
      
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(error.message || "Erro ao enviar mensagem");
    } finally {
      setSendingTest(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-background to-purple-700/10 pointer-events-none" />
      
      <CreateOrgModal 
        open={showOrgModal} 
        onOrgCreated={() => {
          setShowOrgModal(false);
          fetchUserData();
        }}
        onClose={() => setShowOrgModal(false)}
      />
      
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/30 relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-glow">
              <span className="text-lg font-bold text-primary-foreground">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Uplink Lite
              </h1>
              <p className="text-xs text-muted-foreground">por Panda42</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userData?.role === 'superadmin' && (
              <Button 
                variant="outline" 
                onClick={() => navigate("/monitoring")}
                className="gap-2"
              >
                <Server className="w-4 h-4" />
                Monitoramento
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Organization Info Card */}
          <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-elegant">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                  <Server className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{orgData?.name || "Minha Empresa"}</CardTitle>
                  <CardDescription>Plano: {orgData?.plan || "basic"}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* API Key Card - Só mostra quando conectado */}
          {orgData?.api_token && 
           sessionStatus?.status === true && 
           sessionStatus?.message?.toUpperCase() === 'CONNECTED' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-elegant">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-secondary to-primary rounded-lg flex items-center justify-center">
                        <Key className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Bearer Token</CardTitle>
                        <CardDescription>Token de autenticação para chamadas API</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyApiToken}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <code className="text-sm bg-muted/50 px-3 py-2 rounded-md block overflow-x-auto break-all">
                    {orgData.api_token}
                  </code>
                  <p className="text-xs text-muted-foreground">
                    Use este token no header: <code className="text-xs bg-muted px-1 py-0.5 rounded">Authorization: Bearer {orgData.api_token}</code>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Session Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Sessão WhatsApp</CardTitle>
                  <StatusIndicator sessionStatus={sessionStatus} />
                </div>
                
                {/* Botão Criar Sessão - quando não tem token */}
                {!orgData?.api_token && (
                  <Button
                    onClick={handleCreateSession}
                    disabled={creatingSession}
                    className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                  >
                    {creatingSession ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Criar Sessão
                      </>
                    )}
                  </Button>
                )}
                
                {/* Botão Iniciar Sessão - quando tem token mas está desconectado */}
                {orgData?.api_token && 
                 (!sessionStatus || sessionStatus.status === false) && 
                 !sessionStatus?.qrCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartSession}
                    disabled={startingSession}
                    className="gap-2"
                  >
                    {startingSession ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Iniciando...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        Iniciar Sessão
                      </>
                    )}
                  </Button>
                )}
                
                {/* Botão Renovar QR - quando está exibindo QR Code */}
                {sessionStatus?.qrCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshQr}
                    disabled={refreshingQr}
                    className="gap-2"
                  >
                    {refreshingQr ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Renovar QR
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {generatingQrCode && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-3 py-8 text-blue-600"
                  >
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Gerando QR Code, aguarde...</span>
                  </motion.div>
                )}
                {!generatingQrCode && sessionStatus?.qrCode ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                      <img 
                        src={sessionStatus.qrCode} 
                        alt="QR Code WhatsApp" 
                        className="w-64 h-64"
                      />
                    </div>
                    
                    {/* Contador de expiração */}
                    {qrExpiresIn !== null && qrExpiresIn > 0 ? (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        <p className="text-muted-foreground">
                          QR Code expira em <span className="font-bold text-foreground">{qrExpiresIn}s</span>
                        </p>
                      </div>
                    ) : qrExpiresIn === 0 ? (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-red-500 font-medium">QR Code expirado!</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRefreshQr}
                          disabled={refreshingQr}
                          className="gap-2"
                        >
                          {refreshingQr ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Gerar Novo QR Code
                        </Button>
                      </div>
                    ) : null}
                    
                    <p className="text-sm text-muted-foreground text-center">
                      Escaneie o QR Code com seu WhatsApp para conectar
                    </p>
                  </motion.div>
                ) : !generatingQrCode && sessionStatus?.status === true && sessionStatus?.message?.toUpperCase() === 'CONNECTED' ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-4">
                      <Server className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">Sessão Conectada!</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Seu WhatsApp está online e pronto para uso
                    </p>
                  </div>
                ) : !generatingQrCode ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma sessão ativa</p>
                    <p className="text-sm mt-2">Clique em "Criar Sessão" para começar</p>
                  </div>
              ) : null}
            </CardContent>

            {/* Rodapé com controles permanentes */}
            {orgData?.api_token && (
              <CardFooter className="border-t border-border/50 pt-4">
                <div className="flex items-center justify-between w-full">
                  {/* Lado esquerdo - Botões de gestão */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseSession}
                      disabled={closingSession || !sessionStatus?.status}
                      className="gap-2 border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950 disabled:opacity-50"
                    >
                      {closingSession ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Fechar Sessão
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogoutSession}
                      disabled={loggingOut}
                      className="gap-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      {loggingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Logout da Sessão
                    </Button>
                  </div>
                  
                  {/* Lado direito - Info da sessão */}
                  <div className="text-xs text-muted-foreground">
                    Sessão: <span className="font-mono">{orgData.api_session}</span>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </motion.div>

          {/* Test Message Card - Só mostra quando conectado */}
          {orgData?.api_token && 
           sessionStatus?.status === true && 
           sessionStatus?.message?.toUpperCase() === 'CONNECTED' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-elegant">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Teste de Envio</CardTitle>
                      <CardDescription>Envie uma mensagem de teste via API</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="test-phone">Número de Telefone</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-3 py-2 bg-muted rounded-md border border-input">
                          <span className="text-lg">🇧🇷</span>
                          <span className="text-sm font-mono font-medium">+55</span>
                        </div>
                        <Input
                          id="test-phone"
                          type="text"
                          placeholder="11987654321"
                          value={testPhone}
                          onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                          className="font-mono flex-1"
                          maxLength={11}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Formato: DDD + número (somente números)
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="test-message">Mensagem</Label>
                      <Textarea
                        id="test-message"
                        placeholder="Digite sua mensagem..."
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        className="resize-none"
                        rows={3}
                      />
                    </div>
                    
                    <Button
                      onClick={handleSendTestMessage}
                      disabled={sendingTest || !testPhone || !testMessage}
                      className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      {sendingTest ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar Mensagem de Teste
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
