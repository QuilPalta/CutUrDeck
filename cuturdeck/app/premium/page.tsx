"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Crown, Sparkles, Zap, ShieldCheck, ArrowRight, Link2, AlertTriangle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { LanguageProvider, useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

function PremiumContent() {
  const { t } = useLanguage();
  const [isAnnual, setIsAnnual] = useState(true);
  
  const [user, setUser] = useState<any>(null);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  }, []);

  const handleSubscribe = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsLoadingCheckout(true);
    setCheckoutError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAnnual,
          userId: user.id,
          userEmail: user.email
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Error al iniciar el pago con Lemon Squeezy');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(err);
      setCheckoutError('Error de conexión con el servidor de pagos. Verifica la consola.');
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-amber-500/30 flex flex-col overflow-hidden relative">
      <Navbar />

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-600/10 blur-[150px] rounded-full pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 w-full relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-900/20 border border-amber-500/30 text-sm font-bold text-amber-400 mb-6"
          >
            <Crown className="w-4 h-4" />
            <span>Despídete de los anuncios y los límites</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight"
          >
            Sincronización en vivo y <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">poder absoluto.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-400 leading-relaxed"
          >
            Mantén tus mazos actualizados automáticamente con Moxfield o Archidekt. Analiza sin distracciones y guarda infinitas estrategias en tu bóveda.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-gray-900 p-1.5 rounded-xl border border-gray-800 inline-flex items-center relative">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`relative px-6 py-2.5 rounded-lg text-sm font-bold z-10 transition-colors ${!isAnnual ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {!isAnnual && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute inset-0 bg-gray-800 rounded-lg -z-10 shadow-md" 
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              Pago Mensual
            </button>
            
            <button 
              onClick={() => setIsAnnual(true)}
              className={`relative px-6 py-2.5 rounded-lg text-sm font-bold z-10 transition-colors flex items-center gap-2 ${isAnnual ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {isAnnual && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute inset-0 bg-gray-800 rounded-lg -z-10 shadow-md" 
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              Pago Anual <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">Ahorra 20%</span>
            </button>
          </div>
        </motion.div>

        {checkoutError && (
          <div className="max-w-md mx-auto mb-8 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center justify-center gap-3 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{checkoutError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* FREE TIER */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Básico</h3>
              <p className="text-gray-400 text-sm h-10">Optimización manual con publicidad.</p>
              <div className="mt-6 flex items-baseline text-5xl font-extrabold text-white">
                $0 <span className="text-xl font-medium text-gray-500 ml-2">/ para siempre</span>
              </div>
            </div>

            <ul className="flex-1 space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-gray-300">Importación manual por Texto Plano</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-gray-300">Broker Estricto (Sugerencias 1 a 1)</span>
              </li>
              <li className="flex items-start gap-3 opacity-60">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-amber-500 font-medium">Contiene anuncios publicitarios</span>
              </li>
              <li className="flex items-start gap-3 opacity-50">
                <X className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                <span className="text-gray-500">Límite de bóveda estricto (Máx 5 mazos)</span>
              </li>
              <li className="flex items-start gap-3 opacity-50">
                <X className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                <span className="text-gray-500">Sin Sincronización Viva por URL</span>
              </li>
            </ul>

            <Link 
              href="/dashboard"
              className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors text-center"
            >
              Continuar Gratis
            </Link>
          </motion.div>

          {/* PREMIUM TIER */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-900 border-2 border-amber-500/50 rounded-3xl p-8 flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)]"
          >
            <div className="absolute top-0 right-0 bg-amber-500 text-gray-950 text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
              Recomendado
            </div>

            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none" />

            <div className="mb-8 relative z-10">
              <h3 className="text-2xl font-bold text-amber-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-6 h-6" /> Premium
              </h3>
              <p className="text-gray-400 text-sm h-10">Sincronización viva, sin publicidad y algoritmos libres.</p>
              <div className="mt-6 flex items-baseline text-5xl font-extrabold text-white">
                ${isAnnual ? '3.99' : '4.99'} <span className="text-xl font-medium text-gray-500 ml-2">/ mes</span>
              </div>
              {isAnnual && <p className="text-emerald-400 text-sm font-medium mt-2">Facturado anualmente ($47.88)</p>}
            </div>

            <ul className="flex-1 space-y-4 mb-8 relative z-10">
              <li className="flex items-start gap-3">
                <Link2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-200 font-bold">Sincronización Viva por URL</span>
                  <p className="text-xs text-gray-400 mt-1">Conecta con Moxfield/Archidekt. Si actualizas allá, se actualiza acá.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-gray-200 font-medium">Experiencia 100% Sin Anuncios</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-gray-200">Bóveda Ilimitada (Guarda y clona sin fin)</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-gray-200">Motor de Evolución Libre y Análisis Semántico</span>
              </li>
            </ul>

            <button 
              onClick={handleSubscribe}
              disabled={isLoadingCheckout}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-gray-950 font-extrabold rounded-xl transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 text-lg relative z-10 disabled:opacity-70"
            >
              {isLoadingCheckout ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>Suscribirse Ahora <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
            <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Pagos seguros procesados por Lemon Squeezy
            </p>
          </motion.div>

        </div>
      </main>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <LanguageProvider>
      <PremiumContent />
    </LanguageProvider>
  );
}