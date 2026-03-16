"use client";

import React from 'react';
import { Loader2, TrendingDown, ArrowRight, RefreshCcw, Layers } from 'lucide-react';
import { SuggestionPair } from '@/lib/types';

interface BrokerPanelProps {
  suggestions: SuggestionPair[];
  isCalculating: boolean;
  targetBudget: number;
  totalPriceCK: number;
}

export default function BrokerPanel({ suggestions, isCalculating, targetBudget, totalPriceCK }: BrokerPanelProps) {
  return (
    <div className="xl:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col h-[700px]">
      {isCalculating && (
        <div className="absolute inset-0 z-10 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-gray-800 pb-4">
        <TrendingDown className={targetBudget > totalPriceCK ? "text-emerald-400 w-5 h-5 rotate-180" : "text-blue-400 w-5 h-5"} />
        Broker Financiero
      </h3>
      <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-4">
        {suggestions.length > 0 ? suggestions.map((pair, idx) => (
          <div key={idx} className="bg-gray-950 border border-gray-800 p-4 rounded-xl relative">
            <div className="absolute top-0 right-0 bg-blue-900/40 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg border-b border-l border-blue-500/30 uppercase">
              {pair.category}
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-red-400 text-sm font-medium line-through">{pair.cutCard.name}</span>
                <span className="text-gray-500 text-xs font-mono">${pair.cutCard.ckPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 text-sm font-bold">{pair.addCard.name}</span>
                <span className="text-emerald-500/50 text-xs font-mono">${(Number(pair.addCard.prices?.usd) || 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-800 text-xs text-gray-400 leading-relaxed flex items-start gap-2">
              <RefreshCcw className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
              {pair.reason}
            </div>
          </div>
        )) : (
          <div className="text-center text-gray-500 mt-10 flex flex-col items-center">
            <Layers className="w-10 h-10 text-gray-700 mb-3" />
            <p>Ajusta el "Target Liga" y presiona Enter para buscar eficiencias.</p>
          </div>
        )}
      </div>
    </div>
  );
}
