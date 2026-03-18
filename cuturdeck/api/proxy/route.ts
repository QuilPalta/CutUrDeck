import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const deckId = searchParams.get('deckId');
  const query = searchParams.get('q'); 

  // Este log aparecerá en tu terminal si el nuevo archivo está funcionando
  console.log(`[Proxy Activo] Recibido: platform=${platform}, query=${query}`);

  if (!platform) {
    return NextResponse.json({ error: 'Falta el parámetro platform' }, { status: 400 });
  }

  try {
    let targetUrl = '';
    
    if (platform === 'moxfield') {
      if (!deckId) return NextResponse.json({ error: 'Falta deckId' }, { status: 400 });
      targetUrl = `https://api.moxfield.com/v2/decks/all/${deckId}`;
    } 
    else if (platform === 'archidekt') {
      if (!deckId) return NextResponse.json({ error: 'Falta deckId' }, { status: 400 });
      targetUrl = `https://archidekt.com/api/decks/${deckId}/`;
    } 
    else if (platform === 'moxfield-card') {
      if (!query) return NextResponse.json({ error: 'Falta parámetro q' }, { status: 400 });
      targetUrl = `https://api.moxfield.com/v2/cards/search?q=${encodeURIComponent(query)}`;
    } 
    else if (platform === 'edhrec') {
      if (!query) return NextResponse.json({ error: 'Falta parámetro q' }, { status: 400 });
      // Limpieza exhaustiva del nombre del comandante
      const slug = query
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9]+/g, '-') 
        .replace(/(^-|-$)/g, ''); 
        
      targetUrl = `https://json.edhrec.com/pages/commanders/${slug}.json`;
    } 
    else {
      return NextResponse.json({ error: 'Plataforma no soportada' }, { status: 400 });
    }

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/json'
      },
      cache: 'no-store' 
    });

    if (!res.ok) {
      if (platform === 'edhrec' && res.status === 404) {
        return NextResponse.json({ container: { json_dict: { cardlists: [] } } });
      }
      throw new Error(`API respondió con error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error(`[Proxy Error]:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}