"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ArrowRight, TrendingDown, RefreshCcw, Layers, ExternalLink, ShoppingCart } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { LanguageProvider, useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { getCardByName, ScryfallCard } from '@/lib/scryfall';
import { getExactCardKingdomPrice } from '@/lib/mtgjson';

export const dynamic = 'force-dynamic';

interface DeckData {
  id: string;
  platform: string;
  raw_data: string;
}

interface SuggestionPair {
  cutCard: ScryfallCard;
  addCard: ScryfallCard;
  reason: string;
}

function DeckContent() {
  const { t } = useLanguage();
  const params = useParams();
  const deckId = params.id as string;

  const [deck, setDeck] = useState<DeckData | null>(null);
  const [commander, setCommander] = useState<ScryfallCard | null>(null);
  const [totalCards, setTotalCards] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<SuggestionPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDeckAndAnalysis() {
      if (!deckId) return;

      try {
        const { data: dbDeck, error: dbError } = await supabase
          .from('decks')
          .select('id, platform, raw_data')
          .eq('id', deckId)
          .single();

        if (dbError || !dbDeck) throw new Error(t.deckNotFound);
        setDeck(dbDeck);

        let commanderName = '';
        let cardsCount = 0;
        const cardNamesList: string[] = [];

        if (dbDeck.platform === 'moxfield') {
          const match = dbDeck.raw_data.match(/decks\/([a-zA-Z0-9_-]+)/);
          if (!match) throw new Error(t.errMoxfieldInvalid);
          
          const targetUrl = encodeURIComponent(`https://api.moxfield.com/v2/decks/all/${match[1]}`);
          const res = await fetch(`https://corsproxy.io/?${targetUrl}`);
          
          if (!res.ok) throw new Error(t.errMoxfieldBlocked);
          
          const moxData = await res.json();

          if (moxData.commanders && Object.keys(moxData.commanders).length > 0) {
            commanderName = Object.keys(moxData.commanders)[0];
          }
          if (moxData.mainboard) {
            const mainboardCards = Object.keys(moxData.mainboard);
            cardsCount = mainboardCards.length;
            cardNamesList.push(...mainboardCards);
          }

        } else if (dbDeck.platform === 'archidekt') {
          const match = dbDeck.raw_data.match(/decks\/(\d+)/);
          if (!match) throw new Error(t.errArchidektInvalid);
          
          const targetUrl = encodeURIComponent(`https://archidekt.com/api/decks/${match[1]}/`);
          const res = await fetch(`https://corsproxy.io/?${targetUrl}`);
          
          if (!res.ok) throw new Error(t.errArchidektBlocked);
          
          const archData = await res.json();

          archData.cards.forEach((item: any) => {
            if (item.categories.includes("Commander")) {
              commanderName = item.card.oracleCard.name;
            } else {
              cardNamesList.push(item.card.oracleCard.name);
            }
          });
          cardsCount = cardNamesList.length;
        } else {
          throw new Error(t.errPlatform);
        }

        setTotalCards(cardsCount);

        // Fetch Comandante: Scryfall (Visuals) + MTGJSON (Precio CK)
        if (commanderName) {
          const cmdData = await getCardByName(commanderName);
          if (cmdData) {
            const ckPrice = await getExactCardKingdomPrice(commanderName);
            setCommander({ ...cmdData, exact_ck_price: ckPrice });
          }
        }

        const mockAnalysis = [
          { cut: "Sol Ring", add: "Mana Crypt", reason: "Mejora de Curva: Mana Crypt acelera brutalmente tu inicio, siendo un coste 0." }
        ];

        const loadedSuggestions: SuggestionPair[] = [];
        for (const pair of mockAnalysis) {
          const cutData = await getCardByName(pair.cut);
          const addData = await getCardByName(pair.add);
          
          if (cutData && addData) {
            // Fetch precios exactos de Card Kingdom de manera independiente
            const cutCkPrice = await getExactCardKingdomPrice(pair.cut);
            const addCkPrice = await getExactCardKingdomPrice(pair.add);

            loadedSuggestions.push({ 
              cutCard: { ...cutData, exact_ck_price: cutCkPrice }, 
              addCard: { ...addData, exact_ck_price: addCkPrice }, 
              reason: pair.reason 
            });
          }
        }
        
        setSuggestions(loadedSuggestions);

      } catch (err: any) {
        console.error(err);
        setError(err.message || t.deckError);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDeckAndAnalysis();
  }, [deckId, t]);

  // Componente interno actualizado: Card Kingdom usa su propio dato exacto
  const CardPrices = ({ card }: { card: ScryfallCard }) => {
    const cardKingdomSearchUrl = `https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=${encodeURIComponent(card.name)}`;
    const ckLink = card.purchase_uris?.cardkingdom || cardKingdomSearchUrl;

    return (
      <div className="flex flex-col gap-2 mt-3 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          {/* 1. Card Kingdom (Precio exacto extraído de la integración MTGJSON) */}
          <a 
            href={ckLink} 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center justify-between px-3 py-2 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-colors group"
          >
            <span className="flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-500 group-hover:text-emerald-400" />
              {t.priceCK}
            </span>
            <span className="text-emerald-400 font-bold">
               {card.exact_ck_price ? `$${card.exact_ck_price}` : 'N/A'}
            </span>
          </a>

          {/* 2. TCGPlayer (Precio original de Scryfall) */}
          {card.prices.usd && (
            <a 
              href={card.purchase_uris?.tcgplayer} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center justify-between px-3 py-2 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-colors group"
            >
              <span className="flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-400" />
                {t.priceTCG}
              </span>
              <span className="text-gray-400">${card.prices.usd}</span>
            </a>
          )}

          {/* 3. Cardmarket */}
          {card.prices.eur && (
            <a 
              href={card.purchase_uris?.cardmarket} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center justify-between px-3 py-2 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-colors group sm:col-span-2 md:col-span-1"
            >
              <span className="flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-yellow-500 group-hover:text-yellow-400" />
                {t.priceCM}
              </span>
              <span className="text-gray-400">€{card.prices.eur}</span>
            </a>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
          <p className="text-gray-400 font-medium">{t.deckLoading}</p>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md w-full flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
            <p className="text-gray-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-purple-500/30 pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-10">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
              {t.deckTitle}
            </h1>
            <p className="text-sm text-gray-400 flex items-center gap-2">
              {t.deckPlatform}: 
              <a href={deck.raw_data} target="_blank" rel="noreferrer" className="capitalize text-purple-400 hover:text-purple-300 font-medium underline-offset-2 hover:underline transition-all flex items-center gap-1">
                {deck.platform} <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl">
             <Layers className="w-5 h-5 text-purple-400" />
             <span className="font-bold text-lg text-white">{totalCards}</span>
             <span className="text-xs text-gray-500 uppercase">{t.deckCardsTotal}</span>
          </div>
        </div>

        {commander && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 relative overflow-hidden rounded-2xl border border-yellow-500/30 shadow-2xl shadow-yellow-500/10 group"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-500"
              style={{ backgroundImage: `url(${commander.image_uris?.art_crop})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
            
            <div className="relative z-10 p-8 md:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-8">
              <img 
                src={commander.image_uris?.normal} 
                alt={commander.name} 
                className="w-48 sm:w-56 rounded-xl shadow-2xl rotate-[-2deg] group-hover:rotate-0 transition-transform duration-500 border border-gray-700"
              />
              <div className="flex flex-col justify-center h-full pt-4 text-center sm:text-left w-full sm:w-auto">
                <span className="text-yellow-500 font-bold tracking-widest text-xs uppercase mb-2 flex items-center justify-center sm:justify-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  {t.commanderTitle}
                </span>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-2">{commander.name}</h2>
                <p className="text-gray-400 font-medium mb-6">{commander.type_line}</p>
                <div className="w-full sm:w-72">
                   <CardPrices card={commander} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div>
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 border-b border-gray-800 pb-4">
            <TrendingDown className="text-red-400 w-6 h-6" />
            {t.suggestedCuts}
          </h3>

          <div className="flex flex-col gap-8">
            {suggestions.map((pair, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.15 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
                  
                  {/* CARTA A CORTAR */}
                  <div className="flex-1 flex flex-col items-center w-full">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                      <img 
                        src={pair.cutCard.image_uris?.normal} 
                        alt={pair.cutCard.name} 
                        className="w-48 rounded-xl border-2 border-red-500/50 relative z-10 hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-red-900/20"
                      />
                    </div>
                    <div className="mt-4 text-center w-full sm:w-72">
                      <p className="font-bold text-red-400 text-lg mb-1">{pair.cutCard.name}</p>
                      <CardPrices card={pair.cutCard} />
                    </div>
                  </div>

                  {/* FLECHA */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="bg-gray-950 border border-gray-800 p-4 rounded-full shadow-inner mb-2 my-4 lg:my-0">
                      <ArrowRight className="w-8 h-8 text-gray-400 hidden lg:block" />
                      <ArrowRight className="w-8 h-8 text-gray-400 rotate-90 lg:hidden" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.replaceWith}</span>
                  </div>

                  {/* CARTA NUEVA */}
                  <div className="flex-1 flex flex-col items-center w-full">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                      <img 
                        src={pair.addCard.image_uris?.normal} 
                        alt={pair.addCard.name} 
                        className="w-48 rounded-xl border-2 border-emerald-500/50 relative z-10 hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-emerald-900/20"
                      />
                    </div>
                    <div className="mt-4 text-center w-full sm:w-72">
                      <p className="font-bold text-emerald-400 text-lg mb-1">{pair.addCard.name}</p>
                      <CardPrices card={pair.addCard} />
                    </div>
                  </div>
                </div>

                {/* JUSTIFICACIÓN */}
                <div className="mt-8 pt-6 border-t border-gray-800 relative z-10">
                  <div className="flex items-start gap-3">
                    <RefreshCcw className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-200 block mb-1">{t.cutReason}</span>
                      <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                        {pair.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

export default function DeckPage() {
  return (
    <LanguageProvider>
      <DeckContent />
    </LanguageProvider>
  );
}