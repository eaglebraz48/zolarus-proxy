'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/* ------------------------------ i18n ------------------------------ */
type Lang = 'en' | 'pt' | 'es' | 'fr';
const LANGS: Lang[] = ['en', 'pt', 'es', 'fr'];
const isLang = (v: string | null): v is Lang => !!v && LANGS.includes(v as Lang);

const T: Record<
  Lang,
  {
    title: string;
    blurb: string;
    back: string;
    note: string;
    query: string;
    groups: { core: string; stretch: string };
    buttons: {
      amazon: string;
      walmart: string;
      target: string;
      wayfair: string;
      bestbuy: string;
      homedepot: string;
      shein: string;
      temu: string;
    };
  }
> = {
  en: {
    title: 'Price comparison',
    blurb:
      "We'll open retailer pages pre-filled with your search. Pick a store to compare current prices.",
    back: 'Back to Shop',
    note: 'Results are based on your keywords; prices and availability can change.',
    query: 'Query',
    groups: { core: 'Top stores', stretch: 'More stores' },
    buttons: {
      amazon: 'Find on Amazon',
      walmart: 'Try Walmart',
      target: 'Try Target',
      wayfair: 'Try Wayfair',
      bestbuy: 'Try Best Buy',
      homedepot: 'Try Home Depot',
      shein: 'Browse on Shein',
      temu: 'Browse on Temu',
    },
  },
  pt: {
    title: 'Comparador de preços',
    blurb:
      'Abriremos as páginas das lojas com sua busca preenchida. Escolha uma loja para comparar preços.',
    back: 'Voltar ao Shop',
    note: 'Os resultados usam suas palavras-chave; preços e estoque podem mudar.',
    query: 'Busca',
    groups: { core: 'Lojas principais', stretch: 'Mais lojas' },
    buttons: {
      amazon: 'Ver na Amazon',
      walmart: 'Tentar na Walmart',
      target: 'Tentar na Target',
      wayfair: 'Tentar na Wayfair',
      bestbuy: 'Tentar na Best Buy',
      homedepot: 'Tentar na Home Depot',
      shein: 'Ver na Shein',
      temu: 'Ver no Temu',
    },
  },
  es: {
    title: 'Comparación de precios',
    blurb:
      'Abriremos páginas de tiendas con tu búsqueda completa. Elige una tienda para comparar precios.',
    back: 'Volver a Shop',
    note: 'Los resultados usan tus palabras clave; los precios y la disponibilidad pueden cambiar.',
    query: 'Búsqueda',
    groups: { core: 'Tiendas principales', stretch: 'Más tiendas' },
    buttons: {
      amazon: 'Ver en Amazon',
      walmart: 'Probar en Walmart',
      target: 'Probar en Target',
      wayfair: 'Probar en Wayfair',
      bestbuy: 'Probar en Best Buy',
      homedepot: 'Probar en Home Depot',
      shein: 'Ver en Shein',
      temu: 'Ver en Temu',
    },
  },
  fr: {
    title: 'Comparateur de prix',
    blurb:
      'Nous ouvrons les pages des boutiques avec votre recherche préremplie. Choisissez un magasin pour comparer.',
    back: 'Retour à Shop',
    note: 'Résultats basés sur vos mots-clés ; prix et stocks peuvent évoluer.',
    query: 'Requête',
    groups: { core: 'Boutiques phares', stretch: 'Plus de boutiques' },
    buttons: {
      amazon: 'Voir sur Amazon',
      walmart: 'Essayer Walmart',
      target: 'Essayer Target',
      wayfair: 'Essayer Wayfair',
      bestbuy: 'Essayer Best Buy',
      homedepot: 'Essayer Home Depot',
      shein: 'Voir sur Shein',
      temu: 'Voir sur Temu',
    },
  },
};

/* --------------------------- query helpers --------------------------- */
// Build a clean query from /shop inputs
function buildQuery(from: URLSearchParams) {
  const who = (from.get('for') || '').trim();
  const occ = (from.get('occasion') || '').trim();
  const kw = (from.get('keywords') || '').trim();
  const min = (from.get('min') || '').trim();
  const max = (from.get('max') || '').trim();
  const parts = [kw, occ, who].filter(Boolean);
  const q = parts.join(' ').replace(/\s+/g, ' ').trim();
  return { q, min, max };
}

/* ------------------------- retailer URL builders ------------------------- */
/** NOTE: Add affiliate params later (e.g., tag=, campid=) once programs are live. */

// Amazon
function urlAmazon(q: string) {
  const u = new URL('https://www.amazon.com/s');
  if (q) u.searchParams.set('k', q);
  return u.toString();
}

// Walmart
function urlWalmart(q: string) {
  const u = new URL('https://www.walmart.com/search');
  if (q) u.searchParams.set('q', q);
  return u.toString();
}

// Target
function urlTarget(q: string) {
  const u = new URL('https://www.target.com/s');
  if (q) u.searchParams.set('searchTerm', q);
  return u.toString();
}

// Wayfair (furniture / home)
function urlWayfair(q: string) {
  const u = new URL('https://www.wayfair.com/keyword.php');
  if (q) u.searchParams.set('keyword', q);
  return u.toString();
}

// Best Buy (electronics)
function urlBestBuy(q: string) {
  const u = new URL('https://www.bestbuy.com/site/searchpage.jsp');
  if (q) u.searchParams.set('st', q);
  return u.toString();
}

// Home Depot (home improvement)
function urlHomeDepot(q: string) {
  const u = new URL('https://www.homedepot.com/s/');
  // Home Depot accepts /s/<q> path; keep space-to-%20 via encodeURIComponent
  return q ? `https://www.homedepot.com/s/${encodeURIComponent(q)}` : u.toString();
}

// Shein (fashion / marketplace)
function urlShein(q: string) {
  const u = new URL('https://us.shein.com/pse/searchresult');
  if (q) u.searchParams.set('keyword', q);
  return u.toString();
}

// Temu (budget marketplace)
function urlTemu(q: string) {
  const u = new URL('https://www.temu.com/search_result.html');
  if (q) u.searchParams.set('search_key', q);
  return u.toString();
}

/* ------------------------------- UI ------------------------------- */

export default function ComparePage() {
  const sp = useSearchParams();

  const lang = (isLang(sp.get('lang')) ? (sp.get('lang') as Lang) : 'en') as Lang;
  const t = T[lang];
  const { q } = buildQuery(sp);

  // Persist lang for later visits
  React.useEffect(() => {
    try {
      document.cookie = `zola_lang=${lang};path=/;max-age=31536000`;
      localStorage.setItem('z_pref_lang', lang);
    } catch {}
  }, [lang]);

  const section: React.CSSProperties = { marginTop: 18, marginBottom: 8 };
  const grid: React.CSSProperties = {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    maxWidth: 560,
  };
  const btnBase: React.CSSProperties = {
    display: 'inline-block',
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    fontWeight: 800,
    textDecoration: 'none',
    textAlign: 'center',
    border: '2px solid #111827',
    color: '#111827',
    background: '#fff',
  };
  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    background: '#111827',
    color: '#fff',
  };
  const subnote: React.CSSProperties = { color: '#6B7280', fontSize: 13, marginTop: 16 };

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
          <span style={{ fontWeight: 700, marginRight: 6 }}>{t.query}:</span>
          {q}
        </div>
      )}

      {/* Core stores */}
      <h3 style={section}>{t.groups.core}</h3>
      <div style={grid}>
        <a href={urlAmazon(q)} target="_blank" rel="noopener noreferrer" style={btnPrimary}>
          {t.buttons.amazon}
        </a>
        <a href={urlTarget(q)} target="_blank" rel="noopener noreferrer" style={btnBase}>
          {t.buttons.target}
        </a>
        <a href={urlWalmart(q)} target="_blank" rel="noopener noreferrer" style={btnBase}>
          {t.buttons.walmart}
        </a>
        <a href={urlWayfair(q)} target="_blank" rel="noopener noreferrer" style={btnBase}>
          {t.buttons.wayfair}
        </a>
        <a href={urlBestBuy(q)} target="_blank" rel="noopener noreferrer" style={btnBase}>
          {t.buttons.bestbuy}
        </a>
        <a href={urlHomeDepot(q)} target="_blank" rel="noopener noreferrer" style={btnBase}>
          {t.buttons.homedepot}
        </a>
      </div>

      {/* Stretch stores (enable/disable as you like) */}
      <h3 style={section}>{t.groups.stretch}</h3>
      <div style={grid}>
        <a href={urlShein(q)} target="_blank" rel="noopener noreferrer" style={btnBase}>
          {t.buttons.shein}
        </a>
        <a href={urlTemu(q)} target="_blank" rel="noopener noreferrer" style={btnBase}>
          {t.buttons.temu}
        </a>
      </div>

      <p style={subnote}>{t.note}</p>
    </div>
  );
}
