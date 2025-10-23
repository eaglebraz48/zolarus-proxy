'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Lang = 'en' | 'pt' | 'es' | 'fr';
const LANGS: Lang[] = ['en', 'pt', 'es', 'fr'];
const isLang = (v: string | null): v is Lang => !!v && LANGS.includes(v as Lang);

const T: Record<Lang, {
  title: string;
  blurb: string;
  primary: string;
  alt1: string;
  alt2: string;
  back: string;
  note: string;
}> = {
  en: {
    title: 'Price comparison',
    blurb:
      'We’ll open retailer pages with your filters. Pick one below and compare current prices.',
    primary: 'Find on Amazon',
    alt1: 'Try Target',
    alt2: 'Try Walmart',
    back: 'Back to Shop',
    note: 'Results are based on your keywords; prices and availability can change.',
  },
  pt: {
    title: 'Comparador de preços',
    blurb:
      'Vamos abrir as páginas das lojas com seus filtros. Escolha abaixo e compare os preços.',
    primary: 'Ver na Amazon',
    alt1: 'Tentar na Target',
    alt2: 'Tentar na Walmart',
    back: 'Voltar ao Shop',
    note: 'Os resultados usam suas palavras-chave; preços e estoque podem mudar.',
  },
  es: {
    title: 'Comparación de precios',
    blurb:
      'Abriremos páginas de tiendas con tus filtros. Elige abajo y compara precios actuales.',
    primary: 'Ver en Amazon',
    alt1: 'Probar en Target',
    alt2: 'Probar en Walmart',
    back: 'Volver a Shop',
    note: 'Los resultados usan tus palabras clave; los precios pueden cambiar.',
  },
  fr: {
    title: 'Comparateur de prix',
    blurb:
      'Nous ouvrons les pages des boutiques avec vos filtres. Choisissez ci-dessous pour comparer.',
    primary: 'Voir sur Amazon',
    alt1: 'Essayer Target',
    alt2: 'Essayer Walmart',
    back: 'Retour à Shop',
    note: 'Résultats basés sur vos mots-clés ; prix et stocks évoluent.',
  },
};

function buildQuery(from: URLSearchParams) {
  // Normalize inputs we expect from /shop
  const who = (from.get('for') || '').trim();
  const occ = (from.get('occasion') || '').trim();
  const kw = (from.get('keywords') || '').trim();
  const min = (from.get('min') || '').trim();
  const max = (from.get('max') || '').trim();

  // Lightweight “query sentence” for retailer searches
  const parts = [kw, occ, who].filter(Boolean);
  const q = parts.join(' ').replace(/\s+/g, ' ').trim();

  return { q, min, max };
}

function amazonUrl(q: string) {
  // Simple Amazon search; you can append tag=&rh= for affiliates/filters later
  const u = new URL('https://www.amazon.com/s');
  if (q) u.searchParams.set('k', q);
  return u.toString();
}

function targetUrl(q: string) {
  const u = new URL('https://www.target.com/s');
  if (q) u.searchParams.set('searchTerm', q);
  return u.toString();
}

function walmartUrl(q: string) {
  const u = new URL('https://www.walmart.com/search');
  if (q) u.searchParams.set('q', q);
  return u.toString();
}

export default function ComparePage() {
  const sp = useSearchParams();

  const lang = (isLang(sp.get('lang')) ? (sp.get('lang') as Lang) : 'en') as Lang;
  const t = T[lang];
  const { q } = buildQuery(sp);

  // Keep language sticky for future navigations (no SSR branching)
  React.useEffect(() => {
    try {
      document.cookie = `zola_lang=${lang};path=/;max-age=31536000`;
      localStorage.setItem('z_pref_lang', lang);
    } catch {}
  }, [lang]);

  const capsule: React.CSSProperties = {
    display: 'inline-block',
    padding: '12px 16px',
    borderRadius: 10,
    fontWeight: 800,
    textDecoration: 'none',
    textAlign: 'center',
    width: '100%',
    maxWidth: 560,
    border: '2px solid #111827',
  };

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}>
      <div style={{ marginBottom: 12 }}>
        <Link
          href={`/shop?lang=${lang}`}
          style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}
        >
          ← {t.back}
        </Link>
      </div>

      <h1 style={{ fontWeight: 900, fontSize: 28, marginBottom: 8 }}>{t.title}</h1>
      <p style={{ color: '#374151', marginBottom: 16 }}>{t.blurb}</p>

      {/* Query preview (optional) */}
      {q && (
        <div
          style={{
            background: '#F3F4F6',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: '10px 12px',
            color: '#111827',
            marginBottom: 16,
            wordBreak: 'break-word',
          }}
        >
          <span style={{ fontWeight: 700, marginRight: 6 }}>Query:</span>
          {q}
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        <a
          href={amazonUrl(q)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...capsule,
            background: '#111827',
            color: '#fff',
            borderColor: '#111827',
          }}
        >
          {t.primary}
        </a>

        <a
          href={targetUrl(q)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...capsule, background: '#fff', color: '#111827' }}
        >
          {t.alt1}
        </a>

        <a
          href={walmartUrl(q)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...capsule, background: '#fff', color: '#111827' }}
        >
          {t.alt2}
        </a>
      </div>

      <p style={{ color: '#6B7280', fontSize: 13, marginTop: 16 }}>{t.note}</p>
    </div>
  );
}
