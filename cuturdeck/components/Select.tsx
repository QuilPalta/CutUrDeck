"use client";

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  wrapperClassName?: string;
}

export default function Select({
  options,
  value,
  onChange,
  icon,
  size = 'md',
  wrapperClassName = ''
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Cerrar si se hace clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sizes = {
    sm: "px-2 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`relative ${wrapperClassName}`} ref={selectRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 hover:bg-gray-800 transition-colors cursor-pointer select-none ${sizes[size]}`}
      >
        <div className="flex items-center gap-2">
          {icon && <div className={`${iconSizes[size]} text-gray-400 flex-shrink-0`}>{icon}</div>}
          <span className="text-gray-200 font-medium">{selectedOption.label}</span>
        </div>
        <ChevronDown className={`${iconSizes[size]} text-gray-500 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full min-w-[120px] mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-xl shadow-black/50 overflow-hidden right-0"
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  value === opt.value 
                    ? 'bg-purple-600/20 text-purple-400' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {opt.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}