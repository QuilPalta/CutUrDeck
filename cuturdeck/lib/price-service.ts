export interface CardPriceInfo {
  name: string;
  price: number;
  image: string;
  ck_link: string;
}

export async function getLivePrices(cardNames: string[]): Promise<Record<string, CardPriceInfo>> {
  try {
    // Limpiamos los nombres por si vienen con "1x Name" o espacios
    const cleanNames = cardNames.map(name => {
      return name.replace(/^\d+x\s+/, '').trim();
    });

    // Scryfall permite hasta 75 identificadores por POST
    const identifiers = cleanNames.map(name => ({ name }));
    
    const response = await fetch('https://api.scryfall.com/cards/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifiers })
    });

    if (!response.ok) throw new Error("Error en la respuesta de Scryfall");

    const data = await response.json();
    const priceMap: Record<string, CardPriceInfo> = {};

    data.data.forEach((card: any) => {
      priceMap[card.name] = {
        name: card.name,
        price: parseFloat(card.prices.usd || card.prices.usd_foil || "0"),
        image: card.image_uris?.normal || card.image_uris?.small || "",
        ck_link: card.purchase_uris?.cardkingdom || `https://www.cardkingdom.com/catalog/search?filter%5Bname%5D=${encodeURIComponent(card.name)}`
      };
    });

    return priceMap;
  } catch (error) {
    console.error("Error obteniendo precios:", error);
    return {};
  }
}