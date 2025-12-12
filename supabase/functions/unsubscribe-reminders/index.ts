import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      // Try to get from body
      const body = await req.json().catch(() => ({}));
      if (!body.token) {
        return new Response(
          JSON.stringify({ error: "Token is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    const finalToken = token || (await req.json().catch(() => ({}))).token;

    // Decode the token to get user ID
    let userId: string;
    try {
      userId = atob(finalToken);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return new Response(
        JSON.stringify({ error: "Invalid user ID format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Processing unsubscribe for user: ${userId}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update user's unsubscribe preference
    const { error: updateError } = await supabase
      .from("users")
      .update({ unsubscribed_from_reminders: true })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user:", updateError);
      throw updateError;
    }

    console.log(`User ${userId} successfully unsubscribed from reminders`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Você foi descadastrado com sucesso dos lembretes por email.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in unsubscribe-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
