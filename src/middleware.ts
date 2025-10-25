import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const supabase = createMiddlewareClient({ req, res });
    // This refreshes/attaches the auth cookies on every matched request
    await supabase.auth.getSession();
  } catch {
    // don't block navigation on errors
  }
  return res;
}

// ✅ Run on routes that should recognize the session (but not on the landing/sign-in pages)
export const config = {
  matcher: [
    '/dashboard',
    '/profile',
    '/reminders',
    '/refs',
    '/shop',
    '/compare',
    '/callback',
    // add other app pages that rely on a session here
  ],
};
