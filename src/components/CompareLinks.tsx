'use client';

import Link from 'next/link';
import { buildCompareLinks } from '@/lib/compareLinks';

type Lang = 'en' | 'pt' | 'es' | 'fr';

const labels: Record<
  Lang,
  { g: string; b: string; p: string; locked: string }
> = {
  en: {
    g: 'Compare on Google Shopping',
    b: 'Compare on Bing Shopping',
    p: 'Compare on PriceGrabber',
    locked: 'Pro feature — $2/month',
  },
  pt: {
    g: 'Comparar no Google Shopping',
    b: 'Comparar no Bing Shopping',
    p: 'Comparar no PriceGrabber',
    locked: 'Recurso Pro — US$ 2/mês',
  },
  es: {
    g: 'Comparar en Google Shopping',
    b: 'Comparar en Bing Shopping',
    p: 'Comparar en PriceGrabber',
    locked: 'Función Pro — US$ 2/mes',
  },
  fr: {
    g: 'Comparer sur Google Shopping',
    b: 'Comparer sur Bing Shopping',
    p: 'Comparer sur PriceGrabber',
    locked: 'Fonction Pro — 2 $/mois',
  },
};

export default function CompareLinks({
  query,
  isPro,
  lang = 'en',
  onUpgrade,
}: {
  query: string;
  isPro: boolean;
  lang?: Lang;
  onUpgrade?: () => void;
}) {
  const t = labels[lang] || labels.en;
  const links = buildCompareLinks(query || '');

  const Btn = ({ label, href }: { label: string; href: string }) =>
    isPro ? (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm opacity-90 hover:opacity-100"
      >
        {label}
      </Link>
    ) : (
      <button
        onClick={onUpgrade}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm opacity-60 cursor-not-allowed"
        title={t.locked}
      >
        🔒 {label}
      </button>
    );

  return (
    <div className="flex flex-wrap gap-2">
      <Btn label={t.g} href={links.googleShopping} />
      <Btn label={t.b} href={links.bingShopping} />
      <Btn label={t.p} href={links.priceGrabber} />
    </div>
  );
}
