"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Layers, BarChart3, Wand2, Users, ShieldCheck, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { LanguageProvider, useLanguage } from '@/lib/i18n';

function HomeContent() {
  // Aquí ya podemos usar useLanguage() sin problemas de contexto
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-purple-500/30 flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 flex flex-col items-center text-center z-10">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 border border-gray-800 text-sm font-bold text-gray-300 mb-8 shadow-inner shadow-black/50">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>El primer Broker de EDH impulsado por la comunidad.</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Deja de adivinar qué carta <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500">cortar.</span>
            <br />
            Empieza a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-purple-500">optimizar.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Conecta tu mazo de Moxfield o Archidekt. Nuestro algoritmo cruza tu presupuesto, distribución y métricas semánticas con millones de datos de EDHREC para darte el reemplazo perfecto en segundos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/analyze"
              className="w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2 text-lg"
            >
              <Wand2 className="w-5 h-5" /> Analizar mi Mazo Ahora
            </Link>
            <Link 
              href="/explore"
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-lg"
            >
              Explorar la Comunidad
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 w-full max-w-5xl mx-auto relative perspective-1000"
        >
          <div className="w-full h-[400px] md:h-[600px] bg-gray-900 border border-gray-800 rounded-t-3xl shadow-2xl overflow-hidden relative border-b-0 flex flex-col">
            <div className="bg-gray-950 px-4 py-3 border-b border-gray-800 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <div className="mx-auto bg-gray-900 border border-gray-800 rounded-md px-3 py-1 text-xs text-gray-500 font-mono">cuturdeck.com/analyze</div>
            </div>
            
            <div className="flex-1 p-8 bg-gray-950/50 flex flex-col gap-6 relative">
              <div className="w-full h-24 bg-gradient-to-r from-purple-900/20 to-emerald-900/20 rounded-2xl border border-gray-800/50 flex items-center px-6">
                <div className="w-16 h-16 rounded-full bg-gray-800 animate-pulse"></div>
                <div className="ml-4 flex flex-col gap-2">
                  <div className="w-48 h-4 bg-gray-800 rounded animate-pulse"></div>
                  <div className="w-32 h-3 bg-gray-800 rounded animate-pulse"></div>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-1/3 h-64 bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-4">
                  <div className="w-full h-32 bg-gray-800 rounded-xl animate-pulse"></div>
                  <div className="w-full h-4 bg-red-900/30 rounded border border-red-900/50"></div>
                </div>
                <div className="w-1/3 flex items-center justify-center">
                  <ArrowRight className="w-12 h-12 text-gray-700" />
                </div>
                <div className="w-1/3 h-64 bg-gray-900 border border-emerald-900/30 rounded-2xl p-4 flex flex-col gap-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                  <div className="w-full h-32 bg-gray-800 rounded-xl animate-pulse"></div>
                  <div className="w-full h-4 bg-emerald-900/30 rounded border border-emerald-900/50"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent pointer-events-none"></div>
        </motion.div>
      </main>

      <section className="py-24 bg-gray-950 border-t border-gray-900 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Ingeniería de Mazos, no adivinanzas.</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">CutUrDeck lee las reglas de tus cartas, entiende tu estrategia y te guía hacia la victoria con datos duros.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 hover:border-purple-500/30 transition-colors group">
              <div className="w-14 h-14 bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Broker Estadístico</h3>
              <p className="text-gray-400 leading-relaxed">Cruzamos tu mazo con EDHREC en tiempo real para encontrar ineficiencias matemáticas y proponerte los reemplazos más jugados del meta.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 hover:border-emerald-500/30 transition-colors group">
              <div className="w-14 h-14 bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <Layers className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Análisis Semántico</h3>
              <p className="text-gray-400 leading-relaxed">No solo vemos criaturas o artefactos. Nuestro motor lee el texto de reglas para saber si te falta Ramp, Robo, Removal o Limpiamesas.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 hover:border-amber-500/30 transition-colors group">
              <div className="w-14 h-14 bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/30 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Aprendizaje Comunitario</h3>
              <p className="text-gray-400 leading-relaxed">Vota las sugerencias del Broker. El algoritmo aprende de las decisiones de miles de jugadores para no recomendar cartas inútiles en tu comandante.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-950 border-t border-gray-900 py-12 px-6 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-bold tracking-tight">CutUrDeck © 2024</span>
          </div>
          <p className="text-sm text-gray-600 text-center md:text-right max-w-md">
            Esta plataforma no está afiliada a Wizards of the Coast, Moxfield o Archidekt. Creada por jugadores de Commander, para jugadores de Commander.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ESTA ES LA CLAVE: El export por defecto es el Provider que envuelve al contenido
export default function HomePage() {
  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  );
}