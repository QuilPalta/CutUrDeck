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
      return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 });
    }

    // Usamos el origen de la petición para saber a dónde redirigir dinámicamente
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
              currency: "USD", 
              custom: {
                user_id: userId
              }
            },
            // AQUÍ ESTÁ LA MAGIA: Le decimos a Lemon Squeezy a dónde volver
            checkout_options: {
              redirect_url: redirectUrl,
            },
            product_options: {
              enabled_variants: [variantId]
            }
          },
          relationships: {
            store: { data: { type: "stores", id: storeId.toString() } },
            variant: { data: { type: "variants", id: variantId.toString() } }
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Error en Lemon Squeezy');
    }

    return NextResponse.json({ url: data.data.attributes.url });

  } catch (err: any) {
    console.error('Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}