import { CardPriceInfo } from './price-service';

interface Suggestion {
  originalCard: string;
  originalPrice: number;
  replacementCard: string;
  replacementPrice: number;
  savings: number;
  reason: string;
}

export function generateCutSuggestions(
  deckCards: CardPriceInfo[], 
  budgetLimit: number
): Suggestion[] {
  // 1. Ordenamos de más cara a más barata
  const expensiveCards = deckCards
    .filter(c => c.price > budgetLimit)
    .sort((a, b) => b.price - a.price);

  const suggestions: Suggestion[] = [];

  // 2. Lógica de reemplazo (Ejemplo simplificado)
  // En una versión pro, aquí consultaríamos una base de datos de "Tags"
  expensiveCards.forEach(card => {
    if (card.name === "Mana Drain") {
      suggestions.push({
        originalCard: card.name,
        originalPrice: card.price,
        replacementCard: "Counterspell",
        replacementPrice: 1.50,
        savings: card.price - 1.50,
        reason: "Ambas son contrarrestros de 2 manás azules. Counterspell es la opción económica estándar."
      });
    }
    // ... más reglas de negocio
  });

  return suggestions;
}