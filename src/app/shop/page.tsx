//shop/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image'; // NEW
import { useSearchParams, useRouter } from 'next/navigation';
import ShopCTA from '@/components/ShopCTA';

type Lang = 'en' | 'pt' | 'es' | 'fr';
const pick = (lang: Lang, obj: Record<string, string>) => obj[lang] ?? obj.en;

/* -------------------------------------------------------
   Normalize user terms to ENGLISH for store searches.
   UI language is NOT affected.
------------------------------------------------------- */
function normalizeToEnglish(input?: string, lang?: Lang): string {
  if (!input) return '';

  // strip accents, lowercase
  let s = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  // phrase-level maps first (so "roupa de frio" → "winter clothes")
  const phraseMaps: Record<Lang, Record<string, string>> = {
    en: {},
    pt: {
      'roupa de frio': 'winter clothes',
      'roupas de frio': 'winter clothes',
      'dia dos namorados': 'valentine',
    },
    es: {
      'ropa de invierno': 'winter clothes',
      'san valentin': 'valentine',
    },
    fr: {
      'vetements dhiver': 'winter clothes',
      'vêtements d’hiver': 'winter clothes',
      'saint-valentin': 'valentine',
    },
  };

  // single-word maps
  const wordMaps: Record<Lang, Record<string, string>> = {
    en: {},
    pt: {
      namorado: 'boyfriend',
      namorada: 'girlfriend',
      marido: 'husband',
      esposa: 'wife',
      mae: 'mom',
      mae2: 'mom',
      pai: 'dad',
      amigo: 'friend',
      amiga: 'friend',
      filho: 'son',
      filha: 'daughter',
      aniversario: 'birthday',
      casamento: 'wedding',
      formatura: 'graduation',
      natal: 'christmas',
      academia: 'gym',
      roupa: 'clothes',
      roupas: 'clothes',
      sapato: 'shoes',
      sapatos: 'shoes',
      bolsa: 'bag',
      joias: 'jewelry',
      joias2: 'jewelry',
      relogio: 'watch',
      casaco: 'jacket',
    },
    es: {
      novio: 'boyfriend',
      novia: 'girlfriend',
      esposo: 'husband',
      esposa: 'wife',
      mama: 'mom',
      papa: 'dad',
      amigo: 'friend',
      amiga: 'friend',
      hijo: 'son',
      hija: 'daughter',
      cumpleanos: 'birthday',
      boda: 'wedding',
      graduacion: 'graduation',
      navidad: 'christmas',
      gimnasio: 'gym',
      ropa: 'clothes',
      zapatos: 'shoes',
      bolso: 'bag',
      joyeria: 'jewelry',
      reloj: 'watch',
      chaqueta: 'jacket',
    },
    fr: {
      mari: 'husband',
      epouse: 'wife',
      mere: 'mother',
      maman: 'mom',
      papa: 'dad',
      ami: 'friend',
      amie: 'friend',
      fils: 'son',
      fille: 'daughter',
      anniversaire: 'birthday',
      mariage: 'wedding',
      diplomes: 'graduation',
      noel: 'christmas',
      gymnase: 'gym',
      'salle de sport': 'gym',
      vetement: 'clothes',
      vetements: 'clothes',
      chaussures: 'shoes',
      sac: 'bag',
      joaillerie: 'jewelry',
      bijou: 'jewelry',
      bijoux: 'jewelry',
      montre: 'watch',
      veste: 'jacket',
      copine: 'girlfriend',
      'petit ami': 'boyfriend',
    },
  };

  // apply phrase maps
  const pmap = phraseMaps[lang ?? 'en'];
  for (const [k, v] of Object.entries(pmap)) {
    const re = new RegExp(`\\b${escapeRegExp(k)}\\b`, 'g');
    s = s.replace(re, v);
  }

  // apply word maps per token
  const wmap = wordMaps[lang ?? 'en'];
  const tokens = s.split(/\s+/).map((t) => {
    if (lang === 'pt' && (t === 'mae' || t === 'mãe')) return 'mom';
    if (lang === 'pt' && (t === 'joias' || t === 'jóias')) return 'jewelry';
    if (lang === 'es' && (t === 'cumpleanos' || t === 'cumpleaños')) return 'birthday';
    if (lang === 'fr' && (t === 'diplomes' || t === 'diplômes')) return 'graduation';
    return wmap[t] || t;
  });

  return tokens.join(' ').replace(/\s+/g, ' ').trim();
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Amazon link builder (unchanged)
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
      es: 'Ver más na mi página de Amazon',
      fr: 'Voir plus sur ma page Amazon',
    }),
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

  const [showLiveTip, setShowLiveTip] = useState(true);
  const [announce, setAnnounce] = useState('');

  // Init from URL
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

  // Sync URL (debounced)
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
      if (current !== next) router.replace(next);
    }, 250);
    return () => clearTimeout(t);
  }, [forWhom, occasion, keywords, min, max, lang, router, sp]);

  // Clean URL if all empty
  useEffect(() => {
    const allEmpty = !forWhom && !occasion && !keywords && !min && !max;
    if (!allEmpty) return;
    const hasAny =
      sp.get('for') ||
      sp.get('occasion') ||
      sp.get('keywords') ||
      sp.get('budget') ||
      sp.get('min') ||
      sp.get('max');
    if (hasAny) router.replace(withLang('/shop'));
  }, [forWhom, occasion, keywords, min, max]);

  const hasFilters = useMemo(
    () =>
      Boolean(
        (forWhom || occasion || keywords || min || max).trim?.() ??
          (forWhom || occasion || keywords || min || max),
      ),
    [forWhom, occasion, keywords, min, max],
  );

  // ✅ Only change: normalize to EN before building store URL
  const amazonUrl = useMemo(() => {
    if (!hasFilters) return '#';
    const nf = normalizeToEnglish(forWhom, lang);
    const no = normalizeToEnglish(occasion, lang);
    const nk = normalizeToEnglish(keywords, lang);
    return buildAmazonUrl({
      forWhom: nf || undefined,
      occasion: no || undefined,
      keywords: nk || undefined,
      min: min || undefined,
      max: max || undefined,
    });
  }, [hasFilters, forWhom, occasion, keywords, min, max, lang]);

  // a11y announce
  useEffect(() => {
    const parts = [forWhom, occasion, keywords, min, max].filter(Boolean).join(' ');
    if (parts) setAnnounce(txt.liveSRUpdated);
  }, [forWhom, occasion, keywords, min, max]);

  function refreshIdeas() {
    router.push(withLang('/shop?fresh=1'));
  }

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <h1 className="sr-only">{txt.title}</h1>

      {/* NEW: Slim hero strip with horse + vibe */}
      <section className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-b from-cyan-50 to-white px-3 py-2">
        <Image src="/horse-blue.png" alt="" width={34} height={34} priority />
        <div className="font-extrabold text-slate-900">
          Find great gifts faster
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2 opacity-90">
          <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">Tech</span>
          <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">Home</span>
          <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">Fashion</span>
        </div>
      </section>

      <h2 className="text-xl md:text-2xl font-bold text-amber-600">{txt.h2}</h2>

      {/* Compare line + dynamic CTA */}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <p className="text-slate-600 font-medium m-0">{txt.compare}</p>
        <ShopCTA size="sm" />
      </div>

      <p className="mt-1 text-slate-700">{txt.sub}</p>

      {/* Filters row */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_2.2fr_100px_100px_auto] gap-2 items-center">
        <input
          value={forWhom}
          onChange={(e) => setForWhom(e.target.value)}
          placeholder={txt.phFor}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <input
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          placeholder={txt.phOccasion}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder={txt.phKeywords}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <input
          value={min}
          onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))}
          placeholder={txt.phMin}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <input
          value={max}
          onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))}
          placeholder={txt.phMax}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <div className="flex gap-2">
          <a
            href={hasFilters ? amazonUrl : '#'}
            target={hasFilters ? '_blank' : undefined}
            rel={hasFilters ? 'noopener noreferrer' : undefined}
            className={`rounded-xl px-4 py-2 font-semibold transition ${
              hasFilters
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-slate-200 text-slate-400 pointer-events-none'
            }`}
          >
            {txt.btnIdeas}
          </a>
          <button
            onClick={refreshIdeas}
            className="rounded-xl px-4 py-2 font-semibold bg-slate-900 text-white hover:bg-slate-800"
          >
            {txt.btnTry}
          </button>
        </div>
      </div>

      {/* SR live region */}
      <div aria-live="polite" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        {announce}
      </div>

      {/* Dismissible tip */}
      {showLiveTip && (
        <div className="mt-3 flex max-w-3xl items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-800">
          <div className="font-extrabold mr-1">{txt.liveTipTitle}</div>
          <div className="flex-1">{txt.liveTipBody}</div>
          <button
            onClick={() => setShowLiveTip(false)}
            className="whitespace-nowrap rounded-lg bg-emerald-500 px-3 py-1.5 font-bold text-white"
          >
            {txt.liveTipDismiss}
          </button>
        </div>
      )}

      <p className="mt-3 text-slate-600">{txt.note}</p>

      {/* Sections with prominent links */}
      {hasFilters && (
        <div className="mt-6 space-y-6">
          <Section
            title={txt.secCore}
            openText={txt.linkOpen}
            moreText={txt.linkMore}
            href={amazonUrl}
          />
          <Section
            title={txt.secAcc}
            openText={txt.linkOpen}
            moreText={txt.linkMore}
            href={amazonUrl}
          />
          <Section
            title={txt.secPop}
            openText={txt.linkOpen}
            moreText={txt.linkMore}
            href={amazonUrl}
          />
          <Section
            title={txt.secSale}
            openText={txt.linkOpen}
            moreText={txt.linkMore}
            href={amazonUrl}
          />
        </div>
      )}
    </main>
  );
}

/** A tiny presentational block for the “Core / Accessories / Popular / On sale” rows */
function Section({
  title,
  openText,
  moreText,
  href,
}: {
  title: string;
  openText: string;
  moreText: string;
  href: string;
}) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-cyan-300/50 bg-cyan-50 px-3 py-1.5 text-cyan-700 hover:bg-cyan-100 transition"
        >
          {openText}
          <span aria-hidden>↗</span>
        </a>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 transition"
        >
          {moreText}
          <span className="text-slate-400" aria-hidden>
            →
          </span>
        </a>
      </div>
    </section>
  );
}
