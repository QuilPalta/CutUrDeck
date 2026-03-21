import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // "next" es un parámetro opcional para saber a dónde ir después, por defecto al dashboard
  const next = searchParams.get('next') ?? '/dashboard';

  // Si Supabase nos manda el código seguro por servidor (PKCE Flow)
  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            return (await cookieStore).get(name)?.value;
          },
          async set(name: string, value: string, options: CookieOptions) {
            (await cookieStore).set({ name, value, ...options });
          },
          async remove(name: string, options: CookieOptions) {
            (await cookieStore).delete({ name, ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Error intercambiando el código por sesión:', error.message);
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
  }

  // TRUCO MAESTRO: Si no hay "code", es porque Supabase mandó un "#access_token" (Implicit Flow).
  // Los servidores Node.js no pueden leer el "#", pero si redirigimos al dashboard,
  // el navegador se lleva el "#" consigo y el cliente de Supabase lo procesa allá perfectamente.
  return NextResponse.redirect(`${origin}${next}`);
}