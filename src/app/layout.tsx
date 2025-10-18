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
        {/* IMPORTANT: keep the whole app subtree inside Suspense */}
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email || null);
    })();
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const setLang = (next: Lang) => {
    const params = new URLSearchParams(sp.toString());
    params.set('lang', next);
    router.push(`${pathname}?${params.toString()}`);
  };

  const navLink = (label: string, to: string) => {
    const params = new URLSearchParams(sp.toString());
    if (!params.get('lang')) params.set('lang', 'en');
    return (
      <Link
        href={{ pathname: to, query: Object.fromEntries(params.entries()) }}
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

  const isAuthPage = pathname === '/' || pathname === '/sign-in';

  // Localized label
  const seasonalLabel =
    {
      en: 'Holiday specials',
      pt: 'Especiais de feriado',
      es: 'Especiales de temporada',
      fr: 'Offres saisonnières',
    }[lang] ?? 'Holiday specials';

  // Gate Holiday link only on / and /sign-in
  const holidayLink = isAuthPage
    ? {
        label: seasonalLabel,
        href: `/sign-in?next=/go/holiday&lang=${lang}`,
        color: '#9ca3af', // muted on auth pages
      }
    : {
        label: seasonalLabel,
        href: 'https://www.amazon.com/?tag=mateussousa-20',
        color: '#dc2626', // active red elsewhere
      };

  // Referral target shown on dashboard; leave as-is
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

          {/* Holiday specials (gated on landing/sign-in only) */}
          <a
            href={holidayLink.href}
            target={isAuthPage ? undefined : '_blank'}
            rel={isAuthPage ? undefined : 'noopener noreferrer nofollow sponsored'}
            style={{ textDecoration: 'none', fontWeight: 700, color: holidayLink.color }}
          >
            {holidayLink.label}
          </a>

          {/* Refs kept as before */}
          <Link
            href={referralHref}
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

          {!userEmail ? (
            navLink('Sign in', '/sign-in')
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
