import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { isAnnual, userId, userEmail } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const variantId = isAnnual 
      ? process.env.LEMON_SQUEEZY_VARIANT_ANNUAL 
      : process.env.LEMON_SQUEEZY_VARIANT_MONTHLY;

    if (!apiKey || !storeId || !variantId) {
      console.error("Faltan variables de entorno de Lemon Squeezy.");
      return NextResponse.json({ error: 'Configuración incompleta en el servidor' }, { status: 500 });
    }

    const origin = req.headers.get('origin') || 'https://cuturdeck.site';
    const redirectUrl = `${origin}/premium/success`;

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: userEmail || undefined,
              custom: {
                user_id: userId // CRUCIAL para el Webhook
              }
            },
            // AQUÍ ESTÁ LA CORRECCIÓN: Las opciones de redirección van aquí
            product_options: {
              redirect_url: redirectUrl,
              receipt_button_text: "Ir a mi Bóveda",
              receipt_link_url: redirectUrl
            }
          },
          relationships: {
            store: { 
              data: { type: "stores", id: storeId.toString() } 
            },
            variant: { 
              data: { type: "variants", id: variantId.toString() } 
            }
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Lemon Squeezy API Error:", JSON.stringify(data.errors, null, 2));
      throw new Error(data.errors?.[0]?.detail || 'Error de validación en Lemon Squeezy');
    }

    return NextResponse.json({ url: data.data.attributes.url });

  } catch (err: any) {
    console.error('Error en checkout API:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}