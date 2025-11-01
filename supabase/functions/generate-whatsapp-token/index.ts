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

    // 5. Buscar nome da organização
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', userData.organization_id)
      .single();

    if (orgError || !orgData?.name) {
      console.error('Organization data error:', orgError);
      throw new Error('Organization not found');
    }

    const organizationName = orgData.name;
    console.log(`Generating token for organization: ${organizationName}`);

    // 6. Validate and sanitize organization name
    if (!organizationName || typeof organizationName !== 'string') {
      throw new Error('Invalid organization name');
    }
    
    // Validate length
    if (organizationName.length > 100) {
      throw new Error('Organization name too long');
    }
    
    // Validate characters (alphanumeric, spaces, hyphens, underscores only)
    const validNamePattern = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validNamePattern.test(organizationName)) {
      throw new Error('Organization name contains invalid characters');
    }
    
    // URL encode the organization name
    const encodedOrgName = encodeURIComponent(organizationName);

    // 7. Buscar secret key
    const secretKey = Deno.env.get('WPP_SECRET_KEY');
    if (!secretKey) {
      throw new Error('WPP_SECRET_KEY not configured');
    }

    // 8. Fazer chamada para API externa com nome codificado
    const apiUrl = `https://wpp.panda42.com.br/api/${encodedOrgName}/${secretKey}/generate-token`;
    console.log(`Calling external API for organization: ${encodedOrgName}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'accept': '*/*' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`External API error: ${response.status} - ${errorText}`);
      throw new Error(`External API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Token generated successfully for organization`);

    // 9. Retornar resposta com todos os campos
    return new Response(
      JSON.stringify({
        success: true,
        session: data.session,        // Nome da sessão
        token: data.token,            // Apenas o hash
        token_full: data.full,        // Token completo
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
