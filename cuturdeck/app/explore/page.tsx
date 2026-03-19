"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Layers, Calendar, BarChart3, Search, User as UserIcon, Globe, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { LanguageProvider } from '@/lib/i18n';

// Extendemos la interfaz para incluir los datos del perfil del creador
interface PublicDeck {
  id: string;
  raw_data: string;
  platform: string;
  created_at: string;
  profiles: {
    nickname: string | null;
    avatar_url: string | null;
  } | null;
}

function ExploreContent() {
  const [decks, setDecks] = useState<PublicDeck[]>([]);
  const [filteredDecks, setFilteredDecks] = useState<PublicDeck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPublicDecks = async () => {
      try {
        // Hacemos un JOIN con la tabla profiles para traer el nickname y avatar del creador
        const { data, error: fetchError } = await supabase
          .from('decks')
          .select(`
            id,
            raw_data,
            platform,
            created_at,
            profiles (
              nickname,
              avatar_url
            )
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const typedData = data as unknown as PublicDeck[];
        setDecks(typedData || []);
        setFilteredDecks(typedData || []);
      } catch (err: any) {
        console.error(err);
        setError('No pudimos cargar los mazos públicos. Intenta recargar la página.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicDecks();
  }, []);

  // Filtro simple por URL o plataforma
  useEffect(() => {
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = decks.filter(deck => 
      deck.raw_data.toLowerCase().includes(lowercasedSearch) ||
      deck.platform.toLowerCase().includes(lowercasedSearch) ||
      (deck.profiles?.nickname && deck.profiles.nickname.toLowerCase().includes(lowercasedSearch))
    );
    setFilteredDecks(filtered);
  }, [searchTerm, decks]);

  const getDeckShortName = (url: string, platform: string) => {
    try {
      if (platform === 'moxfield') {
        const match = url.match(/decks\/([a-zA-Z0-9_-]+)/);
        return match ? `Moxfield: ${match[1].substring(0, 8)}...` : 'Mazo de Moxfield';
      }
      if (platform === 'archidekt') {
        const match = url.match(/decks\/(\d+)/);
        return match ? `Archidekt: ${match[1]}` : 'Mazo de Archidekt';
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
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-gray-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" />
              Comunidad
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
              Explorar Mazos
            </h1>
            <p className="text-gray-400 text-base max-w-2xl">
              Descubre estrategias analizadas por otros jugadores. Encuentra inspiración, revisa sus métricas de EDHREC y mejora tus propias construcciones.
            </p>
          </div>

          {/* Buscador Simple */}
          <div className="w-full md:w-72 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por ID, plataforma o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner shadow-black/20"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-8">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Grilla de Mazos Públicos */}
        {filteredDecks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDecks.map((deck) => (
              <div key={deck.id} className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/30 hover:bg-gray-900/60 transition-all group flex flex-col h-full relative overflow-hidden">
                
                {/* Info del Creador */}
                <div className="flex items-center gap-3 mb-5 border-b border-gray-800/50 pb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                    {deck.profiles?.avatar_url ? (
                      <img src={deck.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-200">
                      {deck.profiles?.nickname || 'Usuario Anónimo'}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(deck.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 group-hover:border-emerald-500/30 transition-colors">
                    <Layers className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {getDeckShortName(deck.raw_data, deck.platform)}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-800 text-xs text-gray-400 capitalize font-medium">
                      {deck.platform}
                    </div>
                  </div>
                </div>

                {/* Botón de Acción (Empuja al fondo) */}
                <div className="mt-auto pt-4">
                  <Link 
                    href={`/deck/${deck.id}`}
                    className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Ver Análisis Estadístico
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Estado Vacío (Búsqueda sin resultados o no hay mazos públicos) */
          <div className="bg-gray-900/30 border border-gray-800 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-900 p-5 rounded-2xl mb-6 shadow-inner shadow-black">
              <Globe className="w-12 h-12 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No encontramos mazos</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              {searchTerm 
                ? `No hay coincidencias para "${searchTerm}". Intenta buscar con otros términos.` 
                : "Aún no hay mazos públicos en la comunidad. ¡Sé el primero en compartir el tuyo desde tu Panel de Control!"}
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <LanguageProvider>
      <ExploreContent />
    </LanguageProvider>
  );
}