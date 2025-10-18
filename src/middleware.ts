// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/dashboard', '/reminders', '/shop', '/profile'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh/attach auth cookies (keeps you signed in across requests)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname, searchParams } = req.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (!needsAuth) return res;

  const lang = searchParams.get('lang') ?? 'en';
  const nextTarget = pathname + (req.nextUrl.search || '');

  // 1) No session → go sign in
  if (!session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('lang', lang);
    url.searchParams.set('next', nextTarget);
    return NextResponse.redirect(url);
  }

  // 2) Session present: (light) confirmation check.
  //    Magic-link sign-in typically implies confirmed; this is a safe extra guard.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const confirmed =
      // Supabase user fields (depending on provider/config)
      // @ts-ignore – runtime field from Supabase
      Boolean(user?.email_confirmed_at || user?.confirmed_at || user?.email?.length);

    if (!confirmed) {
      const url = req.nextUrl.clone();
      url.pathname = '/sign-in';
      url.searchParams.set('lang', lang);
      url.searchParams.set('next', nextTarget);
      url.searchParams.set('pending', 'confirm');
      return NextResponse.redirect(url);
    }
  } catch {
    // If the user fetch fails for any reason, fall back to requiring sign-in
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('lang', lang);
    url.searchParams.set('next', nextTarget);
    return NextResponse.redirect(url);
  }

  // Auth OK → proceed
  return res;
}

export const config = {
  matcher: [
    /*
      Match all routes except static files and auth
    */
    '/((?!_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
