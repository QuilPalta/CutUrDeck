"use client";

import React, { useState } from 'react';
import { X, Save, Loader2, Image as ImageIcon, Globe, Lock, Type } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface DeckSettingsModalProps {
  deck: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedData: any) => void;
}

export default function DeckSettingsModal({ deck, isOpen, onClose, onUpdate }: DeckSettingsModalProps) {
  const [name, setName] = useState(deck?.name || '');
  const [coverUrl, setCoverUrl] = useState(deck?.cover_url || '');
  const [isPublic, setIsPublic] = useState(deck?.is_public || false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('decks')
        .update({ name, cover_url: coverUrl, is_public: isPublic })
        .eq('id', deck.id);

      if (error) throw error;
      onUpdate({ name, cover_url: coverUrl, is_public: isPublic });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar los ajustes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          
          <h2 className="text-2xl font-bold text-white mb-6">Ajustes del Mazo</h2>

          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2"><Type className="w-4 h-4"/> Nombre Personalizado</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Ashling Voltron"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> URL de la Portada</label>
              <input 
                type="url" 
                value={coverUrl} 
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">Pega la dirección de una imagen para usarla en tu Dashboard.</p>
            </div>

            <div className="flex items-center justify-between bg-gray-950 p-4 rounded-xl border border-gray-800">
              <div>
                <span className="font-bold text-gray-200 block">Mazo Público</span>
                <span className="text-xs text-gray-500">Permite que otros clonen tu mazo desde Explorar.</span>
              </div>
              <button 
                onClick={() => setIsPublic(!isPublic)}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${isPublic ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
              >
                {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isPublic ? 'Público' : 'Privado'}
              </button>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Guardar Cambios
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}