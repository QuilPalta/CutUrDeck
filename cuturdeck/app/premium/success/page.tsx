"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { LanguageProvider } from '@/lib/i18n';
import confetti from 'canvas-confetti';

function SuccessContent() {
  
  // Disparamos confeti cuando el componente se monta
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-amber-500/30 flex flex-col overflow-hidden relative">
      <Navbar />

      {/* Efectos de luz de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
          className="bg-gray-900 border-2 border-amber-500/50 rounded-3xl p-10 max-w-xl w-full shadow-[0_0_60px_rgba(245,158,11,0.2)] flex flex-col items-center"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-50 rounded-full animate-pulse" />
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center relative z-10 shadow-xl border-4 border-gray-900">
              <Crown className="w-12 h-12 text-gray-950" />
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 border-4 border-gray-900 z-20"
            >
              <CheckCircle className="w-6 h-6 text-white" />
            </motion.div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/30 border border-amber-500/30 text-xs font-bold text-amber-400 mb-4 uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> Pago Completado
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              ¡Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Premium!</span>
            </h1>
            
            <p className="text-gray-400 mb-8 leading-relaxed text-lg">
              Tu cuenta ha sido actualizada con éxito. Ya puedes disfrutar de la sincronización en vivo, la bóveda ilimitada y una experiencia 100% libre de anuncios.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full"
          >
            <Link 
              href="/dashboard"
              className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-lg border border-gray-700 hover:border-gray-600"
            >
              Ir a mi Bóveda de Mazos <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default function PremiumSuccessPage() {
  return (
    <LanguageProvider>
      <SuccessContent />
    </LanguageProvider>
  );
}