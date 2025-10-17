// src/lib/amazon.ts
export type Lang = "en" | "pt" | "es" | "fr";

// ✅ Add this line:
const partnerTag = process.env.NEXT_PUBLIC_AMAZON_PARTNER_TAG || "mateussousa-20";

/** Keep everything on amazon.com for now (can map later by region) */
export function domainForLang(_lang: Lang, fallback = "amazon.com") {
  return fallback;
}

/** Build your Amazon affiliate search URL with your tag */
export function buildAffiliateSearchUrl(opts: {
  q: string;
  lang: Lang;
  defaultDomain?: string;
}) {
  const { q, lang, defaultDomain } = opts;
  const domain = domainForLang(lang, defaultDomain || "amazon.com");
  const params = new URLSearchParams();
  params.set("k", q);
  params.set("tag", partnerTag);
 return `https://${domain}/s?k=${q}&tag=${partnerTag}`;

}
