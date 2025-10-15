// src/lib/amazonLink.ts
export type Locale = 'en' | 'pt' | 'es' | 'fr';

const HOST = 'www.amazon.com';

// ✅ Only read the client-safe env var; if it's empty, hard-fallback to your tag.
// This ensures links always include a tag even if the env isn't loaded yet.
const ENV_TAG =
  (process.env.NEXT_PUBLIC_AMAZON_TAG || '').trim() || 'mateussousa-20';

const FORCE_ENGLISH_UI = true;

// Map common “who” terms to English so amazon.com ranks well.
// We keep any unknown words as-is.
const WHO_TO_EN: Record<Locale, Record<string, string>> = {
  en: {},
  pt: {
    namorado: 'boyfriend',
    namorada: 'girlfriend',
    marido: 'husband',
    esposa: 'wife',
    mae: 'mother',
    mãe: 'mother',
    pai: 'father',
  },
  es: {
    novio: 'boyfriend',
    novia: 'girlfriend',
    esposo: 'husband',
    esposa: 'wife',
    madre: 'mother',
    padre: 'father',
  },
  fr: {
    'petit ami': 'boyfriend',
    'petite amie': 'girlfriend',
    mari: 'husband',
    femme: 'wife',
    mère: 'mother',
    pere: 'father',
    père: 'father',
  },
};

// Light keyword hints → add English synonym next to user word.
const KEYWORD_HINTS_TO_EN: Record<Locale, Record<string, string>> = {
  en: {},
  pt: {
    academia: 'gym',
    musica: 'music',
    perfume: 'perfume',
    relógio: 'watch',
    relogio: 'watch',
    vestido: 'dress',
  },
  es: {
    gimnasio: 'gym',
    musica: 'music',
    perfume: 'perfume',
    reloj: 'watch',
    vestido: 'dress',
  },
  fr: {
    'salle de sport': 'gym',
    musique: 'music',
    parfum: 'perfume',
    montre: 'watch',
    robe: 'dress',
  },
};

function toEnglishWho(locale: Locale, whoRaw?: string) {
  if (!whoRaw) return '';
  const dict = WHO_TO_EN[locale] || {};
  const key = whoRaw.trim().toLowerCase();
  return dict[key] || whoRaw.trim();
}

function englishKeywordPhrase(locale: Locale, keywordsRaw?: string) {
  if (!keywordsRaw) return '';
  const hints = KEYWORD_HINTS_TO_EN[locale] || {};
  let out = keywordsRaw.trim();
  for (const [k, v] of Object.entries(hints)) {
    if (out.toLowerCase().includes(k) && !out.toLowerCase().includes(v)) {
      out += ` ${v}`;
    }
  }
  return out;
}

export type Variant = 'core' | 'accessory' | 'sale' | 'popular30';

export interface BuildArgs {
  locale: Locale;
  who?: string;
  keywords?: string;
  variant?: Variant;
  associateTag?: string; // optional override
}

/**
 * Always sends to amazon.com (English UI) with your tag.
 * Variants:
 *  - core: plain query
 *  - accessory: adds "accessory"
 *  - sale: adds deals refinement (clearance/Prime Day/etc.)
 *  - popular30: sorts by review rank + adds "best seller" cues
 */
export function buildAmazonLinks(args: BuildArgs) {
  const {
    locale,
    who = '',
    keywords = '',
    variant = 'core',
    // ✅ if caller passes a tag, use it; else use ENV_TAG (which now hard-falls back)
    associateTag = ENV_TAG,
  } = args;

  const whoEn = toEnglishWho(locale, who);
  const kwEnBase = englishKeywordPhrase(locale, keywords);

  // Base query parts
  const parts: string[] = [];
  if (kwEnBase) parts.push(kwEnBase);
  if (variant === 'accessory') parts.push('accessory');
  if (variant === 'popular30') parts.push('best seller top rated trending');
  if (whoEn) parts.push(`for ${whoEn}`);

  const url = new URL(`https://${HOST}/s`);
  if (parts.length) url.searchParams.set('k', parts.join(' ').trim());
  if (associateTag) url.searchParams.set('tag', associateTag); // ← adds &tag=...
  if (FORCE_ENGLISH_UI) url.searchParams.set('language', 'en_US');

  // Refinements / sort
  const rh: string[] = [];

  // On sale: Amazon deals node (works broadly though unofficial)
  if (variant === 'sale') {
    rh.push('p_n_deal_type:23566065011'); // Deals
    // also bias query to 'deal' helps ranking within search
    const k = url.searchParams.get('k') || '';
    url.searchParams.set('k', `${k} deal`.trim());
  }

  // Popular: reviews sort is the most stable proxy for "last 30 days"
  if (variant === 'popular30') {
    url.searchParams.set('s', 'review-rank');
  }

  if (rh.length) url.searchParams.set('rh', rh.join(','));

  return {
    primaryUrl: url.toString(),
    queryPrimary: parts.join(' ').trim(),
  };
}
