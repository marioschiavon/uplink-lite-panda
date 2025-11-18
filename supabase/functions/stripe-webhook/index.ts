import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET não configurado');
    }
    
    // Verificar assinatura do webhook
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    console.log('Webhook recebido:', event.type);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Processar eventos relevantes
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionId = session.metadata?.session_id;
        const organizationId = session.metadata?.organization_id;

        if (!sessionId || !organizationId) {
          console.error('Metadata ausente no checkout.session.completed');
          break;
        }

        console.log('Processando checkout completo para sessão:', sessionId);

        // Buscar subscription do Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        // Criar registro na tabela subscriptions
        const { error: insertError } = await supabaseAdmin.from('subscriptions').insert({
          session_id: sessionId,
          organization_id: organizationId,
          status: 'active',
          plan_name: 'api_session',
          amount: (stripeSubscription.items.data[0].price.unit_amount || 0) / 100,
          stripe_subscription_id: stripeSubscription.id,
          stripe_customer_id: session.customer as string,
          payment_provider: 'stripe',
          start_date: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          next_payment_date: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          payer_email: session.customer_details?.email,
          external_reference: sessionId,
        });

        if (insertError) {
          console.error('Erro ao inserir assinatura:', insertError);
        }

        // Atualizar session para ativa (liberar acesso)
        await supabaseAdmin.from('sessions').update({
          status: 'connected',
          requires_subscription: false,
        }).eq('id', sessionId);

        console.log('✅ Assinatura ativada para sessão:', sessionId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const newStatus = subscription.status === 'active' ? 'active' : 
                         subscription.status === 'past_due' ? 'past_due' :
                         subscription.status === 'canceled' ? 'cancelled' : 'pending';

        await supabaseAdmin.from('subscriptions')
          .update({
            status: newStatus,
            next_payment_date: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log('✅ Assinatura atualizada:', subscription.id, 'Status:', newStatus);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabaseAdmin.from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // Bloquear sessão
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('session_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (sub) {
          await supabaseAdmin.from('sessions').update({
            status: 'disconnected',
            requires_subscription: true,
          }).eq('id', (sub as any).session_id);
        }

        console.log('❌ Assinatura cancelada:', subscription.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          await supabaseAdmin.from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription as string);

          console.log('⚠️ Pagamento falhou para subscription:', invoice.subscription);
        }
        break;
      }

      default:
        console.log('Evento não processado:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro no webhook:', error);
    return new Response(error.message, { status: 400 });
  }
});
