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
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        {children}
        <ChatWidget />
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

  // load session once
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email || null);
    })();
  }, []);

  // react to auth changes
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

  const hrefWithParams = (to: string) => {
    const params = new URLSearchParams(sp.toString());
    if (!params.get('lang')) params.set('lang', 'en');
    return { pathname: to, query: Object.fromEntries(params.entries()) };
  };

  // Gate links on welcome & email form pages only
  const isWelcomeOrSignIn = pathname === '/' || pathname === '/sign-in';

  const LinkOrDisabled = ({
    to,
    label,
    disabled,
  }: { to: string; label: string; disabled?: boolean }) => {
    if (disabled) {
      return (
        <span
          aria-disabled="true"
          title="Sign in to access"
          style={{ opacity: 0.45, pointerEvents: 'none', fontWeight: 700, color: '#0f172a' }}
        >
          {label}
        </span>
      );
    }
    return (
      <Link
        href={hrefWithParams(to)}
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

  // Brand behavior:
  // - On welcome/sign-in: acts like a normal link to "/"
  // - After that (dashboard/app pages): non-clickable blue word (prevents bouncing to sign-in)
  const Brand = isWelcomeOrSignIn ? (
    <Link
      href={hrefWithParams('/')}
      style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 800 }}
    >
      Zolarus
    </Link>
  ) : (
    <span
      aria-disabled="true"
      title="You're already in"
      style={{
        color: '#2563eb', // blue
        fontWeight: 800,
        pointerEvents: 'none',
        cursor: 'default',
      }}
    >
      Zolarus
    </span>
  );

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
        {Brand}

        <nav style={{ display: 'flex', gap: 16, marginLeft: 8 }}>
          <LinkOrDisabled to="/dashboard" label="Dashboard" disabled={isWelcomeOrSignIn} />
          <LinkOrDisabled to="/shop" label="Shop" disabled={isWelcomeOrSignIn} />
          <LinkOrDisabled to="/referrals" label="Refs" disabled={isWelcomeOrSignIn} />
          <LinkOrDisabled to="/reminders" label="Reminders" disabled={isWelcomeOrSignIn} />
          <LinkOrDisabled to="/profile" label="Profile" disabled={isWelcomeOrSignIn} />
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
              href={hrefWithParams('/sign-in')}
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
