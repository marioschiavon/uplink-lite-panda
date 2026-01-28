import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // 1.5. Receber e validar session_name e notification_phone do body
    const { session_name, notification_phone } = await req.json();
    
    if (!session_name || typeof session_name !== 'string') {
      throw new Error('session_name is required');
    }

    // Validar formato do session_name
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(session_name)) {
      throw new Error('Invalid session name format. Use only letters, numbers, hyphens and underscores');
    }

    if (session_name.length < 3 || session_name.length > 50) {
      throw new Error('Session name must be between 3 and 50 characters');
    }

    console.log(`Received session_name: ${session_name}, notification_phone: ${notification_phone || 'not provided'}`);

    // 2. Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 3. Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User authentication error:', userError);
      throw new Error('User not authenticated');
    }

    console.log(`Authenticated user: ${user.id}`);

    // 4. Buscar dados do usuário e organização
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData?.organization_id) {
      console.error('User data error:', userDataError);
      throw new Error('User organization not found');
    }

    console.log(`User organization: ${userData.organization_id}`);

    // 5. Buscar dados da organização
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', userData.organization_id)
      .single();

    if (orgError || !orgData) {
      console.error('Organization data error:', orgError);
      throw new Error('Organization not found');
    }

    const organizationName = orgData.name;
    console.log(`Generating token for organization: ${organizationName} (session: ${session_name})`);

    // 6. Buscar Evolution API credentials
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('Evolution API credentials not configured');
      throw new Error('Evolution API not configured');
    }

    // 7. Criar instância na Evolution API
    console.log(`Creating instance in Evolution API: ${session_name}`);
    
    let instanceApiKey: string | null = null;
    let instanceData: any = null;
    let instanceExists = false;

    const createResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify({
        instanceName: session_name,
        qrcode: false,
        integration: 'WHATSAPP-BAILEYS'
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`Evolution API create error: ${createResponse.status} - ${errorText}`);
      
      // Se a instância já existe (400 ou 409), buscar o token existente
      if (createResponse.status === 400 || createResponse.status === 409) {
        console.log('Instance already exists, fetching existing token...');
        instanceExists = true;
      } else {
        throw new Error(`Evolution API error: ${createResponse.status} - ${errorText}`);
      }
    } else {
      try {
        instanceData = await createResponse.json();
        console.log('Evolution API create response:', JSON.stringify(instanceData));
        
        // Extrair o apikey específico da nova instância
        if (instanceData?.hash?.apikey) {
          instanceApiKey = instanceData.hash.apikey;
          console.log('Got new instance apikey:', instanceApiKey);
        }
      } catch (parseError) {
        console.log('Could not parse Evolution API create response');
      }
    }

    // Se a instância já existia ou não conseguimos o token, buscar via fetchInstances
    if (!instanceApiKey || instanceExists) {
      console.log('Fetching existing instances to get token...');
      
      const fetchResponse = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
        headers: {
          'apikey': evolutionApiKey
        }
      });

      if (fetchResponse.ok) {
        const instances = await fetchResponse.json();
        console.log(`Found ${Array.isArray(instances) ? instances.length : 0} instances`);
        
        if (Array.isArray(instances)) {
          const existingInstance = instances.find((i: any) => 
            i.name === session_name || i.instanceName === session_name
          );
          
          if (existingInstance) {
            // O token da instância pode estar em diferentes campos dependendo da versão
            instanceApiKey = existingInstance.token || existingInstance.apikey || existingInstance.hash?.apikey;
            console.log('Found existing instance token:', instanceApiKey ? 'YES' : 'NO');
          } else {
            console.log('Instance not found in fetchInstances response');
          }
        }
      } else {
        console.error('Failed to fetch instances:', fetchResponse.status);
      }
    }

    // Se ainda não temos o token, é um erro
    if (!instanceApiKey) {
      throw new Error('Could not obtain instance API key from Evolution API');
    }

    console.log(`Instance created/found: ${session_name} with valid API key`);

    // 8. Criar ou atualizar registro na tabela sessions usando service_role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar se sessão já existe
    const { data: existingSession } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .eq('name', session_name)
      .maybeSingle();

    let sessionData;

    if (existingSession) {
      // UPDATE: atualizar tokens
      const { data: updatedSession, error: updateError } = await supabaseAdmin
        .from('sessions')
        .update({
          api_session: session_name,
          api_token: instanceApiKey,
          api_token_full: instanceApiKey,
          status: 'configured',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSession.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating session:', updateError);
        throw new Error('Failed to update session in database');
      }

      sessionData = updatedSession;
      console.log('Session updated:', sessionData.id);
    } else {
      // INSERT: criar nova sessão
      const { data: newSession, error: insertError } = await supabaseAdmin
        .from('sessions')
        .insert({
          organization_id: userData.organization_id,
          name: session_name,
          api_session: session_name,
          api_token: instanceApiKey,
          api_token_full: instanceApiKey,
          status: 'configured',
          requires_subscription: false,
          api_message_limit: 3000,
          api_message_usage: 0,
          notification_phone: notification_phone || null
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting session:', insertError);
        throw new Error('Failed to create session in database');
      }

      sessionData = newSession;
      console.log('Session created:', sessionData.id);
    }

    // 9. Configure webhook automatically in Evolution API
    console.log(`Configuring webhook for instance: ${session_name}`);
    
    try {
      const webhookConfig = {
        enabled: true,
        url: `https://kfsvpbujmetlendgwnrs.supabase.co/functions/v1/whatsapp-webhook`,
        webhookByEvents: true,
        webhookBase64: true,
        headers: {
          'apikey': instanceApiKey // Security: session token for validation
        },
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED'
        ]
      };

      const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/set/${session_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey
        },
        body: JSON.stringify(webhookConfig)
      });

      if (webhookResponse.ok) {
        console.log('Webhook configured successfully for instance:', session_name);
        
        // Update session with default webhook events (not enabled until user configures URL)
        await supabaseAdmin
          .from('sessions')
          .update({
            webhook_events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
          })
          .eq('id', sessionData.id);
      } else {
        const webhookError = await webhookResponse.text();
        console.warn(`Webhook configuration warning: ${webhookResponse.status} - ${webhookError}`);
      }
    } catch (webhookError) {
      console.warn('Non-critical: Failed to configure webhook:', webhookError);
      // Don't fail the request, session was created successfully
    }

    // 10. Atualizar organizations (compatibilidade temporária)
    await supabaseAdmin
      .from('organizations')
      .update({ 
        api_session: session_name,
        api_token: instanceApiKey,
        api_token_full: instanceApiKey
      })
      .eq('id', userData.organization_id);

    // 10. Retornar resposta com session_id
    return new Response(
      JSON.stringify({
        success: true,
        session: session_name,
        token: instanceApiKey,
        token_full: instanceApiKey,
        session_id: sessionData.id,
        session_name: session_name,
        organization_name: organizationName
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in generate-whatsapp-token:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
