export interface ScryfallCard {
  id: string;
  name: string;
  image_uris?: {
    normal: string;
    art_crop: string;
  };
  mana_cost: string;
  prices: {
    usd: string | null;
    usd_foil: string | null;
    eur: string | null;
    tix: string | null;
  };
  purchase_uris?: {
    tcgplayer?: string;
    cardmarket?: string;
    cardhoarder?: string;
    cardkingdom?: string;
  };
  set_name: string;
  type_line: string;
  
  // Propiedad inyectada por nuestro sistema MTGJSON
  exact_ck_price?: string | null; 
}

export async function getCardByName(name: string): Promise<ScryfallCard | null> {
  try {
    const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
    if (!res.ok) {
      console.warn(`Carta no encontrada en Scryfall: ${name}`);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error conectando con Scryfall:", error);
    return null;
  }
}