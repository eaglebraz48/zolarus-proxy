'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

type Lang = 'en' | 'pt' | 'es' | 'fr';

const T: Record<
  Lang,
  { open: string; subscribe: string; loading: string; signin: string }
> = {
  en: { open: 'Open price comparison', subscribe: 'Subscribe — $0.99/mo', loading: 'Loading…',    signin: 'Sign in required' },
  pt: { open: 'Abrir comparador de preços', subscribe: 'Assinar — US$ 0,99/mês', loading: 'Carregando…', signin: 'É preciso entrar' },
  es: { open: 'Abrir comparador de precios', subscribe: 'Suscribirse — US$ 0,99/mes', loading: 'Cargando…',  signin: 'Inicia sesión' },
  fr: { open: 'Ouvrir comparateur de prix', subscribe: 'S’abonner — 0,99 $/mois', loading: 'Chargement…', signin: 'Connexion requise' },
};

// If your compare page is nested (e.g. /shop/compare), change this to '/shop/compare'
const COMPARE_PATH = '/compare';

function detectLang(): Lang {
  try {
    const url = new URL(window.location.href);
    const qp = (url.searchParams.get('lang') || '').toLowerCase();
    const cookie = document.cookie.match(/(?:^|;)\s*zola_lang=([^;]+)/)?.[1]?.toLowerCase() || '';
    const stored = localStorage.getItem('z_pref_lang')?.toLowerCase() || '';
    const v = (qp || cookie || stored || 'en') as Lang;
    return (['en', 'pt', 'es', 'fr'].includes(v) ? v : 'en') as Lang;
  } catch {
    return 'en';
  }
}

function deriveMinMaxFromBudget(budget?: string | null) {
  if (!budget) return { min: '', max: '' };
  if (budget.includes('-')) {
    const [lo, hi] = budget.split('-');
    return { min: lo || '', max: typeof hi === 'undefined' ? '' : hi };
  }
  // single number => treat as "under X"
  return { min: '0', max: budget };
}

export default function ShopCTA({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { isActive, loading } = useSubscriptionStatus();

  // Hydration-safe lang resolution
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => {
    setLang(detectLang());
    setMounted(true);
  }, []);

  const [busy, setBusy] = useState(false);

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

  // Build a compare href that forwards current filters.
  const compareHref = useMemo(() => {
    if (!mounted) return '#';
    const url = new URL(window.location.href);
    const sp = url.searchParams;

    const forWhom = (sp.get('for') || '').trim();
    const occasion = (sp.get('occasion') || '').trim();
    const keywords = (sp.get('keywords') || '').trim();

    // Accept either ?budget=… or explicit ?min=…&max=…
    const budget = sp.get('budget');
    const explicitMin = (sp.get('min') || '').trim();
    const explicitMax = (sp.get('max') || '').trim();
    const { min, max } = explicitMin || explicitMax
      ? { min: explicitMin, max: explicitMax }
      : deriveMinMaxFromBudget(budget);

    const next = new URL(COMPARE_PATH, window.location.origin);
    const qp = next.searchParams;
    qp.set('lang', lang);
    if (forWhom) qp.set('for', forWhom);
    if (occasion) qp.set('occasion', occasion);
    if (keywords) qp.set('keywords', keywords);
    if (min) qp.set('min', min);
    if (max) qp.set('max', max);

    return `${next.pathname}?${qp.toString()}`;
  }, [mounted, lang]);

  // While hydrating/loading, show stable placeholder
  if (!mounted || loading) {
    return (
      <button style={{ ...common, background: '#e5e7eb', color: '#6b7280' }} disabled>
        {T[lang].loading}
      </button>
    );
  }

  if (isActive) {
    return (
      <a
        href={compareHref}
        style={{ ...common, background: '#059669', color: '#fff' }}
      >
        {T[lang].open}
      </a>
    );
  }

  async function startCheckout(e: React.MouseEvent) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
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
      try { json = await res.json(); } catch {}

      if (!res.ok) {
        const message = json?.error || `HTTP ${res.status}`;
        alert(`Checkout error: ${message}`);
        return;
      }
      if (!json.url) {
        alert('Checkout error: no URL returned');
        return;
      }

      try { localStorage.setItem('z_pref_lang', lang); } catch {}
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
