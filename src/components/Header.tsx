// src/components/header.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BagIcon from '@/components/icons/Bag';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'pt' | 'es' | 'fr';
const LABELS = {
  shop: { en: 'Shop', pt: 'Loja', es: 'Tienda', fr: 'Boutique' },
  dashboard: { en: 'Dashboard', pt: 'Painel', es: 'Panel', fr: 'Tableau de bord' },
  refs: { en: 'Refs', pt: 'Indicações', es: 'Referidos', fr: 'Parrainages' },
  reminders: { en: 'Reminders', pt: 'Lembretes', es: 'Recordatorios', fr: 'Rappels' },
  profile: { en: 'Profile', pt: 'Perfil', es: 'Perfil', fr: 'Profil' },
  signin: { en: 'Sign in', pt: 'Entrar', es: 'Iniciar sesión', fr: 'Se connecter' },
  signout: { en: 'Sign out', pt: 'Sair', es: 'Cerrar sesión', fr: 'Se déconnecter' },
} as const;

function useLang(sp: ReturnType<typeof useSearchParams>): Lang {
  const fromQuery = (sp.get('lang') as Lang | null) ?? null;
  const fromCookie = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const m = document.cookie.match(/(?:^|;)\s*zola_lang=([^;]+)/);
    return (m?.[1] as Lang | undefined) ?? null;
  }, []);
  const val = fromQuery || fromCookie || 'en';
  return (['en', 'pt', 'es', 'fr'].includes(val) ? val : 'en') as Lang;
}

function setLangCookie(lang: Lang) {
  const oneYear = 365 * 24 * 60 * 60;
  document.cookie = `zola_lang=${lang}; path=/; max-age=${oneYear}`;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const lang = useLang(sp);

  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (on) setAuthed(!!data.session);
    })();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s);
    });
    return () => { on = false; subscription?.unsubscribe(); };
  }, []);

  const hideProtected = pathname === '/' || pathname?.startsWith('/sign-in');

  const withLang = (href: string) => {
    const url = new URL(href, 'http://x');
    if (!url.searchParams.get('lang')) url.searchParams.set('lang', lang);
    return url.pathname + (url.search || '');
  };

  const handleLangChange = (next: Lang) => {
    setLangCookie(next);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    router.replace(url.pathname + (url.search || ''));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push(withLang('/'));
  };

  return (
    <header style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
      <nav style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Link href={withLang('/')} style={{ fontWeight: 800, fontSize: 22, color: '#2563eb', textDecoration: 'none' }}>
  Zolarus
</Link>


        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {!hideProtected && (
            <>
              <Link href={withLang('/dashboard')} style={navLink}>{LABELS.dashboard[lang]}</Link>
             <Link href={withLang('/shop')} style={{ ...navLink, display: 'flex', alignItems: 'center', gap: 6 }}>
  <BagIcon size={18} color="#4338CA" />
  <span>{LABELS.shop[lang]}</span>
</Link>

              <Link href={withLang('/referrals')} style={navLink}>{LABELS.refs[lang]}</Link>
              <Link href={withLang('/reminders')} style={navLink}>{LABELS.reminders[lang]}</Link>
              <Link href={withLang('/profile')} style={navLink}>{LABELS.profile[lang]}</Link>
            </>
          )}

          {authed ? (
            <button onClick={signOut} style={signOutBtn}>
              {LABELS.signout[lang]}
            </button>
          ) : (
            <Link href={withLang('/sign-in')} style={signInBtn}>
              {LABELS.signin[lang]}
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>Language</span>
            <select
              value={lang}
              onChange={(e) => handleLangChange(e.target.value as Lang)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff' }}
              aria-label="Language"
            >
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>
      </nav>
    </header>
  );
}

const navLink: React.CSSProperties = {
  color: '#1f2937',
  textDecoration: 'none',
  fontWeight: 500,
};

const signInBtn: React.CSSProperties = {
  marginLeft: 8,
  backgroundColor: '#111827',
  color: '#fff',
  borderRadius: 8,
  padding: '8px 12px',
  textDecoration: 'none',
  fontWeight: 700,
};

const signOutBtn: React.CSSProperties = {
  marginLeft: 8,
  backgroundColor: '#111827',
  color: '#fff',
  borderRadius: 8,
  padding: '8px 12px',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
};
