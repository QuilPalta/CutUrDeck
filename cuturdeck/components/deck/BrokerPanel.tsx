"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, ArrowRight, Layers, AlertCircle, Scale, Lock, LockOpen, ThumbsUp, ThumbsDown, Users, Wand2 } from 'lucide-react';
import { DeckCard, SuggestionPair } from '@/lib/types';
import { getCardByName, ScryfallCard } from '@/lib/scryfall';
import { supabase } from '@/lib/supabase';
// Importamos el analizador semántico del padre (o lo duplicamos para evitar errores de ciclo circular de módulos)
import { getCardTags } from '@/app/deck/[id]/page';

interface BrokerPanelProps {
  deckList: DeckCard[];
  commander: ScryfallCard | null;
  targetBudget: number;
  totalPriceCK: number;
  targetStructure: Record<string, number>;
  onCardClick: (card: DeckCard) => void;
  pinnedCards: Set<string>;
  onTogglePin: (cardName: string) => void;
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

const getDeckCardImageUrl = (card: DeckCard) => {
  if (card.imageUrl && card.imageUrl.trim() !== '') return card.imageUrl;
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
  synergy: 0,
  // @ts-ignore
  tags: getCardTags(scryfall.oracle_text || scryfall.card_faces?.[0]?.oracle_text || "", scryfall.type_line || "")
});

interface FeedbackStats {
  likes: number;
  dislikes: number;
  userVoted?: 'like' | 'dislike' | null;
}

export default function BrokerPanel({ deckList, commander, targetBudget, totalPriceCK, targetStructure, onCardClick, pinnedCards, onTogglePin }: BrokerPanelProps) {
  const [edhrecData, setEdhrecData] = useState<any[]>([]);
  // @ts-ignore - Guardaremos la info enriquecida
  const [suggestions, setSuggestions] = useState<(SuggestionPair & { addTags?: string[] })[]>([]);
  const [isFetchingEDHREC, setIsFetchingEDHREC] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');

  // NUEVO: Switch del "Modo Evolución Flexible"
  const [isFlexibleMode, setIsFlexibleMode] = useState(false);

  const [feedbackStats, setFeedbackStats] = useState<Record<string, FeedbackStats>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  const budgetGap = targetBudget - totalPriceCK;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });
  }, []);

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

  const fetchCommunityFeedback = async (pairs: SuggestionPair[]) => {
    if (pairs.length === 0 || !commander) return;
    try {
      const cmdNormalized = normalizeName(commander.name);
      const pairsKeys = pairs.map(p => ({ cut: normalizeName(p.cutCard.name), add: normalizeName(p.addCard.name) }));
      
      const { data, error } = await supabase.from('cut_feedback').select('*').eq('commander_name', cmdNormalized);
      if (error) throw error;

      const newStats: Record<string, FeedbackStats> = {};
      pairsKeys.forEach(pair => {
        const key = `${cmdNormalized}_${pair.cut}_TO_${pair.add}`;
        const relevantVotes = data.filter(v => v.cut_card === pair.cut && v.add_card === pair.add);
        
        const likes = relevantVotes.filter(v => v.is_like).length;
        const dislikes = relevantVotes.filter(v => !v.is_like).length;
        const userVote = currentUser ? relevantVotes.find(v => v.user_id === currentUser.id) : null;

        newStats[key] = { likes, dislikes, userVoted: userVote ? (userVote.is_like ? 'like' : 'dislike') : null };
      });
      setFeedbackStats(newStats);
    } catch (e) { console.error(e); }
  };

  const calculateCuts = useCallback(async () => {
    if (edhrecData.length === 0 || deckList.length === 0 || !commander) return;
    setIsCalculating(true);

    const newSuggestions: any[] = [];
    const currentStructure: Record<string, number> = { Creature: 0, Instant: 0, Sorcery: 0, Artifact: 0, Enchantment: 0, Planeswalker: 0, Land: 0, Other: 0 };

    const deckWithStats = deckList.map(card => {
      const bType = getBroadType(card.type_line);
      if (!card.isCommander && currentStructure[bType] !== undefined) currentStructure[bType] += card.quantity;
      const synMatch = edhrecData.find(s => normalizeName(s.name) === normalizeName(card.name));
      return { ...card, inclusion: synMatch ? synMatch.inclusion : -1, broadType: bType }; 
    });

    const typeDeltas: Record<string, number> = {};
    Object.keys(targetStructure).forEach(type => { typeDeltas[type] = currentStructure[type] - targetStructure[type]; });

    const currentDeckNamesNormalized = new Set(deckWithStats.map(c => normalizeName(c.name)));
    const availableAdds = edhrecData.filter(c => !currentDeckNamesNormalized.has(normalizeName(c.name)) && c.price > 0);

    try {
      let cutCandidates = [...deckWithStats].filter(c => !c.isCommander && !pinnedCards.has(normalizeName(c.name)));

      const typesToCut = Object.keys(typeDeltas).filter(t => typeDeltas[t] > 0);
      const typesToAdd = Object.keys(typeDeltas).filter(t => typeDeltas[t] < 0);
      const isRebalancing = typesToCut.length > 0 && typesToAdd.length > 0;

      if (isRebalancing) {
        cutCandidates = cutCandidates.filter(c => typesToCut.includes(c.broadType));
      }

      if (budgetGap < 0) {
        cutCandidates = cutCandidates.filter(c => c.ckPrice > 1.0).sort((a, b) => a.inclusion - b.inclusion).slice(0, 10);
      } else {
        cutCandidates = cutCandidates.sort((a, b) => a.inclusion - b.inclusion).slice(0, 10);
      }

      for (const cutCard of cutCandidates) {
        let budgetSpent = newSuggestions.reduce((acc, s) => acc + (Number(s.addCard?.prices?.usd || 0) - s.cutCard.ckPrice), 0);
        let currentRemainingGap = budgetGap - budgetSpent;
        let maxAffordable = budgetGap < 0 ? cutCard.ckPrice : (cutCard.ckPrice + currentRemainingGap);

        let potentialAdds = [...availableAdds];
        
        // LA MAGIA DEL MODO FLEXIBLE
        if (isRebalancing) {
          potentialAdds = potentialAdds.filter(a => typesToAdd.includes(a.type));
        } else if (!isFlexibleMode) {
          // Si no es modo flexible, obligamos peras con peras
          potentialAdds = potentialAdds.filter(a => a.type === cutCard.broadType || a.type === 'Other');
        } // Si es modo flexible, dejamos pasar TODO tipo de carta que tenga sinergia!

        const finalAlternatives = potentialAdds.filter(c => c.price <= maxAffordable).sort((a, b) => (b.inclusion || 0) - (a.inclusion || 0));
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

            // Extraemos los roles de la sugerencia!
            const addedTags = getCardTags(stapleCard.oracle_text || stapleCard.card_faces?.[0]?.oracle_text || "", stapleCard.type_line);

            newSuggestions.push({
              cutCard, addCard: stapleCard, category: "", synergyCut: cutCard.inclusion, synergyAdd: altMatch.inclusion, reason: "", addTags: addedTags
            });
          }
        }
      }
      
      setSuggestions(newSuggestions);
      fetchCommunityFeedback(newSuggestions);

    } catch (e) {
      console.error("[BrokerPanel] Error en algoritmo", e);
      setError("Error cruzando variables complejas.");
    } finally {
      setIsCalculating(false);
    }
  }, [deckList, edhrecData, budgetGap, targetStructure, pinnedCards, commander, isFlexibleMode]);

  useEffect(() => { calculateCuts(); }, [calculateCuts]);

  const handleVote = async (cutName: string, addName: string, isLike: boolean) => {
    if (!currentUser || !commander) { alert("Debes iniciar sesión para ayudar a entrenar al Broker."); return; }
    const cmdNormalized = normalizeName(commander.name);
    const key = `${cmdNormalized}_${normalizeName(cutName)}_TO_${normalizeName(addName)}`;
    const currentStats = feedbackStats[key] || { likes: 0, dislikes: 0, userVoted: null };

    if (currentStats.userVoted === (isLike ? 'like' : 'dislike')) return;

    setFeedbackStats(prev => ({
      ...prev, [key]: {
        likes: isLike ? prev[key].likes + 1 : (prev[key].userVoted === 'like' ? prev[key].likes - 1 : prev[key].likes),
        dislikes: !isLike ? prev[key].dislikes + 1 : (prev[key].userVoted === 'dislike' ? prev[key].dislikes - 1 : prev[key].dislikes),
        userVoted: isLike ? 'like' : 'dislike'
      }
    }));

    try {
      await supabase.from('cut_feedback').upsert({
        commander_name: cmdNormalized, cut_card: normalizeName(cutName), add_card: normalizeName(addName), is_like: isLike, user_id: currentUser.id
      }, { onConflict: 'user_id, commander_name, cut_card, add_card' });
    } catch (e) { console.error("Error guardando voto", e); }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Removal': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Limpiamesa': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Robo': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Ramp': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Counter': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Protección': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  if (error) {
    return (
      <div className="w-full bg-gray-900 border border-red-900/50 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[300px] text-center"><AlertCircle className="w-10 h-10 text-red-500 mb-4" /><h3 className="text-red-400 font-bold mb-2">Error del Broker</h3><p className="text-gray-400 text-sm">{error}</p></div>
    );
  }

  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl relative overflow-hidden flex flex-col min-h-[400px]">
      {(isFetchingEDHREC || isCalculating) && (
        <div className="absolute inset-0 z-20 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
          <p className="text-purple-400 text-sm font-bold tracking-widest uppercase">{isFetchingEDHREC ? "Sincronizando Metajuego..." : "Calculando Ineficiencias..."}</p>
        </div>
      )}
      
      <div className="border-b border-gray-800 pb-4 mb-8 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-2xl font-bold flex items-center gap-2 text-gray-200">
          <Scale className="text-purple-400 w-6 h-6" /> Recomendaciones
        </h3>
        
        <div className="flex items-center gap-4">
          {/* INTERRUPTOR FLEXIBLE */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <span className="text-sm font-bold text-gray-400 group-hover:text-purple-400 transition-colors flex items-center gap-1">
              <Wand2 className="w-4 h-4" /> Evolución Libre
            </span>
            <div className="relative inline-flex items-center">
              <input type="checkbox" className="sr-only peer" checked={isFlexibleMode} onChange={(e) => setIsFlexibleMode(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </div>
          </label>

          {pinnedCards.size > 0 && (
            <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
              <Lock className="w-3 h-3" /> {pinnedCards.size} protegidas
            </span>
          )}
        </div>
      </div>
      
      {suggestions.length > 0 ? (
        <div className="flex flex-col gap-8">
          {suggestions.map((pair, idx) => {
            const key = `${normalizeName(commander?.name || 'unknown')}_${normalizeName(pair.cutCard.name)}_TO_${normalizeName(pair.addCard.name)}`;
            const stats = feedbackStats[key] || { likes: 0, dislikes: 0, userVoted: null };
            const totalVotes = stats.likes + stats.dislikes;
            const approvalRating = totalVotes > 0 ? Math.round((stats.likes / totalVotes) * 100) : 0;
            // @ts-ignore
            const cTags = (pair.cutCard.tags as string[]) || [];

            return (
              <div key={idx} className="bg-gray-950 border border-gray-800/80 rounded-2xl p-6 flex flex-row items-center justify-between w-full hover:border-gray-700 transition-colors group relative">
                
                <div className="flex flex-col items-center flex-1 relative">
                  <button onClick={() => onTogglePin(pair.cutCard.name)} className="absolute -top-3 -right-3 p-2 bg-gray-900 border border-gray-700 rounded-full text-gray-400 hover:text-amber-400 hover:border-amber-500/50 shadow-lg transition-all z-10"><LockOpen className="w-4 h-4" /></button>
                  <div className="w-48 mb-3 overflow-hidden rounded-xl shadow-lg ring-1 ring-red-900/50 cursor-pointer" onClick={() => onCardClick(pair.cutCard)}>
                    <img src={getDeckCardImageUrl(pair.cutCard)} alt={pair.cutCard.name} className="w-full h-auto object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://cards.scryfall.io/large/back/0/a/0aeebaf5-8c7d-4636-9e82-8c27447861f7.jpg'; }} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="bg-red-900/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded border border-red-900/30 mb-1">CORTAR</span>
                    <span className="text-gray-400 font-mono text-base">${pair.cutCard.ckPrice.toFixed(2)}</span>
                    <span className="text-xs font-medium text-gray-500 mb-2">{pair.synergyCut === -1 ? '0%' : `${pair.synergyCut}%`} Sinergia</span>
                    {cTags.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1">{cTags.map(t => <span key={t} className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getTagColor(t)}`}>{t}</span>)}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center flex-1 px-4 gap-4">
                  <ArrowRight className="w-10 h-10 text-gray-600 group-hover:text-purple-500 transition-colors" />
                  <div className="flex flex-col items-center bg-gray-900 p-2 rounded-xl border border-gray-800 shadow-inner shadow-black/20">
                    <div className="flex items-center gap-2 mb-1">
                      <button onClick={() => handleVote(pair.cutCard.name, pair.addCard.name, true)} className={`p-1.5 rounded-md transition-colors ${stats.userVoted === 'like' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:bg-gray-800 hover:text-emerald-400'}`}><ThumbsUp className="w-4 h-4" /></button>
                      <button onClick={() => handleVote(pair.cutCard.name, pair.addCard.name, false)} className={`p-1.5 rounded-md transition-colors ${stats.userVoted === 'dislike' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:bg-gray-800 hover:text-red-400'}`}><ThumbsDown className="w-4 h-4" /></button>
                    </div>
                    {totalVotes > 0 ? (
                      <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${approvalRating >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}><Users className="w-3 h-3" /> {approvalRating}% Aprueba</span>
                    ) : <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Sin votos</span>}
                  </div>
                </div>
                
                <div className="flex flex-col items-center flex-1 cursor-pointer" onClick={() => onCardClick(mapScryfallToDeckCard(pair.addCard, Number(pair.addCard.prices?.usd || 0)))}>
                  <div className="w-48 mb-3 overflow-hidden rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30 transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:ring-emerald-400">
                    <img src={getCardImageUrl(pair.addCard)} alt={pair.addCard.name} className="w-full h-auto object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://cards.scryfall.io/large/back/0/a/0aeebaf5-8c7d-4636-9e82-8c27447861f7.jpg'; }} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="bg-emerald-900/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded border border-emerald-900/30 mb-1">AÑADIR</span>
                    <span className="text-gray-200 font-mono text-base">${(Number(pair.addCard.prices?.usd) || 0).toFixed(2)}</span>
                    <span className="text-xs font-medium text-emerald-500/70 mb-2">{pair.synergyAdd}% Sinergia</span>
                    {pair.addTags && pair.addTags.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1">{pair.addTags.map(t => <span key={t} className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getTagColor(t)}`}>{t}</span>)}</div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        !isFetchingEDHREC && !isCalculating && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600"><Layers className="w-16 h-16 text-gray-800 mb-4" /><p className="text-lg">Tu mazo cumple a la perfección con la distribución y el presupuesto.</p></div>
        )
      )}
    </div>
  );
}