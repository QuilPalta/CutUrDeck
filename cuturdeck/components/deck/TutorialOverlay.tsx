"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TutorialOverlayProps {
  userId: string;
  preferences: any;
  onComplete: () => void;
}

const STEPS = [
  {
    target: 'tour-header',
    title: "¡Bienvenido a tu Análisis!",
    content: "Como es tu primera vez aquí, te daremos un recorrido ultra-rápido de cómo funciona el Deck Broker."
  },
  {
    target: 'tour-budget',
    title: "1. El Presupuesto (Target Liga)",
    content: "Define el límite de dinero de tu mazo. El algoritmo usará este límite para sugerirte cartas más baratas si te pasas, o cartas más fuertes si te sobra."
  },
  {
    target: 'tour-distribution',
    title: "2. Distribución Exacta",
    content: "Haz clic aquí para fijar cuántas tierras, criaturas y artefactos exactos quieres. El Broker te sugerirá cortes precisos para llegar a esa meta."
  },
  {
    target: 'tour-metrics',
    title: "3. Termómetro de Métricas",
    content: "Un vistazo rápido al costo promedio por carta y al ratio crítico entre tus tierras y cartas de acción."
  },
  {
    target: 'tour-broker',
    title: "4. El Broker Estadístico",
    content: "La magia pura. Analizaremos tu lista contra millones de datos de EDHREC para encontrar ineficiencias y recomendarte los reemplazos perfectos."
  }
];

export default function TutorialOverlay({ userId, preferences, onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });

    const updatePosition = () => {
      const targetId = STEPS[currentStep].target;
      const el = document.getElementById(targetId);
      
      if (el) {
        // Si el elemento es muy alto (ej. el Broker), escroleamos hacia el inicio ('start') 
        // en lugar del centro ('center') para no perder la cabecera del panel.
        const align = el.offsetHeight > window.innerHeight * 0.6 ? 'start' : 'center';
        el.scrollIntoView({ behavior: 'smooth', block: align });
        
        // Retraso para dejar que la animación de scroll termine antes de medir
        setTimeout(() => {
          setTargetRect(el.getBoundingClientRect());
        }, 400);
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep]);

  const handleFinish = async () => {
    try {
      const newPrefs = { ...(preferences || {}), has_seen_tutorial: true };
      await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', userId);
      onComplete();
    } catch (e) {
      console.error(e);
      onComplete(); // Cerramos igualmente en caso de error para no bloquear la app
    }
  };

  // Cálculo Inteligente de la posición de la Tarjeta (Popover)
  let popoverTop: number | string = '50%';
  let popoverLeft: number | string = '50%';
  let transformY = '-50%';
  let transformX = '-50%';

  if (targetRect) {
    const isHugeElement = targetRect.height > windowDimensions.height * 0.6;
    const isBottomHalf = targetRect.top > windowDimensions.height / 2;
    
    if (isHugeElement) {
      // Si el elemento es gigantesco (como el broker), anclamos la tarjeta a una
      // zona segura en la parte INFERIOR de la pantalla, para que siempre esté a la vista.
      popoverTop = windowDimensions.height - 40; 
      transformY = '-100%';
    } else if (isBottomHalf) {
      // Si está abajo, ponemos la tarjeta arriba del elemento (sin que se salga de la pantalla)
      popoverTop = Math.max(40, targetRect.top - 20);
      transformY = '-100%';
    } else {
      // Si está arriba, ponemos la tarjeta debajo del elemento
      popoverTop = Math.min(windowDimensions.height - 40, targetRect.bottom + 20);
      transformY = '0';
    }

    // Centramos horizontalmente respecto al elemento, pero evitamos que se salga por los lados
    popoverLeft = Math.max(20, Math.min(targetRect.left, windowDimensions.width - 340));
    transformX = '0';
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none">
        
        {/* Foco de luz (Spotlight) */}
        {targetRect && (
          <motion.div
            className="absolute rounded-xl border-2 border-purple-500/50"
            initial={false}
            animate={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.75)"
            }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            style={{ pointerEvents: 'auto' }}
          />
        )}

        {/* Respaldo por si el elemento no se encuentra */}
        {!targetRect && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/75"
            style={{ pointerEvents: 'auto' }}
          />
        )}

        {/* Tarjeta del Tutorial */}
        <motion.div 
          className="absolute bg-gray-900 border border-purple-500/50 rounded-2xl p-6 w-[320px] shadow-[0_0_40px_rgba(168,85,247,0.2)] pointer-events-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            top: popoverTop,
            left: popoverLeft,
            x: transformX,
            y: transformY
          }}
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
        >
          <button 
            onClick={handleFinish} 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
            title="Omitir tutorial"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="bg-purple-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
              {currentStep + 1}
            </span>
            <h3 className="text-lg font-bold text-white leading-tight pr-4">{STEPS[currentStep].title}</h3>
          </div>
          
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            {STEPS[currentStep].content}
          </p>

          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              {STEPS.map((_, idx) => (
                <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === currentStep ? 'bg-purple-500' : 'bg-gray-700'}`} />
              ))}
            </div>

            {currentStep < STEPS.length - 1 ? (
              <button 
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-900/30"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleFinish}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/30"
              >
                Terminar <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}