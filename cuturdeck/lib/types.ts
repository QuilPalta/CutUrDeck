import { ScryfallCard } from './scryfall';

export interface DeckCard {
  id: string;
  scryfallId: string;
  name: string;
  quantity: number;
  ckPrice: number;
  imageUrl: string;
  isCommander: boolean;
  isFoil: boolean;
  setName: string;
  edhrecRank: number;
  type_line: string;
  synergy: number; // NUEVO: Porcentaje de Sinergia
}

export interface SuggestionPair {
  cutCard: DeckCard;
  addCard: ScryfallCard;
  reason: string;
  category: string;
  synergyAdd: number; // Sinergia de la carta recomendada
  synergyCut: number; // Sinergia de la carta eliminada
}

export interface DeckData {
  id: string;
  platform: string;
  raw_data: string;
}