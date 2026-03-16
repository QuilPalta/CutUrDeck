import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const deckId = searchParams.get('deckId');
  const query = searchParams.get('q'); // Nuevo parámetro para buscar cartas

  if (!platform) {
    return NextResponse.json({ error: 'Falta el parámetro platform' }, { status: 400 });
  }

  try {
    let targetUrl = '';
    
    // Asignamos la URL correcta según la necesidad
    if (platform === 'moxfield') {
      if (!deckId) return NextResponse.json({ error: 'Falta deckId' }, { status: 400 });
      targetUrl = `https://api.moxfield.com/v2/decks/all/${deckId}`;
    } else if (platform === 'archidekt') {
      if (!deckId) return NextResponse.json({ error: 'Falta deckId' }, { status: 400 });
      targetUrl = `https://archidekt.com/api/decks/${deckId}/`;
    } else if (platform === 'moxfield-card') {
      // NUEVO: Endpoint de búsqueda de cartas de Moxfield
      if (!query) return NextResponse.json({ error: 'Falta el parámetro q (nombre de carta)' }, { status: 400 });
      targetUrl = `https://api.moxfield.com/v2/cards/search?q=${encodeURIComponent(query)}`;
    } else {
      return NextResponse.json({ error: 'Plataforma no soportada en el proxy' }, { status: 400 });
    }

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      },
      cache: 'no-store' 
    });

    if (!res.ok) {
      throw new Error(`La API respondió con error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error(`Error en el Proxy de ${platform}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
