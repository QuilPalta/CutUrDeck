import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const deckId = searchParams.get('deckId');

  if (!platform || !deckId) {
    return NextResponse.json({ error: 'Faltan parámetros (platform o deckId)' }, { status: 400 });
  }

  try {
    let targetUrl = '';
    
    // Asignamos la URL correcta según la plataforma
    if (platform === 'moxfield') {
      targetUrl = `https://api.moxfield.com/v2/decks/all/${deckId}`;
    } else if (platform === 'archidekt') {
      targetUrl = `https://archidekt.com/api/decks/${deckId}/`;
    } else {
      return NextResponse.json({ error: 'Plataforma no soportada en el proxy' }, { status: 400 });
    }

    // El servidor hace la petición (Esto evita los problemas de CORS del navegador)
    const res = await fetch(targetUrl, {
      headers: {
        // Un User-Agent genérico evita que Moxfield bloquee la petición del servidor
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      },
      // Usamos cache: 'no-store' para que siempre traiga los precios más recientes
      cache: 'no-store' 
    });

    if (!res.ok) {
      throw new Error(`La API de ${platform} respondió con error: ${res.status}`);
    }

    const data = await res.json();
    
    // Le devolvemos los datos limpios a tu frontend
    return NextResponse.json(data);

  } catch (error: any) {
    console.error(`Error en el Proxy de ${platform}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
