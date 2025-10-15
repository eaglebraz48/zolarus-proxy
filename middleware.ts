import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  if (pathname === '/') {
    const hasLang = searchParams.has('lang');
    if (!hasLang) {
      const url = req.nextUrl.clone();
      url.searchParams.set('lang', 'en');
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
