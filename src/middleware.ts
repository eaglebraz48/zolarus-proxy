// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // pass-through: no gating, just attach supabase session if present
  const res = NextResponse.next();
  try {
    const supabase = createMiddlewareClient({ req, res });
    await supabase.auth.getSession();
  } catch {
    // swallow — we don't want middleware to break navigation
  }
  return res;
}

// Disable protection everywhere for now
export const config = {
  matcher: [], // <- nothing is gated
};
