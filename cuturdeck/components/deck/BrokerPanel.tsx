"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, ArrowRight, Layers, AlertCircle, Scale } from 'lucide-react';
import { DeckCard, SuggestionPair } from '@/lib/types';
import { getCardByName, ScryfallCard } from '@/lib/scryfall';

interface BrokerPanelProps {
  deckList: DeckCard[];
  commander: ScryfallCard | null;
  targetBudget: number;
  totalPriceCK: number;
  targetStructure: Record<string, number>;
  onCardClick: (card: DeckCard) => void;
}

const normalizeName = (name: string) => {
  const frontFace = name.split('//')[0].trim();
  return frontFace.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
};

const generateSlug = (name: string) => {
  const frontFace = name.split('//')[0].trim();
  return frontFace
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]+/g, '-') 
    .replace(/(^-|-$)/g, ''); 
};

const getBroadType = (typeLine: string) => {
  const tl = typeLine.toLowerCase();
  if (tl.includes('creature')) return 'Creature';
  if (tl.includes('instant')) return 'Instant';
  if (tl.includes('sorcer')) return 'Sorcery';
  if (tl.includes('enchantment')) return 'Enchantment';
  if (tl.includes('planeswalker')) return 'Planeswalker';
  if (tl.includes('artifact')) return 'Artifact';
  if (tl.includes('land')) return 'Land';
  return 'Other';
};

const getCardImageUrl = (card: ScryfallCard) => {
  return card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '';
};

// FIX 1: Función de respaldo para obtener la imagen de las cartas a cortar (DeckCard)
const getDeckCardImageUrl = (card: DeckCard) => {
  if (card.imageUrl && card.imageUrl.trim() !== '') return card.imageUrl;
  
  // Si no hay imagen en el mazo base, le pedimos a Scryfall que nos dé la foto exacta por nombre
  const frontFace = card.name.split('//')[0].trim();
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(frontFace)}&format=image&version=normal`;
};

const mapScryfallToDeckCard = (scryfall: ScryfallCard, ckPrice: number): DeckCard => ({
  id: scryfall.id,
  scryfallId: scryfall.id,
  name: scryfall.name,
  quantity: 1,
  ckPrice: ckPrice,
  imageUrl: getCardImageUrl(scryfall),
  isCommander: false,
  isFoil: false,
  setName: scryfall.set_name || '',
  edhrecRank: 0,
  type_line: scryfall.type_line || '',
  synergy: 0
});

export default function BrokerPanel({ deckList, commander, targetBudget, totalPriceCK, targetStructure, onCardClick }: BrokerPanelProps) {
  const [edhrecData, setEdhrecData] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionPair[]>([]);
  const [isFetchingEDHREC, setIsFetchingEDHREC] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');

  const budgetGap = targetBudget - totalPriceCK;

  const fetchSynergyData = useCallback(async () => {
    if (!commander) return;
    setIsFetchingEDHREC(true);
    setError('');

    try {
      const slug = generateSlug(commander.name);
      const targetUrl = `https://json.edhrec.com/pages/commanders/${slug}.json`;
      
      const edhrecRes = await fetch(targetUrl);
      if (!edhrecRes.ok) throw new Error("EDHREC no encontró datos para este comandante.");

      const edhData = await edhrecRes.json();
      const cardlists = edhData.container?.json_dict?.cardlists || [];
      const potentialCards = new Map();

      cardlists.forEach((list: any) => {
        const headerLower = (list.header || '').toLowerCase();
        let broadType = 'Other';
        if (headerLower.includes('creature')) broadType = 'Creature';
        else if (headerLower.includes('instant')) broadType = 'Instant';
        else if (headerLower.includes('sorcer')) broadType = 'Sorcery';
        else if (headerLower.includes('enchantment')) broadType = 'Enchantment';
        else if (headerLower.includes('planeswalker')) broadType = 'Planeswalker';
        else if (headerLower.includes('artifact')) broadType = 'Artifact';
        else if (headerLower.includes('land')) broadType = 'Land';

        list.cardviews?.forEach((card: any) => {
          if (!potentialCards.has(card.name)) {
            const inc = card.inclusion || card.num_decks || 0;
            const pot = card.potential_decks || 1; 
            const inclusionPct = Math.round((inc / pot) * 100);

            potentialCards.set(card.name, {
              name: card.name,
              inclusion: inclusionPct, 
              price: Number(card.prices?.cardkingdom || card.prices?.tcgplayer || card.price || 1.0),
              type: broadType
            });
          }
        });
      });
      
      setEdhrecData(Array.from(potentialCards.values()));
    } catch (err: any) {
      console.error("[BrokerPanel] Error EDHREC:", err);
      setError("Error conectando con EDHREC.");
    } finally {
      setIsFetchingEDHREC(false);
    }
  }, [commander]);

  useEffect(() => {
    fetchSynergyData();
  }, [fetchSynergyData]);

  const calculateCuts = useCallback(async () => {
    if (edhrecData.length === 0 || deckList.length === 0) return;
    setIsCalculating(true);

    const newSuggestions: SuggestionPair[] = [];
    
    const currentStructure: Record<string, number> = {
      Creature: 0, Instant: 0, Sorcery: 0, Artifact: 0, Enchantment: 0, Planeswalker: 0, Land: 0, Other: 0
    };

    const deckWithStats = deckList.map(card => {
      const bType = getBroadType(card.type_line);
      if (!card.isCommander && currentStructure[bType] !== undefined) {
        currentStructure[bType] += card.quantity;
      }
      
      const synMatch = edhrecData.find(s => normalizeName(s.name) === normalizeName(card.name));
      return { 
        ...card, 
        inclusion: synMatch ? synMatch.inclusion : -1,
        broadType: bType
      }; 
    });

    const typeDeltas: Record<string, number> = {};
    Object.keys(targetStructure).forEach(type => {
      typeDeltas[type] = currentStructure[type] - targetStructure[type]; 
    });

    const currentDeckNamesNormalized = new Set(deckWithStats.map(c => normalizeName(c.name)));
    const availableAdds = edhrecData.filter(c => !currentDeckNamesNormalized.has(normalizeName(c.name)) && c.price > 0);

    try {
      let cutCandidates = [...deckWithStats].filter(c => !c.isCommander);

      const typesToCut = Object.keys(typeDeltas).filter(t => typeDeltas[t] > 0);
      const typesToAdd = Object.keys(typeDeltas).filter(t => typeDeltas[t] < 0);
      const isRebalancing = typesToCut.length > 0 && typesToAdd.length > 0;

      if (isRebalancing) {
        cutCandidates = cutCandidates.filter(c => typesToCut.includes(c.broadType));
      }

      if (budgetGap < 0) {
        cutCandidates = cutCandidates
          .filter(c => c.ckPrice > 1.0)
          .sort((a, b) => a.inclusion - b.inclusion) 
          .slice(0, 10);
      } else {
        cutCandidates = cutCandidates
          .sort((a, b) => a.inclusion - b.inclusion) 
          .slice(0, 10);
      }

      for (const cutCard of cutCandidates) {
        let budgetSpent = newSuggestions.reduce((acc, s) => acc + (Number(s.addCard?.prices?.usd || 0) - s.cutCard.ckPrice), 0);
        let currentRemainingGap = budgetGap - budgetSpent;
        
        let maxAffordable = budgetGap < 0 ? cutCard.ckPrice : (cutCard.ckPrice + currentRemainingGap);

        let potentialAdds = [...availableAdds];
        
        if (isRebalancing) {
          potentialAdds = potentialAdds.filter(a => typesToAdd.includes(a.type));
        } else {
          potentialAdds = potentialAdds.filter(a => a.type === cutCard.broadType || a.type === 'Other');
        }

        const finalAlternatives = potentialAdds
          .filter(c => c.price <= maxAffordable)
          .sort((a, b) => (b.inclusion || 0) - (a.inclusion || 0));

        const altMatch = finalAlternatives.find(a => !newSuggestions.some(s => normalizeName(s.addCard.name) === normalizeName(a.name)));
        
        if (altMatch) {
          const stapleCard = await getCardByName(altMatch.name);
          if (stapleCard) {
            if (!stapleCard.prices) stapleCard.prices = {};
            let finalCkPrice = Number(altMatch.price);
            
            try {
              const proxyRes = await fetch(`/api/proxy?platform=moxfield-card&q=${encodeURIComponent(stapleCard.name)}`);
              if (proxyRes.ok) {
                const moxData = await proxyRes.json();
                if (moxData.data?.[0]?.prices?.ck) finalCkPrice = Number(moxData.data[0].prices.ck);
              }
            } catch(e) {}
            
            if (finalCkPrice > maxAffordable) continue;

            stapleCard.prices.usd = String(finalCkPrice);

            newSuggestions.push({
              cutCard, 
              addCard: stapleCard, 
              category: "", 
              synergyCut: cutCard.inclusion,
              synergyAdd: altMatch.inclusion,
              reason: ""
            });
          }
        }
      }
      
      setSuggestions(newSuggestions);
    } catch (e) {
      console.error("[BrokerPanel] Error en algoritmo", e);
      setError("Error cruzando variables complejas.");
    } finally {
      setIsCalculating(false);
    }
  }, [deckList, edhrecData, budgetGap, targetStructure]);

  useEffect(() => {
    calculateCuts();
  }, [calculateCuts]);

  if (error) {
    return (
      <div className="w-full bg-gray-900 border border-red-900/50 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[300px] text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
        <h3 className="text-red-400 font-bold mb-2">Error del Broker</h3>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl relative overflow-hidden flex flex-col min-h-[400px]">
      {(isFetchingEDHREC || isCalculating) && (
        <div className="absolute inset-0 z-20 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-3" />
          <p className="text-gray-400 text-sm font-medium">
            {isFetchingEDHREC ? "Sincronizando Base de Datos..." : "Procesando Estructura..."}
          </p>
        </div>
      )}
      
      <div className="border-b border-gray-800 pb-4 mb-8 shrink-0">
        <h3 className="text-2xl font-bold flex items-center gap-2 text-gray-200">
          <Scale className="text-gray-400 w-6 h-6" />
          Recomendaciones Estructurales
        </h3>
      </div>
      
      {suggestions.length > 0 ? (
        <div className="flex flex-col gap-6">
          {suggestions.map((pair, idx) => (
            <div key={idx} className="bg-gray-950 border border-gray-800/80 rounded-2xl p-6 flex flex-row items-center justify-between w-full hover:border-gray-700 transition-colors group">
              
              {/* Columna Izquierda: CARTA A CORTAR (1/3) */}
              <div 
                className="flex flex-col items-center flex-1 cursor-pointer"
                onClick={() => onCardClick(pair.cutCard)}
              >
                <div className="w-48 mb-3 overflow-hidden rounded-xl shadow-lg ring-1 ring-gray-800 transition-all group-hover:opacity-70">
                  <img 
                    // FIX 2: Se usa la función de respaldo aquí
                    src={getDeckCardImageUrl(pair.cutCard)} 
                    alt={pair.cutCard.name}
                    className="w-full h-auto object-cover"
                    // FIX 3: Si la imagen realmente falla (error 404), mostramos el reverso de una carta
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://cards.scryfall.io/large/back/0/a/0aeebaf5-8c7d-4636-9e82-8c27447861f7.jpg';
                    }}
                  />
                </div>
                <span className="text-gray-400 font-mono text-lg">${pair.cutCard.ckPrice.toFixed(2)}</span>
                <span className="text-sm font-medium text-gray-500 mt-1">
                  {pair.synergyCut === -1 ? '0%' : `${pair.synergyCut}%`} Inc.
                </span>
              </div>
              
              {/* Columna Central: FLECHA (1/3) */}
              <div className="flex flex-col items-center justify-center flex-1 px-4">
                <ArrowRight className="w-8 h-8 text-gray-700" />
              </div>
              
              {/* Columna Derecha: CARTA A AÑADIR (1/3) */}
              <div 
                className="flex flex-col items-center flex-1 cursor-pointer"
                onClick={() => onCardClick(mapScryfallToDeckCard(pair.addCard, Number(pair.addCard.prices?.usd || 0)))}
              >
                <div className="w-48 mb-3 overflow-hidden rounded-xl shadow-lg ring-1 ring-gray-800 transition-all hover:scale-105 hover:ring-gray-600">
                  <img 
                    src={getCardImageUrl(pair.addCard)} 
                    alt={pair.addCard.name}
                    className="w-full h-auto object-cover"
                    // FIX 3: Respaldo también para la carta sugerida
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://cards.scryfall.io/large/back/0/a/0aeebaf5-8c7d-4636-9e82-8c27447861f7.jpg';
                    }}
                  />
                </div>
                <span className="text-gray-200 font-mono text-lg">${(Number(pair.addCard.prices?.usd) || 0).toFixed(2)}</span>
                <span className="text-sm font-medium text-gray-500 mt-1">
                  {pair.synergyAdd}% Inc.
                </span>
              </div>

            </div>
          ))}
        </div>
      ) : (
        !isFetchingEDHREC && !isCalculating && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <Layers className="w-16 h-16 text-gray-800 mb-4" />
            <p className="text-lg">Configuración de mazo estable.</p>
          </div>
        )
      )}
    </div>
  );
}