'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { buildAffiliateSearchUrl } from '@/lib/amazon';

type Lang = 'en' | 'pt' | 'es' | 'fr';
const LANGS: Lang[] = ['en', 'pt', 'es', 'fr'];
const isLang = (v: string | null): v is Lang => !!v && LANGS.includes(v as Lang);

const T: Record<
  Lang,
  {
    title: string;
    blurb: string;
    primary: string;
    alt1: string;
    alt2: string;
    alt3: string;
    alt4: string;
    alt5: string;
    alt6: string;
    alt7: string;           // NEW: Temu
    moreTitle: string;
    back: string;
    note: string;
    query: string;
  }
> = {
  en: {
    title: 'Price comparison',
    blurb:
      'We’ll open retailer pages with your filters. Pick one below and compare current prices.',
    primary: 'Find on Amazon',
    alt1: 'Try Target',
    alt2: 'Try Walmart',
    alt3: 'Try Wayfair',
    alt4: 'Try Best Buy',
    alt5: 'Try Home Depot',
    alt6: 'View on Shein',
    alt7: 'View on Temu',
    moreTitle: 'More stores',
    back: 'Back to Shop',
    note: 'Results are based on your keywords; prices and availability can change.',
    query: 'Query:',
  },
  pt: {
    title: 'Comparador de preços',
    blurb:
      'Abriremos as páginas das lojas com sua busca preenchida. Escolha uma loja para comparar preços.',
    primary: 'Ver na Amazon',
    alt1: 'Tentar na Target',
    alt2: 'Tentar na Walmart',
    alt3: 'Tentar na Wayfair',
    alt4: 'Tentar na Best Buy',
    alt5: 'Tentar na Home Depot',
    alt6: 'Ver na Shein',
    alt7: 'Ver na Temu',
    moreTitle: 'Mais lojas',
    back: 'Voltar ao Shop',
    note: 'Os resultados usam suas palavras-chave; preços e estoque podem mudar.',
    query: 'Busca:',
  },
  es: {
    title: 'Comparación de precios',
    blurb:
      'Abriremos páginas de tiendas con tu búsqueda. Elige una tienda para comparar precios.',
    primary: 'Ver en Amazon',
    alt1: 'Probar en Target',
    alt2: 'Probar en Walmart',
    alt3: 'Probar en Wayfair',
    alt4: 'Probar en Best Buy',
    alt5: 'Probar en Home Depot',
    alt6: 'Ver en Shein',
    alt7: 'Ver en Temu',
    moreTitle: 'Más tiendas',
    back: 'Volver a Shop',
    note: 'Los resultados usan tus palabras clave; los precios pueden cambiar.',
    query: 'Consulta:',
  },
  fr: {
    title: 'Comparateur de prix',
    blurb:
      'Nous ouvrons les pages des boutiques avec votre recherche. Choisissez une boutique pour comparer.',
    primary: 'Voir sur Amazon',
    alt1: 'Essayer Target',
    alt2: 'Essayer Walmart',
    alt3: 'Essayer Wayfair',
    alt4: 'Essayer Best Buy',
    alt5: 'Essayer Home Depot',
    alt6: 'Voir sur Shein',
    alt7: 'Voir sur Temu',
    moreTitle: 'Plus de boutiques',
    back: 'Retour à Shop',
    note: 'Résultats basés sur vos mots-clés ; prix et stocks évoluent.',
    query: 'Requête :',
  },
};

// ---------- query composition & translation ----------

function buildQueryParts(sp: URLSearchParams) {
  const who = (sp.get('for') || '').trim();
  const occ = (sp.get('occasion') || '').trim();
  const kw = (sp.get('keywords') || '').trim();
  const min = (sp.get('min') || '').trim();
  const max = (sp.get('max') || '').trim();

  const parts = [kw, occ, who].filter(Boolean);

  // Price-range hint (Amazon parses "price:50-100"; others ignore unknown tokens harmlessly)
  if (min && max) parts.push(`price:${min}-${max}`);
  else if (min && !max) parts.push(`price:${min}-`);
  else if (!min && max) parts.push(`under ${max}`);

  const raw = parts.join(' ').replace(/\s+/g, ' ').trim();
  return { raw, min, max };
}

/** minimal dictionary for frequent retail/gifting words */
const MINI: Record<string, string> = {
  // PT
  namorado: 'boyfriend', namorada: 'girlfriend', marido: 'husband', esposa: 'wife',
  mae: 'mom', mãe: 'mom', aniversario: 'birthday', aniversário: 'birthday',
  casamento: 'wedding', formatura: 'graduation', academia: 'gym', perfume: 'perfume',
  relogio: 'watch', relógio: 'watch', ternos: 'suits', roupa: 'clothes',

  // ES
  novio: 'boyfriend', novia: 'girlfriend', esposo: 'husband', esposa_es: 'wife',
  mama: 'mom', mamá: 'mom', cumpleaños: 'birthday', boda: 'wedding',
  graduación: 'graduation', gimnasio: 'gym', reloj: 'watch', trajes: 'suits',

  // FR
  'petit ami': 'boyfriend', 'petite amie': 'girlfriend',
  mari: 'husband', femme: 'wife', maman: 'mom', anniversaire: 'birthday',
  mariage: 'wedding', diplôme: 'graduation', sport: 'gym', parfum: 'perfume',
  montre: 'watch', costumes: 'suits',
};

function normalizeAccents(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function toEnglish(lang: Lang, text: string) {
  if (!text || lang === 'en') return text;

  let s = normalizeAccents(text.toLowerCase());

  // phrase-level first
  s = s.replace(/\bpetite?\s+amie?\b/g, (m) => (m.includes('petite') ? 'girlfriend' : 'boyfriend'));

  // token map
  s = s
    .split(/\s+/)
    .map((w) => {
      if (lang === 'es' && w === 'esposa') return 'wife';
      const hit = MINI[w];
      return hit || w;
    })
    .join(' ');

  return s;
}

// ---------- retailer URL builders ----------

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

function wayfairUrl(q: string) {
  const u = new URL('https://www.wayfair.com/keyword.php');
  if (q) u.searchParams.set('keyword', q);
  return u.toString();
}

function bestBuyUrl(q: string) {
  const u = new URL('https://www.bestbuy.com/site/searchpage.jsp');
  if (q) u.searchParams.set('st', q);
  return u.toString();
}

function homeDepotUrl(q: string) {
  // HD mostly uses /s/<query>; keep query param fallback for safety
  const base = 'https://www.homedepot.com/s/';
  return q ? `${base}${encodeURIComponent(q)}` : base;
}

function sheinUrl(q: string) {
  const u = new URL('https://us.shein.com/pse/');
  if (q) u.searchParams.set('src_query', q);
  return u.toString();
}

function temuUrl(q: string) {
  const u = new URL('https://www.temu.com/search_result.html');
  if (q) u.searchParams.set('keyword', q);
  return u.toString();
}

// ---------- page ----------

export default function ComparePage() {
  const sp = useSearchParams();
  const lang = (isLang(sp.get('lang')) ? (sp.get('lang') as Lang) : 'en') as Lang;
  const t = T[lang];

  // compose & translate query
  const { raw } = buildQueryParts(sp);
  const qEn = toEnglish(lang, raw);

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

  const sectionTitle: React.CSSProperties = {
    fontWeight: 800,
    marginTop: 18,
    marginBottom: 8,
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

      {qEn && (
        <div
          style={{
            background: '#F3F4F6',
            border: '1px solid '#E5E7EB',
            borderRadius: 8,
            padding: '10px 12px',
            color: '#111827',
            marginBottom: 16,
            wordBreak: 'break-word',
          }}
        >
          <span style={{ fontWeight: 700, marginRight: 6 }}>{t.query}</span>
          {qEn}
        </div>
      )}

      {/* Primary stores */}
      <div style={{ display: 'grid', gap: 12 }}>
        {/* AMAZON with AFFILIATE TAG + translated query */}
        <a
          href={buildAffiliateSearchUrl({ q: qEn || '', lang })}
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

        <a href={targetUrl(qEn)} target="_blank" rel="noopener noreferrer" style={{ ...capsule, background: '#fff', color: '#111827' }}>
          {t.alt1}
        </a>

        <a href={walmartUrl(qEn)} target="_blank" rel="noopener noreferrer" style={{ ...capsule, background: '#fff', color: '#111827' }}>
          {t.alt2}
        </a>

        <a href={wayfairUrl(qEn)} target="_blank" rel="noopener noreferrer" style={{ ...capsule, background: '#fff', color: '#111827' }}>
          {t.alt3}
        </a>

        <a href={bestBuyUrl(qEn)} target="_blank" rel="noopener noreferrer" style={{ ...capsule, background: '#fff', color: '#111827' }}>
          {t.alt4}
        </a>

        <a href={homeDepotUrl(qEn)} target="_blank" rel="noopener noreferrer" style={{ ...capsule, background: '#fff', color: '#111827' }}>
          {t.alt5}
        </a>
      </div>

      <h3 style={sectionTitle}>{t.moreTitle}</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        <a href={sheinUrl(qEn)} target="_blank" rel="noopener noreferrer" style={{ ...capsule, background: '#fff', color: '#111827' }}>
          {t.alt6}
        </a>
        <a href={temuUrl(qEn)} target="_blank" rel="noopener noreferrer" style={{ ...capsule, background: '#fff', color: '#111827' }}>
          {t.alt7}
        </a>
      </div>

      <p style={{ color: '#6B7280', fontSize: 13, marginTop: 16 }}>{t.note}</p>
    </div>
  );
}
