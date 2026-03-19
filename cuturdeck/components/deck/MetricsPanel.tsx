"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, Layers } from 'lucide-react';
import { DeckCard } from '@/lib/types';

interface MetricsPanelProps {
  isVisible: boolean;
  deckList: DeckCard[];
  totalPriceCK: number;
  totalCards: number;
}

export default function MetricsPanel({ isVisible, deckList, totalPriceCK, totalCards }: MetricsPanelProps) {
  if (!isVisible) return null;

  const avgPrice = totalCards > 0 ? (totalPriceCK / totalCards).toFixed(2) : "0.00";
  const nonLands = deckList.filter(c => !c.type_line.toLowerCase().includes('land')).reduce((acc, c) => acc + c.quantity, 0);
  const lands = deckList.filter(c => c.type_line.toLowerCase().includes('land')).reduce((acc, c) => acc + c.quantity, 0);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, height: 0, marginTop: 0 }}
        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
        exit={{ opacity: 0, height: 0, marginTop: 0 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-gray-200">Métricas del Mazo</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
            <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Costo Promedio / Carta</span>
            <span className="text-xl font-bold text-emerald-400 flex items-center"><DollarSign className="w-4 h-4"/>{avgPrice}</span>
          </div>
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
            <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Ratio (Tierras / Acción)</span>
            <span className="text-xl font-bold text-blue-400 flex items-center gap-2"><Layers className="w-4 h-4"/>{lands} / {nonLands}</span>
          </div>
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
            <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Tamaño Total</span>
            <span className="text-xl font-bold text-purple-400">{totalCards} Cartas</span>
          </div>
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col justify-center">
             <span className="text-xs text-gray-500 italic">Más métricas dinámicas de EDHREC próximamente...</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}