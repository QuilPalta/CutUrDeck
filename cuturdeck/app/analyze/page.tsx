"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, UploadCloud, Loader2, AlertCircle, Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { LanguageProvider, useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

function AnalyzeContent() {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [deckInput, setDeckInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateUrl = (url: string) => {
    if (url.includes('moxfield.com/decks/')) return 'moxfield';
    if (url.includes('archidekt.com/decks/')) return 'archidekt';
    if (url.includes('manabox.app/decks/')) return 'manabox';
    return null;
  };

  const handleImport = async () => {
    setError('');
    setIsLoading(true);

    try {
      const platform = validateUrl(deckInput);
      if (!platform) {
        throw new Error(t.analyzeErrorUrl);
      }

      // Insertar solo la URL en Supabase
      const { data, error: dbError } = await supabase
        .from('decks')
        .insert([
          {
            input_type: 'url',
            raw_data: deckInput.trim(),
            platform: platform
          }
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      if (data && data.id) {
        router.push(`/deck/${data.id}`);
      }

    } catch (err: any) {
      console.error("Error importando:", err);
      setError(err.message || 'Ocurrió un error al procesar el mazo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-purple-500/30">
      <Navbar />

      <main className="flex flex-col items-center px-6 pt-20 pb-20 relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl w-full relative z-10"
        >
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              {t.analyzeTitle}
            </h1>
            <p className="text-gray-400 text-lg">
              {t.analyzeSubtitle}
            </p>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl">
            
            {/* Cabecera de Input */}
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-purple-400" />
                Enlace del mazo
              </label>
              {/* Teaser de la versión Premium */}
              <div className="flex items-center gap-1 text-xs text-yellow-500/70 font-medium bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/20">
                <Lock className="w-3 h-3" />
                Texto Plano en Premium
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-500/20 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-6">
              <input
                type="url"
                value={deckInput}
                onChange={(e) => {
                  setDeckInput(e.target.value);
                  if(error) setError('');
                }}
                placeholder={t.inputUrlPlaceholder}
                className={`w-full px-4 py-4 bg-gray-950 border rounded-xl focus:outline-none focus:ring-1 transition-all text-gray-200 placeholder-gray-600 ${
                  error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-gray-800 focus:border-purple-500 focus:ring-purple-500'
                }`}
              />
              <p className="text-xs text-gray-500 mt-2 ml-1">Soporta enlaces públicos de Moxfield, Archidekt y Manabox.</p>
            </div>

            <Button 
              variant="primary" 
              size="lg" 
              className="w-full relative" 
              onClick={handleImport}
              disabled={!deckInput.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t.btnImporting}
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5 mr-2" />
                  {t.btnImport}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <LanguageProvider>
      <AnalyzeContent />
    </LanguageProvider>
  );
}