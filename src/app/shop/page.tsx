// HERE IT IS
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type Lang = 'en' | 'pt' | 'es' | 'fr';
const pick = (lang: Lang, obj: Record<string, string>) => obj[lang] ?? obj.en;

// Amazon link builder with affiliate tag + sturdy price handling
function buildAmazonUrl(args: {
  forWhom?: string;
  occasion?: string;
  keywords?: string;
  min?: string;
  max?: string;
}) {
  const tag = 'mateussousa-20';

  const parts: string[] = [];
  if (args.forWhom) parts.push(`for ${args.forWhom}`);
  if (args.occasion) parts.push(args.occasion);
  if (args.keywords) parts.push(args.keywords);

  if (args.min && args.max) parts.push(`price:${args.min}-${args.max}`);
  else if (args.min && !args.max) parts.push(`price:${args.min}-`);
  else if (!args.min && args.max) parts.push(`under ${args.max}`);

  const q = encodeURIComponent(parts.join(' ').replace(/\s+/g, ' ').trim());
  return `https://www.amazon.com/s?k=${q}&tag=${encodeURIComponent(tag)}`;
}

export default function ShopPage() {
  const sp = useSearchParams();
  const router = useRouter();

  // language passthrough
  const lang = ((sp.get('lang') || 'en').toLowerCase() as Lang) ?? 'en';
  const withLang = (path: string) =>
    `${path}${path.includes('?') ? '&' : '?'}lang=${encodeURIComponent(lang)}`;

  // i18n strings
  const txt = {
    title: pick(lang, { en: 'Zolarus', pt: 'Zolarus', es: 'Zolarus', fr: 'Zolarus' }),
    h2: pick(lang, {
      en: "Let's get some ideas and shop now at Amazon!",
      pt: 'Vamos buscar ideias e comprar agora na Amazon!',
      es: '¡Busquemos ideas y compremos ahora en Amazon!',
      fr: 'Trouvons des idées et achetons maintenant sur Amazon !',
    }),
    sub: pick(lang, {
      en: 'Open Amazon with your selected ideas below.',
      pt: 'Abra a Amazon com as ideias que você selecionar abaixo.',
      es: 'Abre Amazon con las ideas que selecciones abajo.',
      fr: 'Ouvrez Amazon avec les idées sélectionnées ci-dessous.',
    }),
    compare: pick(lang, {
      en: 'Compare prices across stores — $0.99/month subscription',
      pt: 'Compare preços em várias lojas — assinatura de US$ 0,99/mês',
      es: 'Compara precios en varias tiendas — suscripción de US$ 0,99/mes',
      fr: 'Comparez les prix entre magasins — abonnement à 0,99 $/mois',
    }),
    subscribeLink: pick(lang, { en: 'Subscribe', pt: 'Assinar', es: 'Suscribirse', fr: "S'abonner" }),
    phFor: pick(lang, {
      en: 'for whom (e.g., boyfriend, girlfriend, husband, wife, mom)',
      pt: 'para quem (ex.: namorado, namorada, marido, esposa, mãe)',
      es: 'para quién (p. ej., novio, novia, esposo, esposa, mamá)',
      fr: 'pour qui (ex. : petit ami, conjointe, mari, épouse, maman)',
    }),
    phOccasion: pick(lang, {
      en: 'occasion (e.g., birthday, anniversary, wedding, graduation)',
      pt: 'ocasião (ex.: aniversário, aniversário de namoro, casamento, formatura)',
      es: 'ocasión (p. ej., cumpleaños, aniversario, boda, graduación)',
      fr: 'occasion (ex. : anniversaire, fête, mariage, remise de diplôme)',
    }),
    phKeywords: pick(lang, {
      en: 'keywords (e.g., gym, perfume, watch)',
      pt: 'palavras-chave (ex.: academia, perfume, relógio)',
      es: 'palabras clave (p. ej., gym, perfume, reloj)',
      fr: 'mots-clés (ex. : sport, parfum, montre)',
    }),
    phMin: pick(lang, { en: 'min', pt: 'mín', es: 'mín', fr: 'min' }),
    phMax: pick(lang, { en: 'max', pt: 'máx', es: 'máx', fr: 'max' }),
    btnIdeas: pick(lang, { en: 'Get ideas', pt: 'Ver ideias', es: 'Ver ideas', fr: 'Voir des idées' }),
    btnTry: pick(lang, { en: 'Try new ideas', pt: 'Tentar novas ideias', es: 'Probar nuevas ideas', fr: 'Essayer d’autres idées' }),
    note: pick(lang, {
      en: "Don’t see this page in your language on Amazon? Most browsers can translate: right-click → Translate.",
      pt: 'Não vê esta página no seu idioma na Amazon? A maioria dos navegadores traduz: clique direito → Traduzir.',
      es: '¿No ves esta página en tu idioma en Amazon? La mayoría de los navegadores traducen: clic derecho → Traducir.',
      fr: 'Vous ne voyez pas cette page en français sur Amazon ? La plupart des navigateurs traduisent : clic droit → Traduire.',
    }),
    secCore: pick(lang, { en: 'Core idea', pt: 'Ideia principal', es: 'Idea principal', fr: 'Idée principale' }),
    secAcc: pick(lang, { en: 'Accessories', pt: 'Acessórios', es: 'Accesorios', fr: 'Accessoires' }),
    secPop: pick(lang, {
      en: 'Popular — top sold (last 30 days)',
      pt: 'Popular — mais vendidos (últimos 30 dias)',
      es: 'Popular — más vendidos (últimos 30 días)',
      fr: 'Populaire — meilleures ventes (30 derniers jours)',
    }),
    secSale: pick(lang, { en: 'On sale', pt: 'Em promoção', es: 'En oferta', fr: 'En promotion' }),
    linkOpen: pick(lang, { en: 'Open on Amazon', pt: 'Abrir na Amazon', es: 'Abrir en Amazon', fr: 'Ouvrir sur Amazon' }),
    linkMore: pick(lang, {
      en: 'See more on my Amazon page',
      pt: 'Ver mais na minha página da Amazon',
      es: 'Ver más en mi página de Amazon',
      fr: 'Voir plus sur ma page Amazon',
    }),
  };

  const [forWhom, setForWhom] = useState('');
  const [occasion, setOccasion] = useState('');
  const [keywords, setKeywords] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');

  // Fresh flow + URL hydration
  useEffect(() => {
    const isFresh = sp.get('fresh') === '1';

    if (isFresh) {
      setForWhom('');
      setOccasion('');
      setKeywords('');
      setMin('');
      setMax('');
      router.replace(withLang('/shop')); // scrub ?fresh=1
      return;
    }

    const urlFor = sp.get('for') ?? '';
    const urlOccasion = sp.get('occasion') ?? '';
    const urlKeywords = sp.get('keywords') ?? '';
    const urlBudget = sp.get('budget') ?? '';

    setForWhom(urlFor);
    setOccasion(urlOccasion);
    setKeywords(urlKeywords);

    if (!urlBudget) {
      setMin(''); setMax('');
    } else if (urlBudget.includes('-')) {
      const [lo, hi] = urlBudget.split('-');
      setMin(lo || '');
      setMax(typeof hi === 'undefined' ? '' : hi);
    } else {
      setMin('0'); setMax(urlBudget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  // NEW: auto-reset URL when all inputs are cleared (instant gray-out already handled by hasFilters)
  useEffect(() => {
    const allEmpty = !forWhom && !occasion && !keywords && !min && !max;
    if (!allEmpty) return;

    // if URL still has any filter params, strip them to a clean state
    const hasAnyParams = sp.get('for') || sp.get('occasion') || sp.get('keywords') || sp.get('budget');
    if (hasAnyParams) {
      router.replace(withLang('/shop'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forWhom, occasion, keywords, min, max]);

  // ✅ NEW: if coming back from Stripe, snap to stored language
  useEffect(() => {
    if (sp.get('thanks') === 'sub') {
      try {
        const stored = localStorage.getItem('z_pref_lang');
        if (stored && stored !== lang) {
          router.replace(`/shop?thanks=sub&lang=${encodeURIComponent(stored)}`);
        }
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  const hasFilters = useMemo(
    () => Boolean((forWhom || occasion || keywords || min || max).trim?.() ?? (forWhom || occasion || keywords || min || max)),
    [forWhom, occasion, keywords, min, max]
  );

  const amazonUrl = useMemo(
    () => (hasFilters ? buildAmazonUrl({ forWhom, occasion, keywords, min: min || undefined, max: max || undefined }) : '#'),
    [hasFilters, forWhom, occasion, keywords, min, max]
  );

  function pushShareableUrl() {
    const p = new URLSearchParams();
    if (forWhom) p.set('for', forWhom);
    if (occasion) p.set('occasion', occasion);
    if (keywords) p.set('keywords', keywords);
    if (min && max) p.set('budget', `${min}-${max}`);
    else if (min && !max) p.set('budget', `${min}-`);
    else if (!min && max) p.set('budget', `0-${max}`);
    router.push(withLang(`/shop?${p.toString()}`));
  }

  // hard refresh to a clean state
  function refreshIdeas() {
    router.push(withLang('/shop?fresh=1'));
  }

  // ✅ NEW: language-preserving Subscribe link
  const stripeBase = 'https://buy.stripe.com/bJeeV563U5yyaJ15uMfAc00';
  const subscribeHref = `${stripeBase}?client_reference_id=lang:${encodeURIComponent(lang)}`;
  function onSubscribeClick() {
    try {
      localStorage.setItem('z_pref_lang', lang);
    } catch { /* ignore */ }
  }

  return (
    <main style={{ maxWidth: 980, margin: '32px auto', padding: '0 16px' }}>
      <h1>{txt.title}</h1>
      <h2 style={{ color: '#d97706', fontWeight: 700 }}>{txt.h2}</h2>

      {/* Compare line + subscription link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <p style={{ marginTop: 6, color: '#374151', fontWeight: 500, marginBottom: 0 }}>{txt.compare}</p>
        <a
          href={subscribeHref}        // ← was the fixed Stripe link; now includes client_reference_id
          onClick={onSubscribeClick}  // ← remember current lang before leaving
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: '#0f172a', color: '#fff', padding: '4px 10px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}
        >
          {txt.subscribeLink}
        </a>
      </div>

      <p>{txt.sub}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2.2fr 100px 100px auto', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <input value={forWhom} onChange={(e) => setForWhom(e.target.value)} placeholder={txt.phFor} aria-label="for whom" />
        <input value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder={txt.phOccasion} aria-label="occasion" />
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder={txt.phKeywords} aria-label="keywords" />
        <input value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} placeholder={txt.phMin} aria-label="min price" inputMode="numeric" />
        <input value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} placeholder={txt.phMax} aria-label="max price" inputMode="numeric" />

        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={hasFilters ? amazonUrl : '#'}
            target={hasFilters ? '_blank' : undefined}
            rel={hasFilters ? 'noopener noreferrer' : undefined}
            aria-disabled={!hasFilters}
            style={{
              background: hasFilters ? '#f59e0b' : '#e5e7eb',
              color: hasFilters ? '#fff' : '#9ca3af',
              padding: '8px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              pointerEvents: hasFilters ? 'auto' : 'none',
            }}
          >
            {txt.btnIdeas}
          </a>
          <button
            onClick={refreshIdeas}
            style={{ background: '#0f172a', color: '#fff', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
          >
            {txt.btnTry}
          </button>
        </div>
      </div>

      <p style={{ marginTop: 10 }}>{txt.note}</p>

      {hasFilters && (
        <>
          <h3 style={{ marginTop: 24 }}>{txt.secCore}</h3>
          <p>
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer">{txt.linkOpen}</a>{' '}
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer">{txt.linkMore}</a>
          </p>

          <h3>{txt.secAcc}</h3>
          <p>
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer">{txt.linkOpen}</a>{' '}
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer">{txt.linkMore}</a>
          </p>

          <h3>{txt.secPop}</h3>
          <p>
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer">{txt.linkOpen}</a>{' '}
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer">{txt.linkMore}</a>
          </p>

          <h3>{txt.secSale}</h3>
          <p>
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer">{txt.linkOpen}</a>{' '}
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer">{txt.linkMore}</a>
          </p>
        </>
      )}
    </main>
  );
}
