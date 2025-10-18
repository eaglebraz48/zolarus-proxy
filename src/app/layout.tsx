'use client';

import './globals.css';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import ChatWidget from '@/components/ChatWidget';

type Lang = 'en' | 'pt' | 'es' | 'fr';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        {/* Suspense above the whole page tree so any useSearchParams() is compliant */}
        <Suspense fallback={null}>
          <Header />
          {children}
          <ChatWidget />
        </Suspense>
      </body>
    </html>
  );
}

function Header() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const router = useRouter();
  const lang = ((sp.get('lang') as Lang) || 'en') as Lang;

  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email || null);
    })();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const setLang = (next: Lang) => {
    const params = new URLSearchParams(sp.toString());
    params.set('lang', next);
    router.push(`${pathname}?${params.toString()}`);
  };

  // if not signed in, send to /sign-in?next=/target&lang=...
  const navLink = (label: string, to: string) => {
    const params = new URLSearchParams(sp.toString());
    if (!params.get('lang')) params.set('lang', 'en');

    const dest =
      userEmail
        ? { pathname: to, query: Object.fromEntries(params.entries()) }
        : {
            pathname: '/sign-in',
            query: { next: to, lang: params.get('lang') ?? 'en' },
          };

    return (
      <Link
        href={dest}
        style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 700 }}
      >
        {label}
      </Link>
    );
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const forceSignInUI = pathname === '/' || pathname === '/sign-in';

  // Localized label for the seasonal link text
  const seasonalLabel =
    { en: 'Holiday specials', pt: 'Especiais de feriado', es: 'Especiales de temporada', fr: 'Offres saisonnières' }[
      lang
    ] ?? 'Holiday specials';

  // Referral link used on the dashboard button
  const referralHref = `/?ref=global&lang=${encodeURIComponent(lang)}`;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {navLink('Zolarus', '/')}
        <nav style={{ display: 'flex', gap: 16, marginLeft: 8 }}>
          {navLink('Dashboard', '/dashboard')}
          {navLink('Shop', '/shop')}

          {/* Holiday specials — gated like other items */}
          {userEmail ? (
            <a
              href="https://www.amazon.com/?tag=mateussousa-20"
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              style={{ textDecoration: 'none', color: '#b91c1c', fontWeight: 800 }}
            >
              {seasonalLabel}
            </a>
          ) : (
            <Link
              href={{ pathname: '/sign-in', query: { next: '/go/holiday', lang } }}
              style={{ textDecoration: 'none', color: '#b91c1c', fontWeight: 800 }}
            >
              {seasonalLabel}
            </Link>
          )}

          {/* Refs → same referral URL when signed in; otherwise sign-in first */}
          <Link
            href={userEmail ? referralHref : { pathname: '/sign-in', query: { next: '/', lang } }}
            style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 700 }}
          >
            Refs
          </Link>

          {navLink('Reminders', '/reminders')}
          {navLink('Profile', '/profile')}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '6px 8px',
              background: '#fff',
            }}
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>

          {forceSignInUI || !userEmail ? (
            <Link
              href={{ pathname: '/sign-in', query: { lang } }}
              style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 700 }}
            >
              Sign in
            </Link>
          ) : (
            <button
              onClick={handleSignOut}
              style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
