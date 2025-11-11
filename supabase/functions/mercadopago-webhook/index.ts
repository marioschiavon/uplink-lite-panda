import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.json();
    console.log('Webhook recebido do Mercado Pago:', JSON.stringify(body, null, 2));

    // Mercado Pago envia notificações de diferentes tipos
    if (body.type !== 'subscription_preapproval' && body.action !== 'created' && body.action !== 'updated') {
      console.log('Tipo de notificação ignorado:', body.type);
      return new Response(JSON.stringify({ received: true }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }
    
    // Buscar detalhes da assinatura no MP
    const preapprovalId = body.data?.id;
    if (!preapprovalId) {
      console.error('ID da assinatura não encontrado no webhook');
      return new Response(JSON.stringify({ error: 'Missing preapproval ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Buscando detalhes da assinatura:', preapprovalId);
    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('Erro ao buscar assinatura no MP:', errorText);
      throw new Error('Erro ao buscar assinatura no Mercado Pago');
    }

    const preapproval = await mpResponse.json();
    console.log('Detalhes da assinatura recebidos:', JSON.stringify(preapproval, null, 2));

    // Buscar assinatura no banco (com dados da sessão)
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions' as any)
      .select('*, sessions(*)')
      .eq('preapproval_id', preapprovalId)
      .single();

    if (subError) {
      console.error('Erro ao buscar assinatura no banco:', subError);
      // Se não existe, pode ser uma nova assinatura criada direto no MP
      // Vamos tentar criar baseado no external_reference (que agora é session_id)
      if (preapproval.external_reference) {
        console.log('Criando nova assinatura para sessão:', preapproval.external_reference);
        
        // Buscar dados da sessão
        const { data: sessionData } = await supabaseClient
          .from('sessions')
          .select('organization_id')
          .eq('id', preapproval.external_reference)
          .single();
        
        const { error: insertError } = await supabaseClient
          .from('subscriptions' as any)
          .insert({
            session_id: preapproval.external_reference,
            organization_id: sessionData?.organization_id,
            preapproval_id: preapprovalId,
            payer_email: preapproval.payer_email,
            status: preapproval.status === 'authorized' ? 'active' : 'pending',
            plan_name: 'api_session',
            amount: 69.90,
            external_reference: preapproval.external_reference,
            start_date: preapproval.init_point ? new Date().toISOString() : null,
          });

        if (insertError) {
          console.error('Erro ao criar assinatura:', insertError);
        }
      }
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Mapear status do MP para nosso sistema
    let newStatus = 'pending';
    let subscriptionActive = false;

    switch (preapproval.status) {
      case 'authorized':
        newStatus = 'active';
        subscriptionActive = true;
        console.log('Assinatura autorizada - ativando acesso');
        break;
      case 'paused':
        newStatus = 'paused';
        console.log('Assinatura pausada');
        break;
      case 'cancelled':
        newStatus = 'cancelled';
        console.log('Assinatura cancelada');
        break;
      default:
        console.log('Status desconhecido:', preapproval.status);
    }

    // Atualizar subscription
    const { error: updateSubError } = await supabaseClient
      .from('subscriptions' as any)
      .update({
        status: newStatus,
        payer_id: preapproval.payer_id,
        start_date: preapproval.date_created,
        next_payment_date: preapproval.next_payment_date,
        payment_method_id: preapproval.payment_method_id,
        updated_at: new Date().toISOString(),
      })
      .eq('preapproval_id', preapprovalId);

    if (updateSubError) {
      console.error('Erro ao atualizar subscription:', updateSubError);
    } else {
      console.log('Subscription atualizada com sucesso');
    }

    // NOVO: Liberar ou bloquear a sessão específica baseado no status
    if (subscription.session_id) {
      const { error: updateSessionError } = await supabaseClient
        .from('sessions')
        .update({
          requires_subscription: !subscriptionActive, // FALSE se ativo, TRUE se inativo
        })
        .eq('id', subscription.session_id);

      if (updateSessionError) {
        console.error('Erro ao atualizar sessão:', updateSessionError);
      } else {
        console.log(`Sessão ${subscription.session_id} ${subscriptionActive ? 'liberada' : 'bloqueada'}`);
      }
    }

    // Atualizar organization (manter compatibilidade)
    const { error: updateOrgError } = await supabaseClient
      .from('organizations')
      .update({
        subscription_status: subscriptionActive ? 'active' : 'inactive',
        subscription_expires_at: preapproval.next_payment_date,
      })
      .eq('id', subscription.organization_id);

    if (updateOrgError) {
      console.error('Erro ao atualizar organization:', updateOrgError);
    } else {
      console.log('Organization atualizada - status:', subscriptionActive ? 'active' : 'inactive');
    }

    console.log(`Webhook processado com sucesso - Assinatura ${preapprovalId} -> ${newStatus}`);

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Erro no webhook do Mercado Pago:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
