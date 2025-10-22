'use client';

import { useRouter } from 'next/navigation';

type Lang = 'en' | 'pt' | 'es' | 'fr';

const copy: Record<
  Lang,
  { title: string; cta: string; learn: string; subscribe: string }
> = {
  en: {
    title: 'Compare prices across stores',
    cta: '$0.99/month subscription',
    learn: 'Learn more',
    subscribe: 'Subscribe for $0.99',
  },
  pt: {
    title: 'Compare preços em várias lojas',
    cta: 'Assinatura de US$ 0,99/mês',
    learn: 'Saiba mais',
    subscribe: 'Assinar por US$ 0,99',
  },
  es: {
    title: 'Compara precios en varias tiendas',
    cta: 'Suscripción de US$ 0,99/mes',
    learn: 'Más info',
    subscribe: 'Suscribirse por US$ 0,99',
  },
  fr: {
    title: 'Comparez les prix entre magasins',
    cta: 'Abonnement à 0,99 $/mois',
    learn: 'En savoir plus',
    subscribe: "S'abonner pour 0,99 $",
  },
};

export default function CompareTeaser({
  lang = 'en',
  onUpgrade,
}: {
  lang?: Lang;
  onUpgrade?: () => void;
}) {
  const router = useRouter();
  const t = copy[lang] || copy.en;

  return (
    <div className="mt-3 rounded-xl border border-gray-300 bg-gray-100 p-3">
      <div className="flex items-start gap-2">
        <span className="text-xl leading-none select-none">🔒</span>
        <div className="flex-1">
          <div className="font-semibold">{t.title}</div>
          <div className="text-sm opacity-80">{t.cta}</div>

          <button
            onClick={onUpgrade ?? (() => router.push(`/upgrade?lang=${lang}`))}
            className="mt-2 rounded-lg bg-yellow-400 px-3 py-1.5 text-sm font-semibold text-black hover:bg-yellow-300"
          >
            {t.subscribe}
          </button>
        </div>
        <button
          onClick={onUpgrade ?? (() => router.push(`/upgrade?lang=${lang}`))}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-white"
          title={t.cta}
        >
          {t.learn}
        </button>
      </div>
    </div>
  );
}
