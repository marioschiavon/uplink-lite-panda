import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  created_at: string | null;
  organization_id: string | null;
  org_name?: string;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: authLoading } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) navigate("/dashboard");
  }, [authLoading, isSuperAdmin, navigate]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchUsers();
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("users")
      .select("id, email, name, role, created_at, organization_id, organizations(name)")
      .order("created_at", { ascending: false });

    const mapped: UserRow[] = (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      created_at: u.created_at,
      organization_id: u.organization_id,
      org_name: u.organizations?.name || null,
    }));
    setUsers(mapped);
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Usuários
        </h1>
        <p className="text-muted-foreground">{users.length} usuários cadastrados</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Criação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{u.org_name || <span className="text-muted-foreground">Sem org</span>}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "superadmin" ? "default" : "outline"}>
                      {u.role || "admin"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {u.created_at ? format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
