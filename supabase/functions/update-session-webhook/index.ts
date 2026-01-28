import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateWebhookRequest {
  session_id: string;
  webhook_url?: string;
  webhook_enabled?: boolean;
  webhook_events?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // 2. Parse request body
    const body: UpdateWebhookRequest = await req.json();
    const { session_id, webhook_url, webhook_enabled, webhook_events } = body;

    if (!session_id) {
      throw new Error('session_id is required');
    }

    // Validate webhook URL format if provided
    if (webhook_url && !webhook_url.startsWith('https://')) {
      throw new Error('Webhook URL must use HTTPS');
    }

    // Validate events array if provided
    const validEvents = ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'];
    if (webhook_events) {
      for (const event of webhook_events) {
        if (!validEvents.includes(event)) {
          throw new Error(`Invalid event type: ${event}`);
        }
      }
    }

    console.log(`Updating webhook for session: ${session_id}`);

    // 3. Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 4. Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // 5. Get user's organization
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData?.organization_id) {
      throw new Error('User organization not found');
    }

    // 6. Verify session belongs to user's organization
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, name, organization_id, api_token')
      .eq('id', session_id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found or access denied');
    }

    // 7. Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (webhook_url !== undefined) {
      updateData.webhook_url = webhook_url;
    }
    if (webhook_enabled !== undefined) {
      updateData.webhook_enabled = webhook_enabled;
    }
    if (webhook_events !== undefined) {
      updateData.webhook_events = webhook_events;
    }

    // 8. Update session in Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update(updateData)
      .eq('id', session_id);

    if (updateError) {
      console.error('Error updating session:', updateError);
      throw new Error('Failed to update session');
    }

    // 9. Update webhook configuration in Evolution API
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (evolutionApiUrl && evolutionApiKey && session.name) {
      try {
        const webhookConfig = {
          enabled: webhook_enabled ?? true,
          url: `https://kfsvpbujmetlendgwnrs.supabase.co/functions/v1/whatsapp-webhook`,
          webhookByEvents: true,
          webhookBase64: true,
          headers: {
            'apikey': session.api_token
          },
          events: webhook_events || ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
        };

        const evolutionResponse = await fetch(`${evolutionApiUrl}/webhook/set/${session.name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify(webhookConfig)
        });

        if (!evolutionResponse.ok) {
          console.warn(`Evolution API webhook update failed: ${evolutionResponse.status}`);
        } else {
          console.log('Evolution API webhook updated successfully');
        }
      } catch (evolutionError) {
        console.warn('Failed to update Evolution API webhook:', evolutionError);
        // Don't fail the request, Supabase update was successful
      }
    }

    console.log(`Webhook configuration updated for session ${session_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook configuration updated',
        session_id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in update-session-webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
