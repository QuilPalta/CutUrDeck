"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle, Layers, ExternalLink, DollarSign, Settings2, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { LanguageProvider, useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { getCardByName, ScryfallCard } from '@/lib/scryfall';
import { DeckCard, DeckData } from '@/lib/types';

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

export const getBroadType = (typeLine: string) => {
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

export default function DeckPage() {
  return <LanguageProvider><DeckContent /></LanguageProvider>;
}

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
  const [showConfig, setShowConfig] = useState(false);
  const [targetStructure, setTargetStructure] = useState<Record<string, number>>({
    Creature: 0, Instant: 0, Sorcery: 0, Artifact: 0, Enchantment: 0, Planeswalker: 0, Land: 0, Other: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCard, setSelectedCard] = useState<DeckCard | null>(null);

  useEffect(() => {
    async function fetchDeckBase() {
      if (!deckId) return;

      try {
        const { data: dbDeck, error: dbError } = await supabase.from('decks').select('id, platform, raw_data').eq('id', deckId).single();
        if (dbError || !dbDeck) throw new Error(t.deckNotFound || "Mazo no encontrado en la base de datos.");
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
            cardMap.set(mapKey, { 
              id, scryfallId, name, quantity, ckPrice, imageUrl, isCommander: isCmd, isFoil, setName, type_line: typeLine, 
              edhrecRank: 999999, 
              synergy: 0 
            });
          }
        };

        const cacheBuster = Date.now();

        if (dbDeck.platform === 'moxfield') {
          const match = dbDeck.raw_data.match(/decks\/([a-zA-Z0-9_-]+)/);
          if (!match) throw new Error("URL inválida de Moxfield");
          const res = await fetch(`/api/proxy?platform=moxfield&deckId=${match[1]}&cb=${cacheBuster}`);
          if (!res.ok) throw new Error("No se pudo conectar con Moxfield");
          const moxData = await res.json();

          const processMoxCard = (item: any, isCmd: boolean) => {
            const name = item.card?.name || "Desconocida";
            const quantity = Number(item.count ?? item.quantity ?? 1);
            const isFoil = item.finish === 'foil' || item.isFoil === true;
            const isBasic = BASIC_LANDS.has(name);
            const priceNormal = Number(item.card?.prices?.ck || 0);
            const rawPrice = isFoil ? (Number(item.card?.prices?.ck_foil || 0) > 0 ? Number(item.card?.prices?.ck_foil) : priceNormal) : priceNormal;
            const ckPrice = isBasic ? 0 : rawPrice;

            addCardToMap(name, quantity, ckPrice, item.card?.image_uris?.normal || item.card?.card_faces?.[0]?.image_uris?.normal || "", isCmd, item.card?.id || name, isFoil, item.card?.scryfall_id || item.card?.id || "", item.card?.set_name || item.card?.set?.toUpperCase() || "Desconocida", item.card?.type_line || "Desconocido");
            if (isCmd && !commanderName) commanderName = name;
          };

          if (moxData.commanders) Object.values(moxData.commanders).forEach((c: any) => processMoxCard(c, true));
          if (moxData.mainboard) Object.values(moxData.mainboard).forEach((c: any) => processMoxCard(c, false));
        } else if (dbDeck.platform === 'archidekt') {
          const match = dbDeck.raw_data.match(/decks\/(\d+)/);
          if (!match) throw new Error("URL inválida de Archidekt");
          const res = await fetch(`/api/proxy?platform=archidekt&deckId=${match[1]}&cb=${cacheBuster}`);
          if (!res.ok) throw new Error("No se pudo conectar con Archidekt");
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

            addCardToMap(name, quantity, ckPrice, item.card?.image_uris?.normal || item.card?.card_faces?.[0]?.image_uris?.normal || "", isCmd, item.card?.uid || name, isFoil, item.card?.uid || "", item.card?.edition?.editionname || item.card?.edition?.editioncode?.toUpperCase() || "Desconocida", item.card?.oracleCard?.typeLine || item.card?.type_line || "Desconocido");
            if (isCmd && !commanderName) commanderName = name;
          });
        }

        const parsedList = Array.from(cardMap.values());
        
        const initialStructure: Record<string, number> = {
          Creature: 0, Instant: 0, Sorcery: 0, Artifact: 0, Enchantment: 0, Planeswalker: 0, Land: 0, Other: 0
        };

        parsedList.forEach(card => {
          cardsCount += card.quantity;
          deckPriceSum += (card.ckPrice * card.quantity);
          if (!card.isCommander) {
            const bType = getBroadType(card.type_line);
            initialStructure[bType] += card.quantity;
          }
        });
        
        parsedList.sort((a, b) => b.ckPrice - a.ckPrice);

        setDeckList(parsedList);
        setTotalCards(cardsCount);
        setTotalPriceCK(deckPriceSum);
        setTargetStructure(initialStructure);

        if (commanderName) {
          const cmdData = await getCardByName(commanderName);
          if (cmdData) setCommander(cmdData);
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al procesar el mazo");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDeckBase();
  }, [deckId, t]);

  const handleStructureChange = (type: string, value: number) => {
    setTargetStructure(prev => ({ ...prev, [type]: value }));
  };

  const totalTargetCards = useMemo(() => {
    return Object.values(targetStructure).reduce((a, b) => a + b, 0) + (commander ? 1 : 0);
  }, [targetStructure, commander]);

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
      <p className="text-gray-400 font-medium">Analizando estructura del mazo...</p>
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
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Análisis de Estructura</h1>
            <p className="text-sm text-gray-400 flex items-center gap-2">Origen: <a href={deck.raw_data} target="_blank" rel="noreferrer" className="capitalize text-emerald-400 hover:text-emerald-300 font-medium underline-offset-2 hover:underline flex items-center gap-1">{deck.platform} <ExternalLink className="w-3 h-3" /></a></p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex flex-col bg-gray-900 border border-gray-800 px-5 py-3 rounded-xl">
               <span className="text-xs text-emerald-400/80 uppercase font-bold tracking-wider mb-1">Valor Total (CK)</span>
               <span className="font-bold text-xl text-emerald-400 flex items-center gap-1"><DollarSign className="w-5 h-5" /> {totalPriceCK.toFixed(2)}</span>
             </div>
             
             <div className="flex flex-col bg-blue-900/20 border border-blue-500/30 px-5 py-3 rounded-xl focus-within:border-blue-500/80 transition-colors">
               <span className="text-xs text-blue-400/80 uppercase font-bold tracking-wider mb-1">Target Liga</span>
               <div className="flex items-center gap-1">
                 <DollarSign className="w-5 h-5 text-blue-400" />
                 <input 
                   type="number" 
                   value={targetBudget} 
                   onChange={(e) => setTargetBudget(Number(e.target.value))} 
                   className="bg-transparent font-bold text-xl text-blue-400 w-24 focus:outline-none" 
                 />
               </div>
            </div>

            <button 
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-2 px-5 py-4 rounded-xl font-bold transition-all border ${showConfig ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/50' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'}`}
            >
              <Settings2 className="w-5 h-5" />
              Blueprint
            </button>
          </div>
        </div>

        {showConfig && (
          <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 mb-8 shadow-2xl animate-in slide-in-from-top-4 fade-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                  <Layers className="w-5 h-5" /> Blueprint del Mazo
                </h3>
                <p className="text-sm text-gray-400 mt-1">Define cuántas cartas exactas quieres de cada tipo. El Broker rebalanceará el mazo por ti.</p>
              </div>
              <div className={`px-4 py-2 rounded-lg font-mono font-bold text-lg flex items-center gap-2 border ${totalTargetCards === 100 ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50' : 'bg-red-900/30 text-red-400 border-red-500/50'}`}>
                {totalTargetCards === 100 && <CheckCircle2 className="w-5 h-5" />}
                Total: {totalTargetCards}/100
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {['Land', 'Creature', 'Artifact', 'Enchantment', 'Instant', 'Sorcery', 'Planeswalker'].map((type) => (
                <div key={type} className="bg-gray-950 border border-gray-800 rounded-lg p-3">
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">{type === 'Land' ? 'Tierras' : type}</label>
                  <input 
                    type="number" 
                    min="0"
                    value={targetStructure[type]} 
                    onChange={(e) => handleStructureChange(type, Number(e.target.value) || 0)}
                    className="w-full bg-transparent text-white font-bold text-xl border-b border-gray-700 focus:border-purple-500 focus:outline-none pb-1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {commander && <CommanderHero commander={commander} />}

        <div className="flex flex-col gap-10 mb-12">
          <div className="w-full">
            <InventoryTable deckList={deckList} onCardClick={setSelectedCard} />
          </div>
          
          <div className="w-full">
            <BrokerPanel 
              deckList={deckList} 
              commander={commander} 
              targetBudget={targetBudget} 
              totalPriceCK={totalPriceCK} 
              targetStructure={targetStructure} 
              onCardClick={setSelectedCard} // Pasamos el control del modal al Broker
            />
          </div>
        </div>

      </main>

      <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
}