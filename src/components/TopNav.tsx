'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const LANGUAGES = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
  fr: 'Français',
};

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const currentLang = sp.get('lang') || 'en';

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    const params = new URLSearchParams(sp.toString());
    params.set('lang', newLang);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(`/?lang=${currentLang}`);
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <nav style={{ display: 'flex', gap: 20, fontWeight: 700 }}>
        <Link href={{ pathname: '/', query: { lang: currentLang } }}>Zolarus</Link>
        <Link href={{ pathname: '/dashboard', query: { lang: currentLang } }}>Dashboard</Link>
        <Link href={{ pathname: '/shop', query: { lang: currentLang } }}>Shop</Link>
        <Link href={{ pathname: '/explore', query: { lang: currentLang } }}>Explore gifts</Link>
        <Link href={{ pathname: '/refs', query: { lang: currentLang } }}>Refs</Link>
        <Link href={{ pathname: '/reminders', query: { lang: currentLang } }}>Reminders</Link>
        <Link href={{ pathname: '/profile', query: { lang: currentLang } }}>Profile</Link>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <select value={currentLang} onChange={handleLangChange}>
          {Object.entries(LANGUAGES).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>

        {session ? (
          <button
            onClick={handleSignOut}
            style={{
              background: 'none',
              border: 'none',
              color: '#1e293b',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            Sign out
          </button>
        ) : (
          <Link
            href={{ pathname: '/sign-in', query: { lang: currentLang } }}
            style={{ fontWeight: 700 }}
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
