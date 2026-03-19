"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { Scissors, Zap, Coins, Search, Loader2, ArrowRight } from 'lucide-react';
import { LanguageProvider, useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

function LandingContent() {
  const { t } = useLanguage();
  const router = useRouter();

  // Estados de Supabase y del Formulario
  const [user, setUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [deckUrl, setDeckUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Escuchar la sesión actual
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setIsLoadingAuth(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Manejar el envío del mazo (Solo para usuarios logueados)
  const handleAnalyzeDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckUrl) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      let platform = '';
      if (deckUrl.includes('moxfield.com')) platform = 'moxfield';
      else if (deckUrl.includes('archidekt.com')) platform = 'archidekt';
      else throw new Error("Por ahora solo soportamos enlaces de Moxfield y Archidekt.");

      const { data, error: dbError } = await supabase
        .from('decks')
        .insert([
          { 
            input_type: 'url', 
            raw_data: deckUrl, 
            platform: platform,
            profile_id: user.id // Amarramos el mazo al usuario
          }
        ])
        .select()
        .single();

      if (dbError) throw dbError;
      
      router.push(`/deck/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error al procesar el mazo.");
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-purple-500/30">
      <Navbar />

      <main className="flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center relative overflow-hidden">
        
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-4xl relative z-10 w-full"
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
          
          {user ? (
            /* INTERFAZ PARA USUARIO LOGUEADO: Buscador Directo */
            <div className="w-full max-w-2xl mx-auto bg-gray-900/50 backdrop-blur-md border border-gray-800 p-4 md:p-6 rounded-2xl shadow-xl">
              <h3 className="text-left text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Inicia un nuevo análisis
              </h3>
              <form onSubmit={handleAnalyzeDeck} className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="url" 
                  value={deckUrl}
                  onChange={(e) => setDeckUrl(e.target.value)}
                  placeholder="Pega la URL de tu mazo (Moxfield o Archidekt)..." 
                  required
                  className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-5 py-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-full sm:w-auto h-auto min-h-[56px] flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analizar'}
                  {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                </Button>
              </form>
              {error && <p className="text-red-400 text-sm mt-3 text-left">{error}</p>}
            </div>
          ) : (
            /* INTERFAZ PARA USUARIO DESLOGUEADO: Botones CTA Originales */
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full">
                  Crear Cuenta
                </Button>
              </Link>
              
              <Link href="/explore" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full">
                  Explorar Mazos
                </Button>
              </Link>
            </div>
          )}
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