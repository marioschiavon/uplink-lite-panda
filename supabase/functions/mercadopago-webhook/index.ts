import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

async function sendSubscriptionEmail(
  type: 'created' | 'cancelled' | 'payment_failed',
  data: {
    email: string;
    sessionName: string;
    preapprovalId: string;
    amount?: number;
    nextPaymentDate?: string;
  }
) {
  const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
  
  const templates = {
    created: {
      subject: '✅ Assinatura Uplink Ativada',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">Assinatura Ativada com Sucesso!</h1>
          <p>Olá!</p>
          <p>Sua assinatura da sessão <strong>${data.sessionName}</strong> foi ativada com sucesso.</p>
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p><strong>Detalhes:</strong></p>
            <ul>
              <li>Sessão: ${data.sessionName}</li>
              <li>Valor: R$ ${data.amount?.toFixed(2)}</li>
              <li>Próximo pagamento: ${new Date(data.nextPaymentDate!).toLocaleDateString('pt-BR')}</li>
              <li>ID da Assinatura: ${data.preapprovalId}</li>
            </ul>
          </div>
          <p>Sua sessão já está disponível para uso!</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Uplink - Sistema de Gestão WhatsApp<br>
            ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      `
    },
    cancelled: {
      subject: '⚠️ Assinatura Uplink Cancelada',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">Assinatura Cancelada</h1>
          <p>Olá!</p>
          <p>Sua assinatura da sessão <strong>${data.sessionName}</strong> foi cancelada.</p>
          <div style="background-color: #fff5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p><strong>O que isso significa:</strong></p>
            <ul>
              <li>O acesso à sessão será bloqueado</li>
              <li>Não haverá novas cobranças</li>
              <li>Você pode reativar a qualquer momento</li>
            </ul>
          </div>
          <p>Se foi um erro, você pode criar uma nova assinatura no painel.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Uplink - Sistema de Gestão WhatsApp<br>
            ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      `
    },
    payment_failed: {
      subject: '❌ Falha no Pagamento da Assinatura Uplink',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f59e0b;">Falha no Pagamento</h1>
          <p>Olá!</p>
          <p>Não conseguimos processar o pagamento da sua assinatura <strong>${data.sessionName}</strong>.</p>
          <div style="background-color: #fffaf0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p><strong>O que fazer:</strong></p>
            <ul>
              <li>Verifique se há saldo disponível no cartão</li>
              <li>Acesse o Mercado Pago para atualizar forma de pagamento</li>
              <li>Entre em contato com o suporte se precisar de ajuda</li>
            </ul>
          </div>
          <p><strong>IMPORTANTE:</strong> O acesso à sessão pode ser suspenso se o pagamento não for regularizado.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Uplink - Sistema de Gestão WhatsApp<br>
            ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      `
    }
  };

  const template = templates[type];

  try {
    await resend.emails.send({
      from: 'Uplink Lite <assinaturas@uplinklite.com>',
      to: [data.email],
      subject: template.subject,
      html: template.html,
    });
    console.log(`✅ Email de ${type} enviado para ${data.email}`);
  } catch (error) {
    console.error(`❌ Erro ao enviar email de ${type}:`, error);
  }
}

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
        
        // Enviar email de confirmação
        await sendSubscriptionEmail('created', {
          email: preapproval.payer_email || subscription.payer_email,
          sessionName: subscription.sessions?.name || 'Sua sessão',
          preapprovalId: preapprovalId,
          amount: 69.90,
          nextPaymentDate: preapproval.next_payment_date,
        });
        break;
      case 'paused':
        newStatus = 'paused';
        console.log('Assinatura pausada');
        break;
      case 'cancelled':
        newStatus = 'cancelled';
        console.log('Assinatura cancelada');
        
        // Enviar email de cancelamento
        await sendSubscriptionEmail('cancelled', {
          email: preapproval.payer_email || subscription.payer_email,
          sessionName: subscription.sessions?.name || 'Sua sessão',
          preapprovalId: preapprovalId,
        });
        break;
      case 'pending':
        // Se status anterior era 'active' e agora é 'pending', houve falha no pagamento
        if (subscription.status === 'active') {
          console.log('Falha detectada no pagamento recorrente');
          
          await sendSubscriptionEmail('payment_failed', {
            email: preapproval.payer_email || subscription.payer_email,
            sessionName: subscription.sessions?.name || 'Sua sessão',
            preapprovalId: preapprovalId,
          });
          
          newStatus = 'past_due';
        } else {
          newStatus = 'pending';
        }
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
