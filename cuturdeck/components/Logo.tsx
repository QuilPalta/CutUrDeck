import React from 'react';

export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Carta Base (Fondo) */}
      <rect x="25" y="15" width="50" height="70" rx="6" fill="#1F2937" stroke="#4B5563" strokeWidth="4" />
      
      {/* Carta Principal (Frente, rotada) */}
      <g transform="rotate(12 50 50)">
        <rect x="25" y="15" width="50" height="70" rx="6" fill="#030712" stroke="#A855F7" strokeWidth="4" />
        {/* Arte de la carta (Abstracto) */}
        <path d="M 35 30 L 65 30 L 65 50 L 35 50 Z" fill="#4C1D95" opacity="0.5" />
        {/* Estadísticas/Barras */}
        <rect x="35" y="60" width="20" height="4" rx="2" fill="#10B981" />
        <rect x="35" y="70" width="10" height="4" rx="2" fill="#F59E0B" />
      </g>

      {/* Efecto de "Corte" / "Tijera" / "Análisis" (Línea dinámica) */}
      <path 
        d="M 10 90 L 90 10" 
        stroke="#10B981" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeDasharray="8 8" 
        className="animate-pulse"
      />
    </svg>
  );
}