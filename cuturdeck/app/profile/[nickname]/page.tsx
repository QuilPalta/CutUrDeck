"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, User as UserIcon, Calendar, Layers, Globe, Lock, Edit3, X, Save, AlertCircle, BarChart3, ExternalLink, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { LanguageProvider } from '@/lib/i18n';

interface ProfileData {
  id: string;
  nickname: string;
  avatar_url: string;
  created_at: string;
}

interface UserDeck {
  id: string;
  raw_data: string;
  platform: string;
  created_at: string;
  is_public: boolean;
  name: string | null;
  cover_url: string | null;
}

function ProfileContent() {
  const params = useParams();
  const router = useRouter();
  const rawNickname = params.nickname as string;
  const decodedNickname = decodeURIComponent(rawNickname);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [decks, setDecks] = useState<UserDeck[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para el Modal de Edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const fetchProfileAndDecks = async () => {
      setIsLoading(true);
      setError('');

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('nickname', decodedNickname)
          .single();

        if (profileError || !profileData) {
          throw new Error("Usuario no encontrado.");
        }

        setProfile(profileData);
        setEditNickname(profileData.nickname || '');
        setEditAvatar(profileData.avatar_url || '');

        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;
        const ownerCheck = currentUser?.id === profileData.id;
        setIsOwner(ownerCheck);

        let decksQuery = supabase
          .from('decks')
          .select('*')
          .eq('profile_id', profileData.id)
          .order('created_at', { ascending: false });

        if (!ownerCheck) {
          decksQuery = decksQuery.eq('is_public', true);
        }

        const { data: decksData, error: decksError } = await decksQuery;

        if (decksError) throw decksError;
        setDecks(decksData || []);

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Ocurrió un error al cargar el perfil.");
      } finally {
        setIsLoading(false);
      }
    };

    if (decodedNickname) {
      fetchProfileAndDecks();
    }
  }, [decodedNickname]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    setEditError('');

    try {
      const cleanNickname = editNickname.trim();
      if (!cleanNickname) throw new Error("El Nickname no puede estar vacío.");

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          nickname: cleanNickname, 
          avatar_url: editAvatar.trim() 
        })
        .eq('id', profile.id);

      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error("Este Nickname ya está en uso por otro jugador.");
        }
        throw updateError;
      }

      setShowEditModal(false);
      
      if (cleanNickname !== profile.nickname) {
        router.push(`/profile/${encodeURIComponent(cleanNickname)}`);
      } else {
        setProfile({ ...profile, avatar_url: editAvatar.trim() });
        router.refresh(); 
      }

    } catch (err: any) {
      console.error(err);
      setEditError(err.message || "Error al actualizar el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <UserIcon className="w-20 h-20 text-gray-800 mb-6" />
          <h1 className="text-3xl font-bold text-white mb-2">Perfil no encontrado</h1>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            El jugador que buscas no existe o ha cambiado su nickname.
          </p>
          <Link href="/explore" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-xl transition-all">
            Volver a Explorar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-purple-500/30 flex flex-col">
      <Navbar />

      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-6">Editar Perfil</h2>

              {editError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{editError}</p>
                </div>
              )}

              <div className="flex flex-col gap-5">
                
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> URL de la Foto de Perfil
                  </label>
                  <input 
                    type="url" 
                    value={editAvatar} 
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://ejemplo.com/mifoto.jpg"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                    Usa un enlace directo a una imagen. Puedes subir tu foto a servicios gratuitos como <strong>Imgur</strong>, <strong>Discord</strong> o <strong>Google Drive</strong> y pegar el enlace aquí.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Nickname</label>
                  <input 
                    type="text" 
                    value={editNickname} 
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <p className="text-[10px] text-gray-500 mt-2">Si cambias tu nickname, tu enlace de perfil público también cambiará.</p>
                </div>

                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-900/20"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 relative z-10">
        
        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-8 mb-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="w-32 h-32 rounded-full bg-gray-950 border-4 border-gray-800 overflow-hidden flex items-center justify-center shrink-0 relative group shadow-xl">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.nickname} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-12 h-12 text-gray-600" />
            )}
            
            {isOwner && (
              <div 
                onClick={() => setShowEditModal(true)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
              >
                <Edit3 className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left z-10">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-4 mb-2">
              <h1 className="text-4xl font-extrabold text-white tracking-tight">{profile.nickname}</h1>
              {isOwner && (
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar Perfil
                </button>
              )}
            </div>
            
            <p className="text-gray-400 flex items-center justify-center md:justify-start gap-2 text-sm mb-6">
              <Calendar className="w-4 h-4" /> Se unió en {formatDate(profile.created_at)}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-gray-950 border border-gray-800 px-5 py-3 rounded-xl flex flex-col items-center md:items-start min-w-[120px]">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Mazos Públicos</span>
                <span className="text-2xl font-bold text-white">{decks.filter(d => d.is_public).length}</span>
              </div>
              <div className="bg-gray-950 border border-gray-800 px-5 py-3 rounded-xl flex flex-col items-center md:items-start min-w-[120px]">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Analizados</span>
                <span className="text-2xl font-bold text-purple-400">{isOwner ? decks.length : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-400" />
            {isOwner ? 'Tu Bóveda Completa' : 'Escaparate Público'}
          </h2>
        </div>

        {decks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <div key={deck.id} className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-500/30 hover:bg-gray-900/60 transition-all group flex flex-col h-full relative overflow-hidden">
                
                {isOwner && (
                  <div className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-b border-l uppercase flex items-center gap-1.5 ${deck.is_public ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/30' : 'bg-gray-800/80 text-gray-400 border-gray-700'}`}>
                    {deck.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {deck.is_public ? 'Público' : 'Privado'}
                  </div>
                )}

                {deck.cover_url && (
                  <div className="w-full h-32 -mx-6 -mt-6 mb-4 relative overflow-hidden border-b border-gray-800">
                    <img src={deck.cover_url} alt="Cover" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                  </div>
                )}

                <div className={`flex items-start gap-4 mb-4 ${!deck.cover_url ? 'mt-2' : ''}`}>
                  {!deck.cover_url && (
                    <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 group-hover:border-purple-500/30 transition-colors">
                      <Layers className="w-6 h-6 text-purple-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 leading-tight">
                      {deck.name || getDeckShortName(deck.raw_data, deck.platform)}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <span className="capitalize text-purple-400/80">{deck.platform}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex flex-col gap-3">
                  <div className="bg-gray-950/50 rounded-lg p-2.5 border border-gray-800/50">
                    <a href={deck.raw_data} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-purple-400 truncate block transition-colors flex items-center gap-1.5">
                      <ExternalLink className="w-3 h-3 shrink-0" /> {deck.raw_data}
                    </a>
                  </div>
                  
                  <Link 
                    href={`/deck/${deck.id}`}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Ver Análisis
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/30 border border-gray-800 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-900 p-5 rounded-2xl mb-6 shadow-inner shadow-black">
              <UserIcon className="w-12 h-12 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              {isOwner ? 'Aún no tienes mazos' : 'No hay mazos públicos'}
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              {isOwner 
                ? "Ve a la sección de Analizar para importar tu primer mazo y empezar a usar el Broker." 
                : "Este usuario aún no ha configurado ningún mazo como público en su bóveda."}
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <LanguageProvider>
      <ProfileContent />
    </LanguageProvider>
  );
}