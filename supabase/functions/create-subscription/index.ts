import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User authentication error:', userError);
      throw new Error('Usuário não autenticado');
    }

    console.log(`Authenticated user: ${user.id}`);

    // Buscar session_id do body
    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error('session_id é obrigatório');
    }

    console.log(`Creating subscription for session: ${session_id}`);

    // Buscar dados da sessão e organização
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('sessions')
      .select('id, name, organization_id, organizations(id, name)')
      .eq('id', session_id)
      .single();

    if (sessionError || !sessionData) {
      console.error('Session data error:', sessionError);
      throw new Error('Sessão não encontrada');
    }

    // Verificar se usuário pertence à organização da sessão
    const { data: userData, error: userDataError } = await supabaseClient
      .from('users')
      .select('organization_id, email')
      .eq('id', user.id)
      .single();

    if (userDataError || userData.organization_id !== sessionData.organization_id) {
      throw new Error('Você não tem permissão para criar assinatura para esta sessão');
    }

    console.log(`Session: ${sessionData.name}, Organization: ${(sessionData as any).organizations.name}`);

    // Verificar se já existe assinatura ativa para essa sessão
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions' as any)
      .select('*')
      .eq('session_id', session_id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      throw new Error('Já existe uma assinatura ativa para esta sessão');
    }

    // Obter token do Mercado Pago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }

    // Criar assinatura no Mercado Pago
    const backUrl = `https://kfsvpbujmetlendgwnrs.supabase.co`.replace('supabase.co', 'lovable.app');
    
    const subscriptionData = {
      preapproval_plan_id: "dabea6daad5d4fb8afca202589f0d82e", // Plano UPLINKLITE
      reason: `Uplink - Sessão ${sessionData.name} - ${(sessionData as any).organizations.name}`,
      external_reference: session_id,
      payer_email: userData.email,
      back_url: `${backUrl}/dashboard`
    };

    console.log('Creating subscription in Mercado Pago...');
    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });

    const mpResult = await mpResponse.json();

    if (!mpResponse.ok) {
      const errorDetails = {
        status: mpResponse.status,
        statusText: mpResponse.statusText,
        message: mpResult.message,
        error: mpResult.error,
        cause: mpResult.cause,
        token_used: accessToken.substring(0, 15) + '...'
      };
      console.error('Mercado Pago API Error:', JSON.stringify(errorDetails, null, 2));
      throw new Error(`Erro ao criar assinatura no Mercado Pago (${mpResponse.status}): ${mpResult.message || mpResult.error || 'Erro desconhecido'}`);
    }

    console.log('Subscription created in MP:', mpResult.id);

    // Criar cliente admin para bypass de RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Salvar assinatura no banco (vinculada à sessão)
    const { error: insertError } = await supabaseAdmin
      .from('subscriptions' as any)
      .insert({
        session_id: session_id,
        organization_id: sessionData.organization_id,
        preapproval_id: mpResult.id,
        payer_email: userData.email,
        status: 'pending',
        plan_name: 'api_session',
        amount: 69.90,
        external_reference: session_id,
      });

    if (insertError) {
      console.error('Error saving subscription:', insertError);
      throw new Error('Erro ao salvar assinatura no banco de dados');
    }

    console.log('Subscription saved to database');

    return new Response(
      JSON.stringify({
        success: true,
        init_point: mpResult.init_point,
        subscription_id: mpResult.id,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in create-subscription:', error);
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
