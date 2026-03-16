"use client";

import React from 'react';
import Link from 'next/link';
import { User, Menu, Globe, Settings, LogOut, LayoutDashboard, Crown } from 'lucide-react';
import { useLanguage, Language } from '@/lib/i18n';
import SearchInput from './SearchInput';
import Select from './Select';
import Dropdown, { DropdownItem } from './Dropdown';

export default function Navbar() {
  const { t, language, setLanguage } = useLanguage();

  const languageOptions = [
    { value: 'es', label: 'ES' },
    { value: 'en', label: 'EN' },
    { value: 'pt', label: 'PT' },
    { value: 'fr', label: 'FR' },
    { value: 'de', label: 'DE' },
  ];

  const userMenuItems: DropdownItem[] = [
    { label: 'Mi Perfil', icon: <User className="w-4 h-4" />, href: '/profile' },
    { label: 'Panel de Control', icon: <LayoutDashboard className="w-4 h-4" />, href: '/dashboard' },
    { label: 'Mejorar a Premium', icon: <Crown className="w-4 h-4 text-yellow-500" />, href: '/premium' },
    { divider: true, label: '' },
    { label: 'Ajustes', icon: <Settings className="w-4 h-4" />, href: '/settings' },
    { divider: true, label: '' },
    { label: 'Cerrar Sesión', icon: <LogOut className="w-4 h-4" />, danger: true, onClick: () => console.log('Cerrando sesión...') },
  ];

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gray-950 text-white border-b border-gray-800 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-extrabold tracking-tighter bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
          CutUrDeck
        </Link>
        <div className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
          <Link href="/decks" className="hover:text-purple-400 transition-colors">{t.navMyDecks}</Link>
          <Link href="/explore" className="hover:text-purple-400 transition-colors">{t.navExplore}</Link>
          <Link href="/tools" className="hover:text-purple-400 transition-colors">{t.navTools}</Link>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <SearchInput 
          placeholder={t.navSearch} 
          wrapperClassName="hidden lg:block w-64" 
        />
        
        <Select 
          options={languageOptions}
          value={language}
          onChange={(val) => setLanguage(val as Language)}
          icon={<Globe />}
          size="md"
        />

        <Dropdown 
          align="right"
          trigger={
            <button className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg transition-colors text-gray-300">
              <User className="w-5 h-5" />
            </button>
          }
          items={userMenuItems}
        />

        <button className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}