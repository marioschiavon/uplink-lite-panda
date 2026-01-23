import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";

const Signup = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [name, setName] = useState("");
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/welcome`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast.success(t('auth.signupSuccess'));
        navigate("/welcome");
      }
    } catch (error: any) {
      toast.error(error.message || t('auth.signupError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Create Account | WhatsApp API Uplink"
        description="Create your free Uplink account and start using the WhatsApp API in minutes."
        canonical="https://uplinklite.com/signup"
      />
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 pointer-events-none" />
        
        <Card className="w-full max-w-md relative bg-card border-border shadow-xl animate-fade-in">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center">
              <img 
                src="/logo-uplink.png" 
                alt="Uplink - WhatsApp API"
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
              {t('auth.signupTitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.name')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('auth.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-muted/50 border-border/50 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-muted/50 border-border/50 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-muted/50 border-border/50 pl-10"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-secondary to-primary hover:opacity-90 transition-opacity" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.creatingAccount')}
                  </>
                ) : (
                  t('auth.signupButton')
                )}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t('auth.hasAccount')}{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                {t('auth.loginLink')}
              </Link>
            </div>
            <div className="mt-4 text-center text-xs text-muted-foreground/60">
              {t('common.poweredBy')} <span className="font-medium">S7</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Signup;