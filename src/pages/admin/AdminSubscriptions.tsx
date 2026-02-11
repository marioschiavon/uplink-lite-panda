import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubRow {
  id: string;
  status: string;
  amount: number;
  plan_name: string;
  payment_provider: string | null;
  next_payment_date: string | null;
  created_at: string | null;
  org_name?: string;
  session_name?: string;
}

const AdminSubscriptions = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: authLoading } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<SubRow[]>([]);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) navigate("/dashboard");
  }, [authLoading, isSuperAdmin, navigate]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchSubs();
  }, [isSuperAdmin]);

  const fetchSubs = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("id, status, amount, plan_name, payment_provider, next_payment_date, created_at, organization_id, session_id, organizations(name), sessions(name)")
      .order("created_at", { ascending: false });

    const mapped: SubRow[] = (data || []).map((s: any) => ({
      id: s.id,
      status: s.status,
      amount: Number(s.amount),
      plan_name: s.plan_name,
      payment_provider: s.payment_provider,
      next_payment_date: s.next_payment_date,
      created_at: s.created_at,
      org_name: s.organizations?.name || null,
      session_name: s.sessions?.name || null,
    }));
    setSubs(mapped);
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default" as const;
      case "past_due": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Assinaturas
        </h1>
        <p className="text-muted-foreground">{subs.length} assinaturas no sistema</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organização</TableHead>
                <TableHead>Sessão</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provedor</TableHead>
                <TableHead>Próx. Cobrança</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.org_name || "—"}</TableCell>
                  <TableCell>{s.session_name || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{s.plan_name}</Badge></TableCell>
                  <TableCell>R$ {s.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(s.status)}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.payment_provider || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {s.next_payment_date ? format(new Date(s.next_payment_date), "dd/MM/yyyy", { locale: ptBR }) : "—"}
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

export default AdminSubscriptions;
