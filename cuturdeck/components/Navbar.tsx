"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, Menu, Globe, Settings, LogOut, LayoutDashboard, Crown, Sparkles } from 'lucide-react';
import { useLanguage, Language, LanguageProvider } from '@/lib/i18n';
import Select from './Select';
import Dropdown, { DropdownItem } from './Dropdown';
import { supabase } from '@/lib/supabase';
import Logo from './Logo';

function NavbarContent() {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const languageOptions = [
    { value: 'es', label: 'ES' },
    { value: 'en', label: 'EN' },
    { value: 'pt', label: 'PT' },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) fetchProfile(session.user.id);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const userMenuItems: DropdownItem[] = [
    { label: 'Mi Perfil', icon: <User className="w-4 h-4" />, href: profile?.nickname ? `/profile/${profile.nickname}` : '/profile' },
    { label: 'Panel de Control', icon: <LayoutDashboard className="w-4 h-4" />, href: '/dashboard' },
    { label: 'CutUrDeck Premium', icon: <Crown className="w-4 h-4 text-amber-500" />, href: '/premium' },
    { divider: true, label: '' },
    { label: 'Ajustes', icon: <Settings className="w-4 h-4" />, href: '/settings' },
    { divider: true, label: '' },
    { label: 'Cerrar Sesión', icon: <LogOut className="w-4 h-4" />, danger: true, onClick: handleLogout },
  ];

  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <nav className={`sticky top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-950/90 backdrop-blur-md border-b border-gray-800 shadow-xl' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo className="w-8 h-8 transition-transform group-hover:scale-110 group-hover:rotate-3" />
            <span className="text-2xl font-extrabold tracking-tighter bg-gradient-to-r from-purple-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient hover:opacity-80 transition-opacity hidden sm:block">
              CutUrDeck
            </span>
          </Link>
          
          <div className="hidden md:flex gap-1">
            <Link 
              href="/dashboard" 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/dashboard') ? 'bg-gray-800 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
            >
              Mis Mazos
            </Link>
            <Link 
              href="/explore" 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/explore') ? 'bg-gray-800 text-emerald-400' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
            >
              Explorar Comunidad
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          
          <Link href="/premium" className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-full text-amber-500 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-all group">
            <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" />
            <span>Premium</span>
          </Link>

          <div className="w-px h-6 bg-gray-800 hidden lg:block mx-1"></div>

          <Select 
            options={languageOptions}
            value={language}
            onChange={(val) => setLanguage(val as Language)}
            icon={<Globe />}
            size="md"
          />

          {user ? (
            <Dropdown 
              align="right"
              trigger={
                <button className="relative p-1 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-purple-500/50 rounded-full transition-all text-gray-300 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-gray-900 rounded-full"></span>
                </button>
              }
              items={userMenuItems}
            />
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-bold text-gray-300 hover:text-white transition-colors hidden sm:block">
                Iniciar Sesión
              </Link>
              <Link href="/login" className="px-5 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40">
                Registrarse
              </Link>
            </div>
          )}

          <button className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function Navbar() {
  return (
    <LanguageProvider>
      <NavbarContent />
    </LanguageProvider>
  );
}