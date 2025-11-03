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

    // Buscar dados do usuário e organização
    const { data: userData, error: userDataError } = await supabaseClient
      .from('users')
      .select('organization_id, email')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData?.organization_id) {
      console.error('User data error:', userDataError);
      throw new Error('Organização não encontrada');
    }

    console.log(`User organization: ${userData.organization_id}`);

    // Buscar organização
    const { data: orgData, error: orgError } = await supabaseClient
      .from('organizations')
      .select('id, name')
      .eq('id', userData.organization_id)
      .single();

    if (orgError || !orgData) {
      console.error('Organization data error:', orgError);
      throw new Error('Organização não encontrada');
    }

    console.log(`Creating subscription for organization: ${orgData.name}`);

    // Verificar se já existe assinatura ativa
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions' as any)
      .select('*')
      .eq('organization_id', orgData.id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      throw new Error('Já existe uma assinatura ativa para esta organização');
    }

    // Obter token do Mercado Pago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }

    // Criar assinatura no Mercado Pago
    const backUrl = `https://kfsvpbujmetlendgwnrs.supabase.co`.replace('supabase.co', 'lovable.app');
    
    const subscriptionData = {
      reason: `Uplink - Sessão API WhatsApp - ${orgData.name}`,
      external_reference: orgData.id,
      payer_email: userData.email,
      back_url: `${backUrl}/dashboard`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 69.90,
        currency_id: "BRL",
      },
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
      console.error('Mercado Pago error:', mpResult);
      throw new Error(`Erro ao criar assinatura no Mercado Pago: ${mpResult.message || 'Erro desconhecido'}`);
    }

    console.log('Subscription created in MP:', mpResult.id);

    // Salvar assinatura no banco
    const { error: insertError } = await supabaseClient
      .from('subscriptions' as any)
      .insert({
        organization_id: orgData.id,
        preapproval_id: mpResult.id,
        payer_email: userData.email,
        status: 'pending',
        plan_name: 'api_session',
        amount: 69.90,
        external_reference: orgData.id,
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
