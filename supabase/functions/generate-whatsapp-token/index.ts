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
      console.error(`Evolution API error: ${createResponse.status} - ${errorText}`);
      
      // Se a instância já existe, tentar buscar os dados
      if (createResponse.status === 400 || createResponse.status === 409) {
        console.log('Instance may already exist, proceeding with existing data...');
      } else {
        throw new Error(`Evolution API error: ${createResponse.status} - ${errorText}`);
      }
    }

    let instanceApiKey = evolutionApiKey; // Fallback to global key
    let instanceData: any = null;

    try {
      instanceData = await createResponse.json();
      console.log('Evolution API response:', JSON.stringify(instanceData));
      
      // Tentar extrair o apikey específico da instância
      if (instanceData?.hash?.apikey) {
        instanceApiKey = instanceData.hash.apikey;
      }
    } catch (parseError) {
      console.log('Could not parse Evolution API response, using global key');
    }

    console.log(`Instance created/found: ${session_name}`);

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

    // 9. Atualizar organizations (compatibilidade temporária)
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
