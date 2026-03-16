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
}

export interface SuggestionPair {
  cutCard: DeckCard;
  addCard: ScryfallCard;
  reason: string;
  category: string;
}

export interface DeckData {
  id: string;
  platform: string;
  raw_data: string;
}
