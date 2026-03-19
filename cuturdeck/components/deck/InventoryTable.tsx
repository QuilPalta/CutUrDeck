"use client";

import React, { useState } from 'react';
import { ListOrdered, Search, ArrowUpDown, Filter, LayoutGrid, List, Lock, LockOpen } from 'lucide-react';
import { DeckCard } from '@/lib/types';

interface InventoryTableProps {
  deckList: DeckCard[];
  onCardClick: (card: DeckCard) => void;
  pinnedCards: Set<string>;
  onTogglePin: (cardName: string) => void;
  isOwner: boolean;
}

const normalizeName = (name: string) => {
  const frontFace = name.split('//')[0].trim();
  return frontFace.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
};

function getPrimaryType(typeLine: string): string {
  if (!typeLine) return "Otros";
  const lower = typeLine.toLowerCase();
  if (lower.includes("creature")) return "Criaturas";
  if (lower.includes("instant")) return "Instantáneos";
  if (lower.includes("sorcery")) return "Conjuros";
  if (lower.includes("artifact")) return "Artefactos";
  if (lower.includes("enchantment")) return "Encantamientos";
  if (lower.includes("planeswalker")) return "Planeswalkers";
  if (lower.includes("land")) return "Tierras";
  return "Otros";
}

const getDeckCardImageUrl = (card: DeckCard) => {
  if (card.imageUrl && card.imageUrl.trim() !== '') return card.imageUrl;
  const frontFace = card.name.split('//')[0].trim();
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(frontFace)}&format=image&version=normal`;
};

// Generador de colores para las etiquetas de roles
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

export default function InventoryTable({ deckList, onCardClick, pinnedCards, onTogglePin, isOwner }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('priceDesc');
  const [groupOption, setGroupOption] = useState('type'); // 'type', 'role', 'none'
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredList = deckList.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  filteredList.sort((a, b) => {
    if (sortOption === 'priceDesc') return b.ckPrice - a.ckPrice || a.name.localeCompare(b.name);
    if (sortOption === 'priceAsc') return a.ckPrice - b.ckPrice || a.name.localeCompare(b.name);
    if (sortOption === 'nameAsc') return a.name.localeCompare(b.name);
    return 0;
  });

  let groupedData: { groupName: string, cards: DeckCard[], quantity: number }[] = [];
  
  if (groupOption === 'type') {
    const map = new Map<string, DeckCard[]>();
    filteredList.forEach(c => {
      const pType = c.isCommander ? "Comandante" : getPrimaryType(c.type_line);
      if (!map.has(pType)) map.set(pType, []);
      map.get(pType)!.push(c);
    });
    
    groupedData = Array.from(map.entries()).map(([groupName, cards]) => ({
      groupName, cards, quantity: cards.reduce((sum, c) => sum + c.quantity, 0)
    })).sort((a, b) => {
      if (a.groupName === "Comandante") return -1;
      if (b.groupName === "Comandante") return 1;
      return a.groupName.localeCompare(b.groupName);
    });
  } 
  else if (groupOption === 'role') {
    const map = new Map<string, DeckCard[]>();
    filteredList.forEach(c => {
      if (c.isCommander) {
        if (!map.has("Comandante")) map.set("Comandante", []);
        map.get("Comandante")!.push(c);
        return;
      }
      // @ts-ignore - Usando los tags generados
      const tags = (c.tags as string[]) || [];
      if (tags.length === 0) {
        if (!map.has("Sin Rol Definido")) map.set("Sin Rol Definido", []);
        map.get("Sin Rol Definido")!.push(c);
      } else {
        tags.forEach(tag => {
          if (!map.has(tag)) map.set(tag, []);
          map.get(tag)!.push(c);
        });
      }
    });
    
    groupedData = Array.from(map.entries()).map(([groupName, cards]) => ({
      groupName, cards, quantity: cards.reduce((sum, c) => sum + c.quantity, 0)
    })).sort((a, b) => {
      if (a.groupName === "Comandante") return -1;
      if (b.groupName === "Comandante") return 1;
      if (a.groupName === "Sin Rol Definido") return 1;
      if (b.groupName === "Sin Rol Definido") return -1;
      return a.groupName.localeCompare(b.groupName);
    });
  } 
  else {
    groupedData = [{ groupName: 'Todas las cartas', cards: filteredList, quantity: filteredList.reduce((sum, c) => sum + c.quantity, 0) }];
  }

  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[800px]">
      <div className="p-5 border-b border-gray-800 bg-gray-900 flex justify-between items-center shrink-0">
        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
          <ListOrdered className="w-5 h-5 text-emerald-400" /> 
          Inventario Estratégico
        </h3>
        
        <div className="flex bg-gray-950 rounded-lg p-1 border border-gray-800">
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-800 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-800 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}><LayoutGrid className="w-4 h-4" /></button>
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
        <div className="relative w-full sm:w-1/2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Filtrar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 transition-colors" />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 appearance-none focus:outline-none focus:border-emerald-500">
              <option value="priceDesc">Mayor Precio</option>
              <option value="priceAsc">Menor Precio</option>
              <option value="nameAsc">Nombre (A-Z)</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select value={groupOption} onChange={(e) => setGroupOption(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 appearance-none focus:outline-none focus:border-emerald-500">
              <option value="type">Por Tipo (Criatura, etc)</option>
              <option value="role">Por Rol Funcional (Ramp, etc)</option>
              <option value="none">Sin Agrupar</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-hidden overflow-y-auto custom-scrollbar flex-1 pb-4 bg-gray-950">
        {viewMode === 'list' ? (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-950 border-b border-gray-800 z-10 shadow-sm">
              <tr>
                <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase">Cant.</th>
                <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase">Carta & Roles</th>
                <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Set</th>
                <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase text-right">Precio</th>
                {isOwner && <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase text-center w-16"><Lock className="w-4 h-4 mx-auto" /></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {groupedData.map((group) => (
                <React.Fragment key={group.groupName}>
                  {groupOption !== 'none' && group.cards.length > 0 && (
                    <tr>
                      <td colSpan={isOwner ? 5 : 4} className="bg-gray-800/80 px-6 py-2 border-y border-gray-700">
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                          {group.groupName} <span className="bg-gray-950 text-gray-400 px-2 py-0.5 rounded-full">{group.quantity}</span>
                        </span>
                      </td>
                    </tr>
                  )}
                  {group.cards.map((card, idx) => {
                    const isPinned = pinnedCards.has(normalizeName(card.name));
                    // @ts-ignore
                    const tags = (card.tags as string[]) || [];

                    return (
                      <tr key={`${card.id}-${idx}`} className="hover:bg-gray-800/60 transition-colors group">
                        <td className="py-3 px-6 text-sm font-medium text-gray-300 cursor-pointer" onClick={() => onCardClick(card)}>{card.quantity}x</td>
                        <td className="py-3 px-6 cursor-pointer" onClick={() => onCardClick(card)}>
                          <div className="flex items-center gap-3">
                            {card.imageUrl && <img src={card.imageUrl} alt={card.name} className="w-8 h-8 rounded-full object-cover border border-gray-700 hidden sm:block" />}
                            <div className="flex flex-col gap-1">
                              <span className={`font-medium group-hover:text-emerald-400 transition-colors leading-none ${card.isCommander ? 'text-emerald-400' : (isPinned ? 'text-amber-400' : 'text-gray-200')}`}>
                                {card.name}
                              </span>
                              {tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {tags.map(t => (
                                    <span key={t} className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getTagColor(t)}`}>{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-xs text-gray-400 hidden md:table-cell cursor-pointer" onClick={() => onCardClick(card)}>{card.setName}</td>
                        <td className={`py-3 px-6 text-sm font-mono font-bold text-right cursor-pointer ${card.ckPrice === 0 ? 'text-gray-500' : 'text-emerald-400'}`} onClick={() => onCardClick(card)}>
                          {card.ckPrice === 0 ? '-$' : `$${(card.ckPrice * card.quantity).toFixed(2)}`}
                        </td>
                        {isOwner && (
                          <td className="py-3 px-6 text-center">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onTogglePin(card.name); }}
                              className={`p-1.5 rounded-md transition-all ${isPinned ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-amber-400 hover:bg-gray-800'}`}
                            >
                              {isPinned ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4">
            {groupedData.map((group) => (
              <div key={group.groupName} className="mb-8">
                {groupOption !== 'none' && group.cards.length > 0 && (
                  <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2 flex items-center justify-between">
                    {group.groupName}
                    <span className="bg-gray-900 border border-gray-800 text-gray-400 px-2 py-0.5 rounded-full text-xs">{group.quantity} cartas</span>
                  </h4>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {group.cards.map((card, idx) => {
                    const isPinned = pinnedCards.has(normalizeName(card.name));
                    // @ts-ignore
                    const tags = (card.tags as string[]) || [];

                    return (
                      <div key={`${card.id}-${idx}`} className="relative group cursor-pointer flex flex-col items-center" onClick={() => onCardClick(card)}>
                        <div className="relative w-full">
                          <img 
                            src={getDeckCardImageUrl(card)} 
                            alt={card.name} 
                            className={`w-full h-auto rounded-xl shadow-lg transition-transform duration-200 group-hover:scale-105 ${isPinned ? 'ring-2 ring-amber-500 shadow-amber-900/50' : ''}`}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://cards.scryfall.io/large/back/0/a/0aeebaf5-8c7d-4636-9e82-8c27447861f7.jpg'; }}
                          />
                          {card.quantity > 1 && (
                            <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-gray-900 z-10">
                              {card.quantity}
                            </span>
                          )}
                          {isOwner && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onTogglePin(card.name); }}
                              className={`absolute -top-2 -left-2 p-1.5 rounded-full z-10 transition-all ${isPinned ? 'bg-amber-500 text-gray-900 shadow-lg' : 'bg-gray-900/80 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-amber-500 hover:text-gray-900'}`}
                            >
                              {isPinned ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center mt-2 px-1">
                            {tags.map(t => (
                              <span key={t} className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getTagColor(t)}`}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}