"use client";

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AdBannerProps {
  isPremium: boolean;
  className?: string;
}

export default function AdBanner({ isPremium, className = "" }: AdBannerProps) {
  // Si el usuario es Premium, no renderizamos absolutamente nada (Sin anuncios)
  if (isPremium) return null;

  return (
    <div className={`w-full bg-gray-900/50 border border-gray-800 border-dashed rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px] relative overflow-hidden ${className}`}>
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-gray-800 rounded text-[10px] font-bold text-gray-500 uppercase tracking-wider">
        Ad
      </div>
      <AlertCircle className="w-6 h-6 text-gray-600 mb-2 mt-2" />
      <p className="text-sm font-bold text-gray-500">Espacio Publicitario</p>
      <p className="text-xs text-gray-600">Actualiza a Premium para remover los anuncios.</p>
    </div>
  );
}