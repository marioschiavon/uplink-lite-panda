import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Autenticar usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    console.log(`Authenticated user: ${user.id}`);

    // 2. Buscar dados da sessão
    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error('session_id é obrigatório');
    }

    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('sessions')
      .select('id, name, organization_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !sessionData) {
      console.error('Session data error:', sessionError);
      throw new Error('Sessão não encontrada');
    }

    // 3. Buscar dados do usuário
    const { data: userData, error: userDataError } = await supabaseClient
      .from('users')
      .select('email, organization_id')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      throw new Error('Dados do usuário não encontrados');
    }

    if (userData.organization_id !== sessionData.organization_id) {
      throw new Error('Você não tem permissão para criar assinatura para esta sessão');
    }

    console.log(`Session: ${sessionData.name}, Organization: ${sessionData.organization_id}`);

    // 4. Verificar se já existe assinatura ativa
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions' as any)
      .select('*')
      .eq('session_id', session_id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      throw new Error('Já existe uma assinatura ativa para esta sessão');
    }

    // 5. Inicializar Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY não configurado');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // 6. Criar ou obter customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: userData.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('Customer existente encontrado:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          supabase_user_id: user.id,
          organization_id: sessionData.organization_id,
        }
      });
      console.log('Novo customer criado:', customer.id);
    }

    // 7. Criar Checkout Session
    const origin = req.headers.get('origin') || 'https://kfsvpbujmetlendgwnrs.lovable.app';
    
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [
        {
          price: 'price_xxxxxxxxxxxxx', // SUBSTITUIR pelo Price ID real do Stripe
          quantity: 1,
        },
      ],
      metadata: {
        session_id: session_id,
        session_name: sessionData.name || '',
        organization_id: sessionData.organization_id,
      },
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/checkout?session_name=${sessionData.name}&payment=cancelled`,
    });

    console.log('Checkout session criada:', checkoutSession.id);

    return new Response(
      JSON.stringify({
        success: true,
        url: checkoutSession.url,
        checkout_session_id: checkoutSession.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in create-stripe-checkout:', error);
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
