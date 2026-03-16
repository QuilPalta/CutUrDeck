import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  
  // Clases base estandarizadas (redondeado, transición, fuente, interacción)
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  // Clases según la variante de color
  const variants = {
    primary: "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50 hover:shadow-purple-900/80",
    secondary: "bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 hover:border-gray-700",
    outline: "bg-transparent border-2 border-purple-600 text-purple-500 hover:bg-purple-600 hover:text-white",
    ghost: "bg-transparent hover:bg-gray-800 text-gray-300"
  };

  // Clases según el tamaño
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}