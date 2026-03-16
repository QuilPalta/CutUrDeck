"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ScryfallCard } from '@/lib/scryfall';

interface CommanderHeroProps {
  commander: ScryfallCard;
}

export default function CommanderHero({ commander }: CommanderHeroProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 group">
      <div className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-500" style={{ backgroundImage: `url(${commander.image_uris?.art_crop})` }} />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/90 to-transparent" />
      <div className="relative z-10 p-8 flex flex-col sm:flex-row items-center sm:items-start gap-8">
        <img src={commander.image_uris?.normal} alt={commander.name} className="w-40 sm:w-48 rounded-xl shadow-2xl border border-gray-700" />
        <div className="flex flex-col justify-center h-full pt-2">
          <span className="text-emerald-500 font-bold tracking-widest text-xs uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 
            Comandante Detectado
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">{commander.name}</h2>
          <p className="text-gray-400 font-medium">{commander.type_line}</p>
        </div>
      </div>
    </motion.div>
  );
}
