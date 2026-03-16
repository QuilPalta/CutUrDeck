"use client";

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  divider?: boolean;
  danger?: boolean;
}

interface DropdownProps {
  trigger: ReactNode; // El botón o elemento que abre el menú
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export default function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cierra el dropdown si el usuario hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-50 mt-2 w-56 rounded-xl bg-gray-900 border border-gray-800 shadow-xl shadow-black/50 overflow-hidden ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            <div className="py-2">
              {items.map((item, index) => {
                if (item.divider) {
                  return <div key={index} className="h-px bg-gray-800 my-1" />;
                }

                const content = (
                  <div 
                    className={`flex items-center px-4 py-2 text-sm transition-colors cursor-pointer ${
                      item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      setIsOpen(false); // Cierra al hacer clic
                    }}
                  >
                    {item.icon && <span className="mr-3 w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                    {item.label}
                  </div>
                );

                return item.href ? (
                  <a key={index} href={item.href} className="block">
                    {content}
                  </a>
                ) : (
                  <div key={index}>{content}</div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}