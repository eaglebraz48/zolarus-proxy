'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

type Lang = 'en' | 'pt' | 'es' | 'fr';

const T: Record<
  Lang,
  { open: string; subscribe: string; loading: string; signin: string }
> = {
  en: {
    open: 'Open price comparison',
    subscribe: 'Subscribe — $0.99/mo',
    loading: 'Loading…',
    signin: 'Sign in required',
  },
  pt: {
    open: 'Abrir comparador de preços',
    subscribe: 'Assinar — US$ 0,99/mês',
    loading: 'Carregando…',
    signin: 'É preciso entrar',
  },
  es: {
    open: 'Abrir comparador de precios',
    subscribe: 'Suscribirse — US$ 0,99/mes',
    loading: 'Cargando…',
    signin: 'Inicia sesión',
  },
  fr: {
    open: 'Ouvrir comparateur de prix',
    subscribe: 'S’abonner — 0,99 $/mois',
    loading: 'Chargement…',
    signin: 'Connexion requise',
  },
};

function detectLang(): Lang {
  try {
    const url = new URL(window.location.href);
    const qp = (url.searchParams.get('lang') || '').toLowerCase();
    const cookie =
      document.cookie.match(/(?:^|;)\s*zola_lang=([^;]+)/)?.[1]?.toLowerCase() ||
      '';
    const stored = localStorage.getItem('z_pref_lang')?.toLowerCase() || '';
    const v = (qp || cookie || stored || 'en') as Lang;
    return (['en', 'pt', 'es', 'fr'].includes(v) ? v : 'en') as Lang;
  } catch {
    return 'en';
  }
}

/** Persist the user's language preference immediately. */
function persistLang(lang: Lang) {
  try {
    // cookie: 90 days, SameSite=Lax, whole site
    document.cookie = `zola_lang=${lang}; Max-Age=${60 * 60 * 24 * 90}; Path=/; SameSite=Lax`;
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem('z_pref_lang', lang);
  } catch {
    /* ignore */
  }
}

export default function ShopCTA({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { isActive, loading } = useSubscriptionStatus();
  const [busy, setBusy] = useState(false);
  const [lang] = useState<Lang>(() => detectLang());

  // Optional nicety: if the URL is missing ?lang, add it once (no page reload)
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      if (!u.searchParams.get('lang')) {
        u.searchParams.set('lang', lang);
        window.history.replaceState(null, '', u.toString());
      }
    } catch {
      /* ignore */
    }
  }, [lang]);

  const common: React.CSSProperties = {
    borderRadius: 8,
    textDecoration: 'none',
    display: 'inline-block',
    fontWeight: 700,
    cursor: busy ? 'not-allowed' : 'pointer',
    padding: size === 'sm' ? '6px 10px' : '8px 12px',
    fontSize: size === 'sm' ? 13 : 14,
    opacity: busy ? 0.7 : 1,
  };

  if (loading) {
    return (
      <button style={{ ...common, background: '#e5e7eb', color: '#6b7280' }} disabled>
        {T[lang].loading}
      </button>
    );
  }

  if (isActive) {
    // Already subscribed: persist preference before navigating to /shop
    const onOpenClick = () => {
      persistLang(lang);
    };
    return (
      <a
        href={`/shop?open=compare&lang=${lang}`}
        onClick={onOpenClick}
        style={{ ...common, background: '#059669', color: '#fff' }}
      >
        {T[lang].open}
      </a>
    );
  }

  async function startCheckout(e: React.MouseEvent) {
    e.preventDefault();
    if (busy) return;

    // 🔑 Persist language *before* any async work or redirects.
    persistLang(lang);

    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Preserve language on sign-in redirect too
        window.location.href = `/sign-in?lang=${lang}`;
        return;
      }

      const base =
        process.env.NEXT_PUBLIC_FUNCTIONS_BASE ||
        (location.hostname === 'localhost'
          ? 'http://localhost:8888/.netlify/functions'
          : '/.netlify/functions');

      const res = await fetch(`${base}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, lang }),
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        /* ignore */
      }

      if (!res.ok) {
        const message = json?.error || `HTTP ${res.status}`;
        alert(`Checkout error: ${message}`);
        return;
      }

      if (!json.url) {
        alert('Checkout error: no URL returned');
        return;
      }

      // localStorage already set via persistLang; bounce to Stripe
      window.location.href = json.url;
    } catch (err: any) {
      alert(`Checkout error: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <a
      href="#subscribe"
      onClick={startCheckout}
      style={{ ...common, background: '#0f172a', color: '#fff' }}
    >
      {T[lang].subscribe}
    </a>
  );
}
