"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Layers, Trash2, ExternalLink, Plus, Calendar, ShieldAlert, BarChart3, Globe, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { LanguageProvider } from '@/lib/i18n';

interface UserDeck {
  id: string;
  raw_data: string;
  platform: string;
  created_at: string;
  is_public: boolean;
}

function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [decks, setDecks] = useState<UserDeck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserAndDecks = async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);

      try {
        const { data: userDecks, error: decksError } = await supabase
          .from('decks')
          .select('id, raw_data, platform, created_at, is_public')
          .eq('profile_id', session.user.id)
          .order('created_at', { ascending: false });

        if (decksError) throw decksError;
        setDecks(userDecks || []);
      } catch (err: any) {
        console.error(err);
        setError('No pudimos cargar tus mazos. Intenta recargar la página.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndDecks();
  }, [router]);

  const handleDeleteDeck = async (deckId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este análisis de tu historial?')) return;
    
    setIsDeleting(deckId);
    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId)
        .eq('profile_id', user.id);

      if (error) throw error;
      
      setDecks(prev => prev.filter(deck => deck.id !== deckId));
    } catch (err: any) {
      console.error(err);
      alert('Ocurrió un error al intentar eliminar el mazo.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleTogglePrivacy = async (deckId: string, currentStatus: boolean) => {
    setIsToggling(deckId);
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('decks')
        .update({ is_public: newStatus })
        .eq('id', deckId)
        .eq('profile_id', user.id);

      if (error) throw error;

      setDecks(prev => prev.map(deck => 
        deck.id === deckId ? { ...deck, is_public: newStatus } : deck
      ));
    } catch (err: any) {
      console.error(err);
      alert('Error al cambiar la privacidad del mazo.');
    } finally {
      setIsToggling(null);
    }
  };

  const getDeckShortName = (url: string, platform: string) => {
    try {
      if (platform === 'moxfield') {
        const match = url.match(/decks\/([a-zA-Z0-9_-]+)/);
        return match ? `Moxfield ID: ${match[1].substring(0, 8)}...` : 'Mazo de Moxfield';
      }
      if (platform === 'archidekt') {
        const match = url.match(/decks\/(\d+)/);
        return match ? `Archidekt ID: ${match[1]}` : 'Mazo de Archidekt';
      }
    } catch (e) {}
    return 'Mazo Importado';
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  if (isLoading) {
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
              Panel de Control
            </h1>
            <p className="text-gray-400 text-sm">Administra tu historial de mazos analizados y su configuración de privacidad.</p>
          </div>
          
          <Link 
            href="/analyze"
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20"
          >
            <Plus className="w-5 h-5" />
            Analizar Nuevo Mazo
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-8">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {decks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <div key={deck.id} className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-500/30 transition-all group flex flex-col h-full relative overflow-hidden">
                
                {/* Botón interactivo de Privacidad */}
                <button 
                  onClick={() => handleTogglePrivacy(deck.id, deck.is_public)}
                  disabled={isToggling === deck.id}
                  title="Cambiar visibilidad"
                  className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1.5 rounded-bl-xl border-b border-l uppercase flex items-center gap-1.5 transition-colors focus:outline-none disabled:opacity-50 ${
                    deck.is_public 
                    ? 'bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border-emerald-500/30' 
                    : 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 border-gray-700'
                  }`}
                >
                  {isToggling === deck.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : deck.is_public ? (
                    <Globe className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  {deck.is_public ? 'Público' : 'Privado'}
                </button>

                <div className="flex items-start gap-4 mb-4 mt-2">
                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                    <Layers className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {getDeckShortName(deck.raw_data, deck.platform)}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <span className="capitalize text-purple-400/80">{deck.platform}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(deck.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-950/50 rounded-xl p-3 mb-6 border border-gray-800/50">
                  <a 
                    href={deck.raw_data} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-gray-400 hover:text-purple-400 truncate block transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {deck.raw_data}
                  </a>
                </div>

                <div className="mt-auto flex items-center gap-3 pt-4 border-t border-gray-800/80">
                  <Link 
                    href={`/deck/${deck.id}`}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Ver Análisis
                  </Link>
                  
                  <button 
                    onClick={() => handleDeleteDeck(deck.id)}
                    disabled={isDeleting === deck.id}
                    title="Eliminar del historial"
                    className="p-2.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 hover:border-red-500/50 rounded-lg transition-all disabled:opacity-50"
                  >
                    {isDeleting === deck.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/30 border border-gray-800 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-900 p-4 rounded-2xl mb-6 shadow-inner shadow-black">
              <Layers className="w-12 h-12 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Aún no tienes mazos</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              Tu historial está vacío. Importa tu primer mazo desde Moxfield o Archidekt para empezar a recibir recomendaciones estadísticas.
            </p>
            <Link 
              href="/analyze"
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20"
            >
              <Plus className="w-5 h-5" />
              Importar mi primer mazo
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  );
}