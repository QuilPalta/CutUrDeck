import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { isAnnual, userId, userEmail } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    // Estas variables las obtendrás del panel de configuración de Lemon Squeezy
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    
    // Cada plan (Mensual/Anual) en Lemon Squeezy es una "Variante" de tu producto
    const variantId = isAnnual 
      ? process.env.LEMON_SQUEEZY_VARIANT_ANNUAL 
      : process.env.LEMON_SQUEEZY_VARIANT_MONTHLY;

    if (!apiKey || !storeId || !variantId) {
      return NextResponse.json({ error: 'Faltan variables de entorno de Lemon Squeezy' }, { status: 500 });
    }

    // Creación del Checkout vía API de Lemon Squeezy
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
                // Esto es CRUCIAL: Pasamos tu userId como metadata para que cuando 
                // Lemon Squeezy nos avise que pagaron, sepamos a qué cuenta darle el Premium
                user_id: userId
              }
            }
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: storeId.toString()
              }
            },
            variant: {
              data: {
                type: "variants",
                id: variantId.toString()
              }
            }
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Error creando el checkout en Lemon Squeezy');
    }

    // Lemon Squeezy devuelve la URL de pago lista para usar
    return NextResponse.json({ url: data.data.attributes.url });

  } catch (err: any) {
    console.error('Error en checkout Lemon Squeezy:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}