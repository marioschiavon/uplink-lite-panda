import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Eye, Users, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrgRow {
  id: string;
  name: string;
  plan: string | null;
  is_legacy: boolean | null;
  subscription_status: string | null;
  created_at: string | null;
  session_limit: number | null;
}

const AdminOrganizations = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: authLoading } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgRow | null>(null);
  const [orgSessions, setOrgSessions] = useState<any[]>([]);
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [orgSubs, setOrgSubs] = useState<any[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) navigate("/dashboard");
  }, [authLoading, isSuperAdmin, navigate]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchOrgs();
  }, [isSuperAdmin]);

  const fetchOrgs = async () => {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, plan, is_legacy, subscription_status, created_at, session_limit")
      .order("created_at", { ascending: false });
    setOrgs(data || []);
    setLoading(false);
  };

  const openDetails = async (org: OrgRow) => {
    setSelectedOrg(org);
    setDetailsOpen(true);
    const [sessions, users, subs] = await Promise.all([
      supabase.from("sessions").select("id, name, status, created_at").eq("organization_id", org.id),
      supabase.from("users").select("id, email, name, role, created_at").eq("organization_id", org.id),
      supabase.from("subscriptions").select("id, status, amount, payment_provider, plan_name, created_at").eq("organization_id", org.id).order("created_at", { ascending: false }),
    ]);
    setOrgSessions(sessions.data || []);
    setOrgUsers(users.data || []);
    setOrgSubs(subs.data || []);
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Organizações
        </h1>
        <p className="text-muted-foreground">{orgs.length} organizações cadastradas</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Legacy</TableHead>
                <TableHead>Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell><Badge variant="outline">{org.plan || "starter"}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={org.subscription_status === "active" ? "default" : "secondary"}>
                      {org.subscription_status || "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{org.is_legacy ? <Badge variant="secondary">Legacy</Badge> : "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {org.created_at ? format(new Date(org.created_at), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openDetails(org)}>
                      <Eye className="h-4 w-4 mr-1" /> Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedOrg?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Plano:</span> {selectedOrg?.plan || "starter"}</div>
              <div><span className="text-muted-foreground">Legacy:</span> {selectedOrg?.is_legacy ? "Sim" : "Não"}</div>
              <div><span className="text-muted-foreground">Limite sessões:</span> {selectedOrg?.session_limit || 1}</div>
              <div><span className="text-muted-foreground">Status:</span> {selectedOrg?.subscription_status || "inactive"}</div>
            </div>

            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><MessageSquare className="h-4 w-4" /> Sessões ({orgSessions.length})</h3>
              {orgSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <span>{s.name || "Sem nome"}</span>
                  <Badge variant="outline">{s.status || "N/A"}</Badge>
                </div>
              ))}
              {orgSessions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma sessão</p>}
            </div>

            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><Users className="h-4 w-4" /> Usuários ({orgUsers.length})</h3>
              {orgUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <div>
                    <p className="font-medium">{u.name || u.email}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant="outline">{u.role}</Badge>
                </div>
              ))}
              {orgUsers.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário</p>}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Assinaturas ({orgSubs.length})</h3>
              {orgSubs.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <div>
                    <p className="font-medium">{s.plan_name} · R$ {Number(s.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{s.payment_provider}</p>
                  </div>
                  <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                </div>
              ))}
              {orgSubs.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma assinatura</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrganizations;
