import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";

interface CreateOrgModalProps {
  open: boolean;
  onOrgCreated: () => void;
}

const CreateOrgModal = ({ open, onOrgCreated }: CreateOrgModalProps) => {
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create organization
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: orgName })
        .select()
        .single();

      if (orgError) throw orgError;

      // Update user with organization_id and role
      const { error: userError } = await supabase
        .from("users")
        .update({ 
          organization_id: newOrg.id,
          role: "admin"
        })
        .eq("id", user.id);

      if (userError) throw userError;

      toast.success("Organização criada com sucesso!");
      onOrgCreated();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar organização");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-2xl">Crie sua organização</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Para começar a usar o Uplink Lite, primeiro crie sua organização.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateOrg} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Nome da Empresa</Label>
            <Input
              id="orgName"
              placeholder="Minha Empresa"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="bg-muted/50 border-border/50"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Organização"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrgModal;
