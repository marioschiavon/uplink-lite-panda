import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("superadmin_users" as any)
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsSuperAdmin(!!data);
      setLoading(false);
    };
    check();
  }, []);

  return { isSuperAdmin, loading };
}
