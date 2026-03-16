"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { Scissors, Zap, Coins } from 'lucide-react';
import { LanguageProvider, useLanguage } from '@/lib/i18n';

function LandingContent() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-purple-500/30">
      <Navbar />

      <main className="flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center relative overflow-hidden">
        
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-4xl relative z-10"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            {t.heroTitle1} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
              {t.heroTitle2}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t.heroSubtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            {/* Enlace hacia la página de análisis que creamos antes */}
            <Link href="/analyze" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full">
                {t.btnAnalyze}
              </Button>
            </Link>
            
            {/* Enlace hacia una futura vista de mazo de ejemplo */}
            <Link href="/deck/example" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full">
                {t.btnExample}
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-6xl w-full relative z-10"
        >
          <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-800 flex flex-col items-center text-center hover:border-purple-500/30 transition-colors group">
            <div className="bg-gray-950 p-4 rounded-xl mb-6 text-purple-400 group-hover:scale-110 transition-transform shadow-inner shadow-white/5">
              <Scissors className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-100">{t.feat1Title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t.feat1Desc}
            </p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-800 flex flex-col items-center text-center hover:border-indigo-500/30 transition-colors group">
            <div className="bg-gray-950 p-4 rounded-xl mb-6 text-indigo-400 group-hover:scale-110 transition-transform shadow-inner shadow-white/5">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-100">{t.feat2Title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t.feat2Desc}
            </p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-800 flex flex-col items-center text-center hover:border-emerald-500/30 transition-colors group">
            <div className="bg-gray-950 p-4 rounded-xl mb-6 text-emerald-400 group-hover:scale-110 transition-transform shadow-inner shadow-white/5">
              <Coins className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-100">{t.feat3Title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t.feat3Desc}
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function LandingPage() {
  return (
    <LanguageProvider>
      <LandingContent />
    </LanguageProvider>
  );
}