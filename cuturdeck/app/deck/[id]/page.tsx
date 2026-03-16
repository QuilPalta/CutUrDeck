"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle, Layers, ExternalLink, DollarSign } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { LanguageProvider, useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { getCardByName, ScryfallCard } from '@/lib/scryfall';
import { DeckCard, SuggestionPair, DeckData } from '@/lib/types';

import CommanderHero from '@/components/deck/CommanderHero';
import InventoryTable from '@/components/deck/InventoryTable';
import BrokerPanel from '@/components/deck/BrokerPanel';
import CardModal from '@/components/deck/CardModal';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const BASIC_LANDS = new Set([
  'Plains', 'Island', 'Swamp', 'Mountain', 'Forest',
  'Snow-Covered Plains', 'Snow-Covered Island', 'Snow-Covered Swamp', 'Snow-Covered Mountain', 'Snow-Covered Forest',
  'Wastes'
]);

function DeckContent() {
  const { t } = useLanguage();
  const params = useParams();
  const deckId = params.id as string;

  const [deck, setDeck] = useState<DeckData | null>(null);
  const [commander, setCommander] = useState<ScryfallCard | null>(null);
  const [deckList, setDeckList] = useState<DeckCard[]>([]);
  const [totalCards, setTotalCards] = useState<number>(0);
  const [totalPriceCK, setTotalPriceCK] = useState<number>(0);
  const [targetBudget, setTargetBudget] = useState<number>(160);
  
  const [suggestions, setSuggestions] = useState<SuggestionPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');

  const [selectedCard, setSelectedCard] = useState<DeckCard | null>(null);

  const calculateCuts = useCallback(async (cards: DeckCard[], budget: number, currentTotal: number) => {
    setIsCalculating(true);
    const budgetGap = budget - currentTotal;
    const newSuggestions: SuggestionPair[] = [];

    try {
      if (budgetGap < 0) {
        const candidatesToRemove = cards
          .filter(c => c.ckPrice > 3.0 && !c.isCommander)
          .sort((a, b) => (b.edhrecRank || 0) - (a.edhrecRank || 0));

        const budgetAlternatives = ["Negate", "Cultivate", "Swords to Plowshares", "Sign in Blood", "Naturalize"];
        
        for (let i = 0; i < Math.min(5, candidatesToRemove.length); i++) {
          const cutCard = candidatesToRemove[i];
          const altCard = await getCardByName(budgetAlternatives[i % budgetAlternatives.length]);
          if (altCard) {
            newSuggestions.push({
              cutCard, addCard: altCard, category: "Corte de Presupuesto",
              reason: `Eficiencia Baja: ${cutCard.name} cuesta $${cutCard.ckPrice.toFixed(2)} pero tiene un ranking EDHREC pobre (${cutCard.edhrecRank || 'N/A'}).`
            });
          }
        }
      } else {
        const candidatesToRemove = cards
          .filter(c => c.ckPrice > 0 && c.ckPrice < 2.0 && !c.isCommander && !c.type_line.toLowerCase().includes("land"))
          .sort((a, b) => (b.edhrecRank || 0) - (a.edhrecRank || 0));

        const premiumStaples = ["Rhystic Study", "Demonic Tutor", "Teferi's Protection", "Cyclonic Rift", "Smothering Tithe"];
        
        for (let i = 0; i < Math.min(5, candidatesToRemove.length); i++) {
          const cutCard = candidatesToRemove[i];
          const stapleCard = await getCardByName(premiumStaples[i % premiumStaples.length]);
          if (stapleCard) {
            newSuggestions.push({
              cutCard, addCard: stapleCard, category: "Upgrade de Poder",
              reason: `Inversión: ${cutCard.name} es el eslabón débil de tu mazo. Aprovecha el margen de $${budgetGap.toFixed(2)} para incluir una pieza central ganadora.`
            });
          }
        }
      }
      setSuggestions(newSuggestions);
    } catch (e) {
      console.error("Error calculando sugerencias", e);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  useEffect(() => {
    async function fetchDeckAndAnalysis() {
      if (!deckId) return;

      try {
        const { data: dbDeck, error: dbError } = await supabase.from('decks').select('id, platform, raw_data').eq('id', deckId).single();
        if (dbError || !dbDeck) throw new Error(t.deckNotFound || "Mazo no encontrado");
        setDeck(dbDeck);

        let commanderName = '';
        let cardsCount = 0;
        let deckPriceSum = 0;
        const cardMap = new Map<string, DeckCard>();

        const addCardToMap = (name: string, quantity: number, ckPrice: number, imageUrl: string, isCmd: boolean, id: string, isFoil: boolean, scryfallId: string, setName: string, typeLine: string) => {
          const mapKey = `${name}-${setName}-${isFoil ? 'foil' : 'normal'}`;
          if (cardMap.has(mapKey)) {
            cardMap.get(mapKey)!.quantity += quantity;
          } else {
            cardMap.set(mapKey, { id, scryfallId, name, quantity, ckPrice, imageUrl, isCommander: isCmd, isFoil, setName, edhrecRank: 999999, type_line: typeLine });
          }
        };

        let rawCardsData: any[] = [];
        const cacheBuster = Date.now();

        if (dbDeck.platform === 'moxfield') {
          const match = dbDeck.raw_data.match(/decks\/([a-zA-Z0-9_-]+)/);
          if (!match) throw new Error("URL inválida de Moxfield");
          
          // ¡CAMBIO CLAVE! Usamos nuestra propia API interna en lugar de corsproxy.io
          const res = await fetch(`/api/proxy?platform=moxfield&deckId=${match[1]}&cb=${cacheBuster}`);
          if (!res.ok) throw new Error("No se pudo conectar con Moxfield mediante el Proxy");
          
          const moxData = await res.json();

          const processMoxCard = (item: any, isCmd: boolean) => {
            const name = item.card?.name || "Desconocida";
            const quantity = Number(item.count ?? item.quantity ?? 1);
            const isFoil = item.finish === 'foil' || item.isFoil === true;
            const isBasic = BASIC_LANDS.has(name);
            
            const priceNormal = Number(item.card?.prices?.ck || 0);
            const rawPrice = isFoil ? (Number(item.card?.prices?.ck_foil || 0) > 0 ? Number(item.card?.prices?.ck_foil) : priceNormal) : priceNormal;
            const ckPrice = isBasic ? 0 : rawPrice;

            rawCardsData.push({ name });
            addCardToMap(name, quantity, ckPrice, item.card?.image_uris?.normal || item.card?.card_faces?.[0]?.image_uris?.normal || "", isCmd, item.card?.id || name, isFoil, item.card?.scryfall_id || item.card?.id || "", item.card?.set_name || item.card?.set?.toUpperCase() || "Desconocida", item.card?.type_line || "Desconocido");
            if (isCmd && !commanderName) commanderName = name;
          };

          if (moxData.commanders) Object.values(moxData.commanders).forEach((c: any) => processMoxCard(c, true));
          if (moxData.mainboard) Object.values(moxData.mainboard).forEach((c: any) => processMoxCard(c, false));
        
        } else if (dbDeck.platform === 'archidekt') {
          const match = dbDeck.raw_data.match(/decks\/(\d+)/);
          if (!match) throw new Error("URL inválida de Archidekt");
          
          // ¡CAMBIO CLAVE! Usamos nuestra propia API interna para Archidekt
          const res = await fetch(`/api/proxy?platform=archidekt&deckId=${match[1]}&cb=${cacheBuster}`);
          if (!res.ok) throw new Error("No se pudo conectar con Archidekt mediante el Proxy");
          
          const archData = await res.json();

          archData.cards.forEach((item: any) => {
            const isCmd = item.categories.includes("Commander");
            const name = item.card?.oracleCard?.name || item.card?.name || "Desconocida";
            const quantity = Number(item.quantity ?? item.count ?? 1);
            const isFoil = item.modifier === 'Foil' || item.modifier === 'Foil Etched';
            const isBasic = BASIC_LANDS.has(name);

            const priceNormal = Number(item.card?.prices?.ck || 0);
            const rawPrice = isFoil ? (Number(item.card?.prices?.ck_foil || 0) > 0 ? Number(item.card?.prices?.ck_foil) : priceNormal) : priceNormal;
            const ckPrice = isBasic ? 0 : rawPrice;

            rawCardsData.push({ name });
            addCardToMap(name, quantity, ckPrice, item.card?.image_uris?.normal || item.card?.card_faces?.[0]?.image_uris?.normal || "", isCmd, item.card?.uid || name, isFoil, item.card?.uid || "", item.card?.edition?.editionname || item.card?.edition?.editioncode?.toUpperCase() || "Desconocida", item.card?.oracleCard?.typeLine || item.card?.type_line || "Desconocido");
            if (isCmd && !commanderName) commanderName = name;
          });
        }

        const uniqueNames = Array.from(new Set(rawCardsData.map(c => c.name)));
        const rankMap = new Map<string, number>();
        for (let i = 0; i < uniqueNames.length; i += 75) {
          const chunk = uniqueNames.slice(i, i + 75).map(n => ({ name: n }));
          const sfRes = await fetch('https://api.scryfall.com/cards/collection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifiers: chunk }) });
          if (sfRes.ok) {
            const sfData = await sfRes.json();
            sfData.data.forEach((card: any) => rankMap.set(card.name, card.edhrec_rank || 999999));
          }
        }

        const parsedList = Array.from(cardMap.values()).map(card => {
          cardsCount += card.quantity;
          deckPriceSum += (card.ckPrice * card.quantity);
          return { ...card, edhrecRank: rankMap.get(card.name) || 999999 };
        });

        setDeckList(parsedList);
        setTotalCards(cardsCount);
        setTotalPriceCK(deckPriceSum);

        if (commanderName) {
          const cmdData = await getCardByName(commanderName);
          if (cmdData) setCommander(cmdData);
        }

        calculateCuts(parsedList, targetBudget, deckPriceSum);

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al procesar el mazo");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDeckAndAnalysis();
  }, [deckId, t, targetBudget, calculateCuts]);

  const handleBudgetSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') calculateCuts(deckList, targetBudget, totalPriceCK);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
      <p className="text-gray-400 font-medium">Sincronizando con Scryfall y Card Kingdom...</p>
    </div>
  );

  if (error || !deck) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md w-full">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4 mx-auto" />
        <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
        <p className="text-gray-300">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30 pb-20">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Análisis del Mazo</h1>
            <p className="text-sm text-gray-400 flex items-center gap-2">Origen: <a href={deck.raw_data} target="_blank" rel="noreferrer" className="capitalize text-emerald-400 hover:text-emerald-300 font-medium underline-offset-2 hover:underline flex items-center gap-1">{deck.platform} <ExternalLink className="w-3 h-3" /></a></p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex flex-col bg-gray-900 border border-gray-800 px-5 py-3 rounded-xl">
               <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><Layers className="w-3 h-3" /> Cartas Leídas</span>
               <span className={`font-bold text-xl ${totalCards >= 98 && totalCards <= 100 ? 'text-emerald-400' : 'text-yellow-400'}`}>{totalCards} / 100</span>
             </div>
             <div className="flex flex-col bg-gray-900 border border-gray-800 px-5 py-3 rounded-xl">
               <span className="text-xs text-emerald-400/80 uppercase font-bold tracking-wider mb-1">Valor Total (CK)</span>
               <span className="font-bold text-xl text-emerald-400 flex items-center gap-1"><DollarSign className="w-5 h-5" /> {totalPriceCK.toFixed(2)}</span>
             </div>
             <div className="flex flex-col bg-blue-900/20 border border-blue-500/30 px-5 py-3 rounded-xl focus-within:border-blue-500/80 transition-colors">
               <span className="text-xs text-blue-400/80 uppercase font-bold tracking-wider mb-1">Target Liga (Enter)</span>
               <div className="flex items-center gap-1">
                 <DollarSign className="w-5 h-5 text-blue-400" />
                 <input type="number" value={targetBudget} onChange={(e) => setTargetBudget(Number(e.target.value))} onKeyDown={handleBudgetSubmit} className="bg-transparent font-bold text-xl text-blue-400 w-24 focus:outline-none" />
               </div>
            </div>
          </div>
        </div>

        {commander && <CommanderHero commander={commander} />}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
          <InventoryTable deckList={deckList} onCardClick={setSelectedCard} />
          <BrokerPanel suggestions={suggestions} isCalculating={isCalculating} targetBudget={targetBudget} totalPriceCK={totalPriceCK} />
        </div>

      </main>

      <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
}

export default function DeckPage() {
  return <LanguageProvider><DeckContent /></LanguageProvider>;
}
