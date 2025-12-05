import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";
import { SEO } from "@/components/SEO";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Login | Uplink - API WhatsApp"
        description="Acesse sua conta Uplink e gerencie suas sessões de API WhatsApp. Envie mensagens automatizadas para seus clientes."
        canonical="https://uplinklite.com/login"
        noindex={true}
      />
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-background to-purple-700/10 pointer-events-none" />
        
        <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/90 border-border/50 shadow-elegant animate-fade-in">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center">
              <img 
                src="/logo-uplink.png" 
                alt="Uplink - API WhatsApp para automações empresariais"
                loading="lazy"
                width="80"
                height="80"
                className="w-full h-full object-contain drop-shadow-2xl animate-scale-in rounded-full"
              />
            </div>
            <CardTitle className="text-3xl font-bold">
              Uplink
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Faça login para acessar o painel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-muted/50 border-border/50 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-muted/50 border-border/50 pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end">
                <Link 
                  to="/reset-password" 
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Não tem uma conta?{" "}
                  <Link to="/signup" className="text-primary hover:text-primary/80 font-medium">
                    Cadastre-se
                  </Link>
                </div>
                <div className="mt-4 text-center text-xs text-muted-foreground/60">
                  Powered by <span className="font-medium">S7</span>
                </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Login;
