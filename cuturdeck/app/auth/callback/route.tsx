"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // El cliente de Supabase lee automáticamente la URL y procesa el token oculto
    const processAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error("Error en callback de autenticación:", error);
        router.push('/login');
        return;
      }

      // Si la autenticación es exitosa, lo mandamos al inicio
      router.push('/');
      // Forzamos un refresh para que el Navbar actualice el estado y muestre la foto
      router.refresh(); 
    };

    processAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
      <p className="text-gray-400 font-medium animate-pulse text-lg">
        Conectando con Google...
      </p>
    </div>
  );
}