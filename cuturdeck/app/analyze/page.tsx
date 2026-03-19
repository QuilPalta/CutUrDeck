"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, UploadCloud, Loader2, AlertCircle, Lock, ClipboardPaste, Type } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { LanguageProvider, useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

function AnalyzeContent() {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [deckInput, setDeckInput] = useState('');
  const [deckName, setDeckName] = useState(''); // Nuevo estado para el nombre opcional
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);
      setIsCheckingAuth(false);
    };
    fetchSession();
  }, [router]);

  const validateUrl = (url: string) => {
    if (url.includes('moxfield.com/decks/')) return 'moxfield';
    if (url.includes('archidekt.com/decks/')) return 'archidekt';
    if (url.includes('manabox.app/decks/')) return 'manabox';
    return null;
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setDeckInput(text);
      if (error) setError('');
    } catch (err) {
      console.error('No se pudo leer el portapapeles', err);
    }
  };

  const handleImport = async () => {
    setError('');
    setIsLoading(true);

    try {
      const platform = validateUrl(deckInput);
      if (!platform) {
        throw new Error(t.analyzeErrorUrl || 'URL no válida. Usa Moxfield, Archidekt o Manabox.');
      }

      const { data, error: dbError } = await supabase
        .from('decks')
        .insert([
          {
            input_type: 'url',
            raw_data: deckInput.trim(),
            platform: platform,
            profile_id: user.id,
            is_public: false,
            name: deckName.trim() ? deckName.trim() : null, // Enviamos el nombre o nulo
            cover_url: null 
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
      setError(err.message || 'Ocurrió un error al guardar el mazo en tu cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-purple-500/30 flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20 relative">
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
            
            {/* Input URL Obligatorio */}
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-purple-400" />
                Enlace del mazo
              </label>
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

            <div className="mb-6 relative group">
              <input
                type="url"
                value={deckInput}
                onChange={(e) => {
                  setDeckInput(e.target.value);
                  if(error) setError('');
                }}
                placeholder={t.inputUrlPlaceholder}
                className={`w-full pl-4 pr-12 py-4 bg-gray-950 border rounded-xl focus:outline-none focus:ring-1 transition-all text-gray-200 placeholder-gray-600 ${
                  error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-gray-800 focus:border-purple-500 focus:ring-purple-500'
                }`}
              />
              <button 
                onClick={handlePaste}
                title="Pegar del portapapeles"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors focus:outline-none"
              >
                <ClipboardPaste className="w-5 h-5" />
              </button>
            </div>

            {/* Input Nombre Opcional */}
            <div className="mb-8">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-3">
                <Type className="w-4 h-4 text-gray-400" />
                Nombre del mazo <span className="text-xs text-gray-500 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Ej: Ashling the Pilgrim Voltron"
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-gray-200 placeholder-gray-600"
              />
              <p className="text-xs text-gray-500 mt-2 ml-1">Podrás personalizarlo o añadir una portada desde la vista del mazo más adelante.</p>
            </div>

            <Button 
              variant="primary" 
              size="lg" 
              className="w-full relative flex items-center justify-center" 
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