"use client";

import React, { useState } from 'react';
import { ListOrdered, Search, ArrowUpDown, Filter } from 'lucide-react';
import { DeckCard } from '@/lib/types';

interface InventoryTableProps {
  deckList: DeckCard[];
  onCardClick: (card: DeckCard) => void;
}

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

export default function InventoryTable({ deckList, onCardClick }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('priceDesc');
  const [groupOption, setGroupOption] = useState('type');

  // Lógica de filtrado
  const filteredList = deckList.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Lógica de ordenamiento con desempate alfabético
  filteredList.sort((a, b) => {
    if (sortOption === 'priceDesc') {
      if (b.ckPrice === a.ckPrice) return a.name.localeCompare(b.name);
      return b.ckPrice - a.ckPrice;
    }
    if (sortOption === 'priceAsc') {
      if (a.ckPrice === b.ckPrice) return a.name.localeCompare(b.name);
      return a.ckPrice - b.ckPrice;
    }
    if (sortOption === 'nameAsc') return a.name.localeCompare(b.name);
    return 0;
  });

  // Lógica de agrupación
  let groupedData: { groupName: string, cards: DeckCard[], quantity: number }[] = [];
  
  if (groupOption === 'type') {
    const map = new Map<string, DeckCard[]>();
    filteredList.forEach(c => {
      const pType = c.isCommander ? "Comandante" : getPrimaryType(c.type_line);
      if (!map.has(pType)) map.set(pType, []);
      map.get(pType)!.push(c);
    });
    
    groupedData = Array.from(map.entries()).map(([groupName, cards]) => ({
      groupName,
      cards,
      quantity: cards.reduce((sum, c) => sum + c.quantity, 0)
    })).sort((a, b) => {
      if (a.groupName === "Comandante") return -1;
      if (b.groupName === "Comandante") return 1;
      return a.groupName.localeCompare(b.groupName);
    });
  } else {
    groupedData = [{ groupName: 'Todas las cartas', cards: filteredList, quantity: filteredList.reduce((sum, c) => sum + c.quantity, 0) }];
  }

  return (
    <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[700px]">
      <div className="p-5 border-b border-gray-800 bg-gray-900 flex justify-between items-center shrink-0">
        <h3 className="text-xl font-bold flex items-center gap-2 text-white"><ListOrdered className="w-5 h-5 text-emerald-400" /> Inventario Estricto</h3>
        <span className="text-sm text-gray-500 hidden sm:block">Clickea para Detalles de Scryfall</span>
      </div>
      
      <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
        <div className="relative w-full sm:w-1/2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Filtrar por nombre..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)} 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 appearance-none focus:outline-none focus:border-emerald-500"
            >
              <option value="priceDesc">Mayor Precio</option>
              <option value="priceAsc">Menor Precio</option>
              <option value="nameAsc">Nombre (A-Z)</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select 
              value={groupOption} 
              onChange={(e) => setGroupOption(e.target.value)} 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 appearance-none focus:outline-none focus:border-emerald-500"
            >
              <option value="type">Agrupar por Tipo</option>
              <option value="none">Sin Agrupar</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 pb-4">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-gray-950 border-b border-gray-800 z-10 shadow-sm">
            <tr>
              <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase">Cant.</th>
              <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase">Carta</th>
              <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Set</th>
              <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase text-right">Precio (CK)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {groupedData.map((group) => (
              <React.Fragment key={group.groupName}>
                {groupOption !== 'none' && group.cards.length > 0 && (
                  <tr>
                    <td colSpan={4} className="bg-gray-800/80 px-6 py-2 border-y border-gray-700">
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                        {group.groupName} 
                        <span className="bg-gray-950 text-gray-400 px-2 py-0.5 rounded-full">{group.quantity}</span>
                      </span>
                    </td>
                  </tr>
                )}
                {group.cards.map((card, idx) => (
                  <tr key={`${card.id}-${idx}`} onClick={() => onCardClick(card)} className="hover:bg-gray-800/60 transition-colors cursor-pointer group">
                    <td className="py-3 px-6 text-sm font-medium text-gray-300">{card.quantity}x</td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        {card.imageUrl && <img src={card.imageUrl} alt={card.name} className="w-8 h-8 rounded-full object-cover border border-gray-700 hidden sm:block" />}
                        <div className="flex flex-col">
                          <span className={`font-medium group-hover:text-emerald-400 transition-colors ${card.isCommander ? 'text-emerald-400' : 'text-gray-200'}`}>{card.name}</span>
                          {card.isFoil && <span className="text-[10px] text-purple-400 uppercase font-bold">Foil</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-xs text-gray-400 hidden md:table-cell">{card.setName}</td>
                    <td className={`py-3 px-6 text-sm font-mono font-bold text-right ${card.ckPrice === 0 ? 'text-gray-500' : 'text-emerald-400'}`}>
                      {card.ckPrice === 0 ? '-$' : `$${(card.ckPrice * card.quantity).toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {groupedData.every(g => g.cards.length === 0) && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-500">
                  No se encontraron cartas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
