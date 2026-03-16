"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, X, BookOpen, Gavel } from 'lucide-react';
import { DeckCard } from '@/lib/types';

interface CardModalProps {
  card: DeckCard | null;
  onClose: () => void;
}

export default function CardModal({ card, onClose }: CardModalProps) {
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [cardRulings, setCardRulings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!card) return;
    
    let isMounted = true;
    const fetchScryfallData = async () => {
      setIsLoading(true);
      setCardDetails(null);
      setCardRulings([]);

      try {
        let url = `https://api.scryfall.com/cards/${card.scryfallId}`;
        if (!card.scryfallId) url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}`;
        
        let res = await fetch(url);
        if (!res.ok) res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}`);
        
        if (res.ok && isMounted) {
          const data = await res.json();
          setCardDetails(data);
          if (data.rulings_uri) {
            const rulesRes = await fetch(data.rulings_uri);
            if (rulesRes.ok && isMounted) setCardRulings((await rulesRes.json()).data);
          }
        }
      } catch (error) {
        console.error("Error obteniendo detalles:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchScryfallData();

    return () => { isMounted = false; };
  }, [card]);

  if (!card) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative">
          <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-gray-800/80 hover:bg-red-500 text-gray-400 hover:text-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
          
          {isLoading ? (
            <div className="w-full p-20 flex flex-col items-center justify-center text-gray-400"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" /><p>Buscando datos en Scryfall...</p></div>
          ) : cardDetails ? (
            <>
              <div className="w-full md:w-2/5 p-6 bg-gray-950/50 flex flex-col items-center justify-start border-r border-gray-800">
                <img src={cardDetails.image_uris?.normal || cardDetails.card_faces?.[0]?.image_uris?.normal || card.imageUrl} alt={cardDetails.name} className="w-full max-w-sm rounded-xl shadow-lg border border-gray-700" />
                <div className="mt-6 w-full space-y-3">
                  <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tu Precio (CK)</span>
                    <span className="text-lg text-emerald-400 font-mono font-bold">${card.ckPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-3/5 p-6 overflow-y-auto custom-scrollbar">
                <div className="mb-6">
                  <h2 className="text-3xl font-extrabold text-white mb-1 flex items-center justify-between">{cardDetails.name}<span className="text-xl font-mono text-gray-400">{cardDetails.mana_cost}</span></h2>
                  <p className="text-gray-400 text-lg font-medium mb-2">{cardDetails.type_line}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-gray-800 rounded-full text-xs font-bold text-gray-300 border border-gray-700 flex items-center gap-1"><BookOpen className="w-3 h-3" /> {cardDetails.set_name} ({cardDetails.set.toUpperCase()})</span>
                    <span className="px-3 py-1 bg-gray-800 rounded-full text-xs font-bold text-gray-300 border border-gray-700">Rareza: <span className="capitalize">{cardDetails.rarity}</span></span>
                  </div>
                </div>
                <div className="mb-8 bg-gray-900/50 p-5 rounded-xl border border-gray-800 text-gray-300 leading-relaxed whitespace-pre-wrap">{cardDetails.oracle_text || cardDetails.card_faces?.[0]?.oracle_text || "Sin texto de reglas."}</div>
                {cardRulings.length > 0 && (
                  <div>
                    <h3 className="text-sm uppercase font-bold tracking-wider text-gray-500 mb-3 flex items-center gap-2"><Gavel className="w-4 h-4" /> Rulings Oficiales</h3>
                    <div className="space-y-3">{cardRulings.slice(0, 5).map((rule, i) => (<div key={i} className="flex gap-3 text-sm bg-gray-900/30 p-3 rounded-lg border border-gray-800"><span className="text-gray-500 font-mono shrink-0">{rule.published_at}</span><p className="text-gray-300">{rule.comment}</p></div>))}</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-gray-400"><AlertCircle className="w-10 h-10 mx-auto mb-4 text-yellow-500" />No se pudieron cargar los detalles.</div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
