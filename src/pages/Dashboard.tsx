import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CreateOrgModal from "@/components/CreateOrgModal";
import { toast } from "sonner";
import { LogOut, Building2, Smartphone, Zap } from "lucide-react";

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
}

interface SessionData {
  id: string;
  name: string | null;
  status: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [showOrgModal, setShowOrgModal] = useState(false);

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
          })
          .select()
          .single();

        if (createError) throw createError;
        setUserData(newUser);
        setShowOrgModal(true);
        return;
      }

      setUserData(userRecord);

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
        .single();

      if (orgError) throw orgError;
      setOrgData(org);

      // Fetch sessions
      const { data: sessionsList, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .eq("organization_id", userRecord.organization_id)
        .order("created_at", { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsList || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
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
      <CreateOrgModal open={showOrgModal} onOrgCreated={fetchUserData} />
      
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-glow">
              <span className="text-lg font-bold text-primary-foreground">UL</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Uplink Lite
              </h1>
              <p className="text-xs text-muted-foreground">Panda42</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Olá, {userData?.name || "Usuário"}! 👋
            </h2>
            <p className="text-muted-foreground">
              Bem-vindo ao seu painel de controle
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organização</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orgData?.name || "—"}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Plano: {orgData?.plan || "starter"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessions.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  WhatsApp conectado
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge className="bg-gradient-to-r from-primary to-secondary">
                  {userData?.role || "agent"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Seu papel no sistema
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sessions List */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Sessões do WhatsApp</CardTitle>
              <CardDescription>
                Gerencie suas conexões do WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma sessão encontrada</p>
                  <p className="text-sm mt-2">Conecte um WhatsApp para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div 
                      key={session.id} 
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div>
                        <p className="font-medium">{session.name || "Sessão sem nome"}</p>
                        <p className="text-sm text-muted-foreground">ID: {session.id.slice(0, 8)}...</p>
                      </div>
                      <Badge 
                        variant={session.status === "connected" ? "default" : "secondary"}
                        className={session.status === "connected" ? "bg-gradient-to-r from-primary to-secondary" : ""}
                      >
                        {session.status || "desconectado"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
