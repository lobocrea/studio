'use server';

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Crea un cliente de Supabase para el middleware.
  // El cliente se encargará de refrescar los tokens de autenticación si es necesario.
  const supabase = createMiddlewareClient<Database>({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si no hay sesión y el usuario intenta acceder al dashboard,
  // se le redirige a la página de inicio.
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    const url = new URL(req.url);
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // El middleware se ejecutará en las rutas que coincidan con este patrón.
  matcher: ['/dashboard/:path*', '/'],
};
