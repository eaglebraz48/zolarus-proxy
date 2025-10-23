'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ShopCTA from '@/components/ShopCTA';

type Lang = 'en' | 'pt' | 'es' | 'fr';
const pick = (lang: Lang, obj: Record<string, string>) => obj[lang] ?? obj.en;

// Amazon link builder
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

  const lang = ((sp.get('lang') || 'en').toLowerCase() as Lang) ?? 'en';
  const withLang = (path: string) =>
    `${path}${path.includes('?') ? '&' : '?'}lang=${encodeURIComponent(lang)}`;

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
    phFor: pick(lang, {
      en: 'for whom (e.g., boyfriend, girlfriend, husband, wife, mom)',
      pt: 'para quem (ex.: namorado, namorada, marido, esposa, mãe)',
      es: 'para quién (p. ej., novio, novia, esposo, esposa, mamá)',
      fr: 'pour qui (ex. : petit ami, conjointe, mari, épouse, maman)',
    }),
    phOccasion: pick(lang, {
      en: 'occasion (e.g., birthday, anniversary, wedding, graduation)',
      pt: 'ocasião (ex.: aniversário, casamento, formatura)',
      es: 'ocasión (p. ej., cumpleaños, aniversario, boda, graduación)',
      fr: 'occasion (ex. : anniversaire, mariage, remise de diplôme)',
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
      pt: 'Não vê esta página no seu idioma na Amazon? Clique direito → Traduzir.',
      es: '¿No ves esta página en tu idioma en Amazon? Clic derecho → Traducir.',
      fr: 'Vous ne voyez pas cette page en français sur Amazon ? Clic droit → Traduire.',
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
    // Live-update tip
    liveTipTitle: pick(lang, {
      en: 'Live-updating links',
      pt: 'Links atualizam ao digitar',
      es: 'Enlaces se actualizan al escribir',
      fr: 'Liens mis à jour en direct',
    }),
    liveTipBody: pick(lang, {
      en: 'Type keywords like “mom birthday dress” — the store links below refresh instantly to use your search.',
      pt: 'Digite palavras como “vestido aniversário mãe” — os links das lojas abaixo se atualizam na hora com sua busca.',
      es: 'Escribe palabras como “vestido cumpleaños mamá” — los enlaces de tiendas abajo se actualizan al instante con tu búsqueda.',
      fr: 'Tapez des mots-clés comme « robe anniversaire maman » — les liens des boutiques ci-dessous se mettent à jour instantanément.',
    }),
    liveTipDismiss: pick(lang, { en: 'Got it', pt: 'Entendi', es: 'Entendido', fr: 'Compris' }),
    liveSRUpdated: pick(lang, {
      en: 'Links updated for your search.',
      pt: 'Links atualizados para sua busca.',
      es: 'Enlaces actualizados para tu búsqueda.',
      fr: 'Liens mis à jour pour votre recherche.',
    }),
  };

  const [forWhom, setForWhom] = useState('');
  const [occasion, setOccasion] = useState('');
  const [keywords, setKeywords] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');

  // Tip + SR-announce
  const [showLiveTip, setShowLiveTip] = useState(true);
  const [announce, setAnnounce] = useState('');

  // Initialize from URL
  useEffect(() => {
    const isFresh = sp.get('fresh') === '1';
    if (isFresh) {
      setForWhom('');
      setOccasion('');
      setKeywords('');
      setMin('');
      setMax('');
      router.replace(withLang('/shop'));
      return;
    }
    const urlFor = sp.get('for') ?? '';
    const urlOccasion = sp.get('occasion') ?? '';
    const urlKeywords = sp.get('keywords') ?? '';
    const urlBudget = sp.get('budget') ?? '';
    const urlMin = sp.get('min') ?? '';
    const urlMax = sp.get('max') ?? '';
    setForWhom(urlFor);
    setOccasion(urlOccasion);
    setKeywords(urlKeywords);

    if (urlMin || urlMax) {
      setMin(urlMin);
      setMax(urlMax);
    } else if (!urlBudget) {
      setMin('');
      setMax('');
    } else if (urlBudget.includes('-')) {
      const [lo, hi] = urlBudget.split('-');
      setMin(lo || '');
      setMax(typeof hi === 'undefined' ? '' : hi);
    } else {
      setMin('0');
      setMax(urlBudget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  // Keep URL in sync with inputs (debounced) — so ShopCTA can read latest filters
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('lang', lang);
      if (forWhom) params.set('for', forWhom);
      if (occasion) params.set('occasion', occasion);
      if (keywords) params.set('keywords', keywords);
      if (min) params.set('min', min);
      if (max) params.set('max', max);
      const qs = params.toString();
      const next = `/shop?${qs}`;
      const current = `/shop?${sp.toString()}`;
      if (current !== next) router.replace(next); // shallow replace
    }, 250);
    return () => clearTimeout(t);
  }, [forWhom, occasion, keywords, min, max, lang, router, sp]);

  useEffect(() => {
    const allEmpty = !forWhom && !occasion && !keywords && !min && !max;
    if (!allEmpty) return;
    const hasAny = sp.get('for') || sp.get('occasion') || sp.get('keywords') || sp.get('budget') || sp.get('min') || sp.get('max');
    if (hasAny) router.replace(withLang('/shop'));
  }, [forWhom, occasion, keywords, min, max]);

  const hasFilters = useMemo(
    () =>
      Boolean(
        (forWhom || occasion || keywords || min || max).trim?.() ?? (forWhom || occasion || keywords || min || max)
      ),
    [forWhom, occasion, keywords, min, max]
  );

  const amazonUrl = useMemo(
    () =>
      hasFilters
        ? buildAmazonUrl({
            forWhom,
            occasion,
            keywords,
            min: min || undefined,
            max: max || undefined,
          })
        : '#',
    [hasFilters, forWhom, occasion, keywords, min, max]
  );

  // Announce “links updated” when inputs change (a11y)
  useEffect(() => {
    const parts = [forWhom, occasion, keywords, min, max].filter(Boolean).join(' ');
    if (parts) setAnnounce(txt.liveSRUpdated);
  }, [forWhom, occasion, keywords, min, max]); // lang baked into txt

  function refreshIdeas() {
    router.push(withLang('/shop?fresh=1'));
  }

  return (
    <main style={{ maxWidth: 980, margin: '32px auto', padding: '0 16px' }}>
      <h1>{txt.title}</h1>
      <h2 style={{ color: '#d97706', fontWeight: 700 }}>{txt.h2}</h2>

      {/* Compare line + dynamic CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <p style={{ marginTop: 6, color: '#374151', fontWeight: 500, marginBottom: 0 }}>
          {txt.compare}
        </p>
        <ShopCTA size="sm" />
      </div>

      <p>{txt.sub}</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.2fr 2.2fr 100px 100px auto',
          gap: 8,
          marginTop: 12,
          alignItems: 'center',
        }}
      >
        <input value={forWhom} onChange={(e) => setForWhom(e.target.value)} placeholder={txt.phFor} />
        <input value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder={txt.phOccasion} />
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder={txt.phKeywords} />
        <input
          value={min}
          onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))}
          placeholder={txt.phMin}
        />
        <input
          value={max}
          onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))}
          placeholder={txt.phMax}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={hasFilters ? amazonUrl : '#'}
            target={hasFilters ? '_blank' : undefined}
            rel={hasFilters ? 'noopener noreferrer' : undefined}
            style={{
              background: hasFilters ? '#f59e0b' : '#e5e7eb',
              color: hasFilters ? '#fff' : '#9ca3af',
              padding: '8px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              pointerEvents: hasFilters ? 'auto' : 'none',
            }}
          >
            {txt.btnIdeas}
          </a>
          <button
            onClick={refreshIdeas}
            style={{
              background: '#0f172a',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
            }}
          >
            {txt.btnTry}
          </button>
        </div>
      </div>

      {/* Screen-reader live region */}
      <div
        aria-live="polite"
        style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}
      >
        {announce}
      </div>

      {/* Dismissible “live update” tip */}
      {showLiveTip && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 12px',
            borderRadius: 10,
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            maxWidth: 780,
          }}
        >
          <div style={{ fontWeight: 800, marginRight: 6 }}>{txt.liveTipTitle}</div>
          <div style={{ flex: 1 }}>{txt.liveTipBody}</div>
          <button
            onClick={() => setShowLiveTip(false)}
            style={{
              border: 'none',
              background: '#10B981',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {txt.liveTipDismiss}
          </button>
        </div>
      )}

      <p style={{ marginTop: 10 }}>{txt.note}</p>

      {hasFilters && (
        <>
          <h3 style={{ marginTop: 24 }}>{txt.secCore}</h3>
          <p>
            <a href={amazonUrl} target="_blank">
              {txt.linkOpen}
            </a>{' '}
            <a href={amazonUrl} target="_blank">
              {txt.linkMore}
            </a>
          </p>
          <h3>{txt.secAcc}</h3>
          <p>
            <a href={amazonUrl} target="_blank">
              {txt.linkOpen}
            </a>{' '}
            <a href={amazonUrl} target="_blank">
              {txt.linkMore}
            </a>
          </p>
          <h3>{txt.secPop}</h3>
          <p>
            <a href={amazonUrl} target="_blank">
              {txt.linkOpen}
            </a>{' '}
              <a href={amazonUrl} target="_blank">
              {txt.linkMore}
            </a>
          </p>
          <h3>{txt.secSale}</h3>
          <p>
            <a href={amazonUrl} target="_blank">
              {txt.linkOpen}
            </a>{' '}
            <a href={amazonUrl} target="_blank">
              {txt.linkMore}
            </a>
          </p>
        </>
      )}
    </main>
  );
}
