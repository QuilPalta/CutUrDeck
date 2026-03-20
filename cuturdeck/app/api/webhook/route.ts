import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';
    
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signature = Buffer.from(req.headers.get('x-signature') || '', 'utf8');

    if (!crypto.timingSafeEqual(digest, signature)) {
      console.error("Firma de Webhook inválida.");
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data;

    console.log(`Recibido evento de Lemon Squeezy: ${eventName}`);

    // Solo nos interesan los eventos donde el usuario paga exitosamente
    if (eventName === 'subscription_created' || eventName === 'order_created') {
      const userId = customData?.user_id;
      const customerId = payload.data?.attributes?.customer_id?.toString();

      if (userId) {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ 
            is_premium: true,
            ls_customer_id: customerId
          })
          .eq('id', userId);

        if (error) {
          console.error("Error actualizando Supabase:", error);
          throw error;
        }
        
        console.log(`✅ ¡Éxito! Usuario ${userId} es ahora PREMIUM.`);
      } else {
        console.warn("Se recibió un pago, pero no traía el user_id en custom_data.");
      }
    }

    // Si el usuario cancela la suscripción (opcional, pero buena práctica)
    if (eventName === 'subscription_expired') {
       const userId = customData?.user_id;
       if (userId) {
         await supabaseAdmin.from('profiles').update({ is_premium: false }).eq('id', userId);
         console.log(`❌ Usuario ${userId} perdió el Premium.`);
       }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook Error General:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}