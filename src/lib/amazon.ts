// src/lib/amazon.ts
export type Lang = "en" | "pt" | "es" | "fr";

/** Keep everything on amazon.com for now (can map later). */
export function domainForLang(_lang: Lang, fallback = "www.amazon.com") {
  return fallback;
}

/** Build your Amazon affiliate search URL with your tag attached. */
export function buildAffiliateSearchUrl(opts: {
  q: string;
  lang: Lang;
  tag: string;
  defaultDomain?: string;
}) {
  const { q, lang, tag, defaultDomain } = opts;
  const domain = domainForLang(lang, defaultDomain || "www.amazon.com");
  const params = new URLSearchParams();
  params.set("k", q);
  params.set("tag", tag);
  return `https://${domain}/s?${params.toString()}`;
}
